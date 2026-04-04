# fast_sender_reliable.py

from pymavlink import mavutil
import csv
import time

PORT = 'COM3'
CSV_FILE = 'C:\\Users\\Muzammil\\Downloads\\field-command-hub-new\\Backend\\CSV_data\\points_latlon.csv'
ALT = 10
# fast_sender_fixed.py
# fast_sender_simple.py


master = mavutil.mavlink_connection(PORT)
master.wait_heartbeat()

waypoints = []
with open(CSV_FILE) as f:
    import csv
    reader = csv.DictReader(f)
    for row in reader:
        waypoints.append((float(row['latitude']), float(row['longitude'])))

# FAST STREAM
for seq, (lat, lon) in enumerate(waypoints):
    master.mav.mission_item_int_send(
        0, 0,
        seq,
        3, 16,
        0, 1,
        0,0,0,0,
        int(lat * 1e7),
        int(lon * 1e7),
        10
    )
    time.sleep(0.003)

# SEND END MULTIPLE TIMES (important)
for _ in range(5):
    master.mav.command_long_send(0, 0, 3000, 0, 0,0,0,0,0,0,0)
    time.sleep(0.1)

print("✅ Sent all")