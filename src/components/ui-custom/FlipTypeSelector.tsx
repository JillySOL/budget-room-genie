
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface FlipType {
  id: string;
  name: string;
  description: string;
}

interface FlipTypeSelectorProps {
  types: FlipType[];
  selectedTypeId: string;
  onSelect: (typeId: string) => void;
}

const FlipTypeSelector = ({
  types,
  selectedTypeId,
  onSelect,
}: FlipTypeSelectorProps) => {
  return (
    <div className="grid gap-2">
      {types.map((type) => (
        <div
          key={type.id}
          className={cn(
            "relative cursor-pointer rounded-lg border p-4 transition-all",
            selectedTypeId === type.id
              ? "border-budget-teal bg-budget-teal/5"
              : "border-border hover:border-budget-teal/50"
          )}
          onClick={() => onSelect(type.id)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{type.name}</h3>
              <p className="text-sm text-muted-foreground">{type.description}</p>
            </div>
            {selectedTypeId === type.id && (
              <CheckCircle className="h-5 w-5 text-budget-teal" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FlipTypeSelector;
