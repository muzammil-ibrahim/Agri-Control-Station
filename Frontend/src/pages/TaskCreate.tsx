import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const plots = [
  { id: "plot-a", name: "Plot A" },
  { id: "plot-b", name: "Plot B" },
  { id: "plot-c", name: "Plot C" },
  { id: "plot-d", name: "Plot D" },
];

// Mock existing tasks for edit mode
const existingTasks: Record<string, { name: string; plot: string; columnSpacing: string; rowSpacing: string; borderPadding: string }> = {
  "1": { name: "Seedling planting", plot: "plot-a", columnSpacing: "3", rowSpacing: "2.5", borderPadding: "1" },
  "2": { name: "Fertilizer spray", plot: "plot-b", columnSpacing: "4", rowSpacing: "3", borderPadding: "1.5" },
  "3": { name: "Harvesting wheat", plot: "plot-c", columnSpacing: "3.5", rowSpacing: "2", borderPadding: "0.5" },
};

export default function TaskCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const existingTask = id ? existingTasks[id] : null;

  const [formData, setFormData] = useState({
    name: existingTask?.name || "",
    plot: existingTask?.plot || "",
    columnSpacing: existingTask?.columnSpacing || "",
    rowSpacing: existingTask?.rowSpacing || "",
    borderPadding: existingTask?.borderPadding || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission - just navigate back
    navigate("/task");
  };

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-20 pt-3 sm:pt-4">
      {/* Header */}
      <header className="flex items-center gap-2 sm:gap-4 mb-4 sm:mb-6 px-2 sm:px-4">
        <button
          onClick={() => navigate(-1)}
          className={cn(
            "flex items-center justify-center w-8 sm:w-10 h-8 sm:h-10 rounded-full",
            "bg-card/90 border border-border",
            "text-muted-foreground hover:text-foreground hover:bg-card",
            "transition-all duration-200 active:scale-95 flex-shrink-0"
          )}
        >
          <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-semibold text-foreground">
          {isEditMode ? "Edit Task" : "Create Task"}
        </h1>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="dashboard-panel mx-2 sm:m-0 space-y-4 sm:space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter task name"
            className="bg-muted/50 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plot" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Plot
          </Label>
          <Select
            value={formData.plot}
            onValueChange={(value) => setFormData({ ...formData, plot: value })}
          >
            <SelectTrigger className="bg-muted/50 border-border">
              <SelectValue placeholder="Select plot" />
            </SelectTrigger>
            <SelectContent>
              {plots.map((plot) => (
                <SelectItem key={plot.id} value={plot.id}>
                  {plot.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="columnSpacing" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Column spacing (ft)
          </Label>
          <Input
            id="columnSpacing"
            type="number"
            step="0.1"
            value={formData.columnSpacing}
            onChange={(e) => setFormData({ ...formData, columnSpacing: e.target.value })}
            placeholder="Enter column spacing"
            className="bg-muted/50 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rowSpacing" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Row spacing (ft)
          </Label>
          <Input
            id="rowSpacing"
            type="number"
            step="0.1"
            value={formData.rowSpacing}
            onChange={(e) => setFormData({ ...formData, rowSpacing: e.target.value })}
            placeholder="Enter row spacing"
            className="bg-muted/50 border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="borderPadding" className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Border padding (ft)
          </Label>
          <Input
            id="borderPadding"
            type="number"
            step="0.1"
            value={formData.borderPadding}
            onChange={(e) => setFormData({ ...formData, borderPadding: e.target.value })}
            placeholder="Enter border padding"
            className="bg-muted/50 border-border"
          />
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="w-full bg-card border border-border hover:bg-muted/50 text-foreground"
          >
            {isEditMode ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}
