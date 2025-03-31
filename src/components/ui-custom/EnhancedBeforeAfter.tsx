
import ReactCompareImage from "react-compare-image";
import { useState } from "react";

interface EnhancedBeforeAfterProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

const EnhancedBeforeAfter = ({
  beforeImage,
  afterImage,
  className = "",
  beforeLabel = "Before",
  afterLabel = "After"
}: EnhancedBeforeAfterProps) => {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <div 
      className={`w-full rounded-lg overflow-hidden relative ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <ReactCompareImage
        leftImage={beforeImage}
        rightImage={afterImage}
        leftImageLabel={
          <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-xs font-bold">
            {beforeLabel}
          </div>
        }
        rightImageLabel={
          <div className="bg-budget-accent/70 backdrop-blur-sm text-white px-3 py-1 rounded-sm text-xs font-bold">
            {afterLabel}
          </div>
        }
        sliderLineWidth={2}
        handleSize={48}
        hover
        sliderPositionPercentage={0.5}
        leftImageCss={{ objectFit: "cover" }}
        rightImageCss={{ objectFit: "cover" }}
        handle={
          <div className={`w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center transition-all duration-300 ${isHovering ? 'scale-110' : 'scale-100'}`}>
            <div className="w-6 h-6 bg-budget-accent/20 rounded-full flex items-center justify-center">
              <svg 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className="text-budget-accent"
              >
                <path d="M18 8L6 16M6 8l12 8"/>
              </svg>
            </div>
          </div>
        }
      />
      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
        <div className={`bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full transition-opacity duration-300 ${isHovering ? 'opacity-0' : 'opacity-100'}`}>
          Slide to compare
        </div>
      </div>
    </div>
  );
};

export default EnhancedBeforeAfter;
