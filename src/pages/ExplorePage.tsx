import { Link } from "react-router-dom";
import PageContainer from "@/components/layout/PageContainer";
import { IMAGES } from "@/constants/images";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LoadingPage, LoadingCard } from "@/components/ui/loading";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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

const ExplorePage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage />;
  }

  return (
    <PageContainer>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="py-4">
          <h1 className="text-xl font-semibold">Explore Projects</h1>
        </div>

        {/* Featured Project */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-budget-dark">Budget-Friendly Bathroom Refresh</h2>
            <span className="bg-[#E6F4EA] text-green-800 text-sm font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
              +$18,000 Value
            </span>
          </div>

          <p className="text-budget-dark/70 mb-6">
            See how we transformed this bathroom for under $780 with clever DIY hacks and budget-friendly updates.
          </p>

          <Link to="/project/bathroom-refresh" className="block">
            <EnhancedBeforeAfter
              beforeImage={IMAGES.BEFORE}
              afterImage={IMAGES.AFTER}
              className="mb-6 hover:opacity-95 transition-opacity rounded-xl overflow-hidden"
            />
          </Link>
          
          <Accordion type="single" collapsible className="mb-6">
            <AccordionItem value="suggestions">
              <AccordionTrigger className="text-budget-accent">
                View suggested DIY improvements
              </AccordionTrigger>
              <AccordionContent>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6 pt-4"
                >
                  {BATHROOM_SUGGESTIONS.map((suggestion) => (
                    <motion.div 
                      key={suggestion.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-start gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-budget-dark">{suggestion.title}</h3>
                          <span className="text-sm font-medium text-budget-accent">
                            ${suggestion.estimatedCost}
                          </span>
                        </div>
                        <p className="text-sm text-budget-dark/70">{suggestion.description}</p>
                      </div>
                    </motion.div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="font-medium">Total Cost</span>
                    <span className="text-budget-accent font-medium">
                      $780 AUD
                    </span>
                  </div>
                </motion.div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <div className="flex flex-col gap-3">
            <Link to="/project/bathroom-refresh">
              <Button className="w-full gap-2">
                <Download className="h-4 w-4" />
                View Full Project
              </Button>
            </Link>
            <Button 
              className="w-full bg-[#f9f9f9] hover:bg-[#f0f0f0] text-budget-dark border border-gray-200 flex items-center justify-start px-4"
              onClick={() => localStorage.setItem('savedDesign', JSON.stringify({
                id: "bathroom-refresh",
                name: "Budget-Friendly Refresh",
                totalCost: 780,
                valueAdd: 18000,
                suggestions: BATHROOM_SUGGESTIONS,
              }))}
            >
              <span className="mr-2">📝</span> Save to Notebook
            </Button>
          </div>
        </motion.div>

        {/* More Projects Section */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <h2 className="text-lg font-semibold mb-4">More Projects</h2>
          <div className="grid gap-4">
            <Link to="/project/kitchen-makeover" className="block">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Kitchen Cabinet Makeover</h3>
                  <span className="bg-[#E6F4EA] text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                    +$12,000 Value
                  </span>
                </div>
                <p className="text-sm text-budget-dark/70">Transform your kitchen with a budget-friendly cabinet makeover that adds significant value to your home.</p>
                <div className="mt-4">
                  <span className="text-sm font-medium text-budget-accent">View Project →</span>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};

export default ExplorePage;
