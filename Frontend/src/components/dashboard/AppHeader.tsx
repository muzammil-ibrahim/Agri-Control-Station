import { cn } from "@/lib/utils";
import { Bell, Sun, Moon } from "lucide-react";
import { ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/ui/switch";

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  leftContent?: ReactNode;
  extraButtons?: ReactNode;
}

export function AppHeader({ title, subtitle, leftContent, extraButtons }: AppHeaderProps) {
  const { isDark, toggle } = useTheme();

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 shrink-0 gap-3 sm:gap-0">
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {/* {leftContent || (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-[10px] sm:text-xs font-bold">AC</span>
          </div>
        )} */}
        <div className="flex-1 sm:flex-none">
          <h1 className="text-base sm:text-lg font-semibold text-foreground line-clamp-1">{title}</h1>
          {subtitle && <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
        <div className="flex items-center gap-1 mr-1">
          <Sun className="w-3.5 h-3.5 text-muted-foreground" />
          <Switch checked={isDark} onCheckedChange={toggle} className="scale-75" />
          <Moon className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <button className="p-2 sm:p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0">
          <Bell className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
        {extraButtons}
        <button className={cn("control-btn control-btn-emergency py-1.5 sm:py-2 px-2 sm:px-3 rounded-lg text-[10px] sm:text-xs whitespace-nowrap")}>
          Emergency Stop
        </button>
      </div>
    </header>
  );
}
