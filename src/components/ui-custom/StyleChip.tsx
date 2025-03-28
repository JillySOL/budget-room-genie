
import { cn } from "@/lib/utils";

interface StyleChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}

const StyleChip = ({ label, selected = false, onClick }: StyleChipProps) => {
  return (
    <button
      type="button"
      className={cn(
        "px-4 py-2 rounded-full text-sm transition-all duration-200",
        selected
          ? "bg-budget-teal text-white shadow-md"
          : "bg-white text-budget-dark border border-gray-200 hover:bg-gray-100"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default StyleChip;
