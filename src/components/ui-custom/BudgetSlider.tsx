
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

interface BudgetSliderProps {
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number[]) => void;
}

const BudgetSlider = ({
  min = 100,
  max = 2000,
  step = 100,
  onChange,
}: BudgetSliderProps) => {
  const [value, setValue] = useState([500]);

  const handleValueChange = (newValue: number[]) => {
    setValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-sm text-muted-foreground">Budget Limit</span>
        <span className="font-semibold">${value[0]}</span>
      </div>
      <Slider
        defaultValue={value}
        max={max}
        min={min}
        step={step}
        onValueChange={handleValueChange}
        className="py-4"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${min}</span>
        <span>${max}</span>
      </div>
    </div>
  );
};

export default BudgetSlider;
