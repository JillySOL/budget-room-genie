import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Cpu } from "lucide-react";
import { toast } from "sonner";
import { motion } from 'framer-motion';

const messages = [
  "Consulting the design blueprints...",
  "Reticulating splines...",
  "Warming up the AI generators...",
  "Asking the super computer...",
  "Polishing the pixels...",
  "Adding a touch of magic...",
];

const ProjectStatusPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  
  const projectId = location.state?.projectId;
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
  
  return (
    <PageContainer>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">Creating Your Project</h1>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6"
      >
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 6, -6, 0],
          }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 0.5
          }}
        >
          <Cpu className="w-16 h-16 text-budget-accent stroke-[1.5]" />
        </motion.div>
        <div className="relative h-8 w-full max-w-xs overflow-hidden">
            <motion.p 
              key={currentMessage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-muted-foreground"
            >
              {currentMessage}
            </motion.p>
        </div>
        <div className="w-40 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div 
                className="h-full bg-budget-accent"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, ease: "linear" }}
            />
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default ProjectStatusPage; 