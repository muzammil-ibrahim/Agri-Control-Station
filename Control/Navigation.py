import time
from dronekit import LocationGlobalRelative
from swerve_robot import SwerveRobot


class WaypointNavigator:
    """
    Handles loading waypoints from file and navigating them sequentially
    """

    def __init__(self, robot: SwerveRobot, waypoint_file: str):
        self.robot = robot
        self.waypoint_file = waypoint_file
        self.waypoints = self._load_waypoints()

    # -------------------------------------------------------
    # Waypoint handling
    # -------------------------------------------------------

    def _load_waypoints(self):
        waypoints = []

        with open(self.waypoint_file, 'r') as f:
            for line in f:
                line = line.strip()

                if not line or line.startswith("#"):
                    continue

                lat, lon, alt, heading = map(float, line.split(','))
                waypoints.append((lat, lon, alt, heading))

        if not waypoints:
            raise ValueError("No valid waypoints found!")

        print(f"Loaded {len(waypoints)} waypoints")
        return waypoints

    # -------------------------------------------------------
    # Navigation logic
    # -------------------------------------------------------

    def execute_mission(self, stop_time=1.0):
        print("🚀 Starting waypoint mission")

        for index, wp in enumerate(self.waypoints):
            lat, lon, alt, heading = wp
            destination = LocationGlobalRelative(lat, lon, alt)

            print(f"\n➡ Waypoint {index + 1}")
            print(f"   Lat={lat}, Lon={lon}, Heading={heading}")

            self.robot.goto_location(destination, heading)

            print(f"✅ Waypoint {index + 1} reached")
            time.sleep(stop_time)

        print("\n🎯 Mission completed successfully")


# -------------------------------------------------------
# MAIN
# -------------------------------------------------------

if __name__ == "__main__":

    robot = SwerveRobot(connection_string="COM3", baud=57600)
    navigator = WaypointNavigator(robot, "waypoints.txt")

    navigator.execute_mission()