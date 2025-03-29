import { lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui-custom/Logo";
import PageContainer from "@/components/layout/PageContainer";
import { ArrowRight, Lightbulb, Rocket, Search, Check, Sparkles, Sofa, Clock, Info, PaintBucket, Hammer } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Badge from "@/components/ui-custom/Badge";

// Lazy load components that are not immediately visible
const RoomSelector = lazy(() => import("@/components/home/RoomSelector"));
const BeforeAfterPreview = lazy(() => import("@/components/home/BeforeAfterPreview"));

// Constants
const EASY_WINS = [
  { 
    title: "Paint a Room", 
    icon: <PaintBucket className="h-6 w-6 text-budget-accent" />,
    value: "Save $2,000+",
    tooltip: "Transform your space with modern paint techniques that mimic expensive tile"
  },
  { 
    title: "Stick-on Splashback", 
    icon: <Hammer className="h-6 w-6 text-budget-accent" />,
    value: "Under $200",
    tooltip: "Easy-to-apply adhesive panels that look like real tile"
  },
  { 
    title: "Renew Cabinets", 
    icon: <Hammer className="h-6 w-6 text-budget-accent" />,
    value: "Weekend Project",
    tooltip: "Update cabinet fronts without replacing the entire unit"
  }
] as const;

const Index = () => {
  return (
    <PageContainer className="flex flex-col justify-between min-h-screen" bg="beige">
      <div className="space-y-16">
        <div className="py-6">
          <Logo size="lg" />
        </div>
        
        <Suspense fallback={<div className="h-48 animate-pulse bg-gray-100 rounded-xl" />}>
          <RoomSelector />
          <Link to="/new-project">
            <Button className="w-full mt-4 py-3 bg-budget-yellow/20 hover:bg-budget-yellow/30 text-budget-dark">
              Select another room
            </Button>
          </Link>
        </Suspense>
        
        <div>
          <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <Suspense fallback={<div className="h-48 animate-pulse bg-gray-100 rounded-lg" />}>
              <BeforeAfterPreview />
            </Suspense>
            
            <h1 className="text-2xl font-bold leading-tight relative z-10 mb-3 text-budget-dark">
              💡 Real reno ideas.
              <span className="text-budget-teal block mt-2"> Budget-friendly results.</span>
            </h1>
            
            <p className="text-budget-dark/80 text-sm relative z-10 mb-6">
              Get personalised room redesigns powered by AI — no tradies, just smart choices.
            </p>
            
            <div className="relative z-10">
              <Link to="/new-project">
                <Button className="w-full py-8 gap-3 bg-budget-accent hover:bg-budget-accent/90 text-white text-base font-semibold">
                  Try it Free – Reno my Home
                  <Rocket className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center justify-center mt-4 text-xs gap-1.5 text-budget-teal font-medium">
                <Check className="h-4 w-4" />
                <span>3 Free AI Designs Included</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="text-xl font-semibold mb-8">💸 Easy Wins That Add Real Value</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {EASY_WINS.map((hack, i) => (
              <TooltipProvider key={i}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="group flex flex-col items-center p-5 bg-white rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all cursor-pointer">
                      <div className="w-14 h-14 rounded-full bg-budget-teal/10 flex items-center justify-center mb-4 group-hover:bg-budget-teal/20 transition-colors">
                        {hack.icon}
                      </div>
                      <span className="text-sm font-medium text-budget-dark mb-3 min-h-[40px] flex items-center justify-center">
                        {hack.title}
                      </span>
                      <Badge>{hack.value}</Badge>
                      <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Info className="h-4 w-4 text-budget-neutral" />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{hack.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-gray-100">
          <h2 className="text-xl font-semibold mb-6">Recent Projects</h2>
          
          <div className="space-y-4">
            <Link to="/project/1" className="block">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                    <img src="/after.png" alt="Bathroom" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-2 mb-3">
                      <h3 className="font-medium text-budget-dark text-lg">Bathroom Renovation</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="success">
                                <span>💰</span> +$18,000 Value
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Estimated value added based on similar renovations</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Badge variant="warning">1 free flip left!</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-budget-dark/70 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Last edited: 2 days ago
                      </span>
                    </div>
                    <Progress value={100} className="h-3 rounded-full bg-gray-100" />
                  </div>
                  <ArrowRight className="h-5 w-5 text-budget-neutral shrink-0" />
                </div>
              </div>
            </Link>
            
            <Link to="/explore" className="block">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 rounded-full bg-budget-yellow/20 flex items-center justify-center shrink-0">
                  <Sparkles className="h-7 w-7 text-budget-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-budget-dark text-lg mb-1">Get Inspired</h3>
                  <p className="text-sm text-budget-dark/80">Browse DIY transformation examples</p>
                </div>
                <ArrowRight className="h-5 w-5 text-budget-neutral shrink-0" />
              </div>
            </Link>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default Index;

