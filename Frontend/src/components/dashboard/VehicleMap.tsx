import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useEffect, useRef, useState,useMemo } from "react";
import L, { LatLngExpression } from "leaflet";
import vehicleIconImg from "@/assets/vehicle.png";
import "leaflet/dist/leaflet.css";




type MoveMapProps = {
  position: LatLngExpression;
};

function MoveMap({ position }: MoveMapProps) {
  const map = useMap();

  useEffect(() => {
    map.setView(position);
  }, [position, map]);

  return null;
}


export default function VehicleMap() {
  const markerRef = useRef<L.Marker<any> | null>(null);

  const [mapType, setMapType] = useState<"street" | "satellite">("satellite");
  const [heading, setHeading] = useState(0);

  const [position, setPosition] = useState<[number, number]>([
    17.397065, 78.490267,
    ]);

  const createVehicleIcon = (currentHeading: number) => {
    return L.divIcon({
      className: "vehicle-icon",
      html: `
        <div style="
          width:40px;
          height:40px;
          transform: rotate(${currentHeading}deg);
          transform-origin: center;
          transition: transform 0.15s linear;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <img src="${vehicleIconImg}" style="width:100%;height:100%;object-fit: contain;" />
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  };

  const vehicleIcon = useMemo(() => {
    return createVehicleIcon(heading);
  }, [heading]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setIcon(vehicleIcon);
      //console.log("Icon updated with heading:", heading);
    } else {
      //console.log("Marker ref not ready yet");
    }
  }, [vehicleIcon]);


  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/vehicle");

    ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // console.log("WebSocket data received:", data);

    // Always update heading
    if (data.heading !== undefined) {
      setHeading(data.heading);
      //console.log("Heading set to:", data.heading);
    }

    // Only update position with valid coordinates (not 0,0)
    if (data.lat !== undefined && data.lon !== undefined && (data.lat !== 0 || data.lon !== 0)) {
      const newPos: LatLngExpression = [data.lat, data.lon];
      setPosition(newPos);

      if (markerRef.current) {
        markerRef.current.setLatLng(newPos);
      }
    }
  };
}, []);



  const tileUrl =
  mapType === "street"
    ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";


  return (
    <div className="relative h-full w-full">

        <MapContainer 
        center={position}
        zoom={19}
        className="h-full w-full"
        >
        <TileLayer url={tileUrl} />

        <MoveMap position={position} />

        <Marker
            ref={markerRef}
            position={position}
            icon={vehicleIcon}
        />
        </MapContainer>

        {/* Toggle Button */}
        <button
            onClick={() =>
            setMapType(mapType === "street" ? "satellite" : "street")
            }
            className="
            absolute
            bottom-4
            right-4
            z-[1000]
            bg-background
            px-3 py-2
            rounded-lg
            shadow-md
            text-sm
            text-foreground
            "
        >
            {mapType === "street" ? "Satellite" : "Street"}
        </button>
    </div>
  );
}
