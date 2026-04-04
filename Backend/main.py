from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
import threading
import asyncio
import json
import os
import csv
import time
import math
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional

from Vehicle_state import vehicle_state
from pixhawk_reader import PixhawkReader
from mission_utils import generate_mission_points, convert_points_to_latlon, clear_csv_files
from csv_utils import CSVDataLogger, haversine
from mission_utils import Transformer, get_epsg_code
from database import init_db, apply_schema_patches
from api_routes import router as api_router


# ============================================
# Configuration
# ============================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DATA_DIR = os.path.join(BASE_DIR, "CSV_data")
os.makedirs(CSV_DATA_DIR, exist_ok=True)

GEOFENCE_INPUT_PATH = os.path.join(CSV_DATA_DIR, "geofence.csv")
GEOFENCE_OUTPUT_PATH = os.path.join(CSV_DATA_DIR, "geofence_converted.csv")
POINTS_OUTPUT_PATH = os.path.join(CSV_DATA_DIR, "points_converted.csv")
POINTS_LATLON_PATH = os.path.join(CSV_DATA_DIR, "points_latlon.csv")

DIST_THRESHOLD = 1.0  # meters for logging waypoints
UPDATE_FREQ = 0.1  # seconds

# Global state
logging_active = False
logging_thread = None
connected_clients: List[WebSocket] = []

# Current vehicle state
current_state: Dict = {
    "lat": None,
    "lon": None,
    "yaw": None,
    "h_acc": None,
    "fix_type": None,
    "timestamp": None,
}

app = FastAPI(title="AgriBot Vehicle Backend")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:8080",
        "http://0.0.0.0:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router)

# ============================================
# Mission Generation Endpoints
# ============================================
@app.get("/generate")
async def generate_points(
    col_spacing_ft: float = Query(4),
    row_spacing_ft: float = Query(10),
    border_margin_ft: float = Query(4)
):
    """
    Generate mission waypoint grid from geofence.
    
    Args:
        col_spacing_ft: Column spacing in feet
        row_spacing_ft: Row spacing in feet
        border_margin_ft: Border margin from geofence edge in feet
    """
    result = generate_mission_points(
        geofence_path=GEOFENCE_INPUT_PATH,
        col_spacing_ft=col_spacing_ft,
        row_spacing_ft=row_spacing_ft,
        border_margin_ft=border_margin_ft,
        output_points_path=POINTS_OUTPUT_PATH,
        output_geofence_path=GEOFENCE_OUTPUT_PATH
    )
    return result


@app.post("/convert_to_latlon")
async def convert_to_latlon():
    """Convert generated waypoints back to lat/lon coordinates."""
    try:
        if not os.path.exists(GEOFENCE_INPUT_PATH):
            return {"status": "error", "message": "Geofence file not found"}
        if not os.path.exists(POINTS_OUTPUT_PATH):
            return {"status": "error", "message": "Points file not found"}
        
        df = convert_points_to_latlon(
            geofence_path=GEOFENCE_INPUT_PATH,
            points_path=POINTS_OUTPUT_PATH,
            output_path=POINTS_LATLON_PATH
        )
        return {
            "status": "success",
            "total_points": len(df),
            "points": df.to_dict(orient="records")
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ============================================
# CSV Management Endpoints
# ============================================
@app.get("/clear-csv")
async def clear_csv():
    """Clear all mission-related CSV files."""
    try:
        clear_csv_files([
            GEOFENCE_OUTPUT_PATH,
            POINTS_OUTPUT_PATH,
            POINTS_LATLON_PATH
        ])
        return {"status": "success", "message": "CSV files cleared"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/get_csv")
async def get_geofence_csv():
    """Get geofence coordinates in field-relative coordinates."""
    if not os.path.exists(GEOFENCE_OUTPUT_PATH):
        return {"status": "error", "message": "File not found"}
    return FileResponse(
        path=GEOFENCE_OUTPUT_PATH,
        media_type="text/csv",
        filename="geofence_converted.csv",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )


@app.get("/get_csv1")
async def get_points_csv():
    """Get mission waypoints in field-relative coordinates."""
    if not os.path.exists(POINTS_OUTPUT_PATH):
        return {"status": "error", "message": "File not found"}
    return FileResponse(
        path=POINTS_OUTPUT_PATH,
        media_type="text/csv",
        filename="points_converted.csv",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )


@app.get("/get_csv2")
async def get_geofence_original():
    """Get original geofence coordinates in lat/lon."""
    if not os.path.exists(GEOFENCE_INPUT_PATH):
        return {"status": "error", "message": "File not found"}
    return FileResponse(
        path=GEOFENCE_INPUT_PATH,
        media_type="text/csv",
        filename="geofence.csv",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )


@app.get("/get_csv3")
async def get_points_latlon():
    """Get mission waypoints in lat/lon coordinates."""
    if not os.path.exists(POINTS_LATLON_PATH):
        return {"status": "error", "message": "File not found"}
    return FileResponse(
        path=POINTS_LATLON_PATH,
        media_type="text/csv",
        filename="points_latlon.csv",
        headers={"Cache-Control": "no-cache, no-store, must-revalidate"}
    )


# ---------------- WEBSOCKET REALTIME ----------------
@app.websocket("/ws/vehicle")
async def vehicle_ws(websocket: WebSocket):
    await websocket.accept()

    try:
        while True:
            await websocket.send_text(vehicle_state.json())
            await asyncio.sleep(0.1)   # 10 Hz update rate

    except WebSocketDisconnect:
        print("WebSocket disconnected")
    
    except Exception as e:
        print(f"WebSocket error: {e}")

@app.on_event("startup")
async def startup_event():
    global pixhawk
    
    # Initialize database tables
    init_db()
    apply_schema_patches()
    print("Database initialized successfully")

    pixhawk = PixhawkReader(vehicle_state)
    asyncio.create_task(pixhawk.read_loop())




# ============================================
# Vehicle Data Endpoints
# ============================================
@app.get("/api/vehicle")
async def get_vehicle_data():
    """Get current vehicle state."""
    return vehicle_state


# ============================================
# Data Logging Endpoints
# ============================================
def mavlink_logger_worker():
    """Background worker for logging MAVLink position data."""
    global logging_active
    
    # Start a fresh logging session in geofence.csv
    csv_logger = CSVDataLogger(GEOFENCE_INPUT_PATH, reset=True)
    last_lat, last_lon = None, None
    point_count = 0
    
    while logging_active:
        lat = getattr(vehicle_state, "lat", None)
        lon = getattr(vehicle_state, "lon", None)
        fix_quality = getattr(vehicle_state, "gps_status", "")
        
        if lat is None or lon is None:
            time.sleep(0.5)
            continue
        
        timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Log if distance threshold exceeded
        if last_lat is None or haversine(last_lat, last_lon, lat, lon) >= DIST_THRESHOLD:
            point_count += 1
            label = f"P{point_count}"
            csv_logger.log_point(
                lat=lat,
                lon=lon,
                label=label,
                timestamp=timestamp,
                fix_quality=fix_quality,
                h_accuracy=None
            )
            print(f"Logged {label}: {lat}, {lon}, fix={fix_quality}")
            last_lat, last_lon = lat, lon
        
        time.sleep(0.5)
    
    print("Logging stopped.")


@app.post("/api/start")
async def start_logging():
    """Start logging vehicle position data."""
    global logging_active, logging_thread
    
    if logging_active:
        return {"status": "already_running"}
    
    logging_active = True
    logging_thread = threading.Thread(target=mavlink_logger_worker, daemon=True)
    logging_thread.start()
    return {"status": "started"}


@app.post("/api/stop")
async def stop_logging():
    """Stop logging vehicle position data."""
    global logging_active, logging_thread
    logging_active = False

    if logging_thread and logging_thread.is_alive():
        logging_thread.join(timeout=2.0)
    logging_thread = None

    return {"status": "stopped"}


# ============================================
# WebSocket Endpoints - Real-time Data
# ============================================
@app.websocket("/ws/vehicle")
async def vehicle_ws(websocket: WebSocket):
    """WebSocket for vehicle state updates."""
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        while True:
            await websocket.send_text(vehicle_state.json())
            await asyncio.sleep(UPDATE_FREQ)
    except WebSocketDisconnect:
        if websocket in connected_clients:
            connected_clients.remove(websocket)
        print("Vehicle WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in connected_clients:
            connected_clients.remove(websocket)


@app.websocket("/ws/location")
async def websocket_location(websocket: WebSocket):
    """
    WebSocket for real-time vehicle location.
    Sends field-relative XY coordinates based on geofence reference.
    """
    await websocket.accept()
    
    try:        
        transformer = None
        ref_x, ref_y = 0, 0
        
        if os.path.exists(GEOFENCE_INPUT_PATH):
            try:
                df_geofence = pd.read_csv(GEOFENCE_INPUT_PATH)
                if not df_geofence.empty:
                    mean_lon = df_geofence["longitude"].mean()
                    mean_lat = df_geofence["latitude"].mean()
                    epsg_code = get_epsg_code(mean_lat, mean_lon)
                    
                    transformer = Transformer.from_crs("EPSG:4326", epsg_code, always_xy=True)
                    
                    ref_lat = df_geofence["latitude"].min()
                    ref_lon = df_geofence["longitude"].min()
                    ref_x, ref_y = transformer.transform(ref_lon, ref_lat)
            except Exception as e:
                print(f"Error loading geofence: {e}")
        
        # Send position updates
        while True:
            lat = current_state.get("lat")
            lon = current_state.get("lon")
            
            if lat is None or lon is None:
                await asyncio.sleep(UPDATE_FREQ)
                continue
            
            # Transform to field-relative coordinates if transformer available
            if transformer:
                x_m, y_m = transformer.transform(lon, lat)
                x_ref = (x_m - ref_x) * 100
                y_ref = (y_m - ref_y) * 100
            else:
                x_ref = lon
                y_ref = lat
            
            data = {"x": x_ref, "y": y_ref}
            await websocket.send_json(data)
            await asyncio.sleep(UPDATE_FREQ)
    
    except Exception as e:
        print(f"Location WebSocket error: {e}")
    finally:
        print("Location WebSocket disconnected")


@app.websocket("/ws/yaw")
async def websocket_yaw(websocket: WebSocket):
    """WebSocket for vehicle heading/yaw."""
    await websocket.accept()
    
    try:
        while True:
            yaw = current_state.get("yaw")
            if yaw is not None:
                # Convert radians to degrees if needed
                yaw_deg = math.degrees(yaw) if yaw < 2 * math.pi else yaw
                await websocket.send_json({"yaw": yaw_deg})
            await asyncio.sleep(UPDATE_FREQ)
    except WebSocketDisconnect:
        print("Yaw WebSocket disconnected")
    except Exception as e:
        print(f"Yaw WebSocket error: {e}")

@app.get("/api/geofence")
async def get_geofence():
    """Return list of geofence points read from CSV file."""
    points = []
    try:
        if os.path.exists(GEOFENCE_INPUT_PATH):
            with open(GEOFENCE_INPUT_PATH, newline="") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # skip rows without lat/lng
                    lat = row.get("latitude") or row.get("lat")
                    lng = row.get("longitude") or row.get("lng")
                    label = row.get("label", "")
                    if lat and lng:
                        points.append({"latitude": lat, "longitude": lng, "label": label})
    except Exception as e:
        print(f"Error reading geofence CSV: {e}")
    return points

# ---------- SERVE FRONTEND BUILD ----------
# Get the path to the dist folder
dist_dir = os.path.join(os.path.dirname(__file__), "..", "Frontend", "dist")

# Mount the static files (assets, favicon, etc.)
app.mount("/assets", StaticFiles(directory=os.path.join(dist_dir, "assets")), name="assets")

# Serve index.html for SPA routing (catch-all route for non-API paths)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve index.html for all non-API routes to support SPA routing"""
    # If the path is for an API endpoint, let it through to the API handlers
    if full_path.startswith("api/") or full_path.startswith("ws/"):
        return JSONResponse({"error": "Not Found"}, status_code=404)
    
    index_path = os.path.join(dist_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return JSONResponse({"error": "Frontend build not found"}, status_code=404)
