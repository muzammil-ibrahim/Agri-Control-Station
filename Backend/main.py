from fastapi import FastAPI, WebSocket,WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from survey import  mavlink_logger
from fastapi.responses import JSONResponse
import threading
import asyncio
import json

from Vehicle_state import vehicle_state
from pixhawk_reader import PixhawkReader

app = FastAPI(title="AgriBot Vehicle Backend")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- REST ENDPOINT ----------------
@app.get("/vehicle")
async def get_vehicle_data():
    """
    Initial load for vehicle page
    """
    return vehicle_state


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

    pixhawk = PixhawkReader(vehicle_state)
    pixhawk.connect()

    asyncio.create_task(pixhawk.read_loop())



logging_active = False
logging_thread = None

# API endpoints for logging
@app.post("/start")
async def start_logging():
    global logging_active, logging_thread
    if logging_active:
        return JSONResponse({"status": "already_running"})

    logging_active = True
    logging_thread = threading.Thread(target=mavlink_logger, daemon=True)
    logging_thread.start()
    return {"status": "started"}

@app.post("/stop")
async def stop_logging():
    global logging_active
    logging_active = False
    return {"status": "stopped"}
