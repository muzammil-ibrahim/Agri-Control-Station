import { cn } from "@/lib/utils";
import { ArrowLeft, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/ui/switch";
import { useSidebar } from "./SidebarContext";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  backTo?: string;
}

export function TopBar({ title, subtitle, backTo }: TopBarProps) {
  const { isDark, toggle } = useTheme();
  const { isOpen } = useSidebar();
  const navigate = useNavigate();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border h-16 flex items-center justify-between px-4 lg:px-6 transition-all duration-300",
        isOpen ? "lg:left-56" : "lg:left-16"
      )}
    >
      <div className="flex items-center gap-3">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className={cn(
              "flex items-center justify-center w-8 h-8 rounded-full",
              "bg-card/90 border border-border",
              "text-muted-foreground hover:text-foreground hover:bg-card",
              "transition-all duration-200 active:scale-95 flex-shrink-0"
            )}
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1">
          {title && (
            <h1 className="text-lg font-semibold text-foreground line-clamp-1">{title}</h1>
          )}
          {subtitle && (
            <p className="text-sm text-muted-foreground line-clamp-1">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4 text-muted-foreground" />
          <Switch checked={isDark} onCheckedChange={toggle} className="scale-75" />
          <Moon className="w-4 h-4 text-muted-foreground" />
        </div>

        <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <Bell className="w-5 h-5" />
        </button>

        <button className={cn("control-btn control-btn-emergency py-2 px-3 rounded-lg text-xs whitespace-nowrap")}>
          Emergency Stop
        </button>
      </div>
    </header>
  );
}