import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: ReactNode;
}

export function MetricCard({
  title,
  value,
  unit,
  icon,
  variant = "default",
  size = "md",
  className,
  children,
}: MetricCardProps) {
  const variantBorders = {
    default: "border-border",
    success: "border-success/30",
    warning: "border-warning/30",
    danger: "border-danger/30",
  };

  const valueColors = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-danger",
  };

  const valueSizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  return (
    <div
      className={cn(
        "dashboard-panel flex flex-col",
        variantBorders[variant],
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          {title}
        </span>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>

      {children ? (
        children
      ) : (
        <div className="flex items-baseline gap-1">
          <span className={cn("font-mono font-bold", valueSizes[size], valueColors[variant])}>
            {value}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground uppercase tracking-wider">
              {unit}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
