import { cn } from "@/lib/utils";

interface SemiCircleGaugeProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  size?: "sm" | "md" | "lg";
  variant?: "success" | "warning" | "danger" | "primary";
  className?: string;
}

export function SemiCircleGauge({
  value,
  max,
  label,
  unit = "",
  size = "md",
  variant = "primary",
  className,
}: SemiCircleGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  // Semi-circle uses half the circumference
  const radius = 45;
  const strokeDasharray = Math.PI * radius;
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

  const sizeClasses = {
    sm: "w-28 h-16",
    md: "w-40 h-24",
    lg: "w-56 h-32",
  };

  const textSizes = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl",
  };

  const labelSizes = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
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
        <svg
          viewBox="0 0 100 55"
          className={cn("w-full h-full", glowClasses[variant])}
        >
          {/* Background track */}
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            stroke="hsl(var(--gauge-track))"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 5 50 A 45 45 0 0 1 95 50"
            fill="none"
            className={cn(variantColors[variant], "transition-all duration-500 ease-out")}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Center display */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className={cn("font-mono font-bold text-foreground leading-none", textSizes[size])}>
            {Math.round(value)}
          </span>
          {unit && (
            <span className={cn("text-muted-foreground uppercase tracking-wider", labelSizes[size])}>
              {unit}
            </span>
          )}
        </div>
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between w-full px-1 -mt-1">
        <span className={cn("text-muted-foreground", labelSizes[size])}>0</span>
        <span className={cn("text-muted-foreground uppercase tracking-wider font-medium", labelSizes[size])}>
          {label}
        </span>
        <span className={cn("text-muted-foreground", labelSizes[size])}>{max}</span>
      </div>
    </div>
  );
}
