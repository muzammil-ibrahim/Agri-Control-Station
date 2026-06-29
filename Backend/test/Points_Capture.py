from dronekit import connect
import csv
import os
import time

# Connect to Pixhawk
vehicle = connect('/dev/ttyACM0', baud=115200, wait_ready=True)

filename = "boundary_points.csv"

# Create file and header if it doesn't exist
if not os.path.exists(filename):
    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["latitude", "longitude"])

print("Waiting for RTK Fixed...")

# Wait until RTK Fixed
while vehicle.gps_0.fix_type < 6:
    print(f"Fix Type: {vehicle.gps_0.fix_type}, "
          f"Satellites: {vehicle.gps_0.satellites_visible}")
    time.sleep(1)

print("\nRTK FIXED!")
print("Move the rover to a point.")
print("Press Enter to capture the current position.")
print("Type q and press Enter to quit.\n")

while True:
    cmd = input()

    if cmd.lower() == 'q':
        break

    lat = vehicle.location.global_frame.lat
    lon = vehicle.location.global_frame.lon

    with open(filename, "a", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([lat, lon])

    print(f"Captured point: {lat}, {lon}")

vehicle.close()

