import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RefreshCw, Loader2 } from "lucide-react";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter.tsx";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { db, functions } from "@/firebase-config";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { httpsCallable } from 'firebase/functions';
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
  const [fixingUrl, setFixingUrl] = useState(false);
  const [needsUrlFix, setNeedsUrlFix] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // Effect for cycling loading messages
  useEffect(() => {
    let messageInterval: NodeJS.Timeout | null = null;
    
    const aiStatus = projectData?.aiStatus?.toLowerCase();
    // Show loading messages for processing or generating_image states
    if (aiStatus === 'processing' || aiStatus === 'generating_image') {
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
          
          // Only show processing state if not completed
          if (!aiStatus || aiStatus === "pending" || aiStatus === "processing") {
            // Always set up polling regardless of initial status
            pollInterval = setInterval(async () => {
              try {
                const updatedDocSnap = await getDoc(docRef);
                if (updatedDocSnap.exists()) {
                  const updatedData = updatedDocSnap.data();
                  const updatedStatus = updatedData.aiStatus;
                  
                  setProjectData(updatedData);
                  
                  const hasGeneratedImage = updatedData.aiGeneratedImageURL && 
                                           typeof updatedData.aiGeneratedImageURL === 'string' && 
                                           updatedData.aiGeneratedImageURL.trim() !== '';
                  
                  if (updatedStatus === "completed") {
                    if (hasGeneratedImage) {
                      if (pollInterval) {
                        clearInterval(pollInterval);
                        pollInterval = null;
                      }
                    }
                  } else if (updatedStatus === "failed") {
                    if (pollInterval) {
                      clearInterval(pollInterval);
                      pollInterval = null;
                    }
                  }
                }
              } catch (pollError) {
                // Silently handle polling errors - they're expected if the document doesn't exist yet
                if (pollInterval) {
                  clearInterval(pollInterval);
                  pollInterval = null;
                }
              }
            }, 3000); // Poll every 3 seconds
          }
        } else {
          setError("Project not found.");
        }
      } catch (err) {
        setError("Failed to load project details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
    
    // Clean up interval on component unmount
    return () => {
      if (pollInterval) {
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
      // Silently handle refresh errors
    }
  };

  const handleFixImageUrl = async () => {
    if (!id || fixingUrl) return;
    try {
      setFixingUrl(true);
      toast.loading("Fixing image URL...");
      const fixImageUrl = httpsCallable<{ projectId: string }, { success: boolean; newUrl: string }>(
        functions,
        'fixImageUrl'
      );
      const result = await fixImageUrl({ projectId: id });
      if (result.data.success) {
        toast.success("Image URL fixed! Refreshing...");
        await handleRefresh();
        setNeedsUrlFix(false);
        setImageLoadError(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fix image URL");
    } finally {
      setFixingUrl(false);
    }
  };

  // Auto-detect if URL needs fixing - show button if image exists but might not be loading
  useEffect(() => {
    if (projectData?.aiGeneratedImageURL && projectData?.aiStatus === 'completed') {
      const url = projectData.aiGeneratedImageURL;
      // Show fix button if URL exists and is in the public format (might need fixing)
      // Always show it if we have a generated image URL and status is completed
      setNeedsUrlFix(true);
    } else {
      setNeedsUrlFix(false);
    }
  }, [projectData?.aiGeneratedImageURL, projectData?.aiStatus]);

  // Also show button if image fails to load (detected by EnhancedBeforeAfter component)
  // This is handled by the imageLoadError state set by onLoadError callback

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
  // Priority: Use aiGeneratedImageURL if it exists (this is the nanobanana-generated image)
  // Fallback: Use before image only if no generated image is available
  const rawGeneratedImageURL = projectData.aiGeneratedImageURL;
  const hasGeneratedImage = rawGeneratedImageURL && 
                           typeof rawGeneratedImageURL === 'string' && 
                           rawGeneratedImageURL.trim() !== '';
  
  let afterImage: string;
  
  if (hasGeneratedImage) {
    afterImage = rawGeneratedImageURL.trim();
  } else {
    afterImage = beforeImage;
  }

  // Check if we should show AI processing/loading state
  // Show loading state if: processing, pending, generating_image, or if completed but no generated image yet
  const aiStatus = projectData?.aiStatus?.toLowerCase();
  const isAiProcessing = aiStatus === "processing" || aiStatus === "generating_image";
  const isAiPending = !aiStatus || aiStatus === "pending";
  const isAiFailed = aiStatus === "failed";
  // Show loading if processing/pending/failed OR if we don't have a generated image yet
  const showAiState = isAiProcessing || isAiPending || isAiFailed || !hasGeneratedImage;

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
            <div className="relative mb-6 rounded-lg overflow-hidden shadow-md border dark:border-gray-700 bg-gray-100 dark:bg-gray-800 h-64">
              {/* Show the before image with a loading overlay */}
              <div className="absolute inset-0 w-full h-full">
                {beforeImage && (
                  <img 
                    src={beforeImage} 
                    alt="Original Room" 
                    className="w-full h-full object-cover opacity-50"
                  />
                )}
                <div className="absolute top-3 left-3 z-10 bg-black/70 text-white px-3 py-1 rounded-md text-xs font-medium shadow-sm">
                  Before
                </div>
              </div>
              
              {/* Loading overlay with animation */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-budget-accent/20 to-transparent bg-[length:400%_100%] animate-gradient-x flex flex-col items-center justify-center p-4">
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 shadow-lg max-w-xs w-full backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-3">
                    <Loader2 className="h-8 w-8 animate-spin text-budget-accent" />
                  </div>
                  <p className="text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                    {isAiProcessing ? 
                      currentLoadingMessage : 
                      isAiFailed ?
                      "Unable to generate design. Please try again." :
                      "Waiting for AI to start processing your design..."}
                  </p>
                  
                  {/* Progress bar for processing state */}
                  {isAiProcessing && (
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                      <div className="bg-budget-accent h-1.5 rounded-full animate-pulse-width"></div>
                    </div>
                  )}
                  
                  {isAiProcessing && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">This may take up to a minute...</p>
                  )}
                  {isAiFailed && projectData.aiError && (
                    <p className="text-xs text-red-500 mt-2 text-center">
                      Error: {projectData.aiError}
                    </p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefresh} 
                    className="mt-3 w-full flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Refresh</span>
                  </Button>
                </div>
              </div>
            </div>
          ) : hasGeneratedImage && afterImage !== beforeImage ? (
            // Only show before/after comparison when we have a valid, different generated image
            <div className="mb-6">
              {(needsUrlFix || imageLoadError) && (
                <div className="mb-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                    ⚠️ {imageLoadError ? 'Image failed to load. Click to fix the URL and make the file public.' : 'Image URL needs to be updated to display correctly.'}
                  </p>
                  <Button
                    variant="default"
                    size="default"
                    onClick={handleFixImageUrl}
                    disabled={fixingUrl}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium"
                  >
                    {fixingUrl ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Fixing URL...
                      </>
                    ) : (
                      '🔧 Fix Image URL Now'
                    )}
                  </Button>
                </div>
              )}
              <EnhancedBeforeAfter
                beforeImage={beforeImage}
                afterImage={afterImage}
                className="rounded-lg overflow-hidden shadow-md border dark:border-gray-700"
                onLoadError={() => setImageLoadError(true)}
              />
            </div>
          ) : (
            // Fallback: Still show loading if somehow we got here without a generated image
            <div className="relative mb-6 rounded-lg overflow-hidden shadow-md border dark:border-gray-700 bg-gray-100 dark:bg-gray-800 h-64">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 shadow-lg max-w-xs w-full backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-3">
                    <Loader2 className="h-8 w-8 animate-spin text-budget-accent" />
                  </div>
                  <p className="text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                    {hasGeneratedImage && afterImage === beforeImage 
                      ? "Generated image is being processed..." 
                      : "Waiting for generated image..."}
                  </p>
                </div>
              </div>
            </div>
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
