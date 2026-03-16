import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Layout } from "@/components/navigation/Layout";

interface PageWrapperProps {
  children: ReactNode;
}

const getPageInfo = (pathname: string) => {
  switch (pathname) {
    case "/":
      return { title: "Dashboard", subtitle: "Welcome to AgriControl" };
    case "/vehicle":
      return { title: "Vehicle Control", subtitle: "Harvester-01 • Model AX-500" };
    case "/task":
      return { title: "Task Management", subtitle: "Manage your field operations" };
    case "/task/create":
      return { title: "Create Task", subtitle: "Add a new field operation" };
    case "/fields":
      return { title: "Field Management", subtitle: "Manage your agricultural plots" };
    case "/fields/create":
      return { title: "Create Plot", subtitle: "Add a new field area" };
    case "/fields/plot-map":
      return { title: "Plot Mapping", subtitle: "Map your field boundaries" };
    default:
      if (pathname.startsWith("/task/edit/")) {
        return { title: "Edit Task", subtitle: "Modify task details" };
      }
      if (pathname.startsWith("/task/")) {
        return { title: "Task Details", subtitle: "View task information" };
      }
      return { title: "AgriControl", subtitle: "Field Command Hub" };
  }
};

export function PageWrapper({ children }: PageWrapperProps) {
  const location = useLocation();
  const { title, subtitle } = getPageInfo(location.pathname);

  return (
    <Layout>
      <div className="relative min-h-screen bg-background w-full">
        {children}
      </div>
    </Layout>
  );
}