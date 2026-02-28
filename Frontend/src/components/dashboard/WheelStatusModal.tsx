import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ArrowUp, ArrowDown } from "lucide-react";

interface WheelData {
  position: "front-left" | "front-right" | "rear-left" | "rear-right";
  speed: number;
  direction: "forward" | "reverse" | "idle";
  steeringAngle: number; // positive = right, negative = left
}

interface WheelStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockWheelData: WheelData[] = [
  { position: "front-left", speed: 42, direction: "forward", steeringAngle: -15 },
  { position: "front-right", speed: 44, direction: "forward", steeringAngle: -15 },
  { position: "rear-left", speed: 40, direction: "forward", steeringAngle: 8 },
  { position: "rear-right", speed: 41, direction: "forward", steeringAngle: 8 },
];

function WheelIndicator({ wheel }: { wheel: WheelData }) {
  const isForward = wheel.direction === "forward";
  const isReverse = wheel.direction === "reverse";
  const isIdle = wheel.direction === "idle";
  
  const isLeft = wheel.position.includes("left");
  const isFront = wheel.position.includes("front");

  return (
    <div className={cn(
      "flex flex-col items-center gap-1",
      isLeft ? "items-end" : "items-start"
    )}>
      {/* Speed and direction info */}
      <div className={cn(
        "flex flex-col",
        isLeft ? "items-end text-right" : "items-start text-left"
      )}>
        <span className={cn(
          "text-xl font-mono font-bold",
          isForward && "text-success",
          isReverse && "text-warning",
          isIdle && "text-muted-foreground"
        )}>
          {wheel.speed}
          <span className="text-xs ml-0.5 text-muted-foreground">RPM</span>
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
          {wheel.steeringAngle > 0 ? `+${wheel.steeringAngle}°` : `${wheel.steeringAngle}°`}
        </span>
      </div>

      {/* Wheel visualization */}
      <div className="relative">
        <div
          className={cn(
            "w-6 h-12 rounded-sm border-2 transition-all duration-300",
            isForward && "border-success bg-success/20",
            isReverse && "border-warning bg-warning/20",
            isIdle && "border-muted-foreground bg-muted/20"
          )}
          style={{
            transform: `rotate(${wheel.steeringAngle}deg)`,
          }}
        >
          {/* Direction arrow */}
          <div className="absolute inset-0 flex items-center justify-center">
            {isForward && <ArrowUp className="w-4 h-4 text-success" />}
            {isReverse && <ArrowDown className="w-4 h-4 text-warning" />}
          </div>
          
          {/* Tire treads */}
          <div className="absolute inset-x-1 top-1 bottom-1 flex flex-col justify-evenly">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-px bg-current opacity-30" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function WheelStatusModal({ open, onOpenChange }: WheelStatusModalProps) {
  const frontLeft = mockWheelData.find(w => w.position === "front-left")!;
  const frontRight = mockWheelData.find(w => w.position === "front-right")!;
  const rearLeft = mockWheelData.find(w => w.position === "rear-left")!;
  const rearRight = mockWheelData.find(w => w.position === "rear-right")!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-foreground">Wheel Dynamics</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center py-4">
          {/* Vehicle schematic */}
          <div className="relative w-48 h-72">
            {/* Vehicle body */}
            <div className="absolute inset-x-8 inset-y-8 bg-muted/30 rounded-2xl border border-border">
              {/* Windshield */}
              <div className="absolute top-4 inset-x-3 h-8 bg-muted/50 rounded-t-lg border-b border-border" />
              {/* Rear window */}
              <div className="absolute bottom-4 inset-x-3 h-6 bg-muted/50 rounded-b-lg border-t border-border" />
              {/* Center line */}
              <div className="absolute inset-y-16 left-1/2 w-px bg-border" />
            </div>

            {/* Front Left Wheel */}
            <div className="absolute top-0 left-0">
              <WheelIndicator wheel={frontLeft} />
            </div>

            {/* Front Right Wheel */}
            <div className="absolute top-0 right-0">
              <WheelIndicator wheel={frontRight} />
            </div>

            {/* Rear Left Wheel */}
            <div className="absolute bottom-0 left-0">
              <WheelIndicator wheel={rearLeft} />
            </div>

            {/* Rear Right Wheel */}
            <div className="absolute bottom-0 right-0">
              <WheelIndicator wheel={rearRight} />
            </div>

            {/* Steering direction indicator */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex flex-col items-center gap-1">
                <ArrowUp className="w-5 h-5 text-primary" />
                <span className="text-[10px] text-muted-foreground uppercase">Travel</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 text-[10px] uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-success/30 border border-success" />
              <span className="text-muted-foreground">Forward</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-warning/30 border border-warning" />
              <span className="text-muted-foreground">Reverse</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-muted/30 border border-muted-foreground" />
              <span className="text-muted-foreground">Idle</span>
            </div>
          </div>

          {/* 4WS indicator */}
          <div className="mt-3 px-3 py-1.5 bg-primary/10 rounded-full">
            <span className="text-xs text-primary font-medium">4-Wheel Steering Active</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
