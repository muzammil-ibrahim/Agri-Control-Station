import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface BackendWheelData {
  rpm: number;
  angle: number;
}

interface ProcessedWheelData {
  position: "front-left" | "front-right" | "rear-left" | "rear-right";
  speed: number;
  direction: "forward" | "reverse" | "idle";
  steeringAngle: number;
}

interface WheelStatusInlineProps {
  wheels?: Record<string, BackendWheelData>;
  fourWSActive?: boolean;
}

const mockWheelData: ProcessedWheelData[] = [
  { position: "front-left", speed: 42, direction: "forward", steeringAngle: -15 },
  { position: "front-right", speed: 44, direction: "forward", steeringAngle: -15 },
  { position: "rear-left", speed: 40, direction: "forward", steeringAngle: 8 },
  { position: "rear-right", speed: 41, direction: "forward", steeringAngle: 8 },
];

function processWheelsData(wheels?: Record<string, BackendWheelData>): ProcessedWheelData[] {
  if (!wheels) return mockWheelData;

  return [
    {
      position: "front-left",
      speed: wheels["front_left"]?.rpm ?? 0,
      direction: wheels["front_left"]?.rpm > 0 ? "forward" : wheels["front_left"]?.rpm < 0 ? "reverse" : "idle",
      steeringAngle: wheels["front_left"]?.angle ?? 0,
    },
    {
      position: "front-right",
      speed: wheels["front_right"]?.rpm ?? 0,
      direction: wheels["front_right"]?.rpm > 0 ? "forward" : wheels["front_right"]?.rpm < 0 ? "reverse" : "idle",
      steeringAngle: wheels["front_right"]?.angle ?? 0,
    },
    {
      position: "rear-left",
      speed: wheels["rear_left"]?.rpm ?? 0,
      direction: wheels["rear_left"]?.rpm > 0 ? "forward" : wheels["rear_left"]?.rpm < 0 ? "reverse" : "idle",
      steeringAngle: wheels["rear_left"]?.angle ?? 0,
    },
    {
      position: "rear-right",
      speed: wheels["rear_right"]?.rpm ?? 0,
      direction: wheels["rear_right"]?.rpm > 0 ? "forward" : wheels["rear_right"]?.rpm < 0 ? "reverse" : "idle",
      steeringAngle: wheels["rear_right"]?.angle ?? 0,
    },
  ];
}

function WheelIndicator({ wheel, compact }: { wheel: ProcessedWheelData; compact?: boolean }) {
  const isForward = wheel.direction === "forward";
  const isReverse = wheel.direction === "reverse";
  const isIdle = wheel.direction === "idle";
  const isLeft = wheel.position.includes("left");

  return (
    <div className={cn(
      "flex flex-col items-center gap-0.5",
      isLeft ? "items-end" : "items-start"
    )}>
      {/* Speed info */}
      <div className={cn(
        "flex flex-col",
        isLeft ? "items-end text-right" : "items-start text-left"
      )}>
        <span className={cn(
          "text-sm font-mono font-bold leading-tight",
          isForward && "text-success",
          isReverse && "text-warning",
          isIdle && "text-muted-foreground"
        )}>
          {Math.abs(Math.round(wheel.speed))}
          <span className="text-[8px] ml-0.5 text-muted-foreground">RPM</span>
        </span>
        <span className="text-[8px] text-muted-foreground">
          {wheel.steeringAngle > 0 ? `+${Math.round(wheel.steeringAngle)}°` : `${Math.round(wheel.steeringAngle)}°`}
        </span>
      </div>

      {/* Wheel visualization */}
      <div
        className={cn(
          "w-4 h-8 rounded-sm border-2 transition-all duration-300 relative",
          isForward && "border-success bg-success/20",
          isReverse && "border-warning bg-warning/20",
          isIdle && "border-muted-foreground bg-muted/20"
        )}
        style={{
          transform: `rotate(${wheel.steeringAngle}deg)`,
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          {isForward && <ArrowUp className="w-3 h-3 text-success" />}
          {isReverse && <ArrowDown className="w-3 h-3 text-warning" />}
        </div>
      </div>
    </div>
  );
}

export function WheelStatusInline({ wheels, fourWSActive = true }: WheelStatusInlineProps) {
  const wheelData = processWheelsData(wheels);
  const frontLeft = wheelData.find(w => w.position === "front-left")!;
  const frontRight = wheelData.find(w => w.position === "front-right")!;
  const rearLeft = wheelData.find(w => w.position === "rear-left")!;
  const rearRight = wheelData.find(w => w.position === "rear-right")!;

  return (
    <div className="flex-1 flex items-center justify-center">
      {/* Vehicle schematic - compact version */}
      <div className="relative w-32 h-44">
        {/* Vehicle body */}
        <div className="absolute inset-x-6 inset-y-6 bg-muted/30 rounded-xl border border-border">
          {/* Windshield */}
          <div className="absolute top-2 inset-x-2 h-5 bg-muted/50 rounded-t-md border-b border-border" />
          {/* Rear window */}
          <div className="absolute bottom-2 inset-x-2 h-4 bg-muted/50 rounded-b-md border-t border-border" />
        </div>

        {/* Front Left Wheel */}
        <div className="absolute top-0 left-0">
          <WheelIndicator wheel={frontLeft} compact />
        </div>

        {/* Front Right Wheel */}
        <div className="absolute top-0 right-0">
          <WheelIndicator wheel={frontRight} compact />
        </div>

        {/* Rear Left Wheel */}
        <div className="absolute bottom-0 left-0">
          <WheelIndicator wheel={rearLeft} compact />
        </div>

        {/* Rear Right Wheel */}
        <div className="absolute bottom-0 right-0">
          <WheelIndicator wheel={rearRight} compact />
        </div>

        {/* Travel direction indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <ArrowUp className="w-4 h-4 text-primary" />
        </div>
      </div>
    </div>
  );
}
