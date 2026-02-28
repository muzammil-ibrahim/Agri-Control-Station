from pydantic import BaseModel
from typing import Dict

class WheelData(BaseModel):
    rpm: float
    angle: float

class VehicleData(BaseModel):
    lat: float
    lon: float
    connected: bool
    speed: float
    heading: float

    gps_status: str
    vehicle_mode: str
    gnss_satellites: int
    camera: bool
    rc_connection: bool

    batteries: Dict[str, float]

    actuator_x: float
    actuator_y: float

    wheels: Dict[str, WheelData]

    four_ws_active: bool
