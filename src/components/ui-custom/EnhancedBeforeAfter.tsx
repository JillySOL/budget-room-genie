import ReactCompareImage from "react-compare-image";
import { useState, useMemo, useEffect } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight } from "lucide-react";

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
  const [loadError, setLoadError] = useState(false);

  // Ensure image URLs are absolute
  const beforeUrl = useMemo(() => {
    if (beforeImage.startsWith('http')) return beforeImage;
    return beforeImage;
  }, [beforeImage]);
  
  const afterUrl = useMemo(() => {
    if (afterImage.startsWith('http')) return afterImage;
    return afterImage;
  }, [afterImage]);

  // Use image preloading to detect errors
  useEffect(() => {
    // Reset error state when URLs change
    setLoadError(false);
    
    const preloadImages = () => {
      const preloadBefore = new Image();
      const preloadAfter = new Image();
      
      preloadBefore.src = beforeUrl;
      preloadAfter.src = afterUrl;
      
      preloadBefore.onerror = () => setLoadError(true);
      preloadAfter.onerror = () => setLoadError(true);
    };
    
    preloadImages();
  }, [beforeUrl, afterUrl]);

  // If images fail to load, show a placeholder instead
  if (loadError) {
    return (
      <div className={`w-full rounded-lg overflow-hidden relative bg-gray-100 flex items-center justify-center ${className}`} style={{minHeight: "300px"}}>
        <div className="text-center p-4">
          <p className="text-budget-dark/70 mb-2">Unable to load comparison images</p>
          <button 
            onClick={() => setLoadError(false)}
            className="text-xs bg-budget-accent text-white px-3 py-1 rounded-md"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`w-full rounded-lg overflow-hidden relative ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Fixed position labels */}
      <div className="absolute top-3 left-3 z-10 bg-black/70 text-white px-3 py-1 rounded-md text-xs font-medium shadow-sm">
        {beforeLabel}
      </div>
      <div className="absolute top-3 right-3 z-10 bg-black/70 text-white px-3 py-1 rounded-md text-xs font-medium shadow-sm">
        {afterLabel}
      </div>
      
      <ReactCompareImage
        leftImage={beforeUrl}
        rightImage={afterUrl}
        sliderLineWidth={2}
        handleSize={48}
        hover
        sliderPositionPercentage={0.5}
        leftImageCss={{ objectFit: "cover" }}
        rightImageCss={{ objectFit: "cover" }}
        onSliderPositionChange={() => {
          // Reset error state if slider moved
          if (loadError) setLoadError(false);
        }}
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
      
      {/* Tooltip hint */}
      {!isHovering && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                <div className="bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                  <ArrowRight className="h-3.5 w-3.5 animate-bounce" />
                  Slide to compare
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent 
              side="bottom" 
              className="bg-budget-accent/90 text-white border-budget-accent"
              sideOffset={5}
            >
              Drag the handle to compare images
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

export default EnhancedBeforeAfter;
