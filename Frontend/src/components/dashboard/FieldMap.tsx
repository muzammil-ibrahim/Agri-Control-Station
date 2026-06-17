import React, { useEffect, useRef, useState } from "react";
import tractorTop from "../../assets/TractorTop.png";

interface MapPoint {
  id: string;
  x: number;
  y: number;
}

interface LatLngPoint {
  id: string;
  latitude: number;
  longitude: number;
}

interface FieldMapProps {
  geofence: MapPoint[];
  route?: MapPoint[];
  points?: MapPoint[];
  geofenceLatLng?: LatLngPoint[];
  routeLatLng?: LatLngPoint[];
  tractorPos?: { x: number; y: number };
  yaw?: number;
  showControls?: boolean;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  geofence,
  route,
  points = [],
  geofenceLatLng: _geofenceLatLng = [],
  routeLatLng: _routeLatLng = [],
  tractorPos = { x: 0, y: 0 },
  yaw = 0,
  showControls = false,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const FRAME_W = 900;
  const FRAME_H = 600;
  const routePoints = route || points;

  useEffect(() => {
    if (geofence.length > 0) {
      const xs = geofence.map((p) => p.x);
      const ys = geofence.map((p) => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const width = maxX - minX || 1;
      const height = maxY - minY || 1;

      const scaleX = FRAME_W / Math.max(1, width);
      const scaleY = FRAME_H / Math.max(1, height);
      const scale = Math.min(scaleX, scaleY) * 0.8;

      setZoom(scale);
    }
  }, [geofence]);

  function polygonPath(pointsArr: MapPoint[]): string {
    if (!pointsArr.length) return "";
    return pointsArr.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
  }

  function linePath(pointsArr: MapPoint[]): string {
    if (!pointsArr.length) return "";
    return pointsArr.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  }

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom((z) => Math.max(0.1, Math.min(10, z * delta)));
    };

    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, []);

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const startX = e.clientX - pan.x;
    const startY = e.clientY - pan.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setPan({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div className="relative w-full h-full bg-muted/30 rounded-lg overflow-hidden border border-border flex flex-col">
      <svg
        width="100%"
        height="100%"
        style={{ background: "#e5e7eb", cursor: "grab" }}
        onMouseDown={handleMouseDown}
        className="overflow-hidden"
        ref={svgRef}
      >
        <g
          transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}
          style={{ transformOrigin: "0 0" }}
        >
          {geofence.length > 0 && (
            <path
              d={polygonPath(geofence)}
              fill="#d1fae5"
              stroke="#065f46"
              strokeWidth={2 / zoom}
            />
          )}

          {routePoints.length > 1 && (
            <path
              d={linePath(routePoints)}
              fill="none"
              stroke="#5267ff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </g>

        <g transform={`translate(${pan.x + tractorPos.x * zoom}, ${pan.y + tractorPos.y * zoom}) rotate(${yaw + 90})`}>
          <image href={tractorTop} x={-15} y={-15} width="30" height="30" />
        </g>
      </svg>

      {showControls && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-600 bg-white/80 px-2 py-1 rounded">
          Zoom: {(zoom * 100).toFixed(0)}% - Scroll to zoom - Drag to pan
        </div>
      )}
    </div>
  );
};
