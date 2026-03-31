import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Filter, Plus, Sprout, Bug, FlaskConical, Layers, Pill, Wheat, StickyNote,
  BarChart3, List, ChevronDown, ChevronUp, Trash2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer,
} from "recharts";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cropLogsApi, growthObservationsApi, pestRecordsApi, diseaseRecordsApi, soilTestsApi, treatmentRecordsApi, harvestRecordsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import AddLogDialog from "@/components/logs/AddLogDialog";

interface CropLogRow {
  id: number;
  log_type: string;
  title: string;
  notes: string | null;
  field_id: number;
  logged_by: string | null;
  logged_at: string;
  is_auto_generated: boolean;
  fields: { name: string } | null;
  crop_seasons: { crop_type: string; variety: string | null } | null;
  crop_log_tags: { log_tags: { name: string; color: string | null } | null }[];
}

const logTypeIcons: Record<string, any> = {
  growth: Sprout, pest: Bug, disease: FlaskConical, soil: Layers,
  treatment: Pill, harvest: Wheat, note: StickyNote,
};

const logTypeColors: Record<string, string> = {
  growth: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  pest: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  disease: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  soil: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  treatment: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  harvest: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
  note: "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300",
};

const usageData = [
  { week: "W1", water: 2000, fertilizer: 100, pesticide: 40 },
  { week: "W2", water: 1800, fertilizer: 0, pesticide: 0 },
  { week: "W3", water: 2200, fertilizer: 80, pesticide: 20 },
  { week: "W4", water: 1900, fertilizer: 120, pesticide: 0 },
];
const soilHealthData = [
  { date: "Jan", ph: 6.5, nitrogen: 40, phosphorus: 25, potassium: 170 },
  { date: "Feb", ph: 6.7, nitrogen: 42, phosphorus: 27, potassium: 175 },
  { date: "Mar", ph: 6.8, nitrogen: 45, phosphorus: 28, potassium: 180 },
];
const pestFrequencyData = [
  { name: "Aphids", count: 5, severity: "moderate" },
  { name: "Leaf Blight", count: 3, severity: "low" },
  { name: "Stem Borer", count: 2, severity: "high" },
  { name: "Root Rot", count: 1, severity: "critical" },
];
const yieldData = [
  { season: "2024 Kharif", yieldPerHa: 1520 },
  { season: "2025 Rabi", yieldPerHa: 1680 },
  { season: "2025 Kharif", yieldPerHa: 1750 },
];

const detailFetchers: Record<string, (id: number) => Promise<any>> = {
  growth: async (id) => (await growthObservationsApi.getByLog(id)).data,
  pest: async (id) => (await pestRecordsApi.getByLog(id)).data,
  disease: async (id) => (await diseaseRecordsApi.getByLog(id)).data,
  soil: async (id) => (await soilTestsApi.getByLog(id)).data,
  treatment: async (id) => (await treatmentRecordsApi.getByLog(id)).data,
  harvest: async (id) => (await harvestRecordsApi.getByLog(id)).data,
};

export default function Logs() {
  const { toast } = useToast();
  const [view, setView] = useState<"feed" | "analytics">("feed");
  const [logs, setLogs] = useState<CropLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterField, setFilterField] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [showAuto, setShowAuto] = useState(true);
  const [expandedLog, setExpandedLog] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, any>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    const { data } = await cropLogsApi.list();
    setLogs((data as unknown as CropLogRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadLogs(); }, []);

  const handleExpand = async (logId: number, logType: string) => {
    if (expandedLog === logId) { setExpandedLog(null); return; }
    setExpandedLog(logId);
    if (!details[logId] && detailFetchers[logType]) {
      const detail = await detailFetchers[logType](logId);
      setDetails((prev) => ({ ...prev, [logId]: detail }));
    }
  };

  const handleDelete = async (id: number) => {
    const { error } = await cropLogsApi.delete(id);
    if (error) {
      toast({ title: "Error deleting log", description: error.message, variant: "destructive" });
    } else {
      setLogs((prev) => prev.filter((l) => l.id !== id));
      toast({ title: "Log deleted" });
    }
    setDeleteId(null);
  };

  const filteredLogs = logs
    .filter((l) => filterField === "all" || l.fields?.name === filterField)
    .filter((l) => filterType === "all" || l.log_type === filterType)
    .filter((l) => showAuto || !l.is_auto_generated);

  const fieldNames = [...new Set(logs.map((l) => l.fields?.name).filter(Boolean))] as string[];

  const renderDetail = (log: CropLogRow) => {
    const d = details[log.id];
    if (!d) return <p className="text-xs text-muted-foreground">Loading...</p>;
    const grid = (items: [string, any][]) => (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        {items.map(([label, val]) => val != null && (
          <div key={label}><span className="text-muted-foreground">{label}:</span> <span className="font-mono">{val}</span></div>
        ))}
      </div>
    );
    switch (log.log_type) {
      case "growth": return grid([["Height", `${d.plant_height_cm} cm`], ["Leaves", d.leaf_count], ["BBCH", d.bbch_stage], ["Canopy", `${d.canopy_cover_pct}%`], ["Vigor", d.vigor_rating]]);
      case "pest": return grid([["Pest", d.pest_name], ["Category", d.pest_category], ["Severity", d.severity], ["Affected", `${d.affected_area_pct}%`], ["Action", d.recommended_action]]);
      case "disease": return grid([["Disease", d.disease_name], ["Severity", d.severity], ["Symptoms", d.symptoms], ["Spread", `${d.spread_pct}%`], ["Rate", d.spread_rate]]);
      case "soil": return grid([["pH", d.ph], ["N", `${d.nitrogen_ppm} ppm`], ["P", `${d.phosphorus_ppm} ppm`], ["K", `${d.potassium_ppm} ppm`], ["Moisture", `${d.moisture_pct}%`], ["OM", `${d.organic_matter_pct}%`], ["Temp", `${d.temp_celsius}°C`], ["EC", `${d.ec_ds_per_m} dS/m`]]);
      case "treatment": return grid([["Product", d.product_name], ["Type", d.treatment_type], ["Dose", `${d.dose_per_ha}/ha`], ["Total", `${d.total_quantity} ${d.unit}`], ["Method", d.application_method], ["Weather", d.weather_conditions]]);
      case "harvest": return grid([["Yield", `${d.yield_kg} kg`], ["Area", `${d.harvested_area_ha} ha`], ["Yield/ha", `${d.yield_per_ha} kg/ha`], ["Grade", d.quality_grade], ["Moisture", `${d.moisture_content_pct}%`], ["Storage", d.storage_location]]);
      default: return null;
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={view === "feed" ? "default" : "outline"} size="sm" onClick={() => setView("feed")}>
          <List size={14} className="mr-1" /> Log Feed
        </Button>
        <Button variant={view === "analytics" ? "default" : "outline"} size="sm" onClick={() => setView("analytics")}>
          <BarChart3 size={14} className="mr-1" /> Analytics
        </Button>
      </div>

      {view === "feed" && (
        <>
          <div className="dashboard-panel">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={14} className="text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filters</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select value={filterField} onValueChange={setFilterField}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Fields" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  {fieldNames.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-9"><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="growth">Growth</SelectItem>
                  <SelectItem value="pest">Pest</SelectItem>
                  <SelectItem value="disease">Disease</SelectItem>
                  <SelectItem value="soil">Soil</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                  <SelectItem value="harvest">Harvest</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                </SelectContent>
              </Select>
              <Button variant={showAuto ? "outline" : "secondary"} size="sm" className="h-9" onClick={() => setShowAuto(!showAuto)}>
                {showAuto ? "Hide Auto" : "Show Auto"}
              </Button>
            </div>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <StickyNote size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No logs yet. Tap + to add one.</p>
            </div>
          )}

          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const Icon = logTypeIcons[log.log_type] || StickyNote;
              const isExpanded = expandedLog === log.id;
              const tags = log.crop_log_tags?.map((ct) => ct.log_tags).filter(Boolean) || [];

              return (
                <div key={log.id} className="dashboard-panel cursor-pointer" onClick={() => handleExpand(log.id, log.log_type)}>
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2 rounded-lg shrink-0", logTypeColors[log.log_type])}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-sm text-foreground">{log.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">{log.notes}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteId(log.id); }}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs text-muted-foreground">{log.fields?.name}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{log.crop_seasons?.crop_type || "—"}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{log.logged_by}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{new Date(log.logged_at).toLocaleDateString()}</span>
                        {tags.map((tag: any) => (
                          <span key={tag.name} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: (tag.color || "#888") + "20", color: tag.color || "#888" }}>
                            {tag.name}
                          </span>
                        ))}
                      </div>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-border">
                          {renderDetail(log)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setAddOpen(true)}
            className={cn("fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-200 active:scale-95 hover:bg-primary/90")}
            aria-label="Add log"
          >
            <Plus size={24} />
          </button>

          <AddLogDialog open={addOpen} onOpenChange={setAddOpen} onCreated={loadLogs} />

          <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Log</AlertDialogTitle>
                <AlertDialogDescription>Are you sure you want to delete this log entry? This cannot be undone.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {view === "analytics" && (
        <div className="space-y-4">
          <div className="dashboard-panel">
            <h3 className="text-sm font-semibold text-foreground mb-4">Usage Over Time</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip /><Legend />
                <Bar dataKey="water" stackId="a" fill="hsl(210, 80%, 55%)" name="Water (L)" />
                <Bar dataKey="fertilizer" stackId="a" fill="hsl(142, 60%, 45%)" name="Fertilizer (kg)" />
                <Bar dataKey="pesticide" stackId="a" fill="hsl(38, 92%, 50%)" name="Pesticide (L)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-panel">
            <h3 className="text-sm font-semibold text-foreground mb-4">Soil Health Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={soilHealthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip /><Legend />
                <Line type="monotone" dataKey="ph" stroke="hsl(0, 72%, 51%)" name="pH" strokeWidth={2} />
                <Line type="monotone" dataKey="nitrogen" stroke="hsl(142, 60%, 45%)" name="N (ppm)" strokeWidth={2} />
                <Line type="monotone" dataKey="phosphorus" stroke="hsl(210, 80%, 55%)" name="P (ppm)" strokeWidth={2} />
                <Line type="monotone" dataKey="potassium" stroke="hsl(38, 92%, 50%)" name="K (ppm)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-panel">
            <h3 className="text-sm font-semibold text-foreground mb-4">Pest & Disease Frequency</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={pestFrequencyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Occurrences" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="dashboard-panel">
            <h3 className="text-sm font-semibold text-foreground mb-4">Yield Per Season</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={yieldData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="season" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip />
                <Bar dataKey="yieldPerHa" fill="hsl(var(--primary))" name="Yield (kg/ha)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
