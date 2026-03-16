import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { useSidebar } from "./SidebarContext";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

interface PageMeta {
  title: string;
  subtitle: string;
  backTo?: string;
}

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case "/":
      return { title: "Dashboard", subtitle: "Welcome to AgriControl" } as PageMeta;
    case "/vehicle":
      return { title: "Vehicle Control", subtitle: "Harvester-01 • Model AX-500" } as PageMeta;
    case "/task":
      return { title: "Task Management", subtitle: "Manage your agricultural tasks" } as PageMeta;
    case "/task/create":
      return {
        title: "Create Task",
        subtitle: "Add a new field operation",
        backTo: "/task",
      } as PageMeta;
    case "/fields":
      return {
        title: "Field Management",
        subtitle: "Monitor and manage your fields",
      } as PageMeta;
    case "/fields/create":
      return {
        title: "Create Plot",
        subtitle: "Add a new field area",
        backTo: "/fields",
      } as PageMeta;
    case "/fields/plot-map":
      return {
        title: "Plot Mapping",
        subtitle: "Map your field boundaries",
        backTo: "/fields/create",
      } as PageMeta;
    default:
      if (pathname.startsWith("/task/edit/")) {
        return {
          title: "Edit Task",
          subtitle: "Modify task details",
          backTo: "/task",
        } as PageMeta;
      }
      if (pathname.startsWith("/task/")) {
        return {
          title: "Task Details",
          subtitle: "View and edit task information",
          backTo: "/task",
        } as PageMeta;
      }
      return { title: "AgriControl", subtitle: "Agricultural Control System" } as PageMeta;
  }
};

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { title, subtitle, backTo } = getPageTitle(location.pathname);
  const { isOpen } = useSidebar();

  return (
    <div className="flex relative min-h-screen">
      <Sidebar />
      <TopBar title={title} subtitle={subtitle} backTo={backTo} />
      <main className={cn(
        "flex-1 w-full pt-16 transition-all duration-300",
        isOpen ? "lg:ml-56" : "lg:ml-16"
      )}>
        {children}
      </main>
    </div>
  );
}
