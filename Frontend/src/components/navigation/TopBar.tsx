import { cn } from "@/lib/utils";
import { ArrowLeft, Bell, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSidebar } from "./SidebarContext";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  backTo?: string;
}

export function TopBar({ title, subtitle, backTo }: TopBarProps) {
  const { isDark, toggle } = useTheme();
  const { isOpen } = useSidebar();
  const navigate = useNavigate();
  const { notifications, unreadCount, dismissNotifications } = useNotifications();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [visibleNotifications, setVisibleNotifications] = useState<typeof notifications>([]);

  const unreadNotificationIds = useMemo(
    () => notifications.map((notification) => notification.id),
    [notifications]
  );

  useEffect(() => {
    if (!notificationOpen) {
      setVisibleNotifications([]);
    }
  }, [notificationOpen]);

  const handleNotificationToggle = (open: boolean) => {
    setNotificationOpen(open);

    if (open) {
      setVisibleNotifications(notifications);
      if (unreadNotificationIds.length > 0) {
        dismissNotifications(unreadNotificationIds);
      }
    }
  };

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

        <Popover open={notificationOpen} onOpenChange={handleNotificationToggle}>
          <PopoverTrigger asChild>
            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-danger text-danger-foreground text-[10px] font-semibold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[22rem] p-0 overflow-hidden">
            {/* <div className="border-b border-border px-4 py-3">
              <div className="text-sm font-semibold text-foreground">Notifications</div>
              <div className="text-xs text-muted-foreground">Unread alerts disappear after you open this panel.</div>
            </div> */}
            <div className="max-h-80 overflow-y-auto">
              {visibleNotifications.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground text-center">No unread notifications</div>
              ) : (
                visibleNotifications.map((notification, index) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "px-4 py-3",
                      index !== visibleNotifications.length - 1 && "border-b border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{notification.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>

        <button className={cn("control-btn control-btn-emergency py-2 px-3 rounded-lg text-xs whitespace-nowrap")}>
          Emergency Stop
        </button>
      </div>
    </header>
  );
}