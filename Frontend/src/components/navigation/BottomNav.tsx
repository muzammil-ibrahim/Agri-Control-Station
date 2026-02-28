import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

interface BottomNavProps {
  items: NavItem[];
  className?: string;
}

export function BottomNav({ items, className }: BottomNavProps) {
  const location = useLocation();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-card/95 backdrop-blur-md border-t border-border",
        "safe-area-inset-bottom",
        className
      )}
    >
      <div className="flex items-center justify-around h-14 sm:h-16 w-full px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <RouterNavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-2 rounded-lg transition-all duration-200",
                "min-w-[56px] sm:min-w-[64px]",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon
                className={cn(
                  "w-4 sm:w-5 h-4 sm:h-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span
                className={cn(
                  "text-[8px] sm:text-[10px] uppercase tracking-wider font-medium",
                  isActive && "text-primary"
                )}
              >
                {item.label}
              </span>
            </RouterNavLink>
          );
        })}
      </div>
    </nav>
  );
}
