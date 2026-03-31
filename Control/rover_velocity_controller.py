##purpose: test
import math
import time
from simple_pid import PID
from dronekit import connect, VehicleMode, LocationGlobalRelative
from swerve_drive_control import swerve_kinematics

threshold = 0.015
max_speed = 3 # m/s
min_speed = 1

pids = PID(0,0,0, setpoint=0)
pidh = PID(0,0,0, setpoint=0)


vehicle = connect('COM3', wait_ready=False, baud=57600)
def get_heading():
    return vehicle.heading

def get_distance_meters(a_location, b_location):
    """
    Returns the ground distance in meters between two GPS coordinates.
    """
    dlat = b_location.lat - a_location.lat
    dlong = b_location.lon - a_location.lon
    return math.sqrt((dlat * 1.113195e5)**2 + (dlong * 1.113195e5)**2)

def get_desired_heading(current_lat, current_lon, target_lat, target_lon):
    """
    Calculate the desired heading (bearing) from current location to target location.
    
    Args:
        current_heading (float): Current yaw/heading of the vehicle (0–360 degrees).
        current_location (tuple): (lat, lon) in degrees.
        target_location (tuple): (lat, lon) in degrees.
    
    Returns:
        float: Desired heading in degrees (0–360) to face the target.
    """
    lat1, lon1 = current_lat, current_lon
    lat2, lon2 = target_lat, target_lon
    # lat1, lon1 = 17.3973503, 78.4900178
    # lat2, lon2 = 17.3973573, 78.4899868
    # lat1, lon1 = map(math.radians, current_location)
    # lat2, lon2 = map(math.radians, target_location)

    delta_lon = lon2 - lon1

    x = math.sin(delta_lon) * math.cos(lat2)
    y = math.cos(lat1)*math.sin(lat2) - math.sin(lat1)*math.cos(lat2)*math.cos(delta_lon)

    initial_bearing = math.atan2(x, y)
    initial_bearing_deg = math.degrees(initial_bearing)
    desired_heading = (initial_bearing_deg + 360) % 360

    return int(desired_heading)

def get_heading_error(desired_heading):
    current_heading = 30
    error = (desired_heading - current_heading + 540) % 360 - 180
    return error

def goto_location(destination, heading):

    while True:
        current_location = vehicle.location.global_relative_frame
        distance = get_distance_meters(current_location, destination)
        if distance <= threshold:
            swerve_kinematics(0, 0, 0)
            break
        speed = pids(distance)
        speed = min(speed, max_speed)
        speed = max(speed, min_speed)

        bearing = get_desired_heading(current_location.lat, current_location.lon, destination.lat, destination.lon)
        bearing_rad = math.radians(bearing)

        vx = speed * math.cos(bearing_rad)
        vy = speed * math.sin(bearing_rad)
        av = pidh(get_heading_error(heading))
        
        swerve_kinematics(vx, vy, av)
        time.sleep(0.1)

