import pandas as pd
import numpy as np
import random
from io import StringIO
from pyproj import Transformer
from shapely.geometry import Polygon, Point
from pymavlink import mavutil
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from Vehicle_state import vehicle_state
import time
from datetime import datetime
import math
import csv
import serial
import os



base_dir = r"C:\Users\Muzammil\Downloads\field-command-hub-new\Backend\CSV_data"

DIST_THRESHOLD = 1.0  # meters


# File paths
geofence_input_path = os.path.join(base_dir, "src", "geofence.csv")
# geofence_output_path = os.path.join(base_dir, "dist", "geofence_converted.csv")
# points_output_path = os.path.join(base_dir, "dist", "points_converted.csv")
# points_latlon = os.path.join(base_dir, "dist", "points_latlon.csv")




# Haversine distance
def haversine(lat1, lon1, lat2, lon2):
    R = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

# Background logging function
def mavlink_logger():
    global logging_active

    # Reset CSV at the start of each session
    with open(geofence_input_path, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(["latitude", "longitude", "label", "timestamp", "fix_quality", "h_accuracy"])

    last_lat, last_lon = None, None
    point_count = 0

    while logging_active:
        lat = vehicle_state.lat
        lon = vehicle_state.lon
        # h_acc = current_state.get("h_acc")
        # fix_type = current_state.get("fix_type")

        if lat is None or lon is None:
            time.sleep(0.5)
            continue

        # timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")

        # fix_quality_map = {
        #     0: "No Fix", 1: "Dead Reckoning", 2: "2D-Fix", 3: "3D-Fix",
        #     4: "RTK-Float", 5: "RTK-Fixed"
        # }
        # fix_quality = fix_quality_map.get(fix_type, "Unknown")

        if last_lat is None or haversine(last_lat, last_lon, lat, lon) >= DIST_THRESHOLD:
            point_count += 1
            label = f"P{point_count}"
            with open(geofence_input_path, mode="a", newline="") as file:
                writer = csv.writer(file)
                writer.writerow([lat, lon, label])
            print(f"Logged {label}: {lat}, {lon}")
            last_lat, last_lon = lat, lon

        time.sleep(0.5)

    print("Logging stopped.")



