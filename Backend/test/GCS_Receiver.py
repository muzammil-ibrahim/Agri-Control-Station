# rover_capture_mission.py

from pymavlink import mavutil
import time
from pathlib import Path
import csv
 
PORT = 'udp:0.0.0.0:14551'   # change if needed
BAUD = 115200
OUTPUT_CSV = Path(__file__).resolve().parent / 'received_waypoints.csv'

master = mavutil.mavlink_connection(PORT, baud=BAUD, robust_parsing=True)

print("Waiting for heartbeat...")
master.wait_heartbeat(timeout=5)
print("Connected")

MISSION_MESSAGE_TYPES = [
    "MISSION_COUNT",
    "MISSION_ITEM",
    "MISSION_ITEM_INT",
    "MISSION_REQUEST",
    "MISSION_REQUEST_INT",
    "MISSION_ACK",
]

waypoints = []
expected_count = None
download_in_progress = False
last_list_request = 0.0
next_seq_to_request = 0


def is_home_placeholder(seq, lat, lon):
    # Some autopilots report seq 0 as home (0,0,0) during mission download.
    return seq == 0 and abs(lat) < 1e-6 and abs(lon) < 1e-6


def send_mission_list_request(connection):
    # Some dialects include mission_type; fallback keeps compatibility.
    try:
        connection.mav.mission_request_list_send(
            connection.target_system,
            connection.target_component,
            mavutil.mavlink.MAV_MISSION_TYPE_MISSION,
        )
    except TypeError:
        connection.mav.mission_request_list_send(
            connection.target_system,
            connection.target_component,
        )


def send_mission_item_request(connection, seq):
    try:
        connection.mav.mission_request_int_send(
            connection.target_system,
            connection.target_component,
            seq,
            mavutil.mavlink.MAV_MISSION_TYPE_MISSION,
        )
    except TypeError:
        connection.mav.mission_request_int_send(
            connection.target_system,
            connection.target_component,
            seq,
        )


def write_waypoints_to_csv(csv_file, mission_waypoints):
    with open(csv_file, 'w', newline='') as fp:
        writer = csv.writer(fp)
        writer.writerow(['id', 'lat', 'lon'])
        for idx, (lat, lon) in enumerate(mission_waypoints, start=1):
            writer.writerow([idx, lat, lon])

while True:
    msg = master.recv_match(type=MISSION_MESSAGE_TYPES, blocking=True, timeout=3)

    if not msg:
        now = time.time()
        if now - last_list_request >= 3:
            send_mission_list_request(master)
            last_list_request = now
            print("No mission packet in 3s. Sent MISSION_REQUEST_LIST to Pixhawk")
        else:
            print("No mission packet received in 3s...")
        continue

    msg_type = msg.get_type()
    src_sys = msg.get_srcSystem()
    src_comp = msg.get_srcComponent()
    print(f"RX {msg_type} from sys={src_sys} comp={src_comp}")

    # Step 1: Mission count
    if msg_type == "MISSION_COUNT":
        if download_in_progress:
            print("Ignoring duplicate MISSION_COUNT while download is in progress")
            continue

        expected_count = msg.count
        waypoints = []
        download_in_progress = True
        next_seq_to_request = 0
        print(f"Mission available on Pixhawk: {expected_count} waypoints")

        if expected_count == 0:
            print("Mission is empty")
            download_in_progress = False
        else:
            send_mission_item_request(master, next_seq_to_request)
            print(f"Requested waypoint seq={next_seq_to_request}")

    # Step 2: Capture each waypoint
    elif msg_type in ["MISSION_ITEM", "MISSION_ITEM_INT"]:
        seq = msg.seq

        # For INT version (preferred)
        if msg_type == "MISSION_ITEM_INT":
            lat = msg.x / 1e7
            lon = msg.y / 1e7
            alt = msg.z
        else:
            lat = msg.x
            lon = msg.y
            alt = msg.z

        if is_home_placeholder(seq, lat, lon):
            print("Seq 0 is Pixhawk home placeholder (0,0,0), skipping")
        else:
            waypoints.append((lat, lon))
            print(f"Received WP {seq}: {lat}, {lon}")

        if expected_count is not None:
            next_seq_to_request = seq + 1

        if expected_count is not None and next_seq_to_request < expected_count:
            send_mission_item_request(master, next_seq_to_request)
            print(f"Requested waypoint seq={next_seq_to_request}")
        elif expected_count is not None and next_seq_to_request >= expected_count:
            print("Mission download complete")
            print("Final Waypoints:")
            for wp in waypoints:
                print(wp)
            write_waypoints_to_csv(OUTPUT_CSV, waypoints)
            print(f"Saved {len(waypoints)} waypoints to {OUTPUT_CSV}")
            download_in_progress = False
            break

    # Pixhawk mission pull messages that prove mission handshake is active
    elif msg_type in ["MISSION_REQUEST", "MISSION_REQUEST_INT"]:
        print(f"Pixhawk requested waypoint seq={msg.seq}")

    # Step 3: Mission complete
    elif msg_type == "MISSION_ACK":
        print("Mission upload complete")

        if expected_count is not None:
            print(f"Total received: {len(waypoints)}")

        print("Final Waypoints:")
        for wp in waypoints:
            print(wp)
        write_waypoints_to_csv(OUTPUT_CSV, waypoints)
        print(f"Saved {len(waypoints)} waypoints to {OUTPUT_CSV}")

        # 👉 Now you can start navigation
        # controller.start_mission(waypoints)

        break