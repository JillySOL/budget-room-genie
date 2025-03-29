import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import BeforeAfterView from "@/components/ui-custom/BeforeAfterView";
import { IMAGES } from "@/constants/images";

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
  
  const totalCost = BATHROOM_SUGGESTIONS.reduce((acc, item) => acc + item.estimatedCost, 0);

  return (
    <PageContainer>
      <div className="flex items-center mb-6">
        <Link to="/">
          <Button className="mr-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Bathroom Renovation</h1>
      </div>
      
      <div className="space-y-6">
        <BeforeAfterView
          beforeImage={IMAGES.BEFORE}
          afterImage={IMAGES.AFTER}
        />
        
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Suggested Changes</h2>
            <div className="text-sm font-medium">
              Total: <span className="text-budget-accent">${totalCost} AUD</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {BATHROOM_SUGGESTIONS.map((suggestion) => (
              <div key={suggestion.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-budget-dark">{suggestion.title}</h3>
                    <span className="text-sm font-medium text-budget-accent">${suggestion.estimatedCost}</span>
                  </div>
                  <p className="text-sm text-budget-dark/70">{suggestion.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="text-sm text-budget-dark/70">
              <strong>DIY Options Used:</strong> Peel-and-stick tile, paint, fixture replacement
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default ProjectDetailPage;
