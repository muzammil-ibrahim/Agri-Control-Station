import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { farmsApi, fieldsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CapturedCoordinate {
  label?: string;
  lat?: number | string;
  lng?: number | string;
}

interface PlotCreateLocationState {
  capturedCoordinates?: CapturedCoordinate[];
}

export default function PlotCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [farmId, setFarmId] = useState("");
  const [areaHectares, setAreaHectares] = useState("");
  const [soilType, setSoilType] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [farms, setFarms] = useState<{ id: number; name: string }[]>([]);

  const capturedCoordinates = (location.state as PlotCreateLocationState | null)?.capturedCoordinates || [];

  useEffect(() => {
    const loadFarms = async () => {
      const { data, error } = await farmsApi.list();
      if (error) {
        toast({ title: "Error loading farms", description: error.message, variant: "destructive" });
        return;
      }
      const farmRows = Array.isArray(data) ? (data as { id: number; name: string }[]) : [];
      setFarms(farmRows);
      if (farmRows.length > 0) {
        setFarmId(String(farmRows[0].id));
      }
    };
    loadFarms();
  }, [toast]);

  useEffect(() => {
    if (!Array.isArray(capturedCoordinates) || capturedCoordinates.length === 0) {
      return;
    }

    const csvHeader = "latitude,longitude,sequence_order,label";
    const csvRows = capturedCoordinates
      .map((point, index) => {
        const lat = point.lat ?? "";
        const lng = point.lng ?? "";
        const sequence = index + 1;
        const label = (point.label || "").replace(/,/g, " ");
        return `${lat},${lng},${sequence},${label}`;
      })
      .join("\n");

    const csvText = `${csvHeader}\n${csvRows}`;
    const autoCsv = new File([csvText], "captured_geopoints.csv", { type: "text/csv" });
    setCsvFile(autoCsv);
    toast({ title: "Captured points loaded", description: "CSV generated from captured geopoints" });
  }, [capturedCoordinates, toast]);

  const selectedFileName = useMemo(() => csvFile?.name || "Select CSV file...", [csvFile]);

  const handleSubmit = async () => {
    if (!farmId) {
      toast({ title: "Farm required", description: "Select a farm first", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Name required", description: "Enter a field name", variant: "destructive" });
      return;
    }
    if (!csvFile) {
      toast({ title: "CSV required", description: "Upload a CSV file with geo points", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await fieldsApi.createWithCsv({
      farm_id: Number(farmId),
      name: name.trim(),
      area_hectares: areaHectares ? Number(areaHectares) : undefined,
      soil_type: soilType.trim() || undefined,
      csv_file: csvFile,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Could not create field", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Field created", description: "Field and geo points saved to database" });
    navigate("/fields");
  };

  return (
    <div className="pb-20 pt-4 p-4 flex flex-col">
      {/* Form */}
      <div className="flex-1 space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Farm</Label>
          <Select value={farmId} onValueChange={setFarmId}>
            <SelectTrigger className="h-12 bg-card border-border">
              <SelectValue placeholder="Select farm" />
            </SelectTrigger>
            <SelectContent>
              {farms.map((farm) => (
                <SelectItem key={farm.id} value={String(farm.id)}>
                  {farm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Field Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter field name"
            className="h-12 bg-card border-border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Area (hectares) <span className="text-muted-foreground">(optional)</span></label>
          <Input
            value={areaHectares}
            onChange={(e) => setAreaHectares(e.target.value)}
            type="number"
            step="0.01"
            placeholder="e.g. 2.5"
            className="h-12 bg-card border-border"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Soil Type <span className="text-muted-foreground">(optional)</span></label>
          <Input
            value={soilType}
            onChange={(e) => setSoilType(e.target.value)}
            placeholder="e.g. Loamy"
            className="h-12 bg-card border-border"
          />
        </div>

        {/* Upload Plot Coordinates */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Upload Plot Coordinates (CSV)</label>
          <label
            className={cn(
              "h-12 border border-border rounded-md bg-card",
              "flex items-center justify-between px-4",
              "cursor-pointer hover:border-primary/50 transition-colors"
            )}
          >
            <span className="text-muted-foreground text-sm truncate pr-3">{selectedFileName}</span>
            <Upload className="w-5 h-5 text-muted-foreground" />
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 border-t border-dashed border-border" />
          <span className="text-muted-foreground text-sm">or</span>
          <div className="flex-1 border-t border-dashed border-border" />
        </div>

        {/* Create File Button */}
        <div className="flex justify-center">
          <Button variant="outline" className="px-8" onClick={() => navigate("/fields/plot-map")}>
            Create File
          </Button>
        </div>
      </div>

      {/* Done Button */}
      <div className="flex justify-end pt-4">
        <Button onClick={handleSubmit} className="px-8" disabled={loading}>
          {loading ? "Saving..." : "Done"}
        </Button>
      </div>
    </div>
  );
}
