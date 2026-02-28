const defaultCells = [
  { id: "B1", voltage: 50 },
  { id: "B2", voltage: 50 },
  { id: "B3", voltage: 20 },
  { id: "B4", voltage: 50 },
  { id: "B5", voltage: 10 },
];

function dotColor(v: number) {
  if (v >= 40) return "bg-success";
  if (v >= 20) return "bg-warning";
  return "bg-danger";
}

interface BatteryStatusPanelProps {
  batteries?: Record<string, number>;
}

export function BatteryStatusPanel({ batteries }: BatteryStatusPanelProps) {
  const cells = batteries
    ? Object.entries(batteries).map(([id, voltage]) => ({ id, voltage }))
    : defaultCells;

  return (
    <div className="dashboard-panel flex flex-col py-2 sm:py-3 px-3 sm:px-4">
      <span className="text-[8px] sm:text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
        Battery Status
      </span>
      <div className="flex flex-col gap-2 text-[11px] sm:text-sm">
        {cells.map((c) => (
          <div key={c.id} className="flex items-center justify-between">
            <span className="text-muted-foreground text-[10px] sm:text-xs">{c.id}</span>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor(c.voltage)}`} />
              <span className="text-foreground font-medium font-mono text-[10px] sm:text-xs">{c.voltage}V</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
