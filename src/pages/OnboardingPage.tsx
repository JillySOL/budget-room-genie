import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight, Home, Paintbrush, Hammer, DollarSign, Camera, Check, Upload, Image as ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Logo from "@/components/ui-custom/Logo";
import StyleChip from "@/components/ui-custom/StyleChip";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/firebase-config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast as sonnerToast } from "sonner";
import { v4 as uuidv4 } from 'uuid';

const TOTAL_STEPS = 5;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log("File selected:", file);
    if (file) {
      setSelectedFile(file);
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

  const handleSaveProject = async () => {
    console.log("handleSaveProject called");
    console.log("Current user:", currentUser);
    console.log("Selected file:", selectedFile);

    if (!currentUser || !selectedFile) {
      console.error("Save aborted: User not logged in or no image selected.");
      sonnerToast.error("User not logged in or no image selected.");
      return;
    }

    console.log("Proceeding with upload and save...");
    setIsUploading(true);
    sonnerToast.info("Creating project and uploading image...");

    try {
      const fileExtension = selectedFile.name.split('.').pop();
      const uniqueFilename = `${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `user-uploads/${currentUser.uid}/${uniqueFilename}`);
      console.log("Uploading to:", storageRef.fullPath);
      await uploadBytes(storageRef, selectedFile);
      console.log("Upload successful");
      const uploadedImageURL = await getDownloadURL(storageRef);
      console.log("Got download URL:", uploadedImageURL);

      const projectData = {
        ...userData,
        userId: currentUser.uid,
        uploadedImageURL: uploadedImageURL,
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
      sonnerToast.error("Failed to create project. Please try again.");
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
    } else {
      navigate("/");
    }
  };

  const isNextDisabled = () => {
    if (isUploading) return true;
    switch (currentStep) {
      case 1: return !selectedFile;
      case 2: return !userData.roomType;
      case 3: return !userData.budget;
      case 4: return !userData.style;
      case 5: return !userData.renovationType;
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

      <div className="flex-1">
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">Upload a 'before' photo</h2>
            <p className="text-sm text-muted-foreground">Show us the starting point for your room.</p>

            <Input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              ref={fileInputRef}
            />

            <Button
              variant="outline"
              className="w-full flex flex-col items-center justify-center h-40 border-dashed gap-2"
              onClick={triggerFileInput}
              disabled={isUploading}
            >
              {imagePreviewUrl ? (
                 <img src={imagePreviewUrl} alt="Preview" className="max-h-32 object-contain rounded" />
              ) : (
                <>
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload image</span>
                </>
              )}
            </Button>
            {selectedFile && !isUploading && (
              <p className="text-xs text-center text-muted-foreground">Selected: {selectedFile.name}</p>
            )}
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
                      ? "border-budget-teal bg-budget-teal/10"
                      : "border-gray-200 bg-white"
                  } flex flex-col items-center gap-2 cursor-pointer transition-all`}
                  onClick={() => setUserData({ ...userData, roomType: room.id })}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userData.roomType === room.id ? "bg-budget-teal text-white" : "bg-gray-100"
                  }`}>
                    {room.icon}
                  </div>
                  <span className="font-medium text-sm">{room.name}</span>
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
                      ? "border-budget-teal bg-budget-teal/10"
                      : "border-gray-200 bg-white"
                  } flex items-center justify-between cursor-pointer transition-all`}
                  onClick={() => setUserData({ ...userData, budget: option.id })}
                >
                  <span className="font-medium">{option.label}</span>
                  {userData.budget === option.id && (
                    <div className="w-5 h-5 rounded-full bg-budget-teal flex items-center justify-center">
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
                      ? "border-budget-teal bg-budget-teal/10"
                      : "border-gray-200 bg-white"
                  } flex items-center gap-3 cursor-pointer transition-all`}
                  onClick={() => setUserData({ ...userData, renovationType: type.id })}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    userData.renovationType === type.id ? "bg-budget-teal text-white" : "bg-gray-100"
                  }`}>
                    {type.icon}
                  </div>
                  <div>
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 mb-6">
        <Button
          className="w-full flex items-center justify-center gap-2"
          onClick={handleNextStep}
          disabled={isNextDisabled()}
        >
          {isUploading ? "Creating Project..." : (currentStep < TOTAL_STEPS ? "Continue" : "Generate Designs")}
          {!isUploading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </PageContainer>
  );
};

export default OnboardingPage;
