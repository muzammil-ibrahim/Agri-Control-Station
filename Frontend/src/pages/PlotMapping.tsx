import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import VehicleMap from "@/components/dashboard/VehicleMap";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVehicleData } from "@/hooks/useVehicleData";
import { useToast } from "@/hooks/use-toast";

// Default coordinates until we fetch real data
const initialCoordinates = [
];

const getHttpBackendUrl = () => {
  if (typeof window !== "undefined" && window.location.port === "8000") {
    return window.location.origin;
  }

  let backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  return backendUrl.replace(/^ws:/, "http:").replace(/^wss:/, "https:");
};


export default function PlotMapping() {
  const navigate = useNavigate();
  const [isArmed, setIsArmed] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [coordinates, setCoordinates] = useState<typeof initialCoordinates>(initialCoordinates);
  const [isOverlayDismissed, setIsOverlayDismissed] = useState(false);
  const { data: vehicleData, loading, error } = useVehicleData();
  const { toast } = useToast();

  // fetch geofence points from backend CSV and refresh periodically if started
  const fetchGeofence = () => {
    const backendUrl = getHttpBackendUrl();
    fetch(`${backendUrl}/api/geofence`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCoordinates(
            data.map((pt: any) => ({
              label: pt.label || "",
              lat: pt.latitude ?? pt.lat ?? "",
              lng: pt.longitude ?? pt.lng ?? "",
            }))
          );
        }
      })
      .catch((err) => console.error("Error fetching geofence:", err));
  };

  useEffect(() => {
    fetchGeofence();
    const interval = setInterval(fetchGeofence, 2000);
    return () => clearInterval(interval);
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

  const allChecksReady = preChecks.every(check => check.ok);
  const failingChecks = preChecks.filter(check => !check.ok);

  const handleArmClick = () => {
    if (!allChecksReady) {
      const failingList = failingChecks.map(check => check.label).join(", ");
      toast({
        title: "Cannot Arm Vehicle",
        description: `The following checks are not ready: ${failingList}`,
        variant: "destructive",
        className: "max-w-sm z-[9999]",
      });
      return;
    }
    setIsArmed(!isArmed);
  };

  const handleStart = async () => {
    try {
      const response = await fetch(`${getHttpBackendUrl()}/api/start`, {
        method: "POST",
      });

      const data = await response.json();
      console.log("Start response:", data);

      if (data.status === "started" || data.status === "already_running") {
        setIsStarted(true);
      }
    } catch (error) {
      console.error("Error starting logging:", error);
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch(`${getHttpBackendUrl()}/api/stop`, {
        method: "POST",
      });

      const data = await response.json();
      console.log("Stop response:", data);

      if (data.status === "stopped") {
        setIsStarted(false);
        navigate("/fields/create", { state: { capturedCoordinates: coordinates } });
      }
    } catch (error) {
      console.error("Error stopping logging:", error);
    }
  };



  return (
    <div className="relative h-[calc(100vh-4rem)] flex flex-col bg-background">
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

          {/* Coordinates Table */}
          <div className="flex-1 overflow-auto p-3">
            <h2 className="text-sm font-semibold text-foreground mb-2">Coordinates</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 px-2 text-xs">Point</TableHead>
                  <TableHead className="h-8 px-2 text-xs">Lat</TableHead>
                  <TableHead className="h-8 px-2 text-xs">Lng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coordinates.map((coord) => (
                  <TableRow key={coord.label}>
                    <TableCell className="p-2 text-xs font-medium">{coord.label}</TableCell>
                    <TableCell className="p-2 text-xs text-muted-foreground">{coord.lat}</TableCell>
                    <TableCell className="p-2 text-xs text-muted-foreground">{coord.lng}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Center Column - 50% (Map) */}
        <div className="col-span-2 bg-muted/30 h-full z-[0]">
          <VehicleMap />
        </div>

        {/* Right Column - 25% */}
        <div className="col-span-1 border-l border-border flex flex-col">
          {/* Camera Section - 40vh */}
          <div className="h-[40vh] bg-muted/50 flex items-center justify-center border-b border-border shrink-0">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Camera className="w-8 h-8" />
              <span className="text-xs">Camera Feed</span>
            </div>
          </div>

          {/* Controls below camera */}
          <div className="p-3 space-y-2">
            {!isStarted ? (
              <Button className="w-full" onClick={handleStart}>
                    Start
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowFinishDialog(true)}
                >
                  Finish
                </Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? "Resume" : "Pause"}
                </Button>
                <Button variant="outline" className="w-full">
                  Capture
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Finish Confirmation Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Mapping?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to finish the plot mapping session?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleStop}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
