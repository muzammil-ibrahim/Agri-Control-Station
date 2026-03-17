import { useState, useEffect, useRef } from "react";

export interface WheelData {
  rpm: number;
  angle: number;
}

export interface VehicleData {
  connected: boolean;
  speed: number;
  heading: number;
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

export function useVehicleData() {
  const [data, setData] = useState<VehicleData>(createDefaultVehicleData());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const resetDataToDefaults = () => {
    setData(createDefaultVehicleData());
  };

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const wsUrl = `${BACKEND_URL}/ws/vehicle`;
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log("WebSocket connected");
          setLoading(false);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const vehicleData = JSON.parse(event.data);
            setData(vehicleData);

            // if the backend reports the Pixhawk is disconnected, treat it
            // just like a websocket failure so the UI can show an error screen
            if (vehicleData.connected === false) {
              setError("Vehicle disconnected");
              resetDataToDefaults();
              // close the socket so onclose handler triggers a reconnect attempt
              ws.close();
            }
          } catch (err) {
            console.error("Failed to parse vehicle data:", err);
            setError("Failed to parse vehicle data");
            resetDataToDefaults();
          }
        };

        ws.onerror = () => {
          setError("WebSocket connection error");
          setLoading(false);
          resetDataToDefaults();
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected, attempting to reconnect...");
          setError((prev) => prev ?? "Backend disconnected");
          setLoading(false);
          resetDataToDefaults();
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("WebSocket connection failed:", err);
        setError("Failed to connect to vehicle data stream");
        setLoading(false);
        resetDataToDefaults();
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return { data, loading, error };
}
