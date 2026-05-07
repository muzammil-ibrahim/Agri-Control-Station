import serial
import time
import argparse
import re
from pymavlink import mavutil

parser = argparse.ArgumentParser(description="Arduino IR trigger -> MAVLink bridge")
parser.add_argument("--arduino-port", default="COM7", help="Arduino serial port")
parser.add_argument("--arduino-baud", type=int, default=115200, help="Arduino baud")
parser.add_argument("--pixhawk-port", default="COM10", help="Pixhawk telemetry serial port")
parser.add_argument("--pixhawk-baud", type=int, default=57600, help="Pixhawk telemetry baud")
parser.add_argument("--sensor-id", default="1", help="Fallback sensor ID for legacy trigger lines")
args = parser.parse_args()

ser = serial.Serial(args.arduino_port, args.arduino_baud, timeout=1)

# Use a unique source_system so routing filters do not collide with other GCS ids.
master = mavutil.mavlink_connection(
    args.pixhawk_port,
 
 
    baud=args.pixhawk_baud,
    source_system=42,
    source_component=191,
)
master.wait_heartbeat(timeout=15)
print("Connected to Pixhawk telemetry")


def _build_break_name(sensor_id: str) -> bytes:
    # MAVLink NAMED_VALUE_* names have a small size budget; keep labels compact.
    sanitized = "".join(ch for ch in str(sensor_id) if ch.isalnum())
    if not sanitized:
        sanitized = "1"
    key = f"IR{sanitized}_BREAK"[:10]
    return key.encode("ascii", errors="ignore")


default_break_name = _build_break_name(args.sensor_id)
print(f"Using fallback telemetry name: {default_break_name.decode(errors='ignore')}")


def send_heartbeat():
    master.mav.heartbeat_send(
        mavutil.mavlink.MAV_TYPE_GCS,
        mavutil.mavlink.MAV_AUTOPILOT_INVALID,
        0,
        0,
        mavutil.mavlink.MAV_STATE_ACTIVE,
    )

def send_trigger(break_name):
    master.mav.named_value_int_send(
        int(time.monotonic() * 1000),
        break_name,
        1,
    )


def parse_arduino_line(line: str):
    # Trigger-like format from Arduino: ID:1 COUNT:1
    # COUNT value is ignored; each valid line is treated as one trigger event.
    match = re.match(r"^ID\s*:\s*([A-Za-z0-9]+)\s+COUNT\s*:\s*(-?\d+)\s*$", line)
    if match:
        return match.group(1)

    # Optional explicit trigger format: ID:1 TRIGGER
    match = re.match(r"^ID\s*:\s*([A-Za-z0-9]+)\s+TRIGGER\s*$", line)
    if match:
        return match.group(1)

    # Legacy format: COUNT:<n> treated as a trigger event.
    if line.startswith("COUNT:"):
        return args.sensor_id

    return None


last_hb = 0.0

while True:
    now = time.monotonic()
    if now - last_hb >= 1.0:
        send_heartbeat()
        last_hb = now

    line = ser.readline().decode().strip()

    if not line:
        continue

    try:
        parsed = parse_arduino_line(line)
    except (ValueError, IndexError):
        print(f"Malformed Arduino line: {line}")
        continue

    if parsed is None:
        continue

    sensor_id = parsed
    break_name = _build_break_name(sensor_id)
    print(f"Trigger from Arduino sensor={sensor_id}")
    send_trigger(break_name)