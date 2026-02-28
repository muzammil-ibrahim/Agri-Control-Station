import { cn } from "@/lib/utils";
import { ArrowLeft, Camera, MapPin } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { AppHeader } from "@/components/dashboard/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useVehicleData } from "@/hooks/useVehicleData";
import { useToast } from "@/hooks/use-toast";

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
  const navigate = useNavigate();
  const { id } = useParams();
  const task = id ? tasksData[id] : null;
  const [isArmed, setIsArmed] = useState(false);
  const [vehicleMode, setVehicleMode] = useState("AUTO");
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Task not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col pb-16 sm:pb-20">
      <AppHeader
        title={task.name}
        leftContent={
          <button
            onClick={() => navigate("/task")}
            className={cn(
              "flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full",
              "bg-card/90 border border-border",
              "text-muted-foreground hover:text-foreground hover:bg-card",
              "transition-all duration-200 active:scale-95 flex-shrink-0"
            )}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        }
      />

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
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <MapPin className="w-10 h-10" />
            <span className="text-sm">Map View</span>
            <p className="text-xs text-muted-foreground/60">{task.plot}</p>
          </div>
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
    </div>
  );
}
