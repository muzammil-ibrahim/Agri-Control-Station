from pymavlink import mavutil
import struct

SENSOR_PAYLOAD_TYPE = 32800
SENSOR_FMT = '<ffffffff'   # 8 floats
WHEEL_LABELS = ['FL', 'FR', 'RL', 'RR']

gcs = mavutil.mavlink_connection('COM3', baud=57600)
gcs.wait_heartbeat()
print("GCS connected\n")

gcs.mav.request_data_stream_send(
    gcs.target_system,
    gcs.target_component,
    mavutil.mavlink.MAV_DATA_STREAM_ALL,
    10,   # 10 Hz
    1     # start
)

while True:

    msg = gcs.recv_match(
        type=['NAMED_VALUE_FLOAT', 'BATTERY_STATUS'],
        blocking=True
    )

    if msg.get_type() == 'NAMED_VALUE_FLOAT':
        name = msg.name.decode().strip('\x00')
        value = msg.value

        print(f"[SENSOR] {name} : {value:.2f}")

    elif msg.get_type() == 'BATTERY_STATUS':
        voltage = msg.voltages[0] / 1000.0
        temp = msg.temperature / 100.0

        print(f"[BATTERY] {voltage:.2f}V  {temp:.1f}°C")