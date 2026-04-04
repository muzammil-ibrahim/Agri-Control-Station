import { cn } from "@/lib/utils";
import { MapPin, Plus, Sprout } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { farmsApi, fieldsApi, cropSeasonsApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

const GROWTH_STAGES = ["Germination", "Seedling", "Vegetative", "Flowering", "Fruit Set", "Maturation", "Harvest"];

interface FieldWithSeason {
  id: number;
  farm_id: number;
  name: string;
  area_hectares: number | null;
  soil_type: string | null;
  activeSeason?: {
    crop_type: string;
    variety: string | null;
    growth_stage: string | null;
    expected_harvest: string | null;
    status: string;
  };
}

interface FarmEntity {
  id: number;
  name: string;
  center_lat: number | null;
  center_lng: number | null;
}

interface CropSeasonEntity {
  crop_type: string;
  variety: string | null;
  growth_stage: string | null;
  expected_harvest: string | null;
  status: string;
}

function GrowthStageProgress({ currentStage }: { currentStage: string }) {
  const currentIndex = GROWTH_STAGES.indexOf(currentStage);
  return (
    <div className="flex items-center gap-1 mt-2">
      {GROWTH_STAGES.map((stage, index) => (
        <div key={stage} className="flex items-center gap-1 flex-1">
          <div
            className={cn("h-1.5 rounded-full flex-1 transition-colors", index <= currentIndex ? "bg-primary" : "bg-muted")}
            title={stage}
          />
        </div>
      ))}
    </div>
  );
}

export default function Fields() {
  const navigate = useNavigate();
  const [farm, setFarm] = useState<{ id: number; name: string; center_lat: number | null; center_lng: number | null } | null>(null);
  const [fields, setFields] = useState<FieldWithSeason[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: farms } = await farmsApi.list();
      const farmRows = (Array.isArray(farms) ? farms : []) as FarmEntity[];
      if (farmRows.length === 0) { setLoading(false); return; }

      const selectedFarm = farmRows[0];
      setFarm(selectedFarm);

      const { data: fieldRows } = await fieldsApi.list(selectedFarm.id);
      const typedFieldRows = (Array.isArray(fieldRows) ? fieldRows : []) as FieldWithSeason[];
      if (typedFieldRows.length === 0) { setFields([]); setLoading(false); return; }

      const withSeasons: FieldWithSeason[] = await Promise.all(
        typedFieldRows.map(async (f) => {
          const { data: season } = await cropSeasonsApi.getActive(f.id);
          const typedSeason = (season as CropSeasonEntity | null) || null;
          return {
            ...f,
            activeSeason: typedSeason || undefined,
          };
        })
      );
      setFields(withSeasons);
      setLoading(false);
    }
    load();
  }, []);

  const getFieldStatus = (f: FieldWithSeason) => {
    if (!f.activeSeason) return "idle";
    if (f.activeSeason.growth_stage === "Harvest") return "completed";
    return "active";
  };

  const statusColors: Record<string, string> = {
    idle: "border-border text-muted-foreground",
    active: "border-success/50 text-success",
    completed: "border-primary/50 text-primary",
  };
  const statusLabels: Record<string, string> = { idle: "Idle", active: "Active", completed: "Done" };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48" />)}
        </div>
      </div>
    );
  }

  if (!farm) {
    return (
      <div className="relative min-h-[40vh]">
        <div className="text-center text-muted-foreground py-20">No farms found. Create one to get started.</div>
        <button
          onClick={() => navigate("/fields/plot-map")}
          className={cn(
            "fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-200 active:scale-95 hover:bg-primary/90"
          )}
          aria-label="Add field"
        >
          <Plus size={24} />
        </button>
      </div>
    );
  }

  const totalArea = fields.reduce((sum, f) => sum + (f.area_hectares || 0), 0);
  const activeFields = fields.filter((f) => getFieldStatus(f) === "active").length;

  return (
    <div className="space-y-4">
      <div className="dashboard-panel">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{farm.name}</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin size={14} />
              {farm.center_lat?.toFixed(4)}, {farm.center_lng?.toFixed(4)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="dashboard-panel text-center">
          <p className="text-xs text-muted-foreground">Total Area</p>
          <p className="text-2xl font-bold font-mono text-foreground">{totalArea.toFixed(1)}ha</p>
        </div>
        <div className="dashboard-panel text-center">
          <p className="text-xs text-muted-foreground">Active Fields</p>
          <p className="text-2xl font-bold font-mono text-foreground">{activeFields}/{fields.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          const status = getFieldStatus(field);
          return (
            <div key={field.id} className={cn("dashboard-panel cursor-pointer hover:shadow-md transition-all", status === "active" && "border-success/30")}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground">{field.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{field.area_hectares} ha</Badge>
                    <Badge variant="outline" className="text-xs">{field.soil_type}</Badge>
                  </div>
                </div>
                <span className={cn("text-xs font-medium px-2 py-1 rounded-full border", statusColors[status])}>
                  {statusLabels[status]}
                </span>
              </div>

              {field.activeSeason && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Sprout size={14} className="text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {field.activeSeason.crop_type} — {field.activeSeason.variety}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Stage: {field.activeSeason.growth_stage}</span>
                    <span>Harvest: {field.activeSeason.expected_harvest}</span>
                  </div>
                  {field.activeSeason.growth_stage && <GrowthStageProgress currentStage={field.activeSeason.growth_stage} />}
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>Germination</span>
                    <span>Harvest</span>
                  </div>
                </div>
              )}

              {!field.activeSeason && <p className="text-xs text-muted-foreground mt-2">No active crop season</p>}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/fields/create")}
        className={cn(
          "fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-200 active:scale-95 hover:bg-primary/90"
        )}
        aria-label="Add field"
      >
        <Plus size={24} />
      </button>
    </div>
  );
}
