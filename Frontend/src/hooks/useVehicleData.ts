import { createContext, createElement, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export interface WheelData {
  rpm: number;
  angle: number;
}

export interface VehicleData {
  connected: boolean;
  speed: number;
  heading: number;
  lat?: number;
  lon?: number;
  x?: number;
  y?: number;
  gps_status: string;
  vehicle_mode: string;
  gnss_satellites: number;
  camera: boolean;
  rc_connection: boolean;
  batteries: Record<string, number>;
  actuator_x: number;
  actuator_y: number;
  wheels: Record<string, WheelData>;
  four_ws_active: boolean;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "ws://localhost:8000";

interface VehicleDataContextValue {
  data: VehicleData;
  yaw: number;
  tractorPos: { x: number; y: number };
  loading: boolean;
  error: string | null;
}

const VehicleDataContext = createContext<VehicleDataContextValue | undefined>(undefined);

const createDefaultVehicleData = (): VehicleData => ({
  connected: false,
  speed: 0,
  heading: 0,
  gps_status: "N/A",
  vehicle_mode: "N/A",
  gnss_satellites: 0,
  camera: false,
  rc_connection: false,
  batteries: {},
  actuator_x: 0,
  actuator_y: 0,
  wheels: {},
  four_ws_active: false,
});

export function VehicleDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<VehicleData>(createDefaultVehicleData());
  const [yaw, setYaw] = useState(0);
  const [tractorPos, setTractorPos] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isUnmountingRef = useRef(false);
  const disconnectStateRef = useRef<"connected" | "vehicle-disconnected" | "server-disconnected">("connected");
  const reconnectTimeoutRef = useRef<number | null>(null);
  const { addNotification } = useNotifications();

  const resetDataToDefaults = () => {
    setData(createDefaultVehicleData());
    setYaw(0);
    setTractorPos({ x: 0, y: 0 });
  };

  useEffect(() => {
    const connectWebSocket = () => {
      if (isUnmountingRef.current) {
        return;
      }

      try {
        const wsUrl = `${BACKEND_URL}/ws/vehicle`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WebSocket connected");
          setLoading(false);
        };

        ws.onmessage = (event) => {
          try {
            const vehicleData = JSON.parse(event.data);
            setData(vehicleData);
            setYaw(Number(vehicleData.heading) || 0);

            const nextX = Number(vehicleData.x);
            const nextY = Number(vehicleData.y);

            if (Number.isFinite(nextX) && Number.isFinite(nextY)) {
              setTractorPos({ x: nextX, y: nextY });
            } else {
              // Fallback if backend does not provide field-relative x/y in /ws/vehicle.
              setTractorPos({
                x: Number(vehicleData.lon) || 0,
                y: Number(vehicleData.lat) || 0,
              });
            }

            if (vehicleData.connected !== false) {
              setError(null);
              disconnectStateRef.current = "connected";
            }

            // if the backend reports the Pixhawk is disconnected, treat it
            // just like a websocket failure so the UI can show an error screen
            if (vehicleData.connected === false) {
              setError("Vehicle disconnected");
              if (disconnectStateRef.current !== "vehicle-disconnected") {
                addNotification({
                  title: "Vehicle disconnected",
                  message: "The vehicle connection was lost and telemetry was reset to default values.",
                  dedupeKey: "vehicle-disconnected",
                });
              }
              disconnectStateRef.current = "vehicle-disconnected";
              resetDataToDefaults();
              // close the socket so onclose handler triggers a reconnect attempt
              ws.close();
            }
          } catch (err) {
            console.error("Failed to parse vehicle data:", err);
            setError("Failed to parse vehicle data");
            if (disconnectStateRef.current !== "server-disconnected") {
              addNotification({
                title: "Server disconnected",
                message: "The backend stopped sending valid vehicle data and telemetry was reset.",
                dedupeKey: "server-disconnected",
              });
            }
            disconnectStateRef.current = "server-disconnected";
            resetDataToDefaults();
          }
        };

        ws.onerror = () => {
          setError("WebSocket connection error");
          setLoading(false);
          if (disconnectStateRef.current !== "server-disconnected") {
            addNotification({
              title: "Server disconnected",
              message: "The backend connection failed and telemetry was reset to default values.",
              dedupeKey: "server-disconnected",
            });
          }
          disconnectStateRef.current = "server-disconnected";
          resetDataToDefaults();
        };

        ws.onclose = () => {
          if (isUnmountingRef.current) {
            return;
          }

          console.log("WebSocket disconnected, attempting to reconnect...");
          if (disconnectStateRef.current !== "vehicle-disconnected") {
            if (disconnectStateRef.current !== "server-disconnected") {
              addNotification({
                title: "Server disconnected",
                message: "The backend connection was lost and telemetry was reset to default values.",
                dedupeKey: "server-disconnected",
              });
            }
            disconnectStateRef.current = "server-disconnected";
          }
          setError((prev) => prev ?? "Backend disconnected");
          setLoading(false);
          resetDataToDefaults();
          reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("WebSocket connection failed:", err);
        setError("Failed to connect to vehicle data stream");
        setLoading(false);
        if (disconnectStateRef.current !== "server-disconnected") {
          addNotification({
            title: "Server disconnected",
            message: "The backend could not be reached and telemetry was reset to default values.",
            dedupeKey: "server-disconnected",
          });
        }
        disconnectStateRef.current = "server-disconnected";
        resetDataToDefaults();
      }
    };

    connectWebSocket();

    return () => {
      isUnmountingRef.current = true;
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [addNotification]);

  return createElement(VehicleDataContext.Provider, { value: { data, yaw, tractorPos, loading, error } }, children);
}

export function useVehicleData() {
  const context = useContext(VehicleDataContext);

  if (!context) {
    throw new Error("useVehicleData must be used within a VehicleDataProvider");
  }

  return context;
}
