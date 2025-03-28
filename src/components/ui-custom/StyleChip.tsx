
import { cn } from "@/lib/utils";

interface StyleChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
}

const StyleChip = ({ label, selected = false, onClick, icon }: StyleChipProps) => {
  return (
    <button
      type="button"
      className={cn(
        "px-4 py-3 rounded-xl text-sm transition-all duration-200 flex flex-col items-center gap-2",
        selected
          ? "bg-budget-teal text-white shadow-md"
          : "bg-white text-budget-dark border border-gray-200 hover:bg-gray-100"
      )}
      onClick={onClick}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {label}
    </button>
  );
};

export default StyleChip;
