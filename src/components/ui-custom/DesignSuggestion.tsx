
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Suggestion {
  id: string;
  title: string;
  estimatedCost: number;
  description: string;
}

interface DesignSuggestionProps {
  title: string;
  totalEstimate: number;
  valueIncrease: number;
  suggestions: Suggestion[];
}

const DesignSuggestion = ({
  title,
  totalEstimate,
  valueIncrease,
  suggestions,
}: DesignSuggestionProps) => {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{title}</h3>
            <div className="flex gap-2 mt-1">
              <div className="bg-budget-teal/10 text-budget-teal text-xs px-2 py-0.5 rounded-full">
                ~${totalEstimate}
              </div>
              <div className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                +${valueIncrease} value
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setLiked(true)}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                liked === true ? "bg-green-100 text-green-600" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setLiked(false)}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center",
                liked === false ? "bg-red-100 text-red-600" : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <ThumbsDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm font-medium">Suggested changes</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id}>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium">{suggestion.title}</h4>
                  <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                </div>
                <div className="bg-muted text-xs px-2 py-0.5 rounded font-medium">
                  ${suggestion.estimatedCost}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignSuggestion;
