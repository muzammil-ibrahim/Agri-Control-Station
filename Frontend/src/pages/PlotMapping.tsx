import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, MapPin } from "lucide-react";
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

const mockCoordinates = [
  { label: "P1", lat: "17.4563", lng: "78.3462" },
  { label: "P2", lat: "17.4568", lng: "78.3470" },
  { label: "P3", lat: "17.4575", lng: "78.3465" },
  { label: "P4", lat: "17.4580", lng: "78.3458" },
  { label: "P5", lat: "17.4572", lng: "78.3450" },
  { label: "P6", lat: "17.4565", lng: "78.3455" },
];

export default function PlotMapping() {
  const navigate = useNavigate();
  const [isArmed, setIsArmed] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const { data: vehicleData, loading, error } = useVehicleData();
  const { toast } = useToast();

  const preChecks = [
    {
      label: "Ready to Arm",
      value: vehicleData ? (!vehicleData.rc_connection ? "Yes" : "No") : "Yes",
      ok: vehicleData ? !vehicleData.rc_connection : true
    },
    {
      label: "GPS",
      value: vehicleData?.gps_status || "RTK",
      ok: vehicleData ? vehicleData.gps_status === "RTK" : true
    },
    {
      label: "GNSS",
      value: vehicleData?.gnss_satellites?.toString() || "34",
      ok: vehicleData ? vehicleData.gnss_satellites > 10 : true
    },
    {
      label: "RC Connection",
      value: vehicleData ? (vehicleData.rc_connection ? "Connected" : "Disconnected") : "Disconnected",
      ok: vehicleData ? vehicleData.rc_connection : false
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
      const response = await fetch("http://localhost:8000/start", {
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
      const response = await fetch("http://localhost:8000/stop", {
        method: "POST",
      });

      const data = await response.json();
      console.log("Stop response:", data);

      if (data.status === "stopped") {
        setIsStarted(false);
        navigate("/fields/create");  // optional if you want to navigate
      }
    } catch (error) {
      console.error("Error stopping logging:", error);
    }
  };



  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-border bg-card shrink-0">
        <button
          onClick={() => navigate("/fields/create")}
          className={cn(
            "flex items-center justify-center w-9 h-9 rounded-full",
            "bg-muted border border-border",
            "text-muted-foreground hover:text-foreground hover:bg-accent",
            "transition-all duration-200 active:scale-95"
          )}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Plot Mapping</h1>
      </header>

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
                {mockCoordinates.map((coord) => (
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
        <div className="col-span-2 bg-muted/30 h-[calc(100vh-120px)] z-[0]">
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
    </div>
  );
}
