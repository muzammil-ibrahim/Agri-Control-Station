import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";

interface BatteryGaugeProps {
  level: number; // 0-100
  voltage?: number;
  charging?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function BatteryGauge({
  level,
  voltage,
  charging = false,
  size = "md",
  className,
}: BatteryGaugeProps) {
  const getVariant = () => {
    if (level > 50) return "success";
    if (level > 20) return "warning";
    return "danger";
  };

  const variant = getVariant();

  const variantColors = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };

  const sizeClasses = {
    sm: { container: "w-16 h-8", cap: "w-1.5 h-4" },
    md: { container: "w-24 h-12", cap: "w-2 h-6" },
    lg: { container: "w-32 h-16", cap: "w-2.5 h-8" },
  };

  const textSizes = {
    sm: "text-xs",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <div className="flex items-center">
        {/* Battery body */}
        <div
          className={cn(
            "relative rounded-md border-2 border-muted-foreground/50 p-1 bg-gauge-bg",
            sizeClasses[size].container
          )}
        >
          {/* Fill level */}
          <div
            className={cn(
              "h-full rounded-sm transition-all duration-500",
              variantColors[variant]
            )}
            style={{ width: `${level}%` }}
          />

          {/* Charging indicator */}
          {charging && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-5 h-5 text-warning animate-pulse" fill="currentColor" />
            </div>
          )}
        </div>

        {/* Battery cap */}
        <div
          className={cn(
            "rounded-r-sm bg-muted-foreground/50",
            sizeClasses[size].cap
          )}
        />
      </div>

      {/* Level display */}
      <div className="flex flex-col items-center">
        <span className={cn("font-mono font-bold text-foreground", textSizes[size])}>
          {level}%
        </span>
        {voltage && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {voltage.toFixed(1)}V
          </span>
        )}
      </div>

      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        Battery
      </span>
    </div>
  );
}
