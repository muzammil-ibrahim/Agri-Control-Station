import { cn } from "@/lib/utils";

type SensorStatus = "ok" | "warning" | "error" | "offline";

interface SensorIndicator {
  name: string;
  status: SensorStatus;
}

interface SensorGridProps {
  sensors: SensorIndicator[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function SensorGrid({ sensors, columns = 3, className }: SensorGridProps) {
  const statusColors = {
    ok: "bg-success",
    warning: "bg-warning",
    error: "bg-danger",
    offline: "bg-muted-foreground/50",
  };

  const statusLabels = {
    ok: "OK",
    warning: "WARN",
    error: "ERR",
    offline: "OFF",
  };

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  };

  return (
    <div className={cn("grid gap-2", gridCols[columns], className)}>
      {sensors.map((sensor) => (
        <div
          key={sensor.name}
          className={cn(
            "flex flex-col items-center justify-center p-2 rounded-lg bg-gauge-bg border",
            sensor.status === "ok" && "border-success/20",
            sensor.status === "warning" && "border-warning/20",
            sensor.status === "error" && "border-danger/20",
            sensor.status === "offline" && "border-border"
          )}
        >
          <div
            className={cn(
              "w-3 h-3 rounded-full mb-1",
              statusColors[sensor.status],
              sensor.status !== "offline" && "status-pulse"
            )}
          />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider text-center leading-tight">
            {sensor.name}
          </span>
          <span
            className={cn(
              "text-[9px] font-mono font-medium mt-0.5",
              sensor.status === "ok" && "text-success",
              sensor.status === "warning" && "text-warning",
              sensor.status === "error" && "text-danger",
              sensor.status === "offline" && "text-muted-foreground"
            )}
          >
            {statusLabels[sensor.status]}
          </span>
        </div>
      ))}
    </div>
  );
}
