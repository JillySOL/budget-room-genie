
import React from "react";
import { Sparkles } from "lucide-react";
import QuickWinCard from "./QuickWinCard";

const QUICK_WINS = [
  {
    title: "Paint Refresh",
    description: "Fresh walls boost brightness and appeal",
    image: "/after.png",
    valueIncrease: "$5,000+",
    cost: "$100 DIY job"
  },
  {
    title: "Lighting Update",
    description: "Modern fixtures for an instant upgrade",
    image: "/lovable-uploads/e6b83d6a-eeaf-4229-be7d-8dea49c70b2f.png",
    valueIncrease: "$3,000+",
    cost: "$150 DIY job"
  },
  {
    title: "Hardware Swap",
    description: "Replace cabinet handles and doorknobs",
    image: "/lovable-uploads/ff66ab71-8056-4e11-8f9c-5ca7bcd63501.png",
    valueIncrease: "$2,000+",
    cost: "Under $200"
  }
];

const QuickWinsSection = () => {
  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-medium text-budget-dark flex items-center gap-1.5">
          <Sparkles className="h-4 w-4 text-budget-accent" /> DIY That Pays Off
        </h2>
        <span className="text-xs text-budget-dark/70">Save thousands with simple upgrades</span>
      </div>
      
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-3 pb-4">
          {QUICK_WINS.map((win, i) => (
            <QuickWinCard
              key={i}
              title={win.title}
              description={win.description}
              image={win.image}
              valueIncrease={win.valueIncrease}
              cost={win.cost}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickWinsSection;
