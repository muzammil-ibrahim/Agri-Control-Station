import { cn } from "@/lib/utils";
import { ArrowLeft, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function PlotCreate() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    // Mock submission - just navigate back
    navigate("/fields");
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-4 p-4 flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/fields")}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full",
            "bg-card/90 border border-border",
            "text-muted-foreground hover:text-foreground hover:bg-card",
            "transition-all duration-200 active:scale-95"
          )}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold text-foreground">Create Plot</h1>
      </header>

      {/* Form */}
      <div className="flex-1 space-y-6">
        {/* Name Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter plot name"
            className="h-12 bg-card border-border"
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Description <span className="text-muted-foreground">(optional)</span>
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter description"
            className="h-12 bg-card border-border"
          />
        </div>

        {/* Upload Plot Coordinates */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Upload Plot coordinates</label>
          <div
            className={cn(
              "h-12 border border-border rounded-md bg-card",
              "flex items-center justify-between px-4",
              "cursor-pointer hover:border-primary/50 transition-colors"
            )}
          >
            <span className="text-muted-foreground text-sm">Select file...</span>
            <Upload className="w-5 h-5 text-muted-foreground" />
          </div>
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
        <Button onClick={handleSubmit} className="px-8">
          Done
        </Button>
      </div>
    </div>
  );
}
