import { cn } from "@/lib/utils";

type StatusType = "success" | "warning" | "danger" | "offline" | "idle";

interface StatusIndicatorProps {
  status: StatusType;
  label: string;
  size?: "sm" | "md" | "lg";
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({
  status,
  label,
  size = "md",
  pulse = true,
  className,
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const labelSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  const statusColors = {
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    offline: "bg-muted-foreground",
    idle: "bg-muted-foreground",
  };

  const statusLabels = {
    success: "Online",
    warning: "Warning",
    danger: "Error",
    offline: "Offline",
    idle: "Idle",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="relative">
        <div
          className={cn(
            "rounded-full",
            sizeClasses[size],
            statusColors[status],
            pulse && status !== "offline" && status !== "idle" && "status-pulse"
          )}
        />
        {/* Outer glow ring */}
        {(status === "success" || status === "danger") && (
          <div
            className={cn(
              "absolute inset-0 rounded-full animate-ping opacity-30",
              statusColors[status]
            )}
            style={{ animationDuration: "2s" }}
          />
        )}
      </div>
      <div className="flex flex-col">
        <span className={cn("text-foreground font-medium", labelSizes[size])}>
          {label}
        </span>
        <span className={cn("text-muted-foreground capitalize", size === "sm" ? "text-[10px]" : "text-xs")}>
          {statusLabels[status]}
        </span>
      </div>
    </div>
  );
}
