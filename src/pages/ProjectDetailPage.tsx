import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import { IMAGES } from "@/constants/images";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const BATHROOM_SUGGESTIONS = [
  {
    id: "s1",
    title: "Paint Wall (Soft Neutral)",
    estimatedCost: 150,
    description: "Painted the upper wall a neutral, modern tone (light beige or off-white) to freshen the look and make the space feel larger."
  },
  {
    id: "s2",
    title: "Replace Shower Curtain & Rod",
    estimatedCost: 80,
    description: "Swapped outdated floral curtain with a clean white waffle-style curtain and upgraded to a sleek chrome rod."
  },
  {
    id: "s3",
    title: "Modernize Mirror",
    estimatedCost: 120,
    description: "Replaced circular mirror with a rectangular black-framed mirror for a clean-lined contemporary vibe."
  },
  {
    id: "s4",
    title: "Upgrade Vanity Fixtures",
    estimatedCost: 100,
    description: "Swapped dated gold tap for a matte brushed gold or black fixture to match new hardware."
  },
  {
    id: "s5",
    title: "Tile Over Existing Wall Tiles",
    estimatedCost: 250,
    description: "Covered old floral tiles with modern white wall panels or peel-and-stick tiles for a seamless finish (DIY hack, no demolition required)."
  },
  {
    id: "s6",
    title: "Swap Accessories",
    estimatedCost: 50,
    description: "Neutral-toned soap pump, coordinated hand towel, and a fresh green plant to give the space warmth and life."
  },
  {
    id: "s7",
    title: "Replace Floor Mat",
    estimatedCost: 30,
    description: "Chose a plush dark green mat to contrast the beige floor and add visual texture."
  }
];

const ProjectDetailPage = () => {
  const { id } = useParams();
  
  const handleSaveToNotebook = () => {
    localStorage.setItem('savedDesign', JSON.stringify({
      id: "bathroom-refresh",
      name: "Budget-Friendly Refresh",
      totalCost: 780,
      valueAdd: 18000,
      suggestions: BATHROOM_SUGGESTIONS,
    }));
  };

  return (
    <PageContainer>
      <div className="flex items-center mb-8">
        <Link to="/">
          <Button className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Bathroom Renovation</h1>
      </div>
      
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-budget-dark">Budget-Friendly Refresh</h2>
            <span className="bg-[#E6F4EA] text-green-800 text-sm font-medium px-2.5 py-1 rounded-full">
              +$18,000 Value
            </span>
          </div>

          <EnhancedBeforeAfter
            beforeImage={IMAGES.BEFORE}
            afterImage={IMAGES.AFTER}
            className="mb-6"
          />
          
          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem value="suggestions">
              <AccordionTrigger className="text-budget-accent">
                View suggested DIY improvements
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-4">
                  {BATHROOM_SUGGESTIONS.map((suggestion) => (
                    <div key={suggestion.id} className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-budget-dark">{suggestion.title}</h3>
                          <span className="text-sm font-medium text-budget-accent">
                            ${suggestion.estimatedCost}
                          </span>
                        </div>
                        <p className="text-sm text-budget-dark/70">{suggestion.description}</p>
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-medium">Total Cost</span>
                    <span className="text-budget-accent font-medium">
                      $780 AUD
                    </span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="flex flex-col gap-3">
            <Button className="w-full gap-2">
              <Download className="h-4 w-4" />
              Save to My Projects
            </Button>
            <Button 
              className="w-full bg-[#f9f9f9] hover:bg-[#f0f0f0] text-budget-dark border border-gray-200 flex items-center justify-start px-4"
              onClick={handleSaveToNotebook}
            >
              <span className="mr-2">📝</span> Save to Notebook
            </Button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProjectDetailPage;
