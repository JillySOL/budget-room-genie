
import { useState } from "react";
import { IMAGES } from "@/constants/images";

interface ImageOverlayProps {
  label: string;
  sublabel: string;
}

const ImageOverlay = ({ label, sublabel }: ImageOverlayProps) => (
  <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white px-4 py-2.5">
    <div className="flex items-center justify-between">
      <span className="font-medium text-sm">{label}</span>
      <span className="text-xs text-white/90">{sublabel}</span>
    </div>
  </div>
);

export const BeforeAfterPreview = () => {
  const [imagesLoaded, setImagesLoaded] = useState({ before: false, after: false });

  const handleImageLoad = (type: 'before' | 'after') => {
    setImagesLoaded(prev => ({ ...prev, [type]: true }));
  };

  const allImagesLoaded = imagesLoaded.before && imagesLoaded.after;

  return (
    <div className="flex mb-6 rounded-lg overflow-hidden">
      <div className="w-1/2 h-48 bg-gray-200 relative">
        {!imagesLoaded.before && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-budget-accent"></div>
          </div>
        )}
        <img 
          src="/lovable-uploads/c4de2f88-0972-405e-8074-31f1bde935de.png"
          alt="Before Room" 
          className={`w-full h-full object-cover transition-opacity duration-300 ${imagesLoaded.before ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => handleImageLoad('before')}
        />
        <ImageOverlay label="Before" sublabel="Current State" />
      </div>
      <div className="w-1/2 h-48 bg-gray-100 relative">
        {!imagesLoaded.after && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-budget-accent"></div>
          </div>
        )}
        <img 
          src="/after.png"
          alt="After Room" 
          className={`w-full h-full object-cover transition-opacity duration-300 ${imagesLoaded.after ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => handleImageLoad('after')}
        />
        <ImageOverlay label="After" sublabel="AI Preview" />
      </div>
    </div>
  );
};

export default BeforeAfterPreview;
