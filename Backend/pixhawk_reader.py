#  This code is responsible for reading telemetry data from a Pixhawk flight controller using the MAVLink protocol.
# It establishes a connection to the Pixhawk, listens for various telemetry messages, and updates the vehicle state accordingly. 
# The code handles connection management, message parsing, and provides mechanisms for handling specific telemetry data such as wheel speeds, angles, and seedling increments. 
# It also includes functionality to manage mission transfers and ensure thread-safe access to the Pixhawk connection.
#  It manages the battery status, GPS data, IR count of seedlings.


from pymavlink import mavutil
import threading
import asyncio
import struct
import time
import re
from typing import Callable, Optional

PIXHAWK_PORT = "COM3"
BAUDRATE = 57600

_shared_master = None
_mission_transfer_in_progress = False
_connection_lock = threading.RLock()
_seedling_increment_handler: Optional[Callable[[int, Optional[str]], None]] = None


def set_shared_master(master):
    global _shared_master
    _shared_master = master


def get_shared_master():
    return _shared_master


def set_mission_transfer_in_progress(value: bool):
    global _mission_transfer_in_progress
    _mission_transfer_in_progress = value


def is_mission_transfer_in_progress():
    return _mission_transfer_in_progress


def get_connection_lock():
    return _connection_lock


def register_seedling_increment_handler(handler: Callable[[int, Optional[str]], None]):
    global _seedling_increment_handler
    _seedling_increment_handler = handler

# Sensor tunnel constants (must match onboard firmware)
SENSOR_PAYLOAD_TYPE = 32800
SENSOR_FMT = '<ffffffffffff'   # 12 floats: wheel_speeds[4], mag_angles[4], mag_rpms[4]
WHEEL_KEYS = ['front_left', 'front_right', 'rear_left', 'rear_right']

wheel_map = {
    "FL": "front_left",
    "FR": "front_right",
    "RL": "rear_left",
    "RR": "rear_right"
}

GPS_FIX_MAP = {
    0: "No GPS",
    1: "No Fix",
    2: "2D Fix",
    3: "3D Fix",
    4: "DGPS",
    5: "RTK Float",
    6: "RTK Fixed"
}


class PixhawkReader:
 
    def __init__(self, vehicle_state):
        self.vehicle_state = vehicle_state
        self.master = None
        self.last_rc_update = 0
        self.connected = False
        self.last_seedling_telemetry_totals = {}

    def _emit_seedling_increment(self, delta: int, sensor_id: Optional[str] = None):
        if delta <= 0:
            return
        if _seedling_increment_handler is None:
            return
        try:
            _seedling_increment_handler(delta, sensor_id)
        except Exception as e:
            print(f"Seedling increment handler error: {e}")

    def _handle_named_value_seedling(self, name: str, value: float):
        normalized_name = name.strip().upper()
        sensor_id: Optional[str] = None

        ir_break_match = re.fullmatch(r"IR([A-Z0-9]+)_BREAK", normalized_name)
        ir_count_match = re.fullmatch(r"IR([A-Z0-9]+)_COUNT", normalized_name)
        ir_count_suffix_match = re.fullmatch(r"IR_COUNT_([A-Z0-9]+)", normalized_name)

        if ir_break_match:
            sensor_id = ir_break_match.group(1)
            normalized_name = "IR_BREAK"
        elif ir_count_match:
            sensor_id = ir_count_match.group(1)
            normalized_name = "IR_COUNT"
        elif ir_count_suffix_match:
            sensor_id = ir_count_suffix_match.group(1)
            normalized_name = "IR_COUNT"

        # Increment-style telemetry: each message is the increment to apply.
        if normalized_name in {"SEEDLING_INC", "SEEDLING_DROP", "IR_BREAK"}:
            delta = int(round(value))
            if delta > 0:
                sensor_label = sensor_id if sensor_id is not None else "default"
                print(f"[SEEDLING] Telemetry {normalized_name}={value} sensor={sensor_label} -> delta={delta}")
                self._emit_seedling_increment(delta, sensor_id)
            return True

        # Counter-style telemetry: message carries total break-beam count.
        # IR_COUNT is sent by Backend/test/IR_BB_SerToMav.py.
        if normalized_name in {"SEEDLING_COUNT", "IR_BREAK_COUNT", "IR_COUNT"}:
            current_total = int(round(value))
            source_key = sensor_id if sensor_id is not None else "default"

            if source_key not in self.last_seedling_telemetry_totals:
                self.last_seedling_telemetry_totals[source_key] = current_total
                print(f"[SEEDLING] Baseline {normalized_name}={current_total} sensor={source_key}")
                return True

            delta = current_total - self.last_seedling_telemetry_totals[source_key]
            self.last_seedling_telemetry_totals[source_key] = current_total
            if delta > 0:
                sensor_label = sensor_id if sensor_id is not None else "default"
                print(f"[SEEDLING] Telemetry {normalized_name}={current_total} sensor={sensor_label} -> delta={delta}")
                self._emit_seedling_increment(delta, sensor_id)
            return True

        return False

    async def connect(self):

        while True:
            try:
                print("Connecting to Pixhawk...")

                self.master = mavutil.mavlink_connection(
                    PIXHAWK_PORT,
                    baud=BAUDRATE
                )

                self.master.wait_heartbeat(timeout=5)

                print("✅ Pixhawk Connected")
                            # 🔥 Request BATTERY_STATUS messages
                self.master.mav.command_long_send(
                    self.master.target_system,
                    self.master.target_component,
                    mavutil.mavlink.MAV_CMD_SET_MESSAGE_INTERVAL, 
                    0,
                    mavutil.mavlink.MAVLINK_MSG_ID_BATTERY_STATUS,
                    1000000,  # 1 second
                    0,0,0,0,0
                )

                print("🔋 Requested BATTERY_STATUS stream") 
                self.connected = True
                set_shared_master(self.master)
                # update shared state so frontend knows we're connected
                try:
                    self.vehicle_state.connected = True
                except Exception:
                    pass
                return

            except Exception as e:
                print(f"❌ Pixhawk not found: {e}")
                self.connected = False
                set_shared_master(None)
                # inform frontend we are disconnected
                try:
                    self.vehicle_state.connected = False
                except Exception:
                    pass
                await asyncio.sleep(3)   # wait before retry

    async def read_loop(self):

        while True:

            # ---------------- CONNECT IF NOT CONNECTED ----------------
            if not self.connected:
                await self.connect()

            if is_mission_transfer_in_progress():
                await asyncio.sleep(0.05)
                continue

            try:
                with _connection_lock:
                    msg = self.master.recv_match(blocking=False)

                if msg is None:
                    await asyncio.sleep(0.01)
                    continue

                msg_type = msg.get_type()

                # ---------------- VFR_HUD ----------------
                if msg_type == "VFR_HUD":
                    self.vehicle_state.heading = msg.heading
                    self.vehicle_state.speed = round(msg.groundspeed * 3.6, 2)

                # ---------------- GPS ----------------
                elif msg_type == "GPS_RAW_INT":
                    self.vehicle_state.gnss_satellites = msg.satellites_visible
                    self.vehicle_state.gps_status = GPS_FIX_MAP.get(
                        msg.fix_type, "Unknown"
                    )

                # ---------------- HEARTBEAT ----------------
                elif msg_type == "HEARTBEAT":
                    self.vehicle_state.vehicle_mode = self.master.flightmode


                 # ---------------- Location ----------------
                elif msg_type == "GLOBAL_POSITION_INT":
                    self.vehicle_state.lat = msg.lat / 1e7
                    self.vehicle_state.lon = msg.lon / 1e7

                # ---------------- Battery ----------------
                elif msg_type == "BATTERY_STATUS":

                    battery_id = msg.id
                    voltage_raw = msg.voltages[0]

                    # If telemetry sends 0 or invalid voltage
                    if voltage_raw <= 0:
                        voltage = 0
                    else:
                        voltage = voltage_raw / 1000.0

                    self.vehicle_state.batteries[f"B{battery_id}"] = voltage
                
                # ---------------- RC CONNECTION ----------------
                elif msg_type == "RC_CHANNELS":

                    self.last_rc_update = time.time()

                    if msg.rssi > 0:
                        self.vehicle_state.rc_connection = True
                
                # ---------------- (wheel/sensor data) ----------------
                elif msg_type in ("NAMED_VALUE_FLOAT", "NAMED_VALUE_INT"):

                    try:
                        if isinstance(msg.name, bytes):
                            name = msg.name.decode(errors='ignore').strip('\x00')
                        else:
                            name = msg.name.strip('\x00')
                        raw_value = float(msg.value)
                        value = round(raw_value, 2)

                        if self._handle_named_value_seedling(name, raw_value):
                            continue

                        parts = name.split("_") 

                        if len(parts) != 2:
                            continue

                        wheel_code, data_type = parts

                        if wheel_code not in wheel_map:
                            continue

                        wheel_key = wheel_map[wheel_code]

                        if data_type == "RPM":
                            self.vehicle_state.wheels[wheel_key].rpm = value

                        elif data_type == "ANG":
                            self.vehicle_state.wheels[wheel_key].angle = value

                    except Exception as e:
                        print("Sensor parse error:", e)


                # RC timeout detection
                if time.time() - self.last_rc_update > 1.0:
                    self.vehicle_state.rc_connection = False


            except Exception as e:
                print("⚠️ Connection lost:", e)
                self.connected = False
                set_shared_master(None)
                # signal disconnected state to frontend
                try:
                    self.vehicle_state.connected = False
                except Exception:
                    pass
                self.master = None
                await asyncio.sleep(2)

            await asyncio.sleep(0.01)
