import { cn } from "@/lib/utils";

interface CircularGaugeProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  size?: "sm" | "md" | "lg";
  variant?: "success" | "warning" | "danger" | "primary";
  showNeedle?: boolean;
  className?: string;
}

export function CircularGauge({
  value,
  max,
  label,
  unit = "",
  size = "md",
  variant = "primary",
  showNeedle = false,
  className,
}: CircularGaugeProps) {
  const percentage = Math.min((value / max) * 100, 100);
  const strokeDasharray = 2 * Math.PI * 45;
  const strokeDashoffset = strokeDasharray - (percentage / 100) * strokeDasharray;

  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-44 h-44",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
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

  // Calculate needle rotation (0 to 270 degrees for 3/4 gauge)
  const needleRotation = (percentage / 100) * 270 - 135;

  return (
    <div className={cn("relative flex flex-col items-center", sizeClasses[size], className)}>
      <svg
        viewBox="0 0 100 100"
        className={cn("transform -rotate-90", glowClasses[variant])}
      >
        {/* Background track */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="hsl(var(--gauge-track))"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          className={cn(variantColors[variant], "transition-all duration-500 ease-out")}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>

      {/* Needle */}
      {showNeedle && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${needleRotation}deg)` }}
        >
          <div className="absolute w-1 h-[40%] bg-gauge-needle rounded-full origin-bottom -translate-y-1/2" />
        </div>
      )}

      {/* Center display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-mono font-bold text-foreground", textSizes[size])}>
          {Math.round(value)}
        </span>
        {unit && (
          <span className={cn("text-muted-foreground uppercase tracking-wider", labelSizes[size])}>
            {unit}
          </span>
        )}
      </div>

      {/* Label below */}
      <span className={cn("mt-2 text-muted-foreground uppercase tracking-wider text-center", labelSizes[size])}>
        {label}
      </span>
    </div>
  );
}
