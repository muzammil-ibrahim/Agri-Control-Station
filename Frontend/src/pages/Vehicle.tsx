import { SemiCircleGauge } from "@/components/dashboard/SemiCircleGauge";
import { CircularGauge } from "@/components/dashboard/CircularGauge";
import { WheelStatusInline } from "@/components/dashboard/WheelStatusInline";
import { VehicleStatusPanel } from "@/components/dashboard/VehicleStatusPanel";
import { BatteryStatusPanel } from "@/components/dashboard/BatteryStatusPanel";
import { LinearActuatorPanel } from "@/components/dashboard/LinearActuatorPanel";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { useVehicleData } from "@/hooks/useVehicleData";
import { cn } from "@/lib/utils";
import { Gauge } from "lucide-react";

export default function Vehicle() {
  const { data, loading, error } = useVehicleData();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Connecting to vehicle...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-red-500">
          <p className="text-lg font-semibold mb-2">Connection Error</p>
          <p className="text-sm mb-2">{error || "Unable to connect to vehicle data"}</p>
          <p className="text-xs text-muted-foreground">Make sure the backend is running at {import.meta.env.VITE_BACKEND_URL || "ws://localhost:8000"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-20">
      <AppHeader
        title="AgriBot Control"
        subtitle="Harvester-01 • Model AX-500"
        extraButtons={
          <>
            <button className={cn("control-btn py-1 sm:py-2 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs bg-warning/20 text-warning hover:bg-warning/30 border border-warning/30 whitespace-nowrap")}>
              Park
            </button>
            <button className={cn("control-btn py-1 sm:py-2 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 whitespace-nowrap")}>
              RTL
            </button>
          </>
        }
      />

      <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
      {/* Top row: Speed, Heading, Vehicle Status - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <div className="dashboard-panel flex flex-col items-center justify-center py-3 sm:py-4">
          <div className="flex items-center gap-1 sm:gap-1.5 mb-2">
            <Gauge className="w-3 sm:w-4 h-3 sm:h-4 text-primary" />
            <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Speed</span>
          </div>
          <SemiCircleGauge value={data.speed} max={25} label="km/h" variant="primary" size="md" />
        </div>

        <div className="dashboard-panel flex flex-col items-center justify-center py-3 sm:py-4">
          <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Heading</span>
          <CircularGauge value={data.heading} max={360} label="Heading" unit="°" variant="primary" size="sm" />
        </div>

        <div className="col-span-1 sm:col-span-2 lg:col-span-1">
          <VehicleStatusPanel
            gpsStatus={data.gps_status}
            vehicleMode={data.vehicle_mode}
            gnssSatellites={data.gnss_satellites}
            camera={data.camera}
            rcConnection={data.rc_connection}
          />
        </div>
      </div>

      {/* Bottom row: Battery Status, Linear Actuator, Wheel Dynamics - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        <BatteryStatusPanel batteries={data.batteries} />
        <LinearActuatorPanel actuatorX={data.actuator_x} actuatorY={data.actuator_y} />
        <div className="dashboard-panel flex flex-col col-span-1 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[8px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">Wheel Dynamics</span>
            <span className={cn("text-[8px] sm:text-xs", data.four_ws_active ? "text-primary" : "text-muted-foreground")}>
              {data.four_ws_active ? "4WS Active" : "2WS"}
            </span>
          </div>
          <WheelStatusInline wheels={data.wheels} fourWSActive={data.four_ws_active} />
        </div>
      </div>
      </div>
    </div>
  );
}
