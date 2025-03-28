
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui-custom/Logo";
import PageContainer from "@/components/layout/PageContainer";
import { ArrowRight, Home, Sparkles, PaintBucket, Lightbulb, Search } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <PageContainer className="flex flex-col justify-between">
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
        
        <div className="category-grid mb-8">
          {[
            {
              icon: <PaintBucket className="h-6 w-6 text-budget-accent" />,
              name: "Living Room"
            },
            {
              icon: <Home className="h-6 w-6 text-budget-accent" />,
              name: "Kitchen"
            },
            {
              icon: <Lightbulb className="h-6 w-6 text-budget-accent" />,
              name: "Bedroom"
            },
          ].map((category, i) => (
            <Link to="/new-project" key={i} className="category-item">
              <span className="mb-2">{category.icon}</span>
              <span className="text-xs font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
        
        <div className="mt-8 mb-10">
          <div className="relative overflow-hidden bg-budget-teal text-white rounded-2xl p-6">
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-budget-accent opacity-20 shape-blob"></div>
            <div className="absolute right-20 bottom-10 w-20 h-20 bg-budget-green-light opacity-20 shape-blob"></div>
            
            <h1 className="text-2xl font-bold leading-tight relative z-10 mb-2">
              Flip Your Room for 
              <span className="text-white"> Under $500</span>
            </h1>
            
            <p className="text-white/80 text-sm relative z-10 mb-4">
              Transform your space with budget-friendly redesigns and DIY suggestions.
            </p>
            
            <div className="relative z-10">
              <Link to="/projects">
                <Button size="sm" className="gap-2 bg-white text-budget-teal hover:bg-white/90">
                  Start a New Project
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
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
                <h3 className="font-medium text-budget-dark">Living Room Makeover</h3>
                <p className="text-xs text-budget-neutral">2 of 3 flips used</p>
                <div className="w-full h-1 bg-gray-100 rounded-full mt-1">
                  <div className="h-1 bg-budget-accent rounded-full" style={{ width: '66%' }}></div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-budget-neutral" />
            </div>
          </div>
          
          <Link to="/explore" className="block">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-budget-green-light/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-budget-teal" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-budget-dark">Explore Examples</h3>
                <p className="text-xs text-budget-neutral">Get inspired</p>
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
