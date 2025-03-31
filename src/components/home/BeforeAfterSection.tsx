
import React from "react";
import { IMAGES } from "@/constants/images";
import EnhancedBeforeAfter from "@/components/ui-custom/EnhancedBeforeAfter";

const BeforeAfterSection = () => {
  return (
    <div className="mb-6">
      <h2 className="font-medium text-budget-dark mb-3 flex items-center">
        See the transformation
        <span className="ml-2 text-xs bg-budget-accent/10 text-budget-accent px-2 py-0.5 rounded-full">Swipe to compare</span>
      </h2>
      <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 relative">
        <EnhancedBeforeAfter
          beforeImage={IMAGES.BEFORE}
          afterImage={IMAGES.AFTER}
        />
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center">
            <span className="mr-1">👆</span> Slide to compare
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSection;
