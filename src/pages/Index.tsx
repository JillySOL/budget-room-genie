import { Button } from "@/components/ui/button";
import Logo from "@/components/ui-custom/Logo";
import PageContainer from "@/components/layout/PageContainer";
import { ArrowRight, PaintBucket, Hammer, Lightbulb, Rocket, Search, Check, Sparkles, Sofa, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import StyleChip from "@/components/ui-custom/StyleChip";

const Index = () => {
  return (
    <PageContainer className="flex flex-col justify-between min-h-screen" bg="beige">
      <div className="space-y-12">
        <div className="py-6">
          <Logo size="lg" />
        </div>
        
        <div className="search-container">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-budget-neutral" />
          <input 
            type="text" 
            placeholder="What room are you flipping?" 
            className="search-input pl-12" 
          />
        </div>
        
        <div>
          <h2 className="text-sm font-medium mb-4 text-budget-dark">What room do you want to flip?</h2>
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
        
        <div>
          <div className="relative overflow-hidden bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="absolute -right-4 -top-4 bg-gradient-to-r from-budget-teal to-budget-accent text-white text-xs font-bold py-1.5 px-4 rounded-full shadow-sm rotate-12 z-10">
              Before & After
            </div>
            
            <div className="flex mb-6 rounded-lg overflow-hidden relative">
              <div className="w-1/2 h-32 bg-gray-200 relative">
                <img 
                  src="/images/room-before.jpg" 
                  alt="Before Room" 
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">Before</div>
              </div>
              <div className="w-1/2 h-32 bg-gray-100 relative">
                <img 
                  src="/images/room-after.jpg" 
                  alt="After Room" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">After</div>
              </div>
            </div>
            
            <h1 className="text-2xl font-bold leading-tight relative z-10 mb-3 text-budget-dark">
              💡 Real reno ideas.
              <span className="text-budget-teal block mt-1"> Budget-friendly results.</span>
            </h1>
            
            <p className="text-budget-dark/80 text-sm relative z-10 mb-6">
              Get personalised room redesigns powered by AI — no tradies, just smart choices.
            </p>
            
            <div className="relative z-10">
              <Link to="/new-project">
                <Button className="w-full py-6 gap-3 bg-budget-accent hover:bg-budget-accent/90 text-white text-base">
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

        <div>
          <h2 className="text-xl font-semibold mb-6">💸 Easy Wins That Add Real Value</h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { 
                title: "Paint Instead of Tile", 
                icon: <PaintBucket className="h-5 w-5 text-budget-accent" />,
                value: "Save $2,000+"
              },
              { 
                title: "Stick-on Splashback", 
                icon: <Hammer className="h-5 w-5 text-budget-accent" />,
                value: "Under $100 hack"
              },
              { 
                title: "Reface Cabinets", 
                icon: <Hammer className="h-5 w-5 text-budget-accent" />,
                value: "DIY for under $500"
              }
            ].map((hack, i) => (
              <div key={i} className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm border border-gray-100 text-center">
                <div className="w-12 h-12 rounded-full bg-budget-teal/10 flex items-center justify-center mb-3">
                  {hack.icon}
                </div>
                <span className="text-sm font-medium text-budget-dark mb-2">{hack.title}</span>
                <span className="text-xs font-medium bg-budget-accent/10 text-budget-accent rounded-full px-3 py-1">
                  {hack.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-12 mb-8">
        <h2 className="text-xl font-semibold mb-6">Recent Projects</h2>
        
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                <Sofa className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-medium text-budget-dark truncate">Living Room Makeover</h3>
                  <div className="bg-green-600 text-white text-xs font-medium rounded-full px-3 py-1 flex items-center gap-1.5 whitespace-nowrap">
                    <span>💰</span> +$3,000 Value
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <p className="text-xs text-budget-accent font-medium">1 free flip left!</p>
                  <span className="text-xs text-budget-dark/70 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Last edited: 2 days ago
                  </span>
                </div>
                <Progress value={66} className="h-2.5 bg-gray-100" />
              </div>
              <ArrowRight className="h-5 w-5 text-budget-neutral shrink-0" />
            </div>
          </div>
          
          <Link to="/explore" className="block">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-budget-yellow/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-6 w-6 text-budget-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-budget-dark mb-1">Get Inspired</h3>
                <p className="text-sm text-budget-dark/70">Browse DIY transformation examples</p>
              </div>
              <ArrowRight className="h-5 w-5 text-budget-neutral shrink-0" />
            </div>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default Index;

