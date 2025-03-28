
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import ImageUploader from "@/components/ui-custom/ImageUploader";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BudgetSlider from "@/components/ui-custom/BudgetSlider";
import StyleChip from "@/components/ui-custom/StyleChip";
import FlipTypeSelector from "@/components/ui-custom/FlipTypeSelector";

const ROOM_TYPES = [
  { value: "living-room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "dining-room", label: "Dining Room" },
  { value: "office", label: "Home Office" },
];

const STYLE_OPTIONS = [
  { id: "minimalist", label: "Minimalist" },
  { id: "modern", label: "Modern" },
  { id: "scandinavian", label: "Scandinavian" },
  { id: "industrial", label: "Industrial" },
  { id: "bohemian", label: "Bohemian" },
  { id: "japandi", label: "Japandi" },
  { id: "coastal", label: "Coastal" },
  { id: "traditional", label: "Traditional" },
];

const FLIP_TYPES = [
  {
    id: "budget",
    name: "Budget Flip",
    description: "Affordable makeover using clever DIY hacks (under $500)",
  },
  {
    id: "full",
    name: "Full Renovation",
    description: "Complete room transformation with furniture changes",
  },
  {
    id: "diy",
    name: "DIY Only",
    description: "Focus on DIY projects, no major changes or new furniture",
  },
];

const NewProjectPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [projectData, setProjectData] = useState({
    name: "",
    roomType: "",
    image: null as File | null,
    budget: 500,
    style: "minimalist",
    flipType: "budget",
  });

  const handleImageSelect = (file: File) => {
    setProjectData((prev) => ({ ...prev, image: file }));
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit and create project
      navigate("/project/new");
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate("/projects");
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 1 && !projectData.image) return true;
    if (currentStep === 2 && (!projectData.name || !projectData.roomType)) return true;
    return false;
  };

  return (
    <PageContainer>
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={handlePreviousStep} className="mr-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold">New Project</h1>
      </div>
      
      <div className="flex justify-between mb-6">
        {[1, 2, 3, 4].map((step) => (
          <div 
            key={step}
            className={`h-1 flex-1 mx-0.5 rounded-full ${
              step <= currentStep ? "bg-budget-teal" : "bg-muted"
            }`}
          />
        ))}
      </div>
      
      {currentStep === 1 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-medium mb-2">Upload Room Photo</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Take a clear photo of your room from a good angle
            </p>
            <ImageUploader onImageSelect={handleImageSelect} />
          </div>
        </div>
      )}
      
      {currentStep === 2 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-medium mb-2">Room Details</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Tell us more about the room you want to transform
            </p>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g. Living Room Refresh"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="room-type">Room Type</Label>
                <Select
                  value={projectData.roomType}
                  onValueChange={(value) => setProjectData({ ...projectData, roomType: value })}
                >
                  <SelectTrigger id="room-type">
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {currentStep === 3 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-medium mb-2">Budget & Style</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Set your budget limit and preferred design style
            </p>
            
            <div className="space-y-6">
              <BudgetSlider
                onChange={(value) => setProjectData({ ...projectData, budget: value[0] })}
              />
              
              <div className="space-y-2">
                <Label>Design Style</Label>
                <div className="flex flex-wrap gap-2">
                  {STYLE_OPTIONS.map((style) => (
                    <StyleChip
                      key={style.id}
                      label={style.label}
                      selected={projectData.style === style.id}
                      onClick={() => setProjectData({ ...projectData, style: style.id })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {currentStep === 4 && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-medium mb-2">Flip Type</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Choose what kind of transformation you're looking for
            </p>
            
            <FlipTypeSelector
              types={FLIP_TYPES}
              selectedTypeId={projectData.flipType}
              onSelect={(typeId) => setProjectData({ ...projectData, flipType: typeId })}
            />
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <Button 
          className="w-full flex items-center justify-center gap-2"
          onClick={handleNextStep}
          disabled={isNextDisabled()}
        >
          {currentStep < 4 ? "Continue" : "Generate Designs"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </PageContainer>
  );
};

export default NewProjectPage;
