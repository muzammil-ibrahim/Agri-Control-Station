from smbus2 import SMBus
from pymavlink import mavutil
import time

# ==============================
# CONFIG
# ==============================
I2C_BUS = 1
ESP_ADDRESSES = [0x10, 0x11, 0x12, 0x13, 0x14]

PIXHAWK_PORT = '/dev/ttyACM0'
PIXHAWK_BAUD = 921600

# ==============================
# CONNECT TO PIXHAWK
# ==============================
print("Connecting to Pixhawk...")
master = mavutil.mavlink_connection(
    '/dev/ttyACM1',
    baud=115200,
    source_system=1,
    source_component=191
)
master.wait_heartbeat()
print("Connected to Pixhawk")

# ==============================
# READ ONE ESP
# ==============================
def read_esp(bus, address):

    try:
        # Send GET properly
        bus.write_i2c_block_data(
            address,
            ord('G'),
            [ord('E'), ord('T')]
        )

        time.sleep(0.05)

        data = bus.read_i2c_block_data(address, 0, 32)

        # Remove null padding
        clean_bytes = []
        for b in data:
            if b == 0:
                break
            clean_bytes.append(b)

        response = ''.join(chr(x) for x in clean_bytes)
        return response.strip()

    except Exception as e:
        print(f"I2C Error at {hex(address)}:", e)
        return None


# ==============================
# MAIN LOOP
# ==============================
ADDRESS_TO_ID = {
    0x10: 1,
    0x11: 2,
    0x12: 3,
    0x13: 4,
    0x14: 5
}

while True:

    with SMBus(I2C_BUS) as bus:

        for addr in ESP_ADDRESSES:

            response = read_esp(bus, addr)

            device_id = ADDRESS_TO_ID.get(addr, 0)

            if not response:

                print(f"I2C FAIL for BMS {device_id}")

                # Send 0V to indicate failure
                master.mav.battery_status_send(
                    device_id,
                    0,
                    0,
                    0,
                    [0] + [0]*9,
                    -1,
                    -1,
                    -1,
                    -1,
                    0
                )

                print(f"Sent MAVLink ERROR for ID {device_id}\n")

                continue
            print(f"RAW from {hex(addr)}:", response)

            try:
                values = {}
                parts = response.split(',')

                for p in parts:
                    if '=' in p:
                        k, v = p.split('=')
                        values[k.strip()] = float(v.strip())

                # 🔥 ID based on I2C address
                device_id = ADDRESS_TO_ID.get(addr, 0)

                temperature = values.get("T", 0)
                voltage = values.get("V", 0)

                print("ID:", device_id,
                      "Temp:", temperature,
                      "Volt:", voltage)

                voltage_mv = int(voltage * 1000)
                temperature_cd = int(temperature * 100)

                master.mav.battery_status_send(
                    device_id,
                    0,
                    0,
                    temperature_cd,
                    [voltage_mv] + [0]*9,
                    -1,
                    -1,
                    -1,
                    -1,
                    0
                )

                print(f"Sent MAVLink for ID {device_id}\n")

            except Exception as e:

                device_id = ADDRESS_TO_ID.get(addr, 0)

                print(f"I2C FAIL for BMS {device_id}")

                # Send 0V to indicate failure
                master.mav.battery_status_send(
                    device_id,
                    0,
                    0,
                    0,
                    [0] + [0]*9,   # Voltage = 0 mV
                    -1,
                    -1,
                    -1,
                    -1,
                    0
                )

                continue

    time.sleep(1)