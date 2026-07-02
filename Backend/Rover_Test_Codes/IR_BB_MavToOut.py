# This script connects to a vehicle via telemetry and requests the BATTERY_STATUS message stream. 
# It then continuously receives and prints the battery status information, including battery ID, voltage, and

import time
import re
from pymavlink import mavutil

TELEMETRY_PORT = 'COM10'
TELEMETRY_BAUD = 57600

master = mavutil.mavlink_connection(
    TELEMETRY_PORT,
    baud=TELEMETRY_BAUD,
    source_system=43,
    source_component=191,
)

print("Waiting for heartbeat...")
hb = master.wait_heartbeat(timeout=15)
if hb is None:
    raise TimeoutError("No heartbeat received. Check COM port and telemetry baud.")
print(f"Connected to system {master.target_system}, component {master.target_component}")


def normalize_name(raw_name):
    if isinstance(raw_name, (bytes, bytearray)):
        return raw_name.decode('utf-8', errors='ignore').rstrip('\x00')
    return str(raw_name).rstrip('\x00')


def send_heartbeat():
    master.mav.heartbeat_send(
        mavutil.mavlink.MAV_TYPE_GCS,
        mavutil.mavlink.MAV_AUTOPILOT_INVALID,
        0,
        0,
        mavutil.mavlink.MAV_STATE_ACTIVE,
    )


last_hb = 0.0
last_seen = 0.0
seen_types = set()

while True:
    now = time.monotonic()
    if now - last_hb >= 1.0:
        send_heartbeat()
        last_hb = now

    msg = master.recv_match(blocking=True, timeout=1)

    if not msg:
        if now - last_seen >= 5.0:
            print("No MAVLink messages in last 5 seconds")
            last_seen = now
        continue

    last_seen = now
    msg_type = msg.get_type()
    if msg_type not in seen_types:
        print(f"Seen MAVLink type: {msg_type}")
        seen_types.add(msg_type)

    # Check for NAMED_VALUE_INT
    if msg_type == 'NAMED_VALUE_INT':
        name = normalize_name(msg.name)

        if (
            name == "IR_COUNT"
            or re.fullmatch(r"IR\w+_COUNT", name)
            or name == "IR_BREAK"
            or re.fullmatch(r"IR\w+_BREAK", name)
        ):
            value = msg.value
            print(f"[RECEIVED] {name}: {value}")