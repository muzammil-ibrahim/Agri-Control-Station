import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { fieldsApi, vehiclesApi, tasksApi, geoPointsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface NamedEntity {
  id: number;
  name: string;
}

interface TaskEntity {
  id: number;
  field_id: number;
  vehicle_id: number | null;
  task_type: string;
  target_quantity: number | null;
  unit: string | null;
  scheduled_at: string | null;
  recurrence_rule: string | null;
  col_spacing_ft?: number | null;
  row_spacing_ft?: number | null;
  border_margin_ft?: number | null;
}

interface GeofenceStatus {
  field_id: number;
  field_name: string;
  point_count: number;
  is_ready: boolean;
  message: string;
}

export default function TaskCreate() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEditMode = Boolean(id);

  const [fields, setFields] = useState<{ id: number; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [geofenceStatus, setGeofenceStatus] = useState<GeofenceStatus | null>(null);

  const [formData, setFormData] = useState({
    field_id: "",
    task_type: "",
    target_quantity: "",
    unit: "",
    scheduled_at: "",
    recurrence_rule: "",
    vehicle_id: "",
    col_spacing_ft: "4",
    row_spacing_ft: "10",
    border_margin_ft: "4",
  });

  useEffect(() => {
    async function load() {
      const [{ data: f }, { data: v }] = await Promise.all([
        fieldsApi.list(),
        vehiclesApi.list(),
      ]);

      const fieldRows = (Array.isArray(f) ? f : []) as NamedEntity[];
      const vehicleRows = (Array.isArray(v) ? v : []) as NamedEntity[];
      setFields(fieldRows.map((x) => ({ id: x.id, name: x.name })));
      setVehicles(vehicleRows.map((x) => ({ id: x.id, name: x.name })));

      if (id) {
        const { data: task } = await tasksApi.get(Number(id));
        const typedTask = task as TaskEntity | null;
        if (typedTask) {
          setFormData({
            field_id: String(typedTask.field_id),
            task_type: typedTask.task_type,
            target_quantity: typedTask.target_quantity ? String(typedTask.target_quantity) : "",
            unit: typedTask.unit || "",
            scheduled_at: typedTask.scheduled_at ? typedTask.scheduled_at.slice(0, 16) : "",
            recurrence_rule: typedTask.recurrence_rule || "",
            vehicle_id: typedTask.vehicle_id ? String(typedTask.vehicle_id) : "",
            col_spacing_ft: typedTask.col_spacing_ft != null ? String(typedTask.col_spacing_ft) : "4",
            row_spacing_ft: typedTask.row_spacing_ft != null ? String(typedTask.row_spacing_ft) : "10",
            border_margin_ft: typedTask.border_margin_ft != null ? String(typedTask.border_margin_ft) : "4",
          });
        }
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    const selectedFieldId = Number(formData.field_id);
    if (!selectedFieldId) {
      setGeofenceStatus(null);
      return;
    }

    const loadGeofenceStatus = async () => {
      const { data, error } = await geoPointsApi.geofenceStatus(selectedFieldId);
      if (error) {
        setGeofenceStatus({
          field_id: selectedFieldId,
          field_name: "",
          point_count: 0,
          is_ready: false,
          message: error.message,
        });
        return;
      }
      setGeofenceStatus((data as GeofenceStatus) || null);
    };

    loadGeofenceStatus();
  }, [formData.field_id]);

  const recurrenceToRule = (val: string) => {
    if (val === "daily") return "FREQ=DAILY";
    if (val === "weekly") return "FREQ=WEEKLY";
    if (val === "none" || !val) return null;
    return val;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.field_id) {
      toast({ title: "Field required", description: "Please select a field", variant: "destructive" });
      return;
    }

    if (geofenceStatus && !geofenceStatus.is_ready) {
      toast({
        title: "Geofence missing",
        description: geofenceStatus.message,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const payload = {
      field_id: Number(formData.field_id),
      vehicle_id: formData.vehicle_id ? Number(formData.vehicle_id) : undefined,
      task_type: formData.task_type,
      target_quantity: formData.target_quantity ? Number(formData.target_quantity) : undefined,
      unit: formData.unit || undefined,
      scheduled_at: formData.scheduled_at || undefined,
      recurrence_rule: recurrenceToRule(formData.recurrence_rule) || undefined,
      col_spacing_ft: formData.col_spacing_ft ? Number(formData.col_spacing_ft) : 4,
      row_spacing_ft: formData.row_spacing_ft ? Number(formData.row_spacing_ft) : 10,
      border_margin_ft: formData.border_margin_ft ? Number(formData.border_margin_ft) : 4,
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
          {formData.field_id && geofenceStatus && (
            <p className={`text-xs mt-2 ${geofenceStatus.is_ready ? "text-green-600" : "text-red-600"}`}>
              {geofenceStatus.is_ready
                ? `Geofence ready (${geofenceStatus.point_count} points)`
                : `Geofence missing (${geofenceStatus.point_count} points). ${geofenceStatus.message}`}
            </p>
          )}
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label htmlFor="colSpacing">Col Spacing (ft)</Label>
            <Input id="colSpacing" type="number" step="0.1" value={formData.col_spacing_ft} onChange={(e) => setFormData({ ...formData, col_spacing_ft: e.target.value })} className="h-12 bg-card border-border mt-1" />
          </div>
          <div>
            <Label htmlFor="rowSpacing">Row Spacing (ft)</Label>
            <Input id="rowSpacing" type="number" step="0.1" value={formData.row_spacing_ft} onChange={(e) => setFormData({ ...formData, row_spacing_ft: e.target.value })} className="h-12 bg-card border-border mt-1" />
          </div>
          <div>
            <Label htmlFor="borderMargin">Border Margin (ft)</Label>
            <Input id="borderMargin" type="number" step="0.1" value={formData.border_margin_ft} onChange={(e) => setFormData({ ...formData, border_margin_ft: e.target.value })} className="h-12 bg-card border-border mt-1" />
          </div>
        </div>
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? "Saving..." : isEditMode ? "Update Task" : "Create Task"}
        </Button>
      </form>
    </div>
  );
}
