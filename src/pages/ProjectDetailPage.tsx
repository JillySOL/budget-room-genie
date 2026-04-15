import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Loader2, PlusCircle } from "lucide-react";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter.tsx";
import { db } from "@/firebase-config";
import { doc, onSnapshot, DocumentData } from "firebase/firestore";
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge";

interface DIYSuggestion {
  item: string;
  description: string;
  cost: number;
}

const loadingMessages = [
  "Analyzing your room...",
  "Generating renovation ideas...",
  "Applying design principles...",
  "Rendering your new space...",
  "Polishing the final details...",
  "Almost there...",
];

const renovationTypeLabel: Record<string, string> = {
  budget: "Budget Flip",
  full: "Full Renovation",
  visual: "Visualize",
};

const budgetLabel: Record<string, string> = {
  "300": "Under $300",
  "500": "Under $500",
  "1000": "Under $1,000",
  "2000": "Under $2,000",
};

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [projectData, setProjectData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    let messageInterval: NodeJS.Timeout | null = null;
    const aiStatus = projectData?.aiStatus?.toLowerCase();
    if (aiStatus === 'processing' || aiStatus === 'generating_image') {
      let messageIndex = 0;
      setCurrentLoadingMessage(loadingMessages[messageIndex]);
      messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        setCurrentLoadingMessage(loadingMessages[messageIndex]);
      }, 2500);
    }
    return () => { if (messageInterval) clearInterval(messageInterval); };
  }, [projectData?.aiStatus]);

  useEffect(() => {
    if (!id) { setError("Project ID not found."); setLoading(false); return; }

    const docRef = doc(db, "projects", id);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const prevStatus = prevStatusRef.current;
          const newStatus = data?.aiStatus?.toLowerCase();

          // Fire success toast when generation completes
          if (prevStatus && prevStatus !== 'completed' && newStatus === 'completed') {
            toast.success("Your renovation is ready!");
          }
          prevStatusRef.current = newStatus ?? null;
          setProjectData(data);
        } else {
          setError("Project not found.");
        }
        setLoading(false);
      },
      () => { setError("Failed to load project details."); setLoading(false); }
    );
    return () => unsubscribe();
  }, [id]);

  const handleDownload = async () => {
    const url = projectData?.aiGeneratedImageURL;
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `renomate-${id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Download failed. Try right-clicking the image instead.");
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

  const rawGeneratedImageURL = projectData.aiGeneratedImageURL;
  const hasGeneratedImage = rawGeneratedImageURL &&
    typeof rawGeneratedImageURL === 'string' &&
    rawGeneratedImageURL.trim() !== '';

  const afterImage = hasGeneratedImage ? rawGeneratedImageURL.trim() : beforeImage;

  const aiStatus = projectData?.aiStatus?.toLowerCase();
  const isAiProcessing = aiStatus === "processing" || aiStatus === "generating_image";
  const isAiPending = !aiStatus || aiStatus === "pending";
  const isAiFailed = aiStatus === "failed";
  const showAiState = isAiProcessing || isAiPending || isAiFailed || !hasGeneratedImage;

  const aiSuggestions: DIYSuggestion[] = projectData.aiSuggestions || [];
  const totalEstimatedCost = projectData.aiTotalEstimatedCost || 0;
  const estimatedValueAdded = projectData.aiEstimatedValueAdded || 0;

  const style = projectData.style || "";
  const budget = String(projectData.budget || "");
  const renovationType = projectData.renovationType || "";

  return (
    <PageContainer className="transition-opacity duration-500 ease-in-out opacity-100">
      <div className="flex items-center mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon" className="mr-2" aria-label="Back to Home">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold flex-1 truncate">{projectName}</h1>
        {hasGeneratedImage && (
          <Button variant="outline" size="sm" className="gap-1.5 ml-2 shrink-0" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Metadata strip */}
        {(style || budget || renovationType) && (
          <div className="flex flex-wrap gap-2 mb-5">
            {renovationType && (
              <Badge variant="secondary" className="capitalize">
                {renovationTypeLabel[renovationType] || renovationType}
              </Badge>
            )}
            {budget && (
              <Badge variant="outline">
                {budgetLabel[budget] || `$${budget}`}
              </Badge>
            )}
            {style && (
              <Badge variant="outline" className="capitalize">
                {style}
              </Badge>
            )}
          </div>
        )}

        <div className="mb-6">
          {/* Value added badge */}
          {estimatedValueAdded > 0 && (
            <div className="flex justify-end mb-3">
              <span className="bg-[#E6F4EA] text-green-800 text-sm font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
                +${estimatedValueAdded.toLocaleString()} Est. Value
              </span>
            </div>
          )}

          {showAiState ? (
            <div className="relative mb-6 rounded-lg overflow-hidden shadow-md border dark:border-gray-700 bg-gray-100 dark:bg-gray-800 h-64">
              <div className="absolute inset-0 w-full h-full">
                {beforeImage && (
                  <img src={beforeImage} alt="Original Room" className="w-full h-full object-cover opacity-50" />
                )}
                <div className="absolute top-3 left-3 z-10 bg-black/70 text-white px-3 py-1 rounded-md text-xs font-medium shadow-sm">
                  Before
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-budget-accent/20 to-transparent bg-[length:400%_100%] animate-gradient-x flex flex-col items-center justify-center p-4">
                <div className="bg-white/90 dark:bg-gray-800/90 rounded-lg p-4 shadow-lg max-w-xs w-full backdrop-blur-sm">
                  <div className="flex items-center justify-center mb-3">
                    <Loader2 className="h-8 w-8 animate-spin text-budget-accent" />
                  </div>
                  <p className="text-sm text-center font-medium text-gray-700 dark:text-gray-300">
                    {isAiProcessing
                      ? currentLoadingMessage
                      : isAiFailed
                      ? "Unable to generate design. Please try again."
                      : "Waiting for AI to start processing your design..."}
                  </p>
                  {isAiProcessing && (
                    <>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div className="bg-budget-accent h-1.5 rounded-full animate-pulse-width"></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">This may take up to a minute...</p>
                    </>
                  )}
                  {isAiFailed && projectData.aiError && (
                    <p className="text-xs text-red-500 mt-2 text-center">Error: {projectData.aiError}</p>
                  )}
                </div>
              </div>
            </div>
          ) : hasGeneratedImage ? (
            <div className="mb-6">
              <EnhancedBeforeAfter
                beforeImage={beforeImage}
                afterImage={afterImage}
                className="rounded-lg overflow-hidden shadow-md border dark:border-gray-700"
              />
            </div>
          ) : null}

          {/* DIY Suggestions */}
          {aiSuggestions.length > 0 ? (
            <div className="bg-card rounded-lg border dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b dark:border-gray-700">
                <h2 className="font-semibold text-base">
                  {showAiState ? "Suggested DIY Improvements" : "Your DIY Plan"}
                </h2>
                {showAiState && (
                  <p className="text-xs text-muted-foreground mt-0.5">Ready while your image generates</p>
                )}
              </div>
              <div className="divide-y dark:divide-gray-700">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-4 px-4 sm:px-6 py-4">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-budget-accent/10 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-bold text-budget-accent">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                        <h3 className="font-medium text-card-foreground">{suggestion.item}</h3>
                        <span className="text-sm font-semibold text-budget-accent shrink-0">
                          ${suggestion.cost.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {totalEstimatedCost > 0 && (
                <div className="flex justify-between items-center px-4 sm:px-6 py-4 border-t dark:border-gray-700 bg-muted/30">
                  <span className="font-semibold text-sm">Estimated Total</span>
                  <span className="text-budget-accent text-lg font-bold">${totalEstimatedCost.toLocaleString()}</span>
                </div>
              )}
            </div>
          ) : showAiState ? (
            <div className="bg-card rounded-lg border dark:border-gray-700 shadow-sm p-6 flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin shrink-0" />
              <p className="text-sm">Generating personalised suggestions...</p>
            </div>
          ) : null}

          {/* Bottom CTA */}
          {!showAiState && (
            <div className="mt-6 flex justify-center">
              <Link to="/onboarding">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Start Another Project
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default ProjectDetailPage;
