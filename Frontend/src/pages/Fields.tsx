import { MiniMap } from "@/components/dashboard/MiniMap";
import { cn } from "@/lib/utils";
import { Check, MapPin, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Field {
  id: string;
  name: string;
  area: number;
  status: "idle" | "active" | "completed";
  lastWorked?: string;
}

const fields: Field[] = [
  { id: "1", name: "North Field", area: 12.5, status: "active", lastWorked: "In progress" },
  { id: "2", name: "South Field", area: 8.3, status: "completed", lastWorked: "Yesterday" },
  { id: "3", name: "East Orchard", area: 4.7, status: "idle", lastWorked: "3 days ago" },
  { id: "4", name: "West Pasture", area: 15.2, status: "idle", lastWorked: "1 week ago" },
];

export default function Fields() {
  const navigate = useNavigate();
  const statusColors = {
    idle: "border-border text-muted-foreground",
    active: "border-success/50 text-success",
    completed: "border-primary/50 text-primary",
  };

  const statusLabels = {
    idle: "Idle",
    active: "Active",
    completed: "Done",
  };

  const statusBg = {
    idle: "bg-muted/30",
    active: "bg-success/10",
    completed: "bg-primary/10",
  };

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-20 pt-14 sm:pt-16 p-2 sm:p-4">
      {/* Title */}
      <header className="mb-3 sm:mb-4 px-2 sm:px-0">
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">Field Management</h1>
        <p className="text-[10px] sm:text-xs text-muted-foreground">{fields.length} fields registered</p>
      </header>

      {/* Main grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {/* Map - Takes full width on top */}
        <div className="col-span-1 sm:col-span-2">
          <MiniMap fieldBoundaries={true} />
        </div>

        {/* Summary stats */}
        <div className="dashboard-panel">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium block mb-2">
            Total Area
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-foreground">40.7</span>
            <span className="text-xs sm:text-sm text-muted-foreground">ha</span>
          </div>
        </div>
        <div className="dashboard-panel">
          <span className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium block mb-2">
            Active Fields
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-success">1</span>
            <span className="text-xs sm:text-sm text-muted-foreground">/ {fields.length}</span>
          </div>
        </div>

        {/* Field Cards Grid - Responsive */}
        {fields.map((field) => (
          <div
            key={field.id}
            className={cn(
              "dashboard-panel border-l-4 transition-all duration-200 cursor-pointer hover:scale-[1.02] col-span-1",
              statusColors[field.status],
              statusBg[field.status]
            )}
          >
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-3 sm:w-4 h-3 sm:h-4 text-muted-foreground flex-shrink-0" />
                <span className="font-medium text-foreground text-xs sm:text-sm truncate">{field.name}</span>
              </div>
              {field.status === "completed" && (
                <Check className="w-3 sm:w-4 h-3 sm:h-4 text-primary flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base sm:text-lg font-mono font-bold text-foreground">
                {field.area} <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">ha</span>
              </span>
              <span
                className={cn(
                  "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full",
                  field.status === "active" && "bg-success/20 text-success",
                  field.status === "completed" && "bg-primary/20 text-primary",
                  field.status === "idle" && "bg-muted text-muted-foreground"
                )}
              >
                {statusLabels[field.status]}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 block">
              {field.lastWorked}
            </span>
          </div>
        ))}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => navigate("/fields/create")}
        className={cn(
          "fixed bottom-24 right-4 z-40",
          "w-14 h-14 rounded-full",
          "bg-primary text-primary-foreground",
          "flex items-center justify-center",
          "shadow-lg shadow-primary/30",
          "transition-all duration-200 active:scale-95 hover:bg-primary/90"
        )}
        aria-label="Add field"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
