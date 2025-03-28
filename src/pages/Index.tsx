
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui-custom/Logo";
import PageContainer from "@/components/layout/PageContainer";
import { ArrowRight, Home, Sparkles, PaintBucket, Lightbulb } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <PageContainer className="flex flex-col justify-between">
      <div>
        <Logo size="lg" />
        
        <div className="mt-12 space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Flip Your Room for 
            <span className="text-budget-teal"> Under $500</span>
          </h1>
          
          <p className="text-muted-foreground text-lg">
            Transform your space with budget-friendly AI-powered redesigns and DIY suggestions.
          </p>
          
          <div className="flex justify-center pt-4">
            <Link to="/projects">
              <Button size="lg" className="gap-2">
                Start a New Project
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
      <div className="mt-12 space-y-8">
        <h2 className="text-2xl font-semibold text-center">How It Works</h2>
        
        <div className="grid gap-4">
          {[
            {
              icon: <Home className="h-8 w-8 text-budget-teal" />,
              title: "Upload Your Room",
              description: "Take a photo of the room you want to transform",
            },
            {
              icon: <Sparkles className="h-8 w-8 text-budget-accent" />,
              title: "Get AI Redesigns",
              description: "Our AI suggests budget-friendly transformations",
            },
            {
              icon: <PaintBucket className="h-8 w-8 text-budget-teal" />,
              title: "DIY Suggestions",
              description: "Practical tips to transform your space affordably",
            },
            {
              icon: <Lightbulb className="h-8 w-8 text-budget-accent" />,
              title: "Increase Home Value",
              description: "Add value to your property with smart updates",
            },
          ].map((step, i) => (
            <div key={i} className="flex gap-4 items-start p-4 rounded-lg bg-white shadow-sm">
              <div className="bg-white p-2 rounded-lg shadow-sm">
                {step.icon}
              </div>
              <div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-center">
          <Link to="/explore">
            <Button variant="outline" size="lg">
              Explore Examples
            </Button>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
};

export default Index;
