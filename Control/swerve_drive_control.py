import math

# Configuration — positions of the wheels relative to robot center (meters)
# Example: square robot with 0.3m half width/length
wheel_positions = {
    "FL": ( 0.3,  0.3),
    "FR": ( 0.3, -0.3),
    "RL": (-0.3,  0.3),
    "RR": (-0.3, -0.3),
}

max_wheel_speed = 1.0  # m/s (tune for your robot)

def swerve_kinematics(vx, vy, omega):
    """
    vx: forward velocity (m/s)
    vy: sideways velocity (m/s)
    omega: angular velocity (rad/s)

    returns: dictionary of
             { module_name: (angle_rad, speed_mps) }
    """

    states = {}

    # First compute raw wheel vectors
    for name, (rx, ry) in wheel_positions.items():
        # robot motion + rotational component
        wx = vx - omega * ry
        wy = vy + omega * rx

        # Speed and angle for this wheel
        speed = math.sqrt(wx**2 + wy**2)
        angle = math.atan2(wy, wx)  # radians

        states[name] = (angle, speed)

    # Normalize wheel speeds if any exceed max
    max_speed = max(speed for angle, speed in states.values())
    if max_speed > max_wheel_speed:
        scale = max_wheel_speed / max_speed
        for name in states:
            angle, speed = states[name]
            states[name] = (angle, speed * scale)

    return states

# Example usage:
if __name__ == "__main__":
    # Robot commanded to go forward 1 m/s,
    # strafe right 0.5 m/s, rotate clockwise at 0.5 rad/s
    vx   =  1.0
    vy   = -0.5
    omega = 0.5

    module_states = swerve_kinematics(vx, vy, omega)
    for wheel, (angle, speed) in module_states.items():
        print(f"{wheel}: angle = {math.degrees(angle):.1f}°, speed = {speed:.2f} m/s")
