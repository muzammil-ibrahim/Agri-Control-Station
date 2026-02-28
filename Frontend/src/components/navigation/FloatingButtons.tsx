import { cn } from "@/lib/utils";
import { ArrowLeft, Home } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface FloatingButtonsProps {
  className?: string;
}

export function FloatingButtons({ className }: FloatingButtonsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isVehiclePage = location.pathname === "/" || location.pathname === "/vehicle";

  if (isVehiclePage) return null;

  return (
    <div className={cn("fixed top-4 left-4 z-50 flex gap-2", className)}>
      <button
        onClick={() => navigate(-1)}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          "bg-card/90 backdrop-blur-sm border border-border",
          "text-muted-foreground hover:text-foreground hover:bg-card",
          "transition-all duration-200 active:scale-95",
          "shadow-lg"
        )}
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => navigate("/")}
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-full",
          "bg-card/90 backdrop-blur-sm border border-border",
          "text-muted-foreground hover:text-foreground hover:bg-card",
          "transition-all duration-200 active:scale-95",
          "shadow-lg"
        )}
        aria-label="Go home"
      >
        <Home className="w-5 h-5" />
      </button>
    </div>
  );
}
