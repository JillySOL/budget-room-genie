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

const BATHROOM_SUGGESTIONS = [
  {
    id: "s1",
    title: "Paint Wall (Soft Neutral)",
    estimatedCost: 150,
    description: "Painted the upper wall a neutral, modern tone (light beige or off-white) to freshen the look and make the space feel larger."
  },
  // ... other suggestions ...
];

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
      name: projectData?.projectName || "My Project",
      totalCost: 780,
      valueAdd: 18000,
      suggestions: BATHROOM_SUGGESTIONS,
    }));
    alert("Saved to Notebook (LocalStorage)");
  };

  const handleDownload = () => {
    alert("Download functionality not implemented yet.");
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
          <Button variant="ghost" size="icon" className="mr-2 tap-target" aria-label="Back to Home">
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
            afterImage={afterImage}
            className="mb-6 rounded-lg overflow-hidden shadow-md border dark:border-gray-700"
          />
          
          <Accordion type="single" collapsible defaultValue="suggestions" className="mb-6 w-full bg-card p-4 sm:p-6 rounded-lg border dark:border-gray-700 shadow-sm">
            <AccordionItem value="suggestions">
              <AccordionTrigger className="text-budget-accent hover:no-underline">
                View suggested DIY improvements (Mock)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {BATHROOM_SUGGESTIONS.map((suggestion) => (
                    <div key={suggestion.id} className="flex items-start gap-4 border-b dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                          <h3 className="font-medium text-card-foreground mb-1 sm:mb-0">{suggestion.title}</h3>
                          <span className="text-sm font-semibold text-budget-accent">
                            ${suggestion.estimatedCost}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700 mt-4">
                    <span className="text-lg font-semibold">Estimated Total Cost</span>
                    <span className="text-budget-accent text-xl font-bold">
                      $780 AUD
                    </span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <Button className="gap-2 w-full sm:w-auto" disabled title="Functionality coming soon">
              <Download className="h-4 w-4" />
              Save to My Projects 
            </Button>
            <Button 
              variant="outline"
              className="gap-2 w-full sm:w-auto"
              onClick={handleSaveToNotebook}
            >
              <span className="mr-1">📝</span> Save to Notebook
            </Button>
            <Button onClick={handleDownload} className="gap-2 w-full sm:w-auto" disabled title="Functionality coming soon">
              <Download className="h-4 w-4" />
              Download Results
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProjectDetailPage;
