import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/navigation/Layout";
import { SidebarProvider } from "@/components/navigation/SidebarContext";
import Dashboard from "./pages/Dashboard";
import Vehicle from "./pages/Vehicle";
import TaskList from "./pages/TaskList";
import TaskCreate from "./pages/TaskCreate";
import TaskDetail from "./pages/TaskDetail";
import Fields from "./pages/Fields";
import PlotCreate from "./pages/PlotCreate";
import PlotMapping from "./pages/PlotMapping";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vehicle" element={<Vehicle />} />
              <Route path="/task" element={<TaskList />} />
              <Route path="/task/create" element={<TaskCreate />} />
              <Route path="/task/edit/:id" element={<TaskCreate />} />
              <Route path="/task/:id" element={<TaskDetail />} />
              <Route path="/fields" element={<Fields />} />
              <Route path="/fields/create" element={<PlotCreate />} />
              <Route path="/fields/plot-map" element={<PlotMapping />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
