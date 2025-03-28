
import { Home, Sparkles } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  variant?: "default" | "white";
}

const Logo = ({ size = "md", showText = true, variant = "default" }: LogoProps) => {
  const sizeClasses = {
    sm: "h-6",
    md: "h-8",
    lg: "h-12",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  const getTextColors = () => {
    return variant === "white" 
      ? { brand: "text-white", accent: "text-white" } 
      : { brand: "text-budget-teal", accent: "text-budget-dark" };
  };

  const textColors = getTextColors();

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Home className={`${variant === "white" ? "text-white" : "text-budget-teal"} ${sizeClasses[size]}`} />
        <Sparkles className={`absolute -top-1 -right-2 ${variant === "white" ? "text-budget-accent" : "text-budget-accent"} h-4`} />
      </div>
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]}`}>
          <span className={textColors.accent}>Reno</span>
          <span className={textColors.brand}>Mate</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
