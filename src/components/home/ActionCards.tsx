import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";

const ActionCards = () => {
  return (
    <div className="gap-3">
      <Link to="/onboarding" className="block">
        <div className="bg-gray-100 rounded-xl aspect-video sm:aspect-square flex flex-col items-center justify-center p-4 shadow-sm hover:shadow-md transition-all w-full">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm">
            <Sparkles className="h-6 w-6 text-budget-accent transition-transform hover:scale-110 duration-200" />
          </div>
          <span className="text-sm font-medium text-center">Design with AI</span>
          <span className="text-xs text-budget-dark/70 mt-1">(AI-generated)</span>
        </div>
      </Link>
    </div>
  );
};

export default ActionCards;
