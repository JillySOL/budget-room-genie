import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter.tsx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { db } from "@/firebase-config";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { Loader2 } from 'lucide-react';

interface DIYSuggestion {
  id: string;
  title: string;
  description: string;
  cost: number;
}

interface Project {
  id: string;
  title: string;
  userId: string;
  roomType: string;
  budget: number;
  style: string;
  renovationType: string;
  instructions?: string;
  beforeImageKey: string;
  afterImageKey?: string;
  diySuggestions: DIYSuggestion[];
  createdAt: string;
  updatedAt: string;
  status: 'PENDING' | 'COMPLETE' | 'FAILED';
  totalCost: number;
  beforeImageUrl: string;
  afterImageUrl: string;
}

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [projectData, setProjectData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) {
        setError("Project ID not found.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProjectData(docSnap.data());
        } else {
          setError("Project not found.");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  const handleSaveToNotebook = () => {
    localStorage.setItem('savedDesign', JSON.stringify({
      id: "bathroom-refresh",
      name: "Budget-Friendly Refresh",
      totalCost: 780,
      valueAdd: 18000,
      suggestions: BATHROOM_SUGGESTIONS,
    }));
  };

  if (loading) {
    return (
      <PageContainer className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer className="flex justify-center items-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </PageContainer>
    );
  }

  if (!projectData) {
    return (
       <PageContainer className="flex justify-center items-center min-h-screen">
         <p>Project data could not be loaded.</p>
       </PageContainer>
    );
  }

  const projectName = projectData.projectName || "My Project";
  const beforeImage = projectData.uploadedImageURL && typeof projectData.uploadedImageURL === 'string' 
                    ? projectData.uploadedImageURL 
                    : "/placeholder.svg";
  const afterImage = "/after.png";

  return (
    <PageContainer className="transition-opacity duration-500 ease-in-out opacity-100">
      <div className="flex items-center mb-8">
        <Link to="/">
          <Button className="mr-2 tap-target" aria-label="Back to Home">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">{projectName}</h1>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-budget-dark">{projectName}</h2>
            <span className="bg-[#E6F4EA] text-green-800 text-sm font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
              +$18,000 Value
            </span>
          </div>

          <EnhancedBeforeAfter
            beforeImage={beforeImage}
            afterImage={"/after.png"}
            className="mb-6"
          />
          
          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem value="suggestions">
              <AccordionTrigger className="text-budget-accent">
                View suggested DIY improvements
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {BATHROOM_SUGGESTIONS.map((suggestion) => (
                    <div key={suggestion.id} className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-budget-dark">{suggestion.title}</h3>
                          <span className="text-sm font-medium text-budget-accent">
                            ${suggestion.estimatedCost}
                          </span>
                        </div>
                        <p className="text-sm text-budget-dark/70">{suggestion.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-medium">Total Cost</span>
                    <span className="text-budget-accent font-medium">
                      $780 AUD
                    </span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="flex flex-col gap-3">
            <Button className="w-full gap-2">
              <Download className="h-4 w-4" />
              Save to My Projects
            </Button>
            <Button 
              className="w-full bg-[#f9f9f9] hover:bg-[#f0f0f0] text-budget-dark border border-gray-200 flex items-center justify-start px-4"
              onClick={handleSaveToNotebook}
            >
              <span className="mr-2">📝</span> Save to Notebook
            </Button>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-8">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.1, duration: 0.4 }}
          >
            <EnhancedBeforeAfter
              beforeImage={beforeImageUrl}
              afterImage={afterImageUrl}
              className="rounded-lg overflow-hidden shadow-lg border dark:border-gray-700"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="bg-card p-4 sm:p-6 rounded-lg border dark:border-gray-700 shadow-sm"
          >
            <h3 className="text-lg font-semibold mb-4 border-b pb-2 dark:border-gray-600">Your Specifications</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <p><strong className="text-card-foreground font-medium">Room Type:</strong> {project.roomType || 'N/A'}</p>
              <p><strong className="text-card-foreground font-medium">Desired Style:</strong> {project.style || 'N/A'}</p>
              <p><strong className="text-card-foreground font-medium">Budget:</strong> ${project.budget != null ? project.budget.toFixed(0) : 'N/A'}</p>
              <p><strong className="text-card-foreground font-medium">Renovation Type:</strong> {project.renovationType || 'N/A'}</p>
              {project.instructions && (
                <p className="col-span-2"><strong className="text-card-foreground font-medium">Instructions:</strong> {project.instructions}</p>
              )}
            </div>
          </motion.div>

          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2, duration: 0.4 }}
          >
            <Accordion type="single" collapsible defaultValue="suggestions" className="w-full bg-card p-4 sm:p-6 rounded-lg border dark:border-gray-700 shadow-sm">
              <AccordionItem value="suggestions">
                <AccordionTrigger className="text-lg font-medium hover:no-underline">
                  Suggested DIY Improvements (Mock)
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-6 pt-6">
                    {project.diySuggestions.length > 0 ? (
                      project.diySuggestions.map((suggestion, index) => (
                        <motion.div 
                          key={suggestion.id || index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05, duration: 0.3 }}
                          className="flex items-start gap-4 border-b dark:border-gray-700 pb-4 last:border-b-0 last:pb-0"
                        >
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                              <h3 className="font-medium text-card-foreground mb-1 sm:mb-0">{suggestion.title}</h3>
                              <span className="text-sm font-semibold text-budget-accent">
                                ${suggestion.cost.toFixed(0)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-muted-foreground italic">No specific DIY suggestions available for this project yet.</p>
                    )}
                    
                    {project.diySuggestions.length > 0 && (
                      <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700 mt-4">
                        <span className="text-lg font-semibold">Estimated Total Cost</span>
                        <span className="text-budget-accent text-xl font-bold">
                          ${project.totalCost.toFixed(0)} AUD
                        </span>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </motion.div>
            
          <motion.div 
            className="flex justify-end gap-3 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <Button variant="outline" disabled title="Edit functionality coming soon">
              Edit Project
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" />
              Download Results
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default ProjectDetailPage;
