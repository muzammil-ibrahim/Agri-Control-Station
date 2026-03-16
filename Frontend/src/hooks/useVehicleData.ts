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

export function useVehicleData() {
  const [data, setData] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

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
              // close the socket so onclose handler triggers a reconnect attempt
              ws.close();
            }
          } catch (err) {
            console.error("Failed to parse vehicle data:", err);
            setError("Failed to parse vehicle data");
          }
        };

        ws.onerror = () => {
          setError("WebSocket connection error");
          setLoading(false);
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected, attempting to reconnect...");
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
      } catch (err) {
        console.error("WebSocket connection failed:", err);
        setError("Failed to connect to vehicle data stream");
        setLoading(false);
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
