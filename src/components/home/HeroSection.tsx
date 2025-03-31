
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronRight } from "lucide-react";
import Badge from "@/components/ui-custom/Badge";

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-r from-budget-light to-budget-light/50 rounded-xl p-6 mb-4">
      <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-budget-dark">
        Add $18,000+ Value to Your Home<br />
        <span className="text-budget-teal">With Just 1 Photo</span>
      </h1>
      <p className="text-md text-budget-dark/70 max-w-md mb-6 font-light leading-relaxed">
        Get smart, budget-friendly redesigns powered by AI — no tradies, no hassle.
      </p>
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <Link to="/new-project">
          <Button size="lg" className="gap-1 shadow-sm relative overflow-hidden group">
            <Sparkles className="h-4 w-4 relative z-10" />
            <span className="relative z-10">Get My Free Room Flip</span>
            <ChevronRight className="h-4 w-4 relative z-10" />
            <span className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></span>
          </Button>
        </Link>
        <Badge 
          variant="success" 
          className="mt-2 sm:mt-0 shadow-sm"
          style={{ fontSize: '0.7rem' }}
          icon="💰"
        >
          +$18,000 Value Added
        </Badge>
      </div>
      
      <div className="pt-2 pb-1">
        <span className="bg-budget-accent/10 text-budget-accent px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center">
          <span className="mr-1">🏠</span>
          <span className="font-bold animate-pulse">53</span> rooms transformed this week
        </span>
      </div>
    </div>
  );
};

export default HeroSection;
