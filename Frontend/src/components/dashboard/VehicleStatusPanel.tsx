import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface VehicleStatusPanelProps {
  gpsStatus?: string;
  vehicleMode?: string;
  gnssSatellites?: number;
  camera?: boolean;
  rcConnection?: boolean;
  onModeChange?: (mode: string) => void;
  onCameraToggle?: () => void;
}

export function VehicleStatusPanel({
  gpsStatus = "RTK",
  vehicleMode = "AUTO",
  gnssSatellites = 34,
  camera = true,
  rcConnection =false,
  onModeChange,
  onCameraToggle,
}: VehicleStatusPanelProps) {
  const [selectedMode, setSelectedMode] = useState(vehicleMode?.toLowerCase() || "AUTO");

  useEffect(() => {
    setSelectedMode(vehicleMode?.toLowerCase() || "AUTO");
  }, [vehicleMode]);

  const handleModeChange = (newMode: string) => {
    setSelectedMode(newMode);
    onModeChange?.(newMode);
  };

  return (
    <div className="dashboard-panel flex flex-col py-2 sm:py-3 px-3 sm:px-4">
      <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
        Vehicle Status
      </span>
      <div className="flex flex-col gap-2 text-xs sm:text-sm">
        {/* GPS */}
        <div className="flex items-center justify-between min-w-0">
          <span className="text-muted-foreground truncate">GPS</span>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${gpsStatus === "RTK" ? 'bg-success' : 'bg-danger'}`} />
            <span className="text-foreground font-medium text-[10px] sm:text-xs">{gpsStatus}</span>
          </div>
        </div>

        {/* Vehicle Mode */}
        <div className="flex items-center justify-between min-w-0">
          <span className="text-muted-foreground truncate">Mode</span>
          <Select value={selectedMode} onValueChange={handleModeChange}>
            <SelectTrigger className="h-6 sm:h-7 w-20 sm:w-24 text-[10px] sm:text-xs ml-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">AUTO</SelectItem>
              <SelectItem value="manual">MANUAL</SelectItem>
              <SelectItem value="rc">RC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* GNSS */}
        <div className="flex items-center justify-between min-w-0">
          <span className="text-muted-foreground truncate">GNSS</span>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${gnssSatellites > 10 ? 'bg-success' : 'bg-danger'}`} />
            <span className="text-foreground font-medium text-[10px] sm:text-xs">{gnssSatellites}</span>
          </div>
        </div>

        {/* Camera */}
        <div className="flex items-center justify-between min-w-0">
          <span className="text-muted-foreground truncate hidden sm:block">Camera</span>
          <span className="text-muted-foreground text-[10px] sm:hidden">Cam</span>
          <Button
            variant="outline"
            size="sm"
            className="h-6 sm:h-7 text-[10px] sm:text-xs px-2 sm:px-3 flex-shrink-0 ml-2"
            onClick={() => {
              toast({ title: "Camera", description: "Camera feed coming soon." });
              onCameraToggle?.();
            }}
          >
            View
          </Button>
        </div>

        {/* RC Connection */}
        <div className="flex items-center justify-between min-w-0">
          <span className="text-muted-foreground truncate hidden sm:block">RC Connection</span>
          <span className="text-muted-foreground text-[10px] sm:hidden">RC</span>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rcConnection ? 'bg-success' : 'bg-danger'}`} />
            <span className="text-foreground font-medium text-[10px] sm:text-xs">{rcConnection ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
