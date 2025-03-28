
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui-custom/Logo";
import PageContainer from "@/components/layout/PageContainer";
import { ArrowRight, PaintBucket, Hammer, Lightbulb, Rocket, Search, ToolBox, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import StyleChip from "@/components/ui-custom/StyleChip";

const Index = () => {
  return (
    <PageContainer className="flex flex-col justify-between" bg="beige">
      <div>
        <div className="py-6">
          <Logo size="lg" />
        </div>
        
        <div className="search-container mb-8">
          <Search className="absolute left-4 top-3 text-budget-neutral" />
          <input 
            type="text" 
            placeholder="What room are you flipping?" 
            className="search-input" 
          />
        </div>
        
        <div className="mb-6">
          <h2 className="text-sm font-medium mb-3 text-budget-dark">What room do you want to flip?</h2>
          <div className="category-grid">
            {[
              {
                icon: <PaintBucket className="h-6 w-6 text-budget-accent" />,
                name: "Living Room"
              },
              {
                icon: <Hammer className="h-6 w-6 text-budget-accent" />,
                name: "Kitchen"
              },
              {
                icon: <Lightbulb className="h-6 w-6 text-budget-accent" />,
                name: "Bedroom"
              },
            ].map((category, i) => (
              <Link to="/new-project" key={i} className="category-item hover:shadow-md transition-all">
                <span className="mb-2">{category.icon}</span>
                <span className="text-xs font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="mt-8 mb-10">
          <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="absolute -right-4 -top-4 bg-budget-yellow text-xs font-bold py-1 px-3 rounded-full shadow-sm rotate-12 z-10">
              Before & After
            </div>
            
            <div className="flex mb-4 rounded-lg overflow-hidden">
              <div className="w-1/2 h-28 bg-gray-200">
                <img 
                  src="https://images.unsplash.com/photo-1582562124811-c09040d0a901" 
                  alt="Before Room" 
                  className="w-full h-full object-cover opacity-70"
                />
              </div>
              <div className="w-1/2 h-28 bg-gray-100">
                <img 
                  src="https://images.unsplash.com/photo-1582562124811-c09040d0a901" 
                  alt="After Room" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold leading-tight relative z-10 mb-2 text-budget-dark">
              Flip Your Room for 
              <span className="text-budget-teal"> Under $500</span>
            </h1>
            
            <p className="text-budget-dark/80 text-sm relative z-10 mb-4">
              DIY-style upgrades with AI-powered suggestions — no tradie required.
            </p>
            
            <div className="relative z-10">
              <Link to="/new-project">
                <Button size="lg" className="w-full gap-2 bg-budget-accent hover:bg-budget-accent/90 text-white">
                  Start Free Flip
                  <Rocket className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex items-center justify-center mt-3 text-xs gap-1 text-budget-teal font-medium">
                <Check className="h-4 w-4" />
                <span>3 Free AI Designs Included</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">DIY Hacks That Add Value</h2>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { title: "Paint Instead of Tile", icon: <PaintBucket className="h-5 w-5" /> },
              { title: "Stick-on Splashback", icon: <ToolBox className="h-5 w-5" /> },
              { title: "Reface Cabinets", icon: <Hammer className="h-5 w-5" /> }
            ].map((hack, i) => (
              <div key={i} className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="w-10 h-10 rounded-full bg-budget-teal/10 flex items-center justify-center mb-2">
                  {hack.icon}
                </div>
                <span className="text-xs font-medium text-budget-dark">{hack.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
        
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb3" 
                  alt="Living Room" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center">
                  <h3 className="font-medium text-budget-dark">Living Room Makeover</h3>
                  <div className="ml-2 bg-budget-teal/10 text-budget-teal text-xs rounded-full px-2 py-0.5">
                    +$3,000 Value
                  </div>
                </div>
                <p className="text-xs text-budget-neutral">2 of 3 flips used</p>
                <Progress value={66} className="h-2 mt-1 bg-gray-100" />
              </div>
              <ArrowRight className="h-4 w-4 text-budget-neutral" />
            </div>
          </div>
          
          <Link to="/explore" className="block">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-budget-yellow/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-budget-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-budget-dark">Get Inspired 🧠</h3>
                <p className="text-xs text-budget-neutral">Browse DIY transformation examples</p>
              </div>
              <ArrowRight className="h-4 w-4 text-budget-neutral" />
            </div>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default Index;
