
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface BeforeAfterViewProps {
  beforeImage: string;
  afterImage: string;
}

const BeforeAfterView = ({ beforeImage, afterImage }: BeforeAfterViewProps) => {
  const [position, setPosition] = useState(50);

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="relative h-72 overflow-hidden">
        {/* Before image (full width) */}
        <img 
          src={beforeImage} 
          alt="Before" 
          className="absolute top-0 left-0 w-full h-full object-cover" 
        />
        
        {/* After image (clipped based on slider) */}
        <div 
          className="absolute top-0 left-0 h-full overflow-hidden transition-all duration-150 ease-in-out"
          style={{ width: `${position}%` }}
        >
          <img 
            src={afterImage} 
            alt="After" 
            className="absolute top-0 left-0 w-full h-full object-cover" 
          />
        </div>
        
        {/* Divider line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-md"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-lg">
            <div className="h-1 w-3 ml-2 bg-budget-dark rounded-full"></div>
            <div className="h-1 w-3 mr-2 bg-budget-dark rounded-full"></div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 px-2">
        <Slider
          value={[position]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value) => setPosition(value[0])}
        />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>Before</span>
          <span>After</span>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterView;
