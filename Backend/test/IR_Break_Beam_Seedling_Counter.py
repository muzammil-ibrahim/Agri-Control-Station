"""
IR break-beam telemetry publisher.

Each time the beam is broken, this script emits MAVLink NAMED_VALUE_INT telemetry:
    name = IR_BREAK
    value = 1

Backend Pixhawk reader consumes this telemetry and increments Seedling Count
for the active mission task.

Usage examples:
    python IR_Break_Beam_Seedling_Counter.py --connection udpout:127.0.0.1:14550 --simulate
    python IR_Break_Beam_Seedling_Counter.py --connection COM6 --baud 57600 --pin 17
"""

# pyright: reportMissingImports=false

import argparse
import sys
import time

try:
    from pymavlink import mavutil
except Exception:
    mavutil = None

try:
    import RPi.GPIO as GPIO  # type: ignore
except Exception:
    GPIO = None


def send_ir_break_increment(master) -> None:
    now_ms = int(time.time() * 1000) & 0xFFFFFFFF
    master.mav.named_value_int_send(
        now_ms,
        b"IR_BREAK",
        1,
    )


def run_simulation(master) -> None:
    print("Simulation mode enabled. Press Enter to simulate a beam break. Ctrl+C to stop.")
    while True:
        input()
        send_ir_break_increment(master)
        print("[SEEDLING] Beam break detected. Telemetry increment sent.")


def run_gpio(master, pin: int, debounce_seconds: float) -> None:
    if GPIO is None:
        print("[ERROR] RPi.GPIO is unavailable. Use --simulate on non-Raspberry Pi systems.")
        sys.exit(1)

    GPIO.setwarnings(False)
    GPIO.setmode(GPIO.BCM)
    GPIO.setup(pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)

    print(f"Listening for IR break-beam events on BCM pin {pin}. Ctrl+C to stop.")

    last_detection = 0.0
    was_blocked = False

    try:
        while True:
            is_blocked = GPIO.input(pin) == GPIO.LOW
            now = time.time()

            # Count on edge transition to blocked with debounce.
            if is_blocked and not was_blocked and (now - last_detection) >= debounce_seconds:
                send_ir_break_increment(master)
                print("[SEEDLING] Beam break detected. Telemetry increment sent.")
                last_detection = now

            was_blocked = is_blocked
            time.sleep(0.01)
    finally:
        GPIO.cleanup(pin)


def main() -> None:
    parser = argparse.ArgumentParser(description="IR break-beam MAVLink telemetry publisher")
    parser.add_argument("--connection", default="udpout:127.0.0.1:14550", help="MAVLink connection string")
    parser.add_argument("--baud", type=int, default=57600, help="Serial baud rate when using COM port")
    parser.add_argument("--pin", type=int, default=17, help="BCM GPIO pin for IR beam output")
    parser.add_argument("--debounce", type=float, default=0.25, help="Debounce window in seconds")
    parser.add_argument("--simulate", action="store_true", help="Run without GPIO hardware")
    args = parser.parse_args()

    if mavutil is None:
        print("[ERROR] pymavlink is not installed in this Python environment.")
        print("Install it with: pip install pymavlink")
        sys.exit(1)

    master = mavutil.mavlink_connection(args.connection, baud=args.baud)
    print(f"MAVLink telemetry connection ready: {args.connection}")

    try:
        if args.simulate:
            run_simulation(master)
        else:
            run_gpio(master, args.pin, args.debounce)
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
