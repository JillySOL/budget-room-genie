import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Home, Paintbrush, Hammer, DollarSign, Camera, Check, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Logo from "@/components/ui-custom/Logo";
import StyleChip from "@/components/ui-custom/StyleChip";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/firebase-config";
import { collection, addDoc, serverTimestamp, query, where, getDocs, QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast as sonnerToast } from "sonner";
import { v4 as uuidv4 } from 'uuid';
import ExistingPhotoSelector from "@/components/onboarding/ExistingPhotoSelector";

const TOTAL_STEPS = 5;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userData, setUserData] = useState({
    roomType: "",
    budget: "500",
    style: "",
    renovationType: "",
  });

  const roomTypes = [
    { id: "living-room", name: "Living Room", icon: <Home className="h-5 w-5" /> },
    { id: "bedroom", name: "Bedroom", icon: <Home className="h-5 w-5" /> },
    { id: "kitchen", name: "Kitchen", icon: <Paintbrush className="h-5 w-5" /> },
    { id: "bathroom", name: "Bathroom", icon: <Paintbrush className="h-5 w-5" /> },
    { id: "office", name: "Home Office", icon: <Hammer className="h-5 w-5" /> },
    { id: "outdoor", name: "Outdoor", icon: <Hammer className="h-5 w-5" /> },
  ];

  const budgetOptions = [
    { id: "300", label: "Under $300" },
    { id: "500", label: "Under $500" },
    { id: "1000", label: "Under $1,000" },
    { id: "2000", label: "Under $2,000" },
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
    { id: "budget", name: "Budget Flip", description: "Quick, affordable DIY makeovers", icon: <DollarSign className="h-5 w-5" /> },
    { id: "full", name: "Full Renovation", description: "Complete room transformation", icon: <Hammer className="h-5 w-5" /> },
    { id: "visual", name: "Just Visualize", description: "See ideas without commitment", icon: <Camera className="h-5 w-5" /> },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      if (!currentUser) {
        setLoadingProjects(false);
        return;
      }
      setLoadingProjects(true);
      try {
        const projectsRef = collection(db, "projects");
        const q = query(projectsRef, where("userId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);
        setExistingProjects(querySnapshot.docs);
      } catch (err) {         
        console.error("Error fetching existing projects:", err);
        sonnerToast.error("Failed to load existing photos.");
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [currentUser]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("File selected:", file);
    if (file) {
      setSelectedFile(file);
      setSelectedExistingImageUrl(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedFile(null);
      setImagePreviewUrl(null);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSelectExisting = (imageUrl: string) => {
    setSelectedExistingImageUrl(imageUrl);
    setSelectedFile(null);
    setImagePreviewUrl(imageUrl);
  };

  const handleSaveProject = async () => {
    console.log("handleSaveProject called");

    let finalImageSource: string | File | null = null;
    if (selectedFile) {
      finalImageSource = selectedFile;
    } else if (selectedExistingImageUrl) {
      finalImageSource = selectedExistingImageUrl;
    } else {
      console.error("Save aborted: No image selected.");
      sonnerToast.error("Please select or upload an image.");
      setSubmissionError("An image is required to create the project.");
      return;
    }

    if (!currentUser) {
      console.error("Save aborted: User is not logged in, but should be.");
      sonnerToast.error("You must be logged in to create a project. Redirecting to login.");
      setSubmissionError("Authentication error. Please log in again.");
      navigate("/login");
      return;
    }
    
    setIsUploading(true);
    setSubmissionError(null);

    try {
      let finalImageURL: string | null = null;
      if (finalImageSource instanceof File) {
        console.log("Proceeding with upload...");
        sonnerToast.info("Uploading image...");
        const fileExtension = finalImageSource.name.split('.').pop();
        const uniqueFilename = `${uuidv4()}.${fileExtension}`;
        const storageRef = ref(storage, `user-uploads/${currentUser.uid}/${uniqueFilename}`);
        await uploadBytes(storageRef, finalImageSource);
        finalImageURL = await getDownloadURL(storageRef);
        console.log("Upload successful, URL:", finalImageURL);
      } else {
         finalImageURL = finalImageSource;
         console.log("Using existing image URL:", finalImageURL);
      }

      if (!finalImageURL) {
        throw new Error("Image URL could not be determined after potential upload.");
      }

      sonnerToast.info("Saving project details...");
      const projectData = {
        ...userData,
        userId: currentUser.uid,
        uploadedImageURL: finalImageURL,
        createdAt: serverTimestamp(),
        projectName: `${userData.style || 'My'} ${userData.roomType || 'Room'} Project`,
      };
      console.log("Saving project data to Firestore:", projectData);

      const docRef = await addDoc(collection(db, "projects"), projectData);
      console.log("Document written with ID: ", docRef.id);
      sonnerToast.success("Project created successfully!");
      navigate(`/project/${docRef.id}`);

    } catch (error) {
      console.error("Error creating project:", error);
      const errorMsg = error instanceof Error ? error.message : "Failed to create project. Please try again.";
      setSubmissionError(errorMsg);
      sonnerToast.error(errorMsg);
    } finally {
      console.log("Setting isUploading to false");
      setIsUploading(false);
    }
  };

  const handleNextStep = () => {
    console.log(`handleNextStep called, currentStep: ${currentStep}, TOTAL_STEPS: ${TOTAL_STEPS}`);
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else {
      console.log("Final step reached, calling handleSaveProject...");
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
      case 1: return !userData.roomType;
      case 2: return !userData.budget;
      case 3: return !userData.style;
      case 4: return !userData.renovationType;
      case 5: return !selectedFile && !selectedExistingImageUrl;
      default: return false;
    }
  };

  return (
    <PageContainer className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Logo size="sm" />
        <div className="w-8"></div>
      </div>

      <Progress value={(currentStep / TOTAL_STEPS) * 100} className="w-full mb-6 h-1" />

      <div className="flex-1 pb-6">
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">Choose a 'before' photo</h2>
            <p className="text-sm text-muted-foreground">Upload a new photo or select one from your gallery.</p>

            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />

            {imagePreviewUrl && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 text-center">Selected Photo:</p>
                <div className="relative w-full max-w-sm mx-auto h-48 bg-muted rounded-lg overflow-hidden border">
                  <img src={imagePreviewUrl} alt="Selected preview" className="w-full h-full object-contain" />
                </div>
                {selectedFile && !isUploading && (
                  <p className="text-xs text-center text-muted-foreground mt-1">New Upload: {selectedFile.name}</p>
                )}
                {selectedExistingImageUrl && !isUploading && (
                  <p className="text-xs text-center text-muted-foreground mt-1">Selected from Gallery</p>
                )}
              </div>
            )}
            
            <Button
              variant={imagePreviewUrl ? "secondary" : "default"}
              className="w-full gap-2 py-3 text-base"
              onClick={triggerFileInput}
              disabled={isUploading}
            >
              <Upload className="h-5 w-5" />
              <span>{selectedFile ? "Change Uploaded Photo" : "Upload New Photo"}</span>
            </Button>

            <ExistingPhotoSelector 
              projects={existingProjects}
              isLoading={loadingProjects}
              selectedUrl={selectedExistingImageUrl}
              onSelect={handleSelectExisting}
            />

            {isUploading && (
               <p className="text-xs text-center text-muted-foreground">Uploading...</p>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">What room are you flipping?</h2>
            <p className="text-sm text-muted-foreground">Select the room type</p>
            
            <div className="grid grid-cols-2 gap-3">
              {roomTypes.map((room) => (
                <div
                  key={room.id}
                  className={`p-4 rounded-lg border ${
                    userData.roomType === room.id
                      ? "border-budget-accent bg-budget-accent/10"
                      : "border-gray-200 bg-white"
                  } flex flex-col items-center gap-2 cursor-pointer transition-all`}
                  onClick={() => setUserData({ ...userData, roomType: room.id })}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userData.roomType === room.id ? "bg-budget-accent text-white" : "bg-gray-100"
                  } relative`}>
                    {room.icon}
                    {userData.roomType === room.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-budget-accent">
                        <Check className="h-3 w-3 text-budget-accent" />
                      </div>
                    )}
                  </div>
                  <span className={`font-medium text-sm ${userData.roomType === room.id ? "text-budget-accent" : ""}`}>
                    {room.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">What's your budget?</h2>
            <p className="text-sm text-muted-foreground">We'll customize suggestions to fit</p>
            
            <div className="space-y-3">
              {budgetOptions.map((option) => (
                <div
                  key={option.id}
                  className={`p-4 rounded-lg border ${
                    userData.budget === option.id
                      ? "border-budget-accent bg-budget-accent/10"
                      : "border-gray-200 bg-white"
                  } flex items-center justify-between cursor-pointer transition-all`}
                  onClick={() => setUserData({ ...userData, budget: option.id })}
                >
                  <span className={`font-medium ${userData.budget === option.id ? "text-budget-accent" : ""}`}>
                    {option.label}
                  </span>
                  {userData.budget === option.id && (
                    <div className="w-5 h-5 rounded-full bg-budget-accent flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">What style do you prefer?</h2>
            <p className="text-sm text-muted-foreground">Pick a design direction</p>
            
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

        {currentStep === 5 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">What type of renovation?</h2>
            <p className="text-sm text-muted-foreground">Choose the approach</p>
            
            <div className="space-y-3">
              {renovationTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 rounded-lg border ${
                    userData.renovationType === type.id
                      ? "border-budget-accent bg-budget-accent/10"
                      : "border-gray-200 bg-white"
                  } flex items-center gap-3 cursor-pointer transition-all`}
                  onClick={() => setUserData({ ...userData, renovationType: type.id })}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userData.renovationType === type.id ? "bg-budget-accent text-white" : "bg-gray-100"
                  } relative`}>
                    {type.icon}
                    {userData.renovationType === type.id && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center border border-budget-accent">
                        <Check className="h-3 w-3 text-budget-accent" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className={`font-medium ${userData.renovationType === type.id ? "text-budget-accent" : ""}`}>{type.name}</h3>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {submissionError && (
              <div className="mt-4 text-center p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {submissionError}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto pt-4 border-t bg-background sticky bottom-0 px-4 py-3">
        <div className="flex justify-between items-center">
          <Button variant="ghost" onClick={handleBack} disabled={isUploading}> 
            Back
          </Button>
          <Button onClick={handleNextStep} disabled={isNextDisabled() || isUploading}> 
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : (currentStep === TOTAL_STEPS ? "Create Project" : "Next")}
          </Button>
        </div>
      </div>
    </PageContainer>
  );
};

export default OnboardingPage;
