import { Slider } from "@/components/ui/slider";

interface LinearActuatorPanelProps {
  actuatorX?: number;
  actuatorY?: number;
}

export function LinearActuatorPanel({
  actuatorX = 52,
  actuatorY = 30,
}: LinearActuatorPanelProps) {
  return (
    <div className="dashboard-panel flex flex-col py-2 sm:py-3 px-3 sm:px-4">
      <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2 sm:mb-3">
        Linear Actuator
      </span>
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">X-Axis</span>
            <span className="text-foreground font-medium font-mono text-[10px] sm:text-xs">{Math.round(actuatorX)}%</span>
          </div>
          <Slider value={[actuatorX]} max={100} step={1} disabled className="pointer-events-none" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Y-Axis</span>
            <span className="text-foreground font-medium font-mono text-[10px] sm:text-xs">{Math.round(actuatorY)}%</span>
          </div>
          <Slider value={[actuatorY]} max={100} step={1} disabled className="pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
