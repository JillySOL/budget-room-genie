
import { Home, Sparkles } from "lucide-react";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

const Logo = ({ size = "md", showText = true }: LogoProps) => {
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

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Home className={`text-budget-teal ${sizeClasses[size]}`} />
        <Sparkles className={`absolute -top-1 -right-2 text-budget-accent h-4`} />
      </div>
      {showText && (
        <span className={`font-bold ${textSizeClasses[size]}`}>
          <span className="text-budget-dark">Budget</span>
          <span className="text-budget-teal">Flip</span>
        </span>
      )}
    </div>
  );
};

export default Logo;
