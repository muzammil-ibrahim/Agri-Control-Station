import { cn } from "@/lib/utils";
import { Camera, X } from "lucide-react";
import { useParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FieldMap } from "@/components/dashboard/FieldMap";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVehicleData } from "@/hooks/useVehicleData";
import { useToast } from "@/hooks/use-toast";

interface MapPoint {
  id: string;
  x: number;
  y: number;
}

// Mock task data
const tasksData: Record<string, { name: string; plot: string; progress: number; status: string }> = {
  "1": { name: "Seedling planting", plot: "Plot A", progress: 0, status: "pending" },
  "2": { name: "Fertilizer spray", plot: "Plot B", progress: 50, status: "active" },
  "3": { name: "Harvesting wheat", plot: "Plot C", progress: 100, status: "completed" },
};

// Mock log entries
const logEntries = [
  { time: "05:36:26", message: "Task initialized successfully" },
  { time: "05:36:30", message: "Vehicle connected to GPS" },
  { time: "05:37:15", message: "Starting path calculation" },
  { time: "05:38:02", message: "Navigation started" },
];

export default function TaskDetail() {
  const { id } = useParams();
  const task = id ? tasksData[id] : null;
  const [isArmed, setIsArmed] = useState(false);
  const [vehicleMode, setVehicleMode] = useState("AUTO");
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const { data: vehicleData, yaw, tractorPos, loading, error } = useVehicleData();
  const { toast } = useToast();

  // Map-related state
  const [geofence, setGeofence] = useState<MapPoint[]>([]);
  const [points, setPoints] = useState<MapPoint[]>([]);
  const [drilledPoints, setDrilledPoints] = useState<string[]>([]);
  const [isOverlayDismissed, setIsOverlayDismissed] = useState(false);

  // Fetch CSV data
  const fetchCSVData = () => {
    // Use HTTP for CSV endpoints, WS only for real-time data
    const httpUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
    const baseUrl = httpUrl.replace("ws://", "http://").replace("wss://", "https://");
    
    Promise.all([
      fetch(`${baseUrl}/get_csv`).then((res) => res.text()).catch(() => ""),
      fetch(`${baseUrl}/get_csv1`).then((res) => res.text()).catch(() => ""),
    ]).then(([geofenceCSV, pointsCSV]) => {
      // Simple CSV parser
      const parseCSV = (csv: string): any[] => {
        const lines = csv.trim().split("\n");
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(",").map((h) => h.trim());
        return lines.slice(1).map((line) => {
          const values = line.split(",").map((v) => v.trim());
          const obj: any = {};
          headers.forEach((h, i) => {
            obj[h] = values[i];
          });
          return obj;
        });
      };

      if (geofenceCSV) {
        const parsed = parseCSV(geofenceCSV);
        setGeofence(
          parsed.map((r: any, i: number) => ({
            id: r.id ?? String(i + 1),
            x: +r.x || 0,
            y: +r.y || 0,
          }))
        );
      }

      if (pointsCSV) {
        const parsed = parseCSV(pointsCSV);
        setPoints(
          parsed.map((r: any, i: number) => ({
            id: r.id ?? String(i + 1),
            x: +r.x || 0,
            y: +r.y || 0,
          }))
        );
      }
    });
  };

  // Fetch CSV data on mount
  useEffect(() => {
    fetchCSVData();
  }, []);

  useEffect(() => {
    if (!error && !loading && vehicleData) {
      setIsOverlayDismissed(false);
    }
  }, [error, loading, vehicleData]);

  const isBackendConnected = Boolean(vehicleData?.connected) && !loading && !error;
  const hasGpsFix = Boolean(vehicleData?.gps_status) && vehicleData.gps_status !== "No GPS" && vehicleData.gps_status !== "No Fix";
  const hasEnoughGnssSatellites = (vehicleData?.gnss_satellites ?? 0) > 10;
  const hasRcConnection = Boolean(vehicleData?.rc_connection);
  const isReadyToArm = isBackendConnected && hasGpsFix && hasEnoughGnssSatellites && hasRcConnection;

  const preChecks = [
    {
      label: "Ready to Arm",
      value: isReadyToArm ? "Yes" : "No",
      ok: isReadyToArm,
    },
    {
      label: "GPS",
      value: vehicleData?.gps_status || "No GPS",
      ok: isBackendConnected && hasGpsFix,
    },
    {
      label: "GNSS",
      value: vehicleData?.gnss_satellites?.toString() || "0",
      ok: isBackendConnected && hasEnoughGnssSatellites,
    },
    {
      label: "RC Connection",
      value: hasRcConnection ? "Connected" : "Disconnected",
      ok: isBackendConnected && hasRcConnection,
    },
  ];

  const currentVehicleMode = vehicleData?.vehicle_mode?.toUpperCase() || vehicleMode;

  const allChecksReady = preChecks.every(check => check.ok);
  const failingChecks = preChecks.filter(check => !check.ok);

  const handleArmClick = () => {
    if (!allChecksReady) {
      const failingList = failingChecks.map(check => check.label).join(", ");
      toast({
        title: "Cannot Arm Vehicle",
        description: `The following checks are not ready: ${failingList}`,
        variant: "destructive",
      });
      return;
    }
    setIsArmed(!isArmed);
  };

  if (!task) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Task not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Three-column grid */}
      <div className="flex-1 grid grid-cols-4 gap-0 overflow-hidden">
        {/* Left Column - 25% */}
        <div className="col-span-1 border-r border-border flex flex-col overflow-hidden">
          {/* Pre-Checks */}
          <div className="dashboard-panel flex flex-col py-3 px-4 border-b border-border">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
              Pre-Checks
            </span>
            <div className="flex flex-col gap-2 text-sm">
              {preChecks.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className={cn("w-2 h-2 rounded-full", item.ok ? "bg-success" : "bg-danger")} />
                    <span className="text-foreground font-medium font-mono">{item.value}</span>
                  </div>
                </div>
              ))}
              {/* Vehicle Mode Dropdown */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vehicle Mode</span>
                <Select value={currentVehicleMode} onValueChange={setVehicleMode}>
                  <SelectTrigger className="w-24 h-7 text-xs font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTO">AUTO</SelectItem>
                    <SelectItem value="MANUAL">MANUAL</SelectItem>
                    <SelectItem value="RC">RC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              size="sm"
              variant={isArmed ? "destructive" : "default"}
              className="w-full mt-3"
              //disabled={!isArmed && !allChecksReady}
              onClick={handleArmClick}
            >
              {isArmed ? "Disarm" : "Arm"}
            </Button>
          </div>

          {/* Camera Section */}
          <div className="h-[40vh] bg-muted/50 flex items-center justify-center border-b border-border shrink-0">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Camera className="w-8 h-8" />
              <span className="text-xs">Camera Feed</span>
            </div>
          </div>

          {/* Controls below camera */}
          <div className="p-3 space-y-2">
            {!isStarted ? (
              <Button className="w-full" onClick={() => setIsStarted(true)}>
                Start
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setIsStarted(false);
                    setIsPaused(false);
                  }}
                >
                  Stop
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Center Column - 50% (Map) */}
        <div className="col-span-2 flex items-center justify-center bg-muted/30">
          <FieldMap
            geofence={geofence}
            points={points}
            tractorPos={tractorPos}
            yaw={yaw}
            drilledPoints={drilledPoints}
          />
        </div>

        {/* Right Column - 25% */}
        <div className="col-span-1 border-l border-border flex flex-col overflow-hidden">
          {/* Progress Section */}
          <div className="dashboard-panel flex flex-col py-3 px-4 border-b border-border shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
              Progress
            </span>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Completion</span>
              <span className="text-sm font-mono text-primary">{task.progress}%</span>
            </div>
            <Progress value={task.progress} className="h-2 mb-3" />
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plot</span>
                <span className="text-foreground font-medium font-mono">{task.plot}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="text-foreground font-medium font-mono">1:30:25</span>
              </div>
            </div>
          </div>

          {/* Log Section */}
          <div className="dashboard-panel flex-1 flex flex-col min-h-0 py-3 px-4">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block mb-3 shrink-0">
              Log
            </span>
            <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
              {logEntries.map((entry, index) => (
                <div
                  key={index}
                  className="text-xs font-mono text-muted-foreground bg-muted/30 rounded-lg px-3 py-2"
                >
                  <span className="text-primary">{entry.time}</span>
                  <span className="mx-2">→</span>
                  <span>{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* error/connection overlay */}
      {(error || loading || !vehicleData) && !isOverlayDismissed && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative text-center text-red-500 bg-background/90 p-6 rounded-lg border border-red-500/30 max-w-md">
            <button
              onClick={() => setIsOverlayDismissed(true)}
              className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              aria-label="Close connection message"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-lg font-semibold mb-2">
              {loading ? "Connecting to vehicle..." : "Connection Error"}
            </p>
            <p className="text-sm mb-3">
              {loading
                ? "Establishing link to backend"
                : error || "Unable to connect to vehicle data"}
            </p>
            <p className="text-xs text-muted-foreground">
              Make sure the backend is running at {import.meta.env.VITE_BACKEND_URL || "ws://localhost:8000"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
