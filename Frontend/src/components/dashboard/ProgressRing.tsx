import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  size?: "sm" | "md" | "lg";
  variant?: "success" | "warning" | "danger" | "primary";
  showPercentage?: boolean;
  className?: string;
}

export function ProgressRing({
  value,
  max,
  label,
  size = "md",
  variant = "primary",
  showPercentage = true,
  className,
}: ProgressRingProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const radius = 40;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-28 h-28",
    lg: "w-36 h-36",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-2xl",
  };

  const labelSizes = {
    sm: "text-[9px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  const variantColors = {
    success: "stroke-success",
    warning: "stroke-warning",
    danger: "stroke-danger",
    primary: "stroke-primary",
  };

  const glowClasses = {
    success: "gauge-glow-success",
    warning: "gauge-glow-warning",
    danger: "gauge-glow-danger",
    primary: "",
  };

  return (
    <div className={cn("relative flex flex-col items-center", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <svg viewBox="0 0 100 100" className={cn("transform -rotate-90", glowClasses[variant])}>
          {/* Background track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="hsl(var(--gauge-track))"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            className={cn(variantColors[variant], "transition-all duration-500 ease-out")}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Center display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showPercentage ? (
            <span className={cn("font-mono font-bold text-foreground", textSizes[size])}>
              {Math.round(percentage)}%
            </span>
          ) : (
            <span className={cn("font-mono font-bold text-foreground", textSizes[size])}>
              {Math.round(value)}/{max}
            </span>
          )}
        </div>
      </div>

      {/* Label below */}
      <span className={cn("mt-1 text-muted-foreground uppercase tracking-wider text-center leading-tight", labelSizes[size])}>
        {label}
      </span>
    </div>
  );
}
