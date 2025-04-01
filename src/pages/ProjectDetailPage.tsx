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
import { useAuth } from "@clerk/clerk-react";
import { LoadingPage } from "@/components/ui/loading";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Sample project data - in a real app, this would come from an API
const PROJECTS = {
  "bathroom-refresh": {
    id: "bathroom-refresh",
    title: "Budget-Friendly Bathroom Refresh",
    valueAdd: 18000,
    totalCost: 780,
    description: "See how we transformed this bathroom for under $780 with clever DIY hacks and budget-friendly updates.",
    suggestions: [
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
    ]
  },
  "kitchen-makeover": {
    id: "kitchen-makeover",
    title: "Kitchen Cabinet Makeover",
    valueAdd: 12000,
    totalCost: 450,
    description: "Transform your kitchen with a budget-friendly cabinet makeover that adds significant value to your home.",
    suggestions: [
      {
        id: "k1",
        title: "Paint Cabinet Doors",
        estimatedCost: 150,
        description: "Used a high-quality cabinet paint in a modern white shade to give the kitchen a fresh, clean look."
      },
      {
        id: "k2",
        title: "Replace Cabinet Hardware",
        estimatedCost: 80,
        description: "Installed modern brushed gold handles and knobs to add a touch of luxury."
      },
      {
        id: "k3",
        title: "Add Cabinet Crown Molding",
        estimatedCost: 120,
        description: "Installed crown molding to the top of cabinets for a more finished, custom look."
      },
      {
        id: "k4",
        title: "Install Under-Cabinet Lighting",
        estimatedCost: 100,
        description: "Added LED strip lighting under cabinets for better task lighting and ambiance."
      },
      {
        id: "k5",
        title: "Paint Kitchen Walls",
        estimatedCost: 50,
        description: "Painted walls in a light, neutral color to complement the new cabinet color."
      }
    ]
  }
};

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const project = PROJECTS[id as keyof typeof PROJECTS];
  
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingPage />;
  }

  if (!project) {
    return (
      <PageContainer>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-8"
        >
          <h1 className="text-xl font-semibold mb-4">Project Not Found</h1>
          <Link to="/explore">
            <Button>Back to Explore</Button>
          </Link>
        </motion.div>
      </PageContainer>
    );
  }

  const handleSaveToNotebook = () => {
    if (!isSignedIn) {
      // Redirect to sign in
      window.location.href = '/sign-in';
      return;
    }
    localStorage.setItem('savedDesign', JSON.stringify(project));
  };

  const handleSaveToProjects = () => {
    if (!isSignedIn) {
      // Redirect to sign in
      window.location.href = '/sign-in';
      return;
    }
    // TODO: Implement save to projects
  };

  return (
    <PageContainer>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="flex items-center mb-8">
          <Link to="/explore">
            <Button variant="ghost" size="icon" className="mr-2" aria-label="Back to Explore">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">{project.title}</h1>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-budget-dark">{project.title}</h2>
              <span className="bg-[#E6F4EA] text-green-800 text-sm font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 19V5M5 12l7-7 7 7"/>
                </svg>
                +${project.valueAdd.toLocaleString()} Value
              </span>
            </div>

            <p className="text-budget-dark/70 mb-6">
              {project.description}
            </p>

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
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6 pt-4"
                  >
                    {project.suggestions.map((suggestion) => (
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
                        ${project.totalCost} AUD
                      </span>
                    </div>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex flex-col gap-3">
              <Button 
                className="w-full gap-2"
                onClick={handleSaveToProjects}
              >
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
          </motion.div>
        </div>
      </motion.div>
    </PageContainer>
  );
};

export default ProjectDetailPage;
