import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, DollarSign, Camera, Check, Upload, Loader2, Sofa, Bed, UtensilsCrossed, Bath, Monitor, TreePine, Hammer } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Logo from "@/components/ui-custom/Logo";
import StyleChip from "@/components/ui-custom/StyleChip";
import { useAuth } from "@/context/AuthContext";
import { db, storage, functions } from "@/firebase-config";
import { collection, addDoc, serverTimestamp, query, where, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { toast as sonnerToast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import ExistingPhotoSelector from "@/components/onboarding/ExistingPhotoSelector";
import PaywallModal from "@/components/ui-custom/PaywallModal";

const TOTAL_STEPS = 5;

const STEP_NAMES = ["Photo", "Room", "Style", "Type", "Brief"];

// Auto-maps renovation type → a budget value used in prompts/suggestions
const RENOVATION_BUDGET_MAP: Record<string, string> = {
  budget: "500",
  full: "3000",
  visual: "10000",
};

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedExistingImageUrl, setSelectedExistingImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingProjects, setExistingProjects] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState({
    roomType: "",
    budget: "500",
    style: "",
    renovationType: "",
    customInstructions: "",
  });

  const roomTypes = [
    { id: "living-room", name: "Living Room", icon: <Sofa className="h-5 w-5" /> },
    { id: "bedroom", name: "Bedroom", icon: <Bed className="h-5 w-5" /> },
    { id: "kitchen", name: "Kitchen", icon: <UtensilsCrossed className="h-5 w-5" /> },
    { id: "bathroom", name: "Bathroom", icon: <Bath className="h-5 w-5" /> },
    { id: "office", name: "Home Office", icon: <Monitor className="h-5 w-5" /> },
    { id: "outdoor", name: "Outdoor", icon: <TreePine className="h-5 w-5" /> },
  ];

  const styleOptions = [
    { id: "minimalist", label: "Minimalist" },
    { id: "modern", label: "Modern" },
    { id: "coastal", label: "Coastal" },
    { id: "industrial", label: "Industrial" },
    { id: "scandinavian", label: "Scandinavian" },
    { id: "traditional", label: "Traditional" },
  ];

  const renovationTypes = [
    { id: "budget", name: "Budget Flip", description: "Cosmetic-only updates under $500 — paint, accessories & soft furnishings", icon: <DollarSign className="h-5 w-5" /> },
    { id: "full", name: "Full Renovation", description: "Complete transformation — flooring, cabinetry, fixtures & more", icon: <Hammer className="h-5 w-5" /> },
    { id: "visual", name: "Just Visualise", description: "Dream version with no budget limit — see what's possible", icon: <Camera className="h-5 w-5" /> },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) { setLoadingProjects(false); return; }
      setLoadingProjects(true);
      try {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        setExistingProjects(querySnapshot.docs);
      } catch {
        sonnerToast.error("Failed to load existing photos.");
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [currentUser]);

  const [imageAspectRatio, setImageAspectRatio] = useState<string>("4:3");

  const detectAspectRatio = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const ratio = w / h;
        const ratios: { ratio: number; label: string }[] = [
          { ratio: 1 / 1,   label: "1:1"  },
          { ratio: 2 / 3,   label: "2:3"  },
          { ratio: 3 / 2,   label: "3:2"  },
          { ratio: 3 / 4,   label: "3:4"  },
          { ratio: 4 / 3,   label: "4:3"  },
          { ratio: 4 / 5,   label: "4:5"  },
          { ratio: 5 / 4,   label: "5:4"  },
          { ratio: 9 / 16,  label: "9:16" },
          { ratio: 16 / 9,  label: "16:9" },
        ];
        const closest = ratios.reduce((prev, curr) =>
          Math.abs(curr.ratio - ratio) < Math.abs(prev.ratio - ratio) ? curr : prev
        );
        resolve(closest.label);
      };
      img.onerror = () => resolve("4:3");
      img.src = dataUrl;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setSelectedExistingImageUrl(null);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        setImagePreviewUrl(dataUrl);
        const detectedRatio = await detectAspectRatio(dataUrl);
        setImageAspectRatio(detectedRatio);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreviewUrl(null);
    }
  };

  const triggerFileInput = () => { fileInputRef.current?.click(); };

  const handleSelectExisting = (imageUrl: string) => {
    setSelectedExistingImageUrl(imageUrl);
    setSelectedFile(null);
    setImagePreviewUrl(imageUrl);
  };

  const handleSaveProject = async () => {
    let finalImageSource: string | File | null = null;
    if (selectedFile) {
      finalImageSource = selectedFile;
    } else if (selectedExistingImageUrl) {
      finalImageSource = selectedExistingImageUrl;
    } else {
      sonnerToast.error("Please select or upload an image.");
      setSubmissionError("An image is required to create the project.");
      return;
    }

    if (!currentUser) {
      sonnerToast.error("You must be logged in to create a project.");
      navigate("/login");
      return;
    }

    setIsUploading(true);
    setSubmissionError(null);

    try {
      let finalImageURL: string | null = null;
      if (finalImageSource instanceof File) {
        sonnerToast.info("Uploading image...");
        const fileExtension = finalImageSource.name.split('.').pop();
        const uniqueFilename = `${uuidv4()}.${fileExtension}`;
        const storageRef = ref(storage, `user-uploads/${currentUser.uid}/${uniqueFilename}`);
        await uploadBytes(storageRef, finalImageSource);
        finalImageURL = await getDownloadURL(storageRef);
      } else {
        finalImageURL = finalImageSource;
      }

      if (!finalImageURL) throw new Error("Image URL could not be determined after potential upload.");

      // Check generation limit before creating the project
      const checkFn = httpsCallable<void, { canGenerate: boolean }>(functions, "stripeCheckCanGenerate");
      const usageResult = await checkFn();
      if (!usageResult.data.canGenerate) {
        // Save completed project data so SuccessPage can auto-submit after upgrade
        localStorage.setItem("renomate_pending_project", JSON.stringify({
          uploadedImageURL: finalImageURL,
          imageAspectRatio,
          ...userData,
          projectName: `${userData.style || 'My'} ${userData.roomType || 'Room'} Project`,
        }));
        setShowPaywall(true);
        setIsUploading(false);
        return;
      }

      // Clear any stale pending project (user was already Pro)
      localStorage.removeItem("renomate_pending_project");

      sonnerToast.info("Saving project details...");
      const projectData = {
        ...userData,
        userId: currentUser.uid,
        uploadedImageURL: finalImageURL,
        imageAspectRatio,
        createdAt: serverTimestamp(),
        projectName: `${userData.style || 'My'} ${userData.roomType || 'Room'} Project`,
      };

      const docRef = await addDoc(collection(db, "projects"), projectData);
      sonnerToast.success("Project created! Generating your renovation...");
      navigate(`/project/${docRef.id}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to create project. Please try again.";
      setSubmissionError(errorMsg);
      sonnerToast.error(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSaveProject();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setSubmissionError(null);
    } else {
      navigate("/");
    }
  };

  const isNextDisabled = () => {
    if (isUploading) return true;
    switch (currentStep) {
      case 1: return !selectedFile && !selectedExistingImageUrl;
      case 2: return !userData.roomType;
      case 3: return !userData.style;
      case 4: return !userData.renovationType;
      case 5: return false; // brief is optional
      default: return false;
    }
  };

  const hasExistingPhotos = existingProjects.length > 0;

  return (
    <>
    <PaywallModal open={showPaywall} onClose={() => setShowPaywall(false)} />
    <PageContainer className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Logo size="sm" />
        <div className="w-8"></div>
      </div>

      {/* Progress bar + step name */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-muted-foreground font-medium">
            Step {currentStep} of {TOTAL_STEPS} · {STEP_NAMES[currentStep - 1]}
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round((currentStep / TOTAL_STEPS) * 100)}%
          </span>
        </div>
        <Progress value={(currentStep / TOTAL_STEPS) * 100} className="w-full h-1.5" />
      </div>

      {/* Selection summary strip */}
      {currentStep > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          {userData.roomType && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-budget-accent/10 text-budget-accent capitalize">
              {roomTypes.find(r => r.id === userData.roomType)?.name || userData.roomType}
            </span>
          )}
          {currentStep > 2 && userData.style && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground capitalize">
              {userData.style}
            </span>
          )}
          {currentStep > 3 && userData.renovationType && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
              {renovationTypes.find(t => t.id === userData.renovationType)?.name || userData.renovationType}
            </span>
          )}
        </div>
      )}

      {/* Step content — padded so it clears the fixed bottom bar */}
      <div className="flex-1 pb-28">
        {currentStep === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold">Choose a 'before' photo</h2>
              <p className="text-sm text-muted-foreground mt-1">Upload a new photo or select one from your gallery.</p>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 p-3.5">
              <Camera className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                <strong>Best results:</strong> Step back and capture the <strong>entire room</strong> in one wide shot. Close-up or partial photos limit what the AI can redesign — the more room context, the better the result.
              </p>
            </div>

            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />

            {imagePreviewUrl ? (
              <div className="w-full rounded-xl overflow-hidden border dark:border-gray-700 bg-muted aspect-[4/3]">
                <img src={imagePreviewUrl} alt="Selected preview" className="w-full h-full object-cover" />
              </div>
            ) : (
              <button
                onClick={triggerFileInput}
                className="w-full aspect-[4/3] rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-budget-accent/50 hover:text-budget-accent transition-colors"
              >
                <Upload className="h-8 w-8" />
                <span className="text-sm font-medium">Tap to upload a photo</span>
                <span className="text-xs">JPG, PNG supported</span>
              </button>
            )}

            {imagePreviewUrl && (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={triggerFileInput}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                {selectedFile ? "Change Photo" : "Upload Different Photo"}
              </Button>
            )}

            {currentUser && hasExistingPhotos && (
              <ExistingPhotoSelector
                projects={existingProjects}
                isLoading={loadingProjects}
                selectedUrl={selectedExistingImageUrl}
                onSelect={handleSelectExisting}
              />
            )}

            {submissionError && (
              <div className="text-center p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm border border-red-200 dark:border-red-800/50">
                {submissionError}
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold">What room are you flipping?</h2>
              <p className="text-sm text-muted-foreground mt-1">Select the room type</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {roomTypes.map((room) => (
                <div
                  key={room.id}
                  className={`p-4 rounded-lg border ${
                    userData.roomType === room.id
                      ? "border-budget-accent bg-budget-accent/10"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950"
                  } flex flex-col items-center gap-2 cursor-pointer transition-all hover:border-budget-accent/50`}
                  onClick={() => setUserData({ ...userData, roomType: room.id })}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userData.roomType === room.id ? "bg-budget-accent text-white" : "bg-gray-100 dark:bg-gray-800"
                  } relative`}>
                    {room.icon}
                    {userData.roomType === room.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white dark:bg-gray-950 rounded-full flex items-center justify-center border border-budget-accent">
                        <Check className="h-3 w-3 text-budget-accent" />
                      </div>
                    )}
                  </div>
                  <span className={`font-medium text-sm ${userData.roomType === room.id ? "text-budget-accent" : "text-foreground"}`}>
                    {room.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold">What style do you prefer?</h2>
              <p className="text-sm text-muted-foreground mt-1">Pick a design direction</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((style) => (
                <StyleChip
                  key={style.id}
                  label={style.label}
                  selected={userData.style === style.id}
                  onClick={() => setUserData({ ...userData, style: style.id })}
                  useOrangeAccent={true}
                />
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold">What type of renovation?</h2>
              <p className="text-sm text-muted-foreground mt-1">Choose your approach</p>
            </div>
            <div className="space-y-3">
              {renovationTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 rounded-lg border ${
                    userData.renovationType === type.id
                      ? "border-budget-accent bg-budget-accent/10"
                      : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950"
                  } flex items-center gap-3 cursor-pointer transition-all hover:border-budget-accent/50`}
                  onClick={() => setUserData({
                    ...userData,
                    renovationType: type.id,
                    budget: RENOVATION_BUDGET_MAP[type.id] || "500",
                  })}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userData.renovationType === type.id ? "bg-budget-accent text-white" : "bg-gray-100 dark:bg-gray-800"
                  } relative shrink-0`}>
                    {type.icon}
                    {userData.renovationType === type.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white dark:bg-gray-950 rounded-full flex items-center justify-center border border-budget-accent">
                        <Check className="h-3 w-3 text-budget-accent" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-medium ${userData.renovationType === type.id ? "text-budget-accent" : "text-foreground"}`}>{type.name}</h3>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h2 className="text-xl font-semibold">Any specific requests?</h2>
              <p className="text-sm text-muted-foreground mt-1">Optional — describe exactly what you want included. The AI will prioritise your instructions.</p>
            </div>
            <Textarea
              placeholder={`e.g. "Insert a frameless glass shower screen", "Keep the existing timber floors", "Add a kitchen island with bar stools"`}
              className="min-h-[160px] text-sm resize-none"
              value={userData.customInstructions}
              onChange={(e) => setUserData({ ...userData, customInstructions: e.target.value })}
              maxLength={500}
            />
            {userData.customInstructions.length > 0 && (
              <p className="text-xs text-muted-foreground text-right">{userData.customInstructions.length}/500</p>
            )}
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Tips for best results:</p>
              <p>· Be specific about materials or finishes ("white subway tiles", "oak flooring")</p>
              <p>· Mention what to keep ("keep the existing window")</p>
              <p>· Describe fixtures directly ("wall-mounted vanity with LED mirror")</p>
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom bar — sits above the BottomNav (which is fixed at bottom-0) */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-background border-t border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <Button variant="ghost" onClick={handleBack} disabled={isUploading}>
            Back
          </Button>
          <Button
            onClick={currentStep === TOTAL_STEPS ? handleSaveProject : handleNextStep}
            disabled={isNextDisabled() || isUploading}
          >
            {isUploading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : currentStep === TOTAL_STEPS
              ? "Generate My Renovation"
              : "Next"}
          </Button>
        </div>
      </div>
    </PageContainer>
    </>
  );
};

export default OnboardingPage;
