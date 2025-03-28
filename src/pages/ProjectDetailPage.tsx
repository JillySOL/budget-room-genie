
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, DownloadIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BeforeAfterView from "@/components/ui-custom/BeforeAfterView";
import DesignSuggestion from "@/components/ui-custom/DesignSuggestion";
import SubscriptionModal from "@/components/ui-custom/SubscriptionModal";
import { useToast } from "@/hooks/use-toast";

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [designTab, setDesignTab] = useState("design-1");
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Placeholder data for the project
  const project = {
    id: id || "1",
    name: "Living Room Refresh",
    roomType: "Living Room",
    originalImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb3",
    budget: 500,
    style: "Minimalist",
    flipType: "Budget Flip",
    flipsUsed: 2,
    flipsTotal: 3,
    designs: [
      {
        id: "design-1",
        name: "Bright & Airy Minimalist",
        afterImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7",
        totalEstimate: 450,
        valueIncrease: 2000,
        suggestions: [
          {
            id: "s1",
            title: "Paint walls (Simply White)",
            estimatedCost: 180,
            description: "Fresh coat of paint on all walls with Benjamin Moore Simply White",
          },
          {
            id: "s2",
            title: "Update light fixture",
            estimatedCost: 120,
            description: "Replace ceiling light with modern pendant light",
          },
          {
            id: "s3",
            title: "Add floating shelves",
            estimatedCost: 85,
            description: "Install 3 white floating shelves on accent wall",
          },
          {
            id: "s4",
            title: "New throw pillows",
            estimatedCost: 65,
            description: "Add 4 textured neutral throw pillows to refresh sofa",
          },
        ],
      },
      {
        id: "design-2",
        name: "Cozy Scandinavian",
        afterImage: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92",
        totalEstimate: 480,
        valueIncrease: 2500,
        suggestions: [
          {
            id: "s1",
            title: "Paint accent wall (Hale Navy)",
            estimatedCost: 95,
            description: "Create feature wall with Benjamin Moore Hale Navy",
          },
          {
            id: "s2",
            title: "Add area rug",
            estimatedCost: 140,
            description: "5x7 neutral patterned area rug to define space",
          },
          {
            id: "s3",
            title: "Wall art and décor",
            estimatedCost: 110,
            description: "Minimal wall art and small decorative objects",
          },
          {
            id: "s4",
            title: "Table lamp and plants",
            estimatedCost: 135,
            description: "Add warm lighting with table lamp and 2-3 indoor plants",
          },
        ],
      },
    ],
  };
  
  const handleGenerateNew = () => {
    if (project.flipsUsed >= project.flipsTotal) {
      setShowSubscriptionModal(true);
    } else {
      // Generate new design
      toast({
        title: "Generating new design",
        description: "This would generate a new AI design in the real app",
      });
    }
  };
  
  const handleSubscribe = () => {
    setShowSubscriptionModal(false);
    toast({
      title: "Subscription successful",
      description: "You now have unlimited access to BudgetFlip Pro features",
    });
  };

  // Find the current design
  const currentDesign = project.designs.find(d => d.id === designTab) || project.designs[0];

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Link to="/projects">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">{project.name}</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={handleGenerateNew}
        >
          <Plus className="h-3 w-3" />
          New Design
        </Button>
      </div>
      
      <div className="bg-white rounded-lg p-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <div className="bg-secondary text-xs px-2 py-1 rounded">
            {project.roomType}
          </div>
          <div className="bg-secondary text-xs px-2 py-1 rounded">
            ${project.budget} Budget
          </div>
          <div className="bg-secondary text-xs px-2 py-1 rounded">
            {project.style}
          </div>
          <div className="bg-secondary text-xs px-2 py-1 rounded">
            {project.flipType}
          </div>
        </div>
      </div>
      
      {project.designs.length > 0 ? (
        <div className="space-y-6">
          <Tabs value={designTab} onValueChange={setDesignTab}>
            <TabsList className="w-full">
              {project.designs.map((design, index) => (
                <TabsTrigger key={design.id} value={design.id} className="flex-1">
                  Design {index + 1}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {project.designs.map((design) => (
              <TabsContent key={design.id} value={design.id} className="animate-fade-in">
                <div className="space-y-4">
                  <BeforeAfterView
                    beforeImage={project.originalImage}
                    afterImage={design.afterImage}
                  />
                  
                  <DesignSuggestion
                    title={design.name}
                    totalEstimate={design.totalEstimate}
                    valueIncrease={design.valueIncrease}
                    suggestions={design.suggestions}
                  />
                  
                  <Button className="w-full gap-2">
                    <DownloadIcon className="h-4 w-4" />
                    Save to My Projects
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
          
          <div className="text-center text-xs text-muted-foreground">
            {project.flipsUsed} of {project.flipsTotal} free flips used
            {project.flipsUsed >= project.flipsTotal && (
              <Button 
                variant="link" 
                className="text-xs h-auto p-0 pl-1"
                onClick={() => setShowSubscriptionModal(true)}
              >
                Upgrade for unlimited
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="font-medium mb-2">No designs generated yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Generate your first design to see the transformation
          </p>
          <Button onClick={handleGenerateNew}>Generate Design</Button>
        </div>
      )}
      
      <SubscriptionModal
        open={showSubscriptionModal}
        onOpenChange={setShowSubscriptionModal}
        onSubscribe={handleSubscribe}
      />
    </PageContainer>
  );
};

export default ProjectDetailPage;
