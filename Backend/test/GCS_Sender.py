# gcs_send_mission.py

from pymavlink import mavutil
from pathlib import Path
import csv
import time

PORT = 'udp:0.0.0.0:14550'
BAUD = 57600
DEFAULT_ALT = 10.0
CSV_FILE = 'C:\\Users\\Muzammil\\Downloads\\field-command-hub-new\\Backend\\CSV_data\\points_latlon.csv'
REQUEST_TIMEOUT = 10
MAX_TIMEOUT_RETRIES = 5
MAX_SEND_RETRIES_PER_SEQ = 3
RETRY_DELAY_SEC = 0.5


def load_waypoints_from_csv(csv_file):
    waypoints = []

    with open(csv_file, newline='') as fp:
        reader = csv.DictReader(fp)
        for idx, row in enumerate(reader, start=1):
            lat_value = row.get('latitude') or row.get('lat')
            lon_value = row.get('longitude') or row.get('lon')
            if lat_value is None or lon_value is None:
                raise ValueError(
                    f"Missing latitude/longitude at CSV row {idx}. "
                    "Expected columns: latitude,longitude"
                )

            lat = float(lat_value)
            lon = float(lon_value)
            waypoints.append((lat, lon))

    if not waypoints:
        raise ValueError(f"No waypoints found in CSV: {csv_file}")

    return waypoints


def send_mission_count(connection, count):
    connection.mav.mission_count_send(
        connection.target_system,
        connection.target_component,
        count
    )


def send_waypoint(connection, req_type, seq, lat, lon):
    if req_type == 'MISSION_REQUEST_INT':
        # INT uses scaled integers for lat/lon.
        connection.mav.mission_item_int_send(
            connection.target_system,
            connection.target_component,
            seq,
            mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT,
            mavutil.mavlink.MAV_CMD_NAV_WAYPOINT,
            0,
            1,
            0,
            0,
            0,
            0,
            int(lat * 1e7),
            int(lon * 1e7),
            DEFAULT_ALT
        )
    else:
        connection.mav.mission_item_send(
            connection.target_system,
            connection.target_component,
            seq,
            mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT,
            mavutil.mavlink.MAV_CMD_NAV_WAYPOINT,
            0,
            1,
            0,
            0,
            0,
            0,
            lat,
            lon,
            DEFAULT_ALT
        )

master = mavutil.mavlink_connection(PORT, baud=BAUD)
master.wait_heartbeat()

print("Connected")

waypoints = load_waypoints_from_csv(CSV_FILE)
print(f"Loaded {len(waypoints)} waypoints from {CSV_FILE}")

# Send count
send_mission_count(master, len(waypoints))

# Wait for requests (Pixhawk usually requests with MISSION_REQUEST_INT)
sent_sequences = set()
last_completed_seq = -1
timeout_retries = 0

while len(sent_sequences) < len(waypoints):
    msg = master.recv_match(
        type=['MISSION_REQUEST_INT', 'MISSION_REQUEST'],
        blocking=True,
        timeout=REQUEST_TIMEOUT
    )

    if msg is None:
        timeout_retries += 1
        if timeout_retries > MAX_TIMEOUT_RETRIES:
            print(
                f"Timed out waiting for mission request. "
                f"Exceeded max retries ({MAX_TIMEOUT_RETRIES})"
            )
            break

        resume_seq = last_completed_seq + 1
        print(
            f"Timeout waiting for mission request. Retry {timeout_retries}/"
            f"{MAX_TIMEOUT_RETRIES}. Resuming from seq={resume_seq}"
        )
        send_mission_count(master, len(waypoints))
        continue

    timeout_retries = 0

    req_type = msg.get_type()
    seq = msg.seq

    if seq >= len(waypoints):
        print(f"Ignoring unexpected request seq={seq}")
        continue

    lat, lon = waypoints[seq]
    sent_ok = False
    for attempt in range(1, MAX_SEND_RETRIES_PER_SEQ + 1):
        try:
            send_waypoint(master, req_type, seq, lat, lon)
            sent_ok = True
            break
        except Exception as exc:
            print(
                f"Send failed for seq={seq} attempt={attempt}/"
                f"{MAX_SEND_RETRIES_PER_SEQ}: {exc}"
            )
            if attempt < MAX_SEND_RETRIES_PER_SEQ:
                time.sleep(RETRY_DELAY_SEC)

    if not sent_ok:
        print(f"Giving up on seq={seq} after send retries")
        continue

    sent_sequences.add(seq)
    if seq > last_completed_seq:
        last_completed_seq = seq

    progress = (len(sent_sequences) / len(waypoints)) * 100.0
    print(
        f"Request={req_type} seq={seq} -> Sent WP {seq} | "
        f"Progress: {len(sent_sequences)}/{len(waypoints)} ({progress:.1f}%)"
    )

# Wait for ACK from Pixhawk
ack = master.recv_match(type='MISSION_ACK', blocking=True, timeout=10)
if ack is None:
    print("No MISSION_ACK received")
else:
    print("Mission ACK received")