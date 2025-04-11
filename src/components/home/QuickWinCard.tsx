import React, { useMemo } from "react";

interface QuickWinProps {
  title: string;
  description: string;
  image: string;
  valueIncrease: string;
  cost: string;
}

const QuickWinCard = ({ title, description, image, valueIncrease, cost }: QuickWinProps) => {
  // Ensure image URL is absolute by adding origin if it's a relative path
  const imageUrl = useMemo(() => {
    // If already absolute URL or data URL, return as is
    if (image.startsWith('http') || image.startsWith('data:')) {
      return image;
    }
    // Otherwise, ensure it has the origin
    return image;
  }, [image]);

  return (
    <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow min-w-[240px] w-[240px] flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
        <div>
          <h3 className="font-medium text-budget-dark">{title}</h3>
          <p className="text-xs text-budget-dark/70">{description}</p>
          <div className="mt-2 space-y-1">
            <span className="text-xs flex items-center gap-1 bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium">
              ✅ Adds {valueIncrease} Value
            </span>
            <span className="text-xs flex items-center gap-1 bg-budget-accent/10 text-budget-accent px-2 py-0.5 rounded-full font-medium">
              {title === "Paint Refresh" ? "🎨" : title === "Lighting Update" ? "💡" : "🔧"} {cost}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickWinCard;
