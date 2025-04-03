import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StyleChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  useOrangeAccent?: boolean;
}

const StyleChip = ({ label, selected = false, onClick, icon, useOrangeAccent = false }: StyleChipProps) => {
  return (
    <button
      type="button"
      className={cn(
        "px-4 py-3 rounded-xl text-sm transition-all duration-200 relative",
        selected
          ? useOrangeAccent 
            ? "bg-budget-accent/10 text-budget-accent border-2 border-budget-accent font-medium" 
            : "bg-budget-teal/10 text-budget-teal border-2 border-budget-teal font-medium"
          : "bg-white text-budget-dark border border-gray-200 hover:bg-gray-100 hover:shadow-sm"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {label}
        {selected && (
          <div className={`ml-1 w-4 h-4 rounded-full ${useOrangeAccent ? 'bg-budget-accent' : 'bg-budget-teal'} text-white flex items-center justify-center`}>
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
    </button>
  );
};

export default StyleChip;
