import math
import time
from simple_pid import PID
from dronekit import connect
from swerve_drive_control import swerve_kinematics


class SwerveRobot:

    def __init__(self, connection_string='COM3', baud=57600):
        self.vehicle = connect(connection_string, baud=baud, wait_ready=False)

        # Navigation thresholds
        self.threshold = 0.015  # meters
        self.max_speed = 3.0
        self.min_speed = 0.5

        # PID controllers
        self.distance_pid = PID(1.2, 0, 0, setpoint=0)
        self.heading_pid = PID(2.0, 0, 0, setpoint=0)

        self.distance_pid.output_limits = (self.min_speed, self.max_speed)
        self.heading_pid.output_limits = (-1.5, 1.5)  # rad/s
        self.mode=None

    # -------------------------------------------------------
    # Utility functions
    # -------------------------------------------------------

    def get_distance_meters(self, a, b):
        dlat = b.lat - a.lat
        dlon = b.lon - a.lon
        return math.sqrt((dlat * 1.113195e5) ** 2 + (dlon * 1.113195e5) ** 2)

    def get_desired_heading(self, current, target):
        lat1 = math.radians(current.lat)
        lon1 = math.radians(current.lon)
        lat2 = math.radians(target.lat)
        lon2 = math.radians(target.lon)

        dlon = lon2 - lon1

        x = math.sin(dlon) * math.cos(lat2)
        y = math.cos(lat1) * math.sin(lat2) - \
            math.sin(lat1) * math.cos(lat2) * math.cos(dlon)

        bearing = math.degrees(math.atan2(x, y))
        return (bearing + 360) % 360

    def get_heading_error(self, desired_heading):
        current_heading = self.vehicle.heading
        return (desired_heading - current_heading + 540) % 360 - 180

    # -------------------------------------------------------
    # Autonomous navigation
    # -------------------------------------------------------

    def goto_location(self, destination, target_heading):
        while True:
            current = self.vehicle.location.global_relative_frame
            distance = self.get_distance_meters(current, destination)

            if distance <= self.threshold:
                swerve_kinematics(0, 0, 0)
                print("Reached waypoint")
                break

            speed = self.distance_pid(distance)

            bearing = self.get_desired_heading(current, destination)
            bearing_rad = math.radians(bearing)

            vx = speed * math.cos(bearing_rad)
            vy = speed * math.sin(bearing_rad)

            heading_error = self.get_heading_error(target_heading)
            av = self.heading_pid(heading_error)

            swerve_kinematics(vx, vy, av)
            time.sleep(0.1)

    # -------------------------------------------------------
    # RC Control
    # -------------------------------------------------------

    def read_rc_channels(self):
        """
        Returns normalized RC values (-1 to +1)
        """
        ch = self.vehicle.channels

        vx = (ch['1'] - 1500) / 500.0   # Roll
        vy = (ch['2'] - 1500) / 500.0   # Pitch
        av = (ch['4'] - 1500) / 500.0   # Yaw

        return vx, vy, av

    def rc_control_loop(self):
        """
        Manual swerve drive using RC
        """
        while True:
            vx, vy, av = self.read_rc_channels()

            # Scale velocities
            vx *= self.max_speed
            vy *= self.max_speed
            av *= 1.5  # rad/s

            swerve_kinematics(vx, vy, av)
            time.sleep(0.05)
