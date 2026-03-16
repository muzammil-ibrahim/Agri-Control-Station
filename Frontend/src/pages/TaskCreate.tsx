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
    <div className="pb-20 pt-4 p-4 flex flex-col">
      <form onSubmit={handleSubmit} className="flex-1 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            Name
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter task name"
            className="h-12 bg-card border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plot" className="text-sm font-medium text-foreground">
            Plot
          </Label>
          <Select
            value={formData.plot}
            onValueChange={(value) => setFormData({ ...formData, plot: value })}
          >
            <SelectTrigger className="h-12 bg-card border-border">
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
          <Label htmlFor="columnSpacing" className="text-sm font-medium text-foreground">
            Column spacing (ft)
          </Label>
          <Input
            id="columnSpacing"
            type="number"
            step="0.1"
            value={formData.columnSpacing}
            onChange={(e) => setFormData({ ...formData, columnSpacing: e.target.value })}
            placeholder="Enter column spacing"
            className="h-12 bg-card border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="rowSpacing" className="text-sm font-medium text-foreground">
            Row spacing (ft)
          </Label>
          <Input
            id="rowSpacing"
            type="number"
            step="0.1"
            value={formData.rowSpacing}
            onChange={(e) => setFormData({ ...formData, rowSpacing: e.target.value })}
            placeholder="Enter row spacing"
            className="h-12 bg-card border-border"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="borderPadding" className="text-sm font-medium text-foreground">
            Border padding (ft)
          </Label>
          <Input
            id="borderPadding"
            type="number"
            step="0.1"
            value={formData.borderPadding}
            onChange={(e) => setFormData({ ...formData, borderPadding: e.target.value })}
            placeholder="Enter border padding"
            className="h-12 bg-card border-border"
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="px-8">
            {isEditMode ? "Update" : "Done"}
          </Button>
        </div>
      </form>
    </div>
  );
}
