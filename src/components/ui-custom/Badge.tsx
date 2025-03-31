
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-budget-accent/10 text-budget-accent",
  success: "bg-green-600 text-white",
  warning: "bg-yellow-500/20 text-yellow-700"
};

export const Badge = ({ children, variant = "default", className, style, icon }: BadgeProps) => {
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full whitespace-nowrap",
        variants[variant],
        className
      )}
      style={style}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;
