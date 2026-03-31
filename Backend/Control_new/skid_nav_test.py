import argparse
import csv
import math
import time
import json
from pathlib import Path

import serial  # type: ignore[import-not-found]
from dronekit import connect, LocationGlobal  # type: ignore[import-not-found]
from navigation_core import (  # type: ignore[import-not-found]
    compute_nav_outputs,
    get_desired_heading,
    get_distance_meters,
    get_heading_error,
)


# Defaults tuned from Control/main2.py behavior
DEFAULT_TURN_SPEED = 30
DEFAULT_FORWARD_SPEED = 40
DEFAULT_HEADING_TOLERANCE = 10
DEFAULT_WAYPOINT_RADIUS = 1.5
DEFAULT_LOOP_DT = 0.1
DEFAULT_MIN_TRACK_SPEED = 8
DEFAULT_DISTANCE_GAIN = 0.8
DEFAULT_HEADING_RATE_GAIN = 0.08
DEFAULT_MAX_HEADING_RATE = 40.0


class SkidRobot:
    """
    Skid rover adapter that exposes goto_location(destination, target_heading),
    so it can run waypoint missions using swerve-style navigation flow.
    """

    def __init__(
        self,
        vehicle_port: str,
        vehicle_baud: int,
        motor_port: str,
        motor_baud: int,
        turn_speed: int = DEFAULT_TURN_SPEED,
        forward_speed: int = DEFAULT_FORWARD_SPEED,
        heading_tolerance: float = DEFAULT_HEADING_TOLERANCE,
        waypoint_radius: float = DEFAULT_WAYPOINT_RADIUS,
        loop_dt: float = DEFAULT_LOOP_DT,
        min_track_speed: int = DEFAULT_MIN_TRACK_SPEED,
        distance_gain: float = DEFAULT_DISTANCE_GAIN,
        heading_rate_gain: float = DEFAULT_HEADING_RATE_GAIN,
        max_heading_rate: float = DEFAULT_MAX_HEADING_RATE,
        dry_run: bool = False,
    ):
        self.turn_speed = turn_speed
        self.forward_speed = forward_speed
        self.heading_tolerance = heading_tolerance
        self.waypoint_radius = waypoint_radius
        self.loop_dt = loop_dt
        self.min_track_speed = min_track_speed
        self.distance_gain = distance_gain
        self.heading_rate_gain = heading_rate_gain
        self.max_heading_rate = max_heading_rate
        self.dry_run = dry_run

        self.vehicle = connect(vehicle_port, wait_ready=True, baud=vehicle_baud)
        self.ddsm_ser = None

        if not self.dry_run:
            self.ddsm_ser = serial.Serial(motor_port, baudrate=motor_baud, timeout=1)
            self.ddsm_ser.setRTS(False)
            self.ddsm_ser.setDTR(False)

    def close(self):
        self.set_motor_speeds(0, 0)
        time.sleep(0.05)

        if self.ddsm_ser is not None:
            self.ddsm_ser.close()

        if self.vehicle is not None:
            self.vehicle.close()

    def set_motor_speeds(self, left: int, right: int):
        """
        Sends left/right skid commands in the same JSON format used by main2.py.
        """
        if self.dry_run:
            print(f"[DRY-RUN] left={left}, right={right}")
            return

        command_right = {
            "T": 10010,
            "id": 1,
            "cmd": left,
            "act": 3,
        }
        command_left = {
            "T": 10010,
            "id": 2,
            "cmd": -right,
            "act": 3,
        }

        self.ddsm_ser.write((json.dumps(command_right) + "\n").encode())
        time.sleep(0.01)
        self.ddsm_ser.write((json.dumps(command_left) + "\n").encode())

    def apply_skid_from_nav_outputs(self, wheel_speed_cmd: int, heading_rate_cmd: float):
        """
        Low-level skid mapping from navigation outputs (speed + heading rate).
        """
        left_cmd = int(wheel_speed_cmd - heading_rate_cmd)
        right_cmd = int(wheel_speed_cmd + heading_rate_cmd)

        left_cmd = max(self.min_track_speed, min(self.forward_speed, left_cmd))
        right_cmd = max(self.min_track_speed, min(self.forward_speed, right_cmd))

        self.set_motor_speeds(left_cmd, right_cmd)
        return left_cmd, right_cmd

    def goto_location(self, destination, target_heading=0.0):
        """
        Interface compatible with waypoint mission loops from swerve navigation code.
        target_heading is accepted for compatibility; skid turn control follows bearing-to-goal.
        """
        while True:
            current = self.vehicle.location.global_relative_frame
            distance = get_distance_meters(current, destination)

            if distance <= self.waypoint_radius:
                self.set_motor_speeds(0, 0)
                print(f"Reached waypoint (distance={distance:.2f} m)")
                break

            desired_heading = get_desired_heading(current, destination)
            heading_error = get_heading_error(float(self.vehicle.heading), desired_heading)

            # Differential steering only: no in-place turns and no reverse wheel command.
            wheel_speed_cmd, heading_rate_cmd = compute_nav_outputs(
                distance=distance,
                heading_error=heading_error,
                min_speed=self.min_track_speed,
                max_speed=self.forward_speed,
                distance_gain=self.distance_gain,
                heading_rate_gain=self.heading_rate_gain,
                max_heading_rate=self.max_heading_rate,
            )
            left_cmd, right_cmd = self.apply_skid_from_nav_outputs(wheel_speed_cmd, heading_rate_cmd)

            print(
                f"dist={distance:.2f}m | desired={desired_heading:.1f}deg | "
                f"current={self.vehicle.heading}deg | err={heading_error:.1f}deg | "
                f"ws={wheel_speed_cmd} | hr={heading_rate_cmd:.2f} | L={left_cmd} R={right_cmd}"
            )
            time.sleep(self.loop_dt)


def load_waypoints_from_csv(csv_path: Path):
    waypoints = []

    with csv_path.open(newline="") as fp:
        reader = csv.DictReader(fp)

        for idx, row in enumerate(reader, start=1):
            lat_raw = row.get("latitude") or row.get("lat")
            lon_raw = row.get("longitude") or row.get("lon")

            if lat_raw is None or lon_raw is None:
                raise ValueError(
                    f"Missing latitude/longitude at row {idx}. "
                    "Expected columns: latitude,longitude (or lat,lon)."
                )

            heading_raw = row.get("heading")

            lat = float(lat_raw)
            lon = float(lon_raw)
            heading = float(heading_raw) if heading_raw not in (None, "") else 0.0

            waypoints.append((lat, lon, heading))

    if not waypoints:
        raise ValueError(f"No waypoints found in {csv_path}")

    return waypoints


def run_mission(robot: SkidRobot, waypoints, stop_time: float):
    print(f"Starting skid mission with {len(waypoints)} waypoints")

    for index, (lat, lon, heading) in enumerate(waypoints, start=1):
        destination = LocationGlobal(lat, lon)

        print(f"\nWaypoint {index}: lat={lat}, lon={lon}, heading={heading}")
        robot.goto_location(destination, heading)
        print(f"Waypoint {index} reached")
        time.sleep(stop_time)

    print("Mission completed")


def parse_args():
    parser = argparse.ArgumentParser(description="Test swerve-style navigation on a skid rover")

    parser.add_argument(
        "--waypoints",
        default=str(Path(__file__).resolve().parent.parent /"received_waypoints.csv"),
        help="CSV path with waypoint columns (lat/lon or latitude/longitude)",
    )
    parser.add_argument("--vehicle-port", default="/dev/ttyACM1", help="Pixhawk telemetry port")
    parser.add_argument("--vehicle-baud", type=int, default=115200, help="Pixhawk baud rate")
    parser.add_argument("--motor-port", default="/dev/ttyACM0", help="Skid motor controller port")
    parser.add_argument("--motor-baud", type=int, default=115200, help="Skid motor serial baud")
    parser.add_argument("--turn-speed", type=int, default=DEFAULT_TURN_SPEED)
    parser.add_argument("--forward-speed", type=int, default=DEFAULT_FORWARD_SPEED)
    parser.add_argument("--heading-tolerance", type=float, default=DEFAULT_HEADING_TOLERANCE)
    parser.add_argument("--waypoint-radius", type=float, default=DEFAULT_WAYPOINT_RADIUS)
    parser.add_argument("--loop-dt", type=float, default=DEFAULT_LOOP_DT)
    parser.add_argument("--min-track-speed", type=int, default=DEFAULT_MIN_TRACK_SPEED)
    parser.add_argument("--distance-gain", type=float, default=DEFAULT_DISTANCE_GAIN)
    parser.add_argument("--heading-rate-gain", type=float, default=DEFAULT_HEADING_RATE_GAIN)
    parser.add_argument("--max-heading-rate", type=float, default=DEFAULT_MAX_HEADING_RATE)
    parser.add_argument("--stop-time", type=float, default=1.0, help="Pause at each waypoint (s)")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Do not send motor serial commands; print commands only",
    )

    return parser.parse_args()


def main():
    args = parse_args()

    waypoint_file = Path(args.waypoints).resolve()
    waypoints = load_waypoints_from_csv(waypoint_file)

    robot = SkidRobot(
        vehicle_port=args.vehicle_port,
        vehicle_baud=args.vehicle_baud,
        motor_port=args.motor_port,
        motor_baud=args.motor_baud,
        turn_speed=args.turn_speed,
        forward_speed=args.forward_speed,
        heading_tolerance=args.heading_tolerance,
        waypoint_radius=args.waypoint_radius,
        loop_dt=args.loop_dt,
        min_track_speed=args.min_track_speed,
        distance_gain=args.distance_gain,
        heading_rate_gain=args.heading_rate_gain,
        max_heading_rate=args.max_heading_rate,
        dry_run=args.dry_run,
    )

    try:
        run_mission(robot, waypoints, args.stop_time)
    except KeyboardInterrupt:
        print("Interrupted by user, stopping rover")
        robot.set_motor_speeds(0, 0)
    finally:
        robot.close()


if __name__ == "__main__":
    main()
