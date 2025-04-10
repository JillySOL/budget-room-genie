import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Cpu, Plus } from "lucide-react";
import { toast } from "sonner";

const messages = [
  "Consulting the design blueprints...",
  "Reticulating splines...",
  "Warming up the AI generators...",
  "Asking the super computer...",
  "Polishing the pixels...",
  "Adding a touch of magic...",
];

const ProjectStatusPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  
  const projectId = jobId;
  const [currentMessage, setCurrentMessage] = useState(messages[0]);
  
  useEffect(() => {
    if (!projectId) {
      console.error("ProjectStatusPage: No projectId found in location state.");
      toast.error("Could not retrieve project details. Returning to new project page.");
      navigate('/new-project');
      return;
    }

    const messageIntervalId = setInterval(() => {
      setCurrentMessage(prev => messages[(messages.indexOf(prev) + 1) % messages.length]);
    }, 1500);

    const redirectTimeoutId = setTimeout(() => {
      navigate(`/project/${projectId}`);
    }, 3000);

    return () => {
      clearInterval(messageIntervalId);
      clearTimeout(redirectTimeoutId);
    };
  }, [projectId, navigate]);
  
  const getStatusMessage = () => {
    switch (status) {
      case "PENDING":
        return "Starting the renovation generation...";
      case "PROCESSING":
        return "Creating your dream renovation...";
      case "COMPLETE":
        return "Generation complete! Redirecting...";
      case "FAILED":
        return "Generation failed";
      default:
        return "Processing your request...";
    }
  };
  
  const handleRetry = () => {
    navigate("/new-project");
  };

  const handleStartNew = () => {
    navigate('/onboarding');
  };
  
  return (
    <PageContainer className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Creating Your Project</h1>
      </div>
      
      <div className="max-w-md w-full space-y-6">
        <div className="relative h-8 w-full max-w-xs overflow-hidden">
          <p 
            className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-muted-foreground"
          >
            {currentMessage}
          </p>
        </div>
        <div className="w-40 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-budget-accent"
          />
        </div>
        <Button 
          className="gap-2"
          onClick={() => navigate("/onboarding")}
        >
          <Plus className="h-4 w-4" />
          Start Another Project
        </Button>
      </div>
    </PageContainer>
  );
};

export default ProjectStatusPage; 