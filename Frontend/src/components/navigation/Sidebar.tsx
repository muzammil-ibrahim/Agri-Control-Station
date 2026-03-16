import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Map,
  Target,
  Leaf,
  DollarSign,
  BarChart3,
  FileText,
  Users,
  Settings,
  Award,
  ChevronDown,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path?: string;
  badge?: string;
  submenu?: NavItem[];
}

const navigationItems: NavItem[] = [
  { label: "Vehicle", icon: <Map className="w-5 h-5" />, path: "/Vehicle" },
  { label: "Tasks", icon: <Target className="w-5 h-5" />, path: "/task" },
  { label: "Fields", icon: <Leaf className="w-5 h-5" />, path: "/fields" },

  { label: "Documents", icon: <FileText className="w-5 h-5" />, path: "#" },
  {
    label: "Inventory",
    icon: <Users className="w-5 h-5" />,
    path: "#",
    badge: "Beta",
  },
  { label: "Farm settings", icon: <Settings className="w-5 h-5" />, path: "#" },
];

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebar();

  const isActive = (path?: string) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  const handleLinkClick = () => {
    setIsMobileOpen(false);
  };

  const renderMenuItem = (item: NavItem, depth = 0) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const active = isActive(item.path);
    const isExpanded = expandedMenu === item.label;

    return (
      <div key={item.label}>
        {hasSubmenu ? (
          <button
            onClick={() =>
              setExpandedMenu(isExpanded ? null : item.label)
            }
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors",
              isOpen ? "hover:bg-sidebar-accent" : "hover:bg-sidebar-accent/50",
              depth > 0 && "pl-6"
            )}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-sidebar-foreground/60">{item.icon}</span>
              {isOpen && <span className="text-sm text-sidebar-foreground">{item.label}</span>}
              {isOpen && item.badge && (
                <span className="text-xs bg-warning text-warning-foreground px-2 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </div>
            {isOpen && (
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-sidebar-foreground/60 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            )}
          </button>
        ) : (
          <Link
            to={item.path || "#"}
            onClick={handleLinkClick}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors",
              isOpen ? "hover:bg-sidebar-accent" : "hover:bg-sidebar-accent/50",
              active && "bg-sidebar-primary/20 text-sidebar-primary",
              !active && "text-sidebar-foreground hover:text-sidebar-foreground",
              depth > 0 && "pl-6"
            )}
          >
            <span className="text-current">{item.icon}</span>
            {isOpen && (
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.label}</span>
                {item.badge && (
                  <span className="text-xs bg-warning text-warning-foreground px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </Link>
        )}

        {hasSubmenu && isExpanded && isOpen && (
          <div className="pl-4 space-y-1">
            {item.submenu!.map((subitem) => renderMenuItem(subitem, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 hover:bg-sidebar-accent rounded-lg bg-sidebar text-sidebar-foreground"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[35] lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40",
          "flex flex-col",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isOpen ? "w-56" : "w-16"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-sidebar-border">
          <Link
            to="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 bg-sidebar-primary rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-bold text-xs">AC</span>
            </div>
            {isOpen && <span className="font-semibold text-sidebar-foreground text-sm">AgriControl</span>}
          </Link>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 hover:bg-sidebar-accent rounded-lg text-sidebar-foreground/60 hover:text-sidebar-foreground ml-auto"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                !isOpen && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navigationItems.map((item) => renderMenuItem(item))}
        </nav>

        {/* Footer */}
        {/* <div className="border-t border-slate-700 p-4">
          {isOpen && (
            <div className="text-xs text-slate-400">
              <p></p>
            </div>
          )}
        </div> */}
      </aside>
    </>
  );
}
