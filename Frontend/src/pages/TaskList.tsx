import { cn } from "@/lib/utils";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AppHeader } from "@/components/dashboard/AppHeader";

interface Task {
  id: number;
  name: string;
  plot: string;
  status: "pending" | "active" | "completed";
}

const initialTasks: Task[] = [
  { id: 1, name: "Seedling planting", plot: "Plot A", status: "pending" },
  { id: 2, name: "Fertilizer spray", plot: "Plot B", status: "active" },
  { id: 3, name: "Harvesting wheat", plot: "Plot C", status: "completed" },
];

export default function TaskList() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    setTasks(tasks.filter((t) => t.id !== id));
    setDeleteId(null);
  };

  return (
    <div className="min-h-screen bg-background pb-16 sm:pb-20">
      <AppHeader title="AgriControl Bot" />

      <div className="px-2 sm:px-4">

      {/* Task Table - Responsive */}
      <div className="dashboard-panel">
        <div className="overflow-x-auto -mx-2 sm:mx-0 px-2 sm:px-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 sm:py-3 px-2 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium w-8 sm:w-12">
                  S.No
                </th>
                <th className="text-left py-2 sm:py-3 px-2 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Name
                </th>
                <th className="text-left py-2 sm:py-3 px-2 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Plot
                </th>
                <th className="text-right py-2 sm:py-3 px-2 text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, index) => (
                <tr
                  key={task.id}
                  className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                  onClick={() => navigate(`/task/${task.id}`)}
                >
                  <td className="py-2 sm:py-3 px-2 text-[11px] sm:text-sm text-muted-foreground">{index + 1}</td>
                  <td className="py-2 sm:py-3 px-2 text-[11px] sm:text-sm text-foreground truncate">{task.name}</td>
                  <td className="py-2 sm:py-3 px-2 text-[11px] sm:text-sm text-muted-foreground hidden sm:table-cell">{task.plot}</td>
                  <td className="py-2 sm:py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/task/edit/${task.id}`);
                        }}
                        className="p-1 sm:p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Edit2 className="w-3 sm:w-4 h-3 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(task.id);
                        }}
                        className="p-1 sm:p-2 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors"
                      >
                        <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/task/${task.id}`);
                        }}
                        className={cn(
                          "px-4 py-1.5 rounded-lg text-xs font-medium transition-colors",
                          task.status === "active"
                            ? "bg-warning/20 text-warning"
                            : "bg-primary/20 text-primary hover:bg-primary/30"
                        )}
                      >
                        {task.status === "active" ? "Running" : "Start"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tasks.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <p>No tasks created yet</p>
            <p className="text-xs mt-1">Click the + button to create a new task</p>
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <button
        onClick={() => navigate("/task/create")}
        className={cn(
          "fixed bottom-24 left-1/2 -translate-x-1/2 z-40",
          "w-14 h-14 rounded-full",
          "bg-card border-2 border-border",
          "flex items-center justify-center",
          "text-foreground hover:text-primary hover:border-primary/50",
          "transition-all duration-200 active:scale-95",
          "shadow-lg"
        )}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-danger text-danger-foreground hover:bg-danger/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
