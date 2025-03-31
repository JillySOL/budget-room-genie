
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
      <div className="rounded-xl overflow-hidden shadow-md border border-gray-200">
        <EnhancedBeforeAfter
          beforeImage={IMAGES.BEFORE}
          afterImage={IMAGES.AFTER}
          beforeLabel="BEFORE"
          afterLabel="AFTER"
        />
      </div>
    </div>
  );
};

export default BeforeAfterSection;
