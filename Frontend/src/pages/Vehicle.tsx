import { SemiCircleGauge } from "@/components/dashboard/SemiCircleGauge";
import { CircularGauge } from "@/components/dashboard/CircularGauge";
import { WheelStatusInline } from "@/components/dashboard/WheelStatusInline";
import { VehicleStatusPanel } from "@/components/dashboard/VehicleStatusPanel";
import { BatteryStatusPanel } from "@/components/dashboard/BatteryStatusPanel";
import { LinearActuatorPanel } from "@/components/dashboard/LinearActuatorPanel";
import { useVehicleData } from "@/hooks/useVehicleData";
import { cn } from "@/lib/utils";
import { Gauge, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Vehicle() {
  const { data, loading, error } = useVehicleData();
  const [isOverlayDismissed, setIsOverlayDismissed] = useState(false);

  useEffect(() => {
    if (!error && !loading && data) {
      setIsOverlayDismissed(false);
    }
  }, [error, loading, data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Connecting to vehicle...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 sm:pb-20 pt-0">
      <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <button
          type="button"
          className="control-btn control-btn-start py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-[10px] sm:text-xs"
        >
          RTL
        </button>
        <button
          type="button"
          className="control-btn control-btn-stop py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-[10px] sm:text-xs"
        >
          Park
        </button>
      </div>

      {/* Top row: Speed, Heading, Vehicle Status - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <div className="dashboard-panel flex flex-col items-center justify-center py-3 sm:py-4">
          <div className="flex items-center gap-1 sm:gap-1.5 mb-2">
            <Gauge className="w-3 sm:w-4 h-3 sm:h-4 text-primary" />
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Speed</span>
          </div>
          <SemiCircleGauge value={data?.speed ?? 0} max={25} label="km/h" variant="primary" size="md" />
        </div>

        <div className="dashboard-panel flex flex-col items-center justify-center py-3 sm:py-4">
          <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Heading</span>
          <CircularGauge value={data?.heading ?? 0} max={360} label="Heading" unit="°" variant="primary" size="sm" />
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <VehicleStatusPanel
            gpsStatus={data?.gps_status ?? "N/A"}
            vehicleMode={data?.vehicle_mode ?? "N/A"}
            gnssSatellites={data?.gnss_satellites ?? 0}
            camera={data?.camera ?? false}
            rcConnection={data?.rc_connection ?? false}
          />
        </div>
      </div>

      {/* Bottom row: Battery Status, Linear Actuator, Wheel Dynamics - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <BatteryStatusPanel batteries={data?.batteries ?? {}} />
        <LinearActuatorPanel actuatorX={data?.actuator_x ?? 0} actuatorY={data?.actuator_y ?? 0} />
        <div className="dashboard-panel flex flex-col col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">Wheel Dynamics</span>
            <span className={cn("text-[8px] sm:text-xs", data?.four_ws_active ? "text-primary" : "text-muted-foreground")}>
              {data?.four_ws_active ? "4WS Active" : ""}
            </span>
          </div>
          <WheelStatusInline wheels={data?.wheels ?? {}} fourWSActive={data?.four_ws_active ?? false} />
        </div>
      </div>
      </div>

      {/* Error overlay with blurred background */}
      {(error || !data) && !isOverlayDismissed && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative text-center text-red-500 bg-background/90 p-6 rounded-lg border border-red-500/30 max-w-md">
            <button
              onClick={() => setIsOverlayDismissed(true)}
              className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Close connection message"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-lg font-semibold mb-2">Connection Error</p>
            <p className="text-sm mb-3">{error || "Unable to connect to vehicle data"}</p>
            <p className="text-xs text-muted-foreground">Make sure the backend is running at {import.meta.env.VITE_BACKEND_URL || "ws://localhost:8000"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
