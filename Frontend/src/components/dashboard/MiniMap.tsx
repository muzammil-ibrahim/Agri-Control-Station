import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface MiniMapProps {
  vehiclePosition?: { x: number; y: number };
  fieldBoundaries?: boolean;
  className?: string;
}

export function MiniMap({
  vehiclePosition = { x: 65, y: 45 },
  fieldBoundaries = true,
  className,
}: MiniMapProps) {
  return (
    <div
      className={cn(
        "dashboard-panel relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
        <span className="text-[8px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">Vehicle Location</span>
        <div className="flex items-center gap-1 text-[8px] sm:text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="hidden sm:block">GPS Active</span>
          <span className="sm:hidden">GPS</span>
        </div>
      </div>

      <div className="relative bg-gauge-bg rounded-lg aspect-video min-h-[100px] sm:min-h-[120px] overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path
                d="M 20 0 L 0 0 0 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted-foreground"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {fieldBoundaries && (
          <svg className="absolute inset-0 w-full h-full p-3">
            <polygon
              points="10,20 90,15 95,85 15,90 10,20"
              fill="hsl(var(--primary) / 0.1)"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              className="opacity-60"
            />
          </svg>
        )}

        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
          style={{ left: `${vehiclePosition.x}%`, top: `${vehiclePosition.y}%` }}
        >
          <div className="absolute inset-0 w-6 h-6 -ml-3 -mt-3 rounded-full bg-primary/30 animate-ping" />
          <div className="relative w-4 h-4 bg-primary rounded-full border-2 border-primary-foreground shadow-lg">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-transparent border-b-primary-foreground" />
          </div>
        </div>

        <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded px-2 py-1">
          <span className="text-[10px] font-mono text-muted-foreground">
            40.7128° N, 74.0060° W
          </span>
        </div>
      </div>
    </div>
  );
}
