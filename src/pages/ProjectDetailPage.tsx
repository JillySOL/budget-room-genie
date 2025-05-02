import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw } from "lucide-react";
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
import { toast } from 'sonner';

interface DIYSuggestion {
  item: string;
  description: string;
  cost: number;
}

// Array of loading messages
const loadingMessages = [
  "Analyzing your room...",
  "Generating renovation ideas...",
  "Applying modern design principles...",
  "Rendering your new space...",
  "Polishing the final details...",
  "Almost there...",
];

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [projectData, setProjectData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);

  // Effect for cycling loading messages
  useEffect(() => {
    let messageInterval: NodeJS.Timeout | null = null;
    
    if (projectData?.aiStatus === 'processing') {
      let messageIndex = 0;
      setCurrentLoadingMessage(loadingMessages[messageIndex]); // Set initial message
      
      messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setCurrentLoadingMessage(loadingMessages[messageIndex]);
      }, 2500); // Cycle every 2.5 seconds
    }
    
    // Cleanup function
    return () => {
      if (messageInterval) {
        clearInterval(messageInterval);
      }
    };
  }, [projectData?.aiStatus]); // Re-run when aiStatus changes

  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;
    
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
          const data = docSnap.data();
          setProjectData(data);
          
          // Check AI status
          const aiStatus = data.aiStatus;
          console.log(`Initial AI status: ${aiStatus}`);
          
          // Only show processing state if not completed
          if (!aiStatus || aiStatus === "pending" || aiStatus === "processing") {
            // Always set up polling regardless of initial status
            pollInterval = setInterval(async () => {
              console.log("Polling for updates...");
              try {
                const updatedDocSnap = await getDoc(docRef);
                if (updatedDocSnap.exists()) {
                  const updatedData = updatedDocSnap.data();
                  const updatedStatus = updatedData.aiStatus;
                  console.log(`Updated AI status: ${updatedStatus}`);
                  
                  // Always update the project data
                  setProjectData(updatedData);
                  
                  if (updatedStatus === "completed" || updatedStatus === "failed") {
                    console.log("AI processing finished, stopping polling");
                    if (pollInterval) {
                      clearInterval(pollInterval);
                      pollInterval = null;
                    }
                  }
                }
              } catch (pollError) {
                console.error("Error polling for updates:", pollError);
              }
            }, 3000); // Poll more frequently (every 3 seconds)
          } else {
            // AI is already completed or failed
          }
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
    
    // Clean up interval on component unmount
    return () => {
      if (pollInterval) {
        console.log("Cleaning up polling interval");
        clearInterval(pollInterval);
      }
    };
  }, [id]);

  const handleSaveToNotebook = () => {
    if (!projectData) return;
    
    localStorage.setItem('savedDesign', JSON.stringify({
      id: id || "project",
      name: projectData.projectName || "My Project",
      totalCost: projectData.aiTotalEstimatedCost || 0,
      valueAdd: projectData.aiEstimatedValueAdded || 0,
      suggestions: projectData.aiSuggestions || [],
    }));
    toast('Saved to Local Notebook');
  };

  const handleDownload = () => {
    alert("Download functionality not implemented yet.");
  };

  // Function to manually refresh project data
  const handleRefresh = async () => {
    if (!id) return;
    
    try {
      const docRef = doc(db, "projects", id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const refreshedData = docSnap.data();
        setProjectData(refreshedData);
      }
    } catch (err) {
      console.error("Error refreshing project data:", err);
    }
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
                    
  // Determine afterImage based on AI status
  let afterImage = "/after.png"; // Default fallback
  
  if (projectData.aiStatus === "completed" && projectData.aiGeneratedImageURL) {
    afterImage = projectData.aiGeneratedImageURL;
  }

  // Check if we should show AI processing/loading state
  // Simpler check based directly on aiStatus
  const isAiProcessing = projectData?.aiStatus === "processing";
  const isAiPending = !projectData?.aiStatus || projectData?.aiStatus === "pending";
  const isAiFailed = projectData?.aiStatus === "failed";
  const showAiState = isAiProcessing || isAiPending || isAiFailed;

  // Get AI suggestions or use mock data if not available
  const aiSuggestions = projectData.aiSuggestions || [];
  const totalEstimatedCost = projectData.aiTotalEstimatedCost || 0;
  const estimatedValueAdded = projectData.aiEstimatedValueAdded || 0;
  
  // Format values for display
  const formattedCost = totalEstimatedCost ? `$${totalEstimatedCost}` : "TBD";
  const formattedValue = estimatedValueAdded ? `+$${estimatedValueAdded.toLocaleString()}` : "+$18,000";

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
              {formattedValue} Value
            </span>
          </div>

          {showAiState ? (
            <div className="relative mb-6 rounded-lg overflow-hidden shadow-md border dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center h-64 p-4">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-budget-accent" />
              <p className="text-sm text-center mx-auto max-w-xs font-medium text-gray-700 dark:text-gray-300">
                {isAiProcessing ? 
                  currentLoadingMessage : 
                  isAiFailed ?
                  "Unable to generate design. Please try again." :
                  "Waiting for AI to start processing your design..."}
              </p>
              {isAiProcessing && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This may take up to a minute...</p>
              )}
              {isAiFailed && projectData.aiError && (
                <p className="text-xs text-red-500 mt-2 text-center max-w-xs">
                  Error: {projectData.aiError}
                </p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh} 
                className="mt-4 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </Button>
            </div>
          ) : (
            <EnhancedBeforeAfter
              beforeImage={beforeImage}
              afterImage={afterImage}
              className="mb-6 rounded-lg overflow-hidden shadow-md border dark:border-gray-700"
            />
          )}
          
          <Accordion type="single" collapsible defaultValue="suggestions" className="mb-6 w-full bg-card p-4 sm:p-6 rounded-lg border dark:border-gray-700 shadow-sm">
            <AccordionItem value="suggestions">
              <AccordionTrigger className="text-budget-accent hover:no-underline">
                {showAiState ? "AI is generating recommendations..." : "View suggested DIY improvements"}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {showAiState ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <p>
                        {isAiProcessing ? 
                          "Analyzing your room and generating personalized suggestions..." : 
                          isAiFailed ?
                          "Unable to generate suggestions. Please try again later." :
                          "Waiting to start processing..."}
                      </p>
                    </div>
                  ) : aiSuggestions.length > 0 ? (
                    // Display real AI suggestions
                    <>
                      {aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start gap-4 border-b dark:border-gray-700 pb-4 last:border-b-0 last:pb-0">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                              <h3 className="font-medium text-card-foreground mb-1 sm:mb-0">{suggestion.item}</h3>
                              <span className="text-sm font-semibold text-budget-accent">
                                ${suggestion.cost}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-between items-center pt-4 border-t dark:border-gray-700 mt-4">
                        <span className="text-lg font-semibold">Estimated Total Cost</span>
                        <span className="text-budget-accent text-xl font-bold">
                          {formattedCost}
                        </span>
                      </div>
                    </>
                  ) : (
                    // Fallback to mock data if no AI suggestions available
                    <p className="text-center py-2 text-gray-500">No suggestions available yet.</p>
                  )}
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
              disabled={showAiState}
            >
              <span className="mr-1">📝</span> Save to Local Notebook
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
