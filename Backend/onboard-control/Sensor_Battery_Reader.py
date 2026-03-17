from smbus2 import SMBus
from pymavlink import mavutil
import struct
import math
import time

# ==============================
# CONFIG
# ==============================
I2C_BUS = 1
ESP_ADDRESSES = [0x10, 0x11, 0x12, 0x13, 0x14]

PIXHAWK_PORT = '/dev/ttyACM0'
PIXHAWK_BAUD = 115200

SENSOR_PAYLOAD_TYPE = 32800
# 4 wheel speeds + 4 mag angles = 8 floats
SENSOR_FMT = '<ffffffff'

ADDRESS_TO_ID = {
    0x10: 1,
    0x11: 2,
    0x12: 3,
    0x13: 4,
    0x14: 5
}

# ==============================
# CONNECT TO PIXHAWK
# ==============================
print("Connecting to Pixhawk...")
master = mavutil.mavlink_connection(
    PIXHAWK_PORT,
    baud=PIXHAWK_BAUD,
    source_system=42,
    source_component=191
)
master.wait_heartbeat()
print("Connected to Pixhawk")

# ==============================
# READ ONE ESP
# ==============================
def read_esp(bus, address):
    try:
        bus.write_i2c_block_data(address, ord('G'), [ord('E'), ord('T')])
        time.sleep(0.05)
        data = bus.read_i2c_block_data(address, 0, 32)

        clean_bytes = []
        for b in data:
            if b == 0:
                break
            clean_bytes.append(b)

        return ''.join(chr(x) for x in clean_bytes).strip()

    except Exception as e:
        print(f"I2C Error at {hex(address)}: {e}")
        return None

# ==============================
# SEND BATTERY STATUS
# ==============================
def send_battery(device_id, voltage=0, temperature=0, ok=True):
    voltage_mv = int(voltage * 1000) if ok else 0
    temperature_cd = int(temperature * 100) if ok else 0

    master.mav.battery_status_send(
        device_id,
        0, 0,
        temperature_cd,
        [voltage_mv] + [0] * 9,
        -1, -1, -1, -1,
        0
    )

# ==============================
# SEND 4-WHEEL + ENCODER TUNNEL
# ==============================
def send_sensor_values(wheel_speeds, mag_angles):

    t = int(time.time()*1000) & 0xFFFFFFFF

    master.mav.named_value_float_send(t, b"FL_RPM", float(wheel_speeds[0]))
    master.mav.named_value_float_send(t, b"FR_RPM", float(wheel_speeds[1]))
    master.mav.named_value_float_send(t, b"RL_RPM", float(wheel_speeds[2]))
    master.mav.named_value_float_send(t, b"RR_RPM", float(wheel_speeds[3]))

    master.mav.named_value_float_send(t, b"FL_ANG", float(mag_angles[0]))
    master.mav.named_value_float_send(t, b"FR_ANG", float(mag_angles[1]))
    master.mav.named_value_float_send(t, b"RL_ANG", float(mag_angles[2]))
    master.mav.named_value_float_send(t, b"RR_ANG", float(mag_angles[3]))


# ==============================
# DUMMY DATA GENERATOR
# ==============================
_start_time = time.time()

def get_dummy_sensor_data():
    t = time.time() - _start_time

    # Each wheel slightly phase-offset to simulate real independent wheels
    wheel_speeds = [
        15.0 + 15.0 * math.sin(2 * math.pi * t / 10.0),           # FL
        15.0 + 15.0 * math.sin(2 * math.pi * t / 10.0 + 0.3),     # FR
        15.0 + 15.0 * math.sin(2 * math.pi * t / 10.0 + 0.6),     # RL
        15.0 + 15.0 * math.sin(2 * math.pi * t / 10.0 + 0.9),     # RR
    ]

    # Each encoder rotates at slightly different speed
    mag_angles = [
        (t * 45.0) % 360.0,    # FL: 45 deg/sec
        (t * 50.0) % 360.0,    # FR: 50 deg/sec
        (t * 40.0) % 360.0,    # RL: 40 deg/sec
        (t * 55.0) % 360.0,    # RR: 55 deg/sec
    ]

    return wheel_speeds, mag_angles

# ==============================
# MAIN LOOP
# ==============================
WHEEL_LABELS = ['FL', 'FR', 'RL', 'RR']
loop_count = 0

while True:
    loop_count += 1
    print(f"\n{'='*35}")
    print(f"Loop #{loop_count}  |  t={time.time() - _start_time:.1f}s")
    print(f"{'='*35}")

    # --- Battery status from all ESPs via I2C ---
    with SMBus(I2C_BUS) as bus:
        for addr in ESP_ADDRESSES:
            device_id = ADDRESS_TO_ID.get(addr, 0)
            response = read_esp(bus, addr)

            if not response:
                print(f"[BMS {device_id}] I2C FAIL — sending 0V")
                send_battery(device_id, ok=False)
                continue

            print(f"[BMS {device_id}] RAW: {response}")

            try:
                values = {}
                for p in response.split(','):
                    if '=' in p:
                        k, v = p.split('=')
                        values[k.strip()] = float(v.strip())

                temperature = values.get("T", 0)
                voltage     = values.get("V", 0)

                send_battery(device_id, voltage, temperature, ok=True)
                print(f"[BMS {device_id}] {voltage:.2f}V  {temperature:.1f}°C  ✓")

            except Exception as e:
                print(f"[BMS {device_id}] Parse error: {e} — sending 0V")
                send_battery(device_id, ok=False)

    # --- Dummy 4-wheel + encoder data ---
    wheel_speeds, mag_angles = get_dummy_sensor_data()

    send_sensor_values(wheel_speeds, mag_angles)

    print(f"\n[SENSOR VALUES SENT]")
    print(f"  {'Wheel':<6} {'Speed RPM':>10} {'Angle °':>10}")
    print(f"  {'-'*30}")
    for i, label in enumerate(WHEEL_LABELS):
        print(f"  {label:<6} {wheel_speeds[i]:>10.2f} {mag_angles[i]:>10.2f}")

    time.sleep(1)