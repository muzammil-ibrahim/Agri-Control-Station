import { cn } from "@/lib/utils";
import { Plus, Edit2, Trash2, Play, Filter, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { tasksApi, taskExecutionsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface TaskRow {
  id: number;
  field_id: number;
  vehicle_id: number | null;
  task_type: string;
  target_quantity: number | null;
  unit: string | null;
  scheduled_at: string | null;
  recurrence_rule: string | null;
  status: string;
  fields: { name: string } | null;
  vehicles: { name: string } | null;
}

interface Execution {
  id: number;
  started_at: string | null;
  completed_at: string | null;
  outcome: string | null;
  actual_quantity: number | null;
  unit: string | null;
  failure_reason: string | null;
}

const taskTypeColors: Record<string, string> = {
  water: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  fertilize: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  spray: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  harvest: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  plant: "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300",
};

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  cancelled: "bg-danger/10 text-danger",
};

const outcomeColors: Record<string, string> = {
  success: "text-success",
  partial: "text-warning",
  failed: "text-danger",
};

function formatRecurrence(rule: string | null) {
  if (!rule) return null;
  if (rule.includes("DAILY")) return "daily";
  if (rule.includes("WEEKLY")) return "weekly";
  return rule;
}

export default function TaskList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [executions, setExecutions] = useState<Record<number, Execution[]>>({});
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [filterField, setFilterField] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadTasks = async () => {
    const { data, error } = await tasksApi.list();
    if (error) { toast({ title: "Error loading tasks", description: error.message, variant: "destructive" }); return; }
    setTasks((data as unknown as TaskRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { loadTasks(); }, []);

  const handleExpand = async (taskId: number) => {
    if (expandedTask === taskId) { setExpandedTask(null); return; }
    setExpandedTask(taskId);
    if (!executions[taskId]) {
      const { data } = await taskExecutionsApi.listByTask(taskId);
      setExecutions((prev) => ({ ...prev, [taskId]: (data || []) as Execution[] }));
    }
  };

  const handleDelete = async (id: number) => {
    await tasksApi.delete(id);
    setTasks(tasks.filter((t) => t.id !== id));
    setDeleteId(null);
    toast({ title: "Task deleted" });
  };

  const fieldNames = [...new Set(tasks.map((t) => t.fields?.name).filter(Boolean))] as string[];

  const filteredTasks = tasks
    .filter((t) => filterField === "all" || t.fields?.name === filterField)
    .filter((t) => filterType === "all" || t.task_type === filterType)
    .filter((t) => filterStatus === "all" || t.status === filterStatus)
    .sort((a, b) => new Date(a.scheduled_at || 0).getTime() - new Date(b.scheduled_at || 0).getTime());

  const nextTask = filteredTasks.find((t) => t.status === "pending" || t.status === "active");
  const now = new Date();
  const nextTime = nextTask?.scheduled_at ? new Date(nextTask.scheduled_at) : null;
  const countdown = nextTime ? Math.max(0, Math.floor((nextTime.getTime() - now.getTime()) / 1000 / 60)) : null;

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>;
  }

  return (
    <div className="space-y-4">
      {nextTask && (
        <div className="dashboard-panel flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={18} className="text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Next: {nextTask.task_type} — {nextTask.fields?.name}</p>
              <p className="text-xs text-muted-foreground">
                {nextTask.fields?.name} · {nextTask.scheduled_at ? new Date(nextTask.scheduled_at).toLocaleString() : "—"}
              </p>
            </div>
          </div>
          {countdown !== null && (
            <Badge variant="outline" className="font-mono">
              {countdown > 60 ? `${Math.floor(countdown / 60)}h ${countdown % 60}m` : `${countdown}m`}
            </Badge>
          )}
        </div>
      )}

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
              <SelectItem value="water">Water</SelectItem>
              <SelectItem value="fertilize">Fertilize</SelectItem>
              <SelectItem value="spray">Spray</SelectItem>
              <SelectItem value="harvest">Harvest</SelectItem>
              <SelectItem value="plant">Plant</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-9"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const recurrence = formatRecurrence(task.recurrence_rule);
          return (
            <div key={task.id} className="dashboard-panel">
              <div className="flex items-start justify-between cursor-pointer" onClick={() => navigate(`/task/${task.id}`)}>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground capitalize">{task.task_type} — {task.fields?.name}</h3>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", taskTypeColors[task.task_type])}>{task.task_type}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColors[task.status])}>{task.status}</span>
                    {recurrence && <Badge variant="outline" className="text-xs">🔁 {recurrence}</Badge>}
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{task.fields?.name}</span>
                    <span>{task.vehicles?.name || "—"}</span>
                    {task.target_quantity && <span>{task.target_quantity} {task.unit}</span>}
                    <span>{task.scheduled_at ? new Date(task.scheduled_at).toLocaleString() : "—"}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); }} className="p-2 rounded-lg hover:bg-success/10 text-success transition-colors" title="Run Now"><Play size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); navigate(`/task/edit/${task.id}`); }} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors" title="Edit"><Edit2 size={14} /></button>
                  <button onClick={(e) => { e.stopPropagation(); setDeleteId(task.id); }} className="p-2 rounded-lg hover:bg-danger/10 text-danger transition-colors" title="Delete"><Trash2 size={14} /></button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleExpand(task.id); }}
                    className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    title={expandedTask === task.id ? "Hide history" : "Show history"}
                  >
                    {expandedTask === task.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {expandedTask === task.id && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Execution History</p>
                  {(!executions[task.id] || executions[task.id].length === 0) ? (
                    <p className="text-xs text-muted-foreground">No executions yet</p>
                  ) : (
                    <div className="space-y-2">
                      {executions[task.id].map((exec) => (
                        <div key={exec.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <span className={cn("font-medium capitalize", outcomeColors[exec.outcome || ""])}>{exec.outcome}</span>
                            <span className="text-muted-foreground">{exec.started_at ? new Date(exec.started_at).toLocaleString() : "—"}</span>
                            {exec.completed_at && <span className="text-muted-foreground">→ {new Date(exec.completed_at).toLocaleTimeString()}</span>}
                          </div>
                          <span className="font-mono">{exec.actual_quantity} {exec.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => navigate("/task/create")} className={cn("fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 transition-all duration-200 active:scale-95 hover:bg-primary/90")} aria-label="Add task">
        <Plus size={24} />
      </button>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
