
import { useState } from "react";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BeforeAfterView from "@/components/ui-custom/BeforeAfterView";
import DesignSuggestion from "@/components/ui-custom/DesignSuggestion";

const ExplorePage = () => {
  const [activeRoom, setActiveRoom] = useState("living-room");
  
  // Sample explore data
  const exampleRooms = [
    {
      id: "living-room",
      name: "Living Room",
      beforeImage: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb3",
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
      id: "bedroom",
      name: "Bedroom",
      beforeImage: "https://images.unsplash.com/photo-1600210491369-e753d80a41f3",
      afterImage: "https://images.unsplash.com/photo-1617325247661-675ab4b64ae2",
      totalEstimate: 380,
      valueIncrease: 1800,
      suggestions: [
        {
          id: "s1",
          title: "New bedding set",
          estimatedCost: 150,
          description: "Modern bedding with duvet cover and decorative pillows",
        },
        {
          id: "s2",
          title: "Wall paint (Soft Gray)",
          estimatedCost: 120,
          description: "Paint walls with Benjamin Moore Classic Gray",
        },
        {
          id: "s3",
          title: "Bedside lighting",
          estimatedCost: 110,
          description: "Add minimalist bedside lamp or wall sconces",
        },
      ],
    },
    {
      id: "kitchen",
      name: "Kitchen",
      beforeImage: "https://images.unsplash.com/photo-1556912173-3bb406ef7e77",
      afterImage: "https://images.unsplash.com/photo-1600566752355-35792bedcfea",
      totalEstimate: 490,
      valueIncrease: 3000,
      suggestions: [
        {
          id: "s1",
          title: "Cabinet refresh",
          estimatedCost: 180,
          description: "Paint cabinets white and add new modern hardware",
        },
        {
          id: "s2",
          title: "Peel & stick backsplash",
          estimatedCost: 120,
          description: "Add peel and stick marble-look backsplash",
        },
        {
          id: "s3",
          title: "Under-cabinet lighting",
          estimatedCost: 85,
          description: "Install LED strip lights under cabinets",
        },
        {
          id: "s4",
          title: "Update faucet",
          estimatedCost: 105,
          description: "Replace with modern brushed nickel kitchen faucet",
        },
      ],
    },
  ];
  
  // Find the current room
  const currentRoom = exampleRooms.find(room => room.id === activeRoom) || exampleRooms[0];

  return (
    <PageContainer>
      <div className="flex items-center mb-6">
        <Link to="/">
          <Button variant="ghost" size="icon" className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Explore Examples</h1>
      </div>
      
      <Tabs value={activeRoom} onValueChange={setActiveRoom}>
        <TabsList className="w-full mb-4">
          {exampleRooms.map(room => (
            <TabsTrigger key={room.id} value={room.id} className="flex-1">
              {room.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {exampleRooms.map(room => (
          <TabsContent key={room.id} value={room.id} className="animate-fade-in">
            <div className="space-y-4">
              <div className="text-sm text-center text-muted-foreground mb-2">
                See how we transformed this {room.name.toLowerCase()} for under ${room.totalEstimate}
              </div>
              
              <BeforeAfterView
                beforeImage={room.beforeImage}
                afterImage={room.afterImage}
              />
              
              <DesignSuggestion
                title={`Budget-Friendly ${room.name} Flip`}
                totalEstimate={room.totalEstimate}
                valueIncrease={room.valueIncrease}
                suggestions={room.suggestions}
              />
              
              <div className="flex justify-center">
                <Link to="/new-project">
                  <Button>
                    Start My Project
                  </Button>
                </Link>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </PageContainer>
  );
};

export default ExplorePage;
