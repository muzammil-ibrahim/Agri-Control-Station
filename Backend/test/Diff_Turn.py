from dronekit import connect
import time
import math
import json
import serial

vehicle = connect('/dev/ttyACM0', baud=115200, wait_ready=True)

DDSM_PORT = '/dev/ttyACM1'
SERIAL_BAUDRATE = 115200

ddsm_ser = serial.Serial(DDSM_PORT, baudrate=SERIAL_BAUDRATE)
ddsm_ser.setRTS(False)
ddsm_ser.setDTR(False)
print("[System] DDSM Connected")

def normalize(angle):
    return angle % 360


def heading_error(target, current):
    """
    Smallest signed angle difference.
    Returns value between -180 and 180.
    """
    return ((target - current + 540) % 360) - 180

def motor_control(left, right):
    global ddsm_ser
    command_right = {
        "T":10010,
        "id":2,
        "cmd":-right,
        "act":3
    }

    command_left = {
        "T":10010,
        "id":1,
        "cmd":left,
        "act":3
    }

    ddsm_ser.write((json.dumps(command_right)+'\n').encode())
    time.sleep(0.01)
    ddsm_ser.write((json.dumps(command_left)+'\n').encode())


def linear_to_rpm(speed, wheel_diameter):

    wheel_radius = wheel_diameter / 2

    rpm = (speed / (2 * math.pi * wheel_radius)) * 60

    return rpm

def wheel_speeds(radius, forward_speed, wheel_base):

    left = forward_speed * (1 - wheel_base/(2*radius))
    right = forward_speed * (1 + wheel_base/(2*radius))

    return left, right


def u_turn(radius,
           forward_speed,
           wheel_base,
           wheel_diameter,
           tolerance=2):

    start_heading = vehicle.heading

    target_heading = (start_heading + 180) % 360

    print("Starting Heading :", start_heading)
    print("Target Heading   :", target_heading)

    left_speed, right_speed = wheel_speeds(
        radius,
        forward_speed,
        wheel_base
    )

    left_rpm = linear_to_rpm(left_speed, wheel_diameter)
    right_rpm = linear_to_rpm(right_speed, wheel_diameter)

    print("Left Wheel RPM  :", left_rpm)
    print("Right Wheel RPM :", right_rpm)

    while True:

        current_heading = vehicle.heading
        error = heading_error(target_heading, current_heading)

        if abs(error) <= tolerance:
            break

        # Scale factor between 0.3 and 1.0
        scale = max(0.3, min(1.0, abs(error) / 45.0))

        motor_control(left_rpm * scale,
                    right_rpm * scale)

        time.sleep(0.05)

    motor_control(0,0)

    print("U-turn completed.")


WHEEL_BASE = 0.3          # meters
WHEEL_DIAMETER = 0.1     # meters

try:
    u_turn(
        radius=0.5,
        forward_speed=0.25,
        wheel_base=WHEEL_BASE,
        wheel_diameter=WHEEL_DIAMETER
    )
except KeyboardInterrupt:
    motor_control(0,0)
finally:
    vehicle.close()
    ddsm_ser.close()