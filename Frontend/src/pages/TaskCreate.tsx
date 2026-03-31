import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { fieldsApi, vehiclesApi, tasksApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function TaskCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditMode = Boolean(id);

  const [fields, setFields] = useState<{ id: number; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    field_id: "",
    task_type: "",
    target_quantity: "",
    unit: "",
    scheduled_at: "",
    recurrence_rule: "",
    vehicle_id: "",
  });

  useEffect(() => {
    async function load() {
      const [{ data: f }, { data: v }] = await Promise.all([fieldsApi.list(), vehiclesApi.list()]);
      setFields((f || []).map((x) => ({ id: x.id, name: x.name })));
      setVehicles((v || []).map((x) => ({ id: x.id, name: x.name })));

      if (id) {
        const { data: task } = await tasksApi.get(Number(id));
        if (task) {
          setFormData({
            field_id: String(task.field_id),
            task_type: task.task_type,
            target_quantity: task.target_quantity ? String(task.target_quantity) : "",
            unit: task.unit || "",
            scheduled_at: task.scheduled_at ? task.scheduled_at.slice(0, 16) : "",
            recurrence_rule: task.recurrence_rule || "",
            vehicle_id: task.vehicle_id ? String(task.vehicle_id) : "",
          });
        }
      }
    }
    load();
  }, [id]);

  const recurrenceToRule = (val: string) => {
    if (val === "daily") return "FREQ=DAILY";
    if (val === "weekly") return "FREQ=WEEKLY";
    if (val === "none" || !val) return null;
    return val;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      field_id: Number(formData.field_id),
      vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : undefined,
      task_type: formData.task_type,
      target_quantity: formData.target_quantity ? Number(formData.target_quantity) : undefined,
      unit: formData.unit || undefined,
      scheduled_at: formData.scheduled_at || undefined,
      recurrence_rule: recurrenceToRule(formData.recurrence_rule) || undefined,
    };

    const { error } = isEditMode
      ? await tasksApi.update(Number(id), payload)
      : await tasksApi.create(payload);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: isEditMode ? "Task updated" : "Task created" });
    navigate("/task");
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-6">
      <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-lg">
        <div className="dashboard-panel space-y-4">
        <div>
          <Label>Field</Label>
          <Select value={formData.field_id} onValueChange={(v) => setFormData({ ...formData, field_id: v })}>
            <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="Select field" /></SelectTrigger>
            <SelectContent>
              {fields.map((f) => <SelectItem key={f.id} value={String(f.id)}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Task Type</Label>
          <Select value={formData.task_type} onValueChange={(v) => setFormData({ ...formData, task_type: v })}>
            <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="water">Water</SelectItem>
              <SelectItem value="fertilize">Fertilize</SelectItem>
              <SelectItem value="spray">Spray</SelectItem>
              <SelectItem value="harvest">Harvest</SelectItem>
              <SelectItem value="plant">Plant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <Input id="quantity" type="number" value={formData.target_quantity} onChange={(e) => setFormData({ ...formData, target_quantity: e.target.value })} placeholder="0" className="h-12 bg-card border-border mt-1" />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="L, kg..." className="h-12 bg-card border-border mt-1" />
          </div>
        </div>

        <div>
          <Label htmlFor="scheduledAt">Scheduled Date & Time</Label>
          <Input id="scheduledAt" type="datetime-local" value={formData.scheduled_at} onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} className="h-12 bg-card border-border mt-1" />
        </div>

        <div>
          <Label>Recurrence</Label>
          <Select value={formData.recurrence_rule || "none"} onValueChange={(v) => setFormData({ ...formData, recurrence_rule: v })}>
            <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="One-time" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">One-time</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Vehicle</Label>
          <Select value={formData.vehicle_id} onValueChange={(v) => setFormData({ ...formData, vehicle_id: v })}>
            <SelectTrigger className="h-12 mt-1"><SelectValue placeholder="Select vehicle" /></SelectTrigger>
            <SelectContent>
              {vehicles.map((v) => <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? "Saving..." : isEditMode ? "Update Task" : "Create Task"}
        </Button>
      </form>
    </div>
  );
}
