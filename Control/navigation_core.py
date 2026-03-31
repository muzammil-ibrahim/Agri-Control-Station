import math
from typing import Tuple

__all__ = [
    "get_distance_meters",
    "get_desired_heading",
    "get_heading_error",
    "compute_nav_outputs",
]


def get_distance_meters(current, target) -> float:
    """Ground distance in meters between two objects with .lat/.lon."""
    dlat = target.lat - current.lat
    dlon = target.lon - current.lon
    return math.sqrt((dlat * 1.113195e5) ** 2 + (dlon * 1.113195e5) ** 2)


def get_desired_heading(current, target) -> float:
    """Bearing (0-360 deg) from current to target using GPS coordinates."""
    lat1 = math.radians(current.lat)
    lon1 = math.radians(current.lon)
    lat2 = math.radians(target.lat)
    lon2 = math.radians(target.lon)

    dlon = lon2 - lon1
    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)

    bearing = math.degrees(math.atan2(x, y))
    return (bearing + 360.0) % 360.0


def get_heading_error(current_heading: float, desired_heading: float) -> float:
    """Signed heading error in range [-180, 180]."""
    return (desired_heading - current_heading + 540.0) % 360.0 - 180.0


def compute_nav_outputs(
    distance: float,
    heading_error: float,
    min_speed: int,
    max_speed: int,
    distance_gain: float,
    heading_rate_gain: float,
    max_heading_rate: float,
) -> Tuple[int, float]:
    """
    Shared high-level navigation outputs:
    - wheel_speed_cmd: translational speed command
    - heading_rate_cmd: signed turn-rate command
    """
    wheel_speed_cmd = int(min(max_speed, max(min_speed, distance_gain * distance)))

    heading_rate_cmd = heading_rate_gain * heading_error
    heading_rate_cmd = max(-max_heading_rate, min(max_heading_rate, heading_rate_cmd))

    return wheel_speed_cmd, heading_rate_cmd
