import { useParams, Link, useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, AlertTriangle } from "lucide-react";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@clerk/clerk-react";
import { LoadingPage, Loading } from "@/components/ui/loading";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

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
  const { projectId } = useParams<{ projectId: string }>();
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setError("No project ID provided.");
      setIsLoading(false);
      return;
    }

    if (!isLoaded) {
      return;
    }
    
    if (!isSignedIn) {
       setIsLoading(false);
       setError("Please sign in to view project details."); 
       return; 
    }

    const fetchProject = async () => {
      setIsLoading(true);
      setError(null);
      setProject(null);

      try {
        const token = await getToken({ template: "RenoMateBackendAPI" });
        if (!token) {
          throw new Error("Authentication token not available.");
        }

        const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/project/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.status === 404) {
          throw new Error("Project not found.");
        }
        if (response.status === 403) {
           throw new Error("You do not have permission to view this project.");
        }
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Failed to fetch project details' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data: Project = await response.json();
        setProject(data);
      } catch (err: any) {
        console.error("Error fetching project:", err);
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [projectId, isLoaded, isSignedIn, getToken]); 

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error || !project) {
    return (
      <PageContainer>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 flex flex-col items-center gap-4"
        >
          <AlertTriangle className="w-12 h-12 text-destructive" />
          <h1 className="text-xl font-semibold text-destructive">
            {error || "Project Not Found"}
          </h1>
          <p className="text-muted-foreground">
            {error === "Project not found." 
              ? "The project you are looking for does not exist or may have been deleted."
              : error === "You do not have permission to view this project."
              ? "Please ensure you are logged in with the correct account."
              : error === "Please sign in to view project details."
              ? "Sign in to access your projects."
              : "An error occurred while loading the project. Please try again later."
            }
          </p>
          <Button onClick={() => navigate('/projects')}>Back to My Projects</Button>
        </motion.div>
      </PageContainer>
    );
  }

  const beforeImageUrl = project.beforeImageUrl || '/placeholder-image.png';
  const afterImageUrl = project.afterImageUrl || beforeImageUrl;

  const handleDownload = () => {
     toast.info("Download functionality coming soon!");
  };

  return (
    <PageContainer>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-8"
      >
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            aria-label="Back to Projects"
            onClick={() => navigate('/projects')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-semibold truncate" title={project.title}>{project.title || 'Project Details'}</h1>
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
