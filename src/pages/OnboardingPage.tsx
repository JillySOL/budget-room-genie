import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Home, Paintbrush, Hammer, DollarSign, Camera, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Logo from "@/components/ui-custom/Logo";
import StyleChip from "@/components/ui-custom/StyleChip";
import { toast } from "sonner";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the photoKey from location state (passed from photo upload)
  const photoKey = location.state?.photoKey;
  
  useEffect(() => {
    // If no photoKey is provided, redirect back to new-project
    if (!photoKey) {
      toast.error("Please select or upload a photo first");
      navigate("/new-project");
    }
  }, [photoKey, navigate]);
  
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

  const handleSubmitProject = async () => {
    if (!photoKey) {
      toast.error("Photo is missing. Please try again.");
      navigate("/new-project");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Convert form data to the format expected by the API
      const projectDetails = {
        roomType: getRoomTypeName(userData.roomType),
        budget: parseInt(userData.budget),
        style: getStyleName(userData.style),
        renovationType: getRenovationTypeName(userData.renovationType),
        instructions: "" // We could add this field later
      };
      
      // Get auth token with the specific template
      const token = await getToken({ template: "RenoMateBackendAPI" });
      
      // Call API to start generation
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/start-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          key: photoKey,
          projectDetails
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Include more specific error handling based on backend response if possible
        throw new Error(data.message || `Failed to start generation (HTTP ${response.status})`);
      }

      // Ensure projectId is returned from the backend
      if (!data.projectId) {
        throw new Error("Backend did not return a projectId.");
      }
      
      // Navigate to the simple status page, passing the projectId
      navigate(`/status`, { 
        state: { 
          // Pass only the projectId needed by the status page
          projectId: data.projectId 
        } 
      });
      
    } catch (error) {
      console.error("Error submitting project:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit project. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper functions to get display names
  const getRoomTypeName = (id: string) => {
    const room = roomTypes.find(room => room.id === id);
    return room ? room.name : id;
  };
  
  const getStyleName = (id: string) => {
    const style = styleOptions.find(style => style.id === id);
    return style ? style.label : id;
  };
  
  const getRenovationTypeName = (id: string) => {
    const type = renovationTypes.find(type => type.id === id);
    return type ? type.name : id;
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit the project to API
      handleSubmitProject();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/new-project");
    }
  };

  return (
    <PageContainer className="flex flex-col min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Logo size="sm" />
        <div className="w-8"></div> {/* Empty div for alignment */}
      </div>

      <div className="flex justify-between mb-6">
        {[1, 2, 3, 4].map((step) => (
          <div 
            key={step}
            className={`h-1 flex-1 mx-0.5 rounded-full ${
              step <= currentStep ? "bg-budget-accent" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="flex-1 pb-6">
        {currentStep === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">G'day! What room are you looking to flip?</h2>
            <p className="text-sm text-muted-foreground">Select the room you want to transform</p>
            
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
            
            <Button
              className="w-full flex items-center justify-center gap-2 mt-6 bg-budget-accent hover:bg-budget-accent/90"
              onClick={handleNextStep}
              disabled={!userData.roomType}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">What's your budget?</h2>
            <p className="text-sm text-muted-foreground">We'll customize DIY suggestions to fit</p>
            
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
            
            <Button
              className="w-full flex items-center justify-center gap-2 mt-6 bg-budget-accent hover:bg-budget-accent/90"
              onClick={handleNextStep}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">What style do you prefer?</h2>
            <p className="text-sm text-muted-foreground">Pick a design direction for your space</p>
            
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
            
            <Button
              className="w-full flex items-center justify-center gap-2 mt-6 bg-budget-accent hover:bg-budget-accent/90"
              onClick={handleNextStep}
              disabled={!userData.style}
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">What type of renovation?</h2>
            <p className="text-sm text-muted-foreground">Choose the approach that works for you</p>
            
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
            
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <Button
              className="w-full flex items-center justify-center gap-2 mt-6 bg-budget-accent hover:bg-budget-accent/90"
              onClick={handleNextStep}
              disabled={!userData.renovationType || isSubmitting}
            >
              {isSubmitting ? (
                <>Processing...</>
              ) : (
                <>
                  Save & Finish
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  );
};

export default OnboardingPage;
