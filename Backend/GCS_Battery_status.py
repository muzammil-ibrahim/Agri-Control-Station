from pymavlink import mavutil

# Connect to telemetry radio
master = mavutil.mavlink_connection('COM3', baud=57600)

master.wait_heartbeat()
print("Connected to vehicle")
master.mav.command_long_send(
                    master.target_system,
                    master.target_component,
                    mavutil.mavlink.MAV_CMD_SET_MESSAGE_INTERVAL, 
                    0,
                    mavutil.mavlink.MAVLINK_MSG_ID_BATTERY_STATUS,
                    1000000,  # 1 second
                    0,0,0,0,0
                )

print("🔋 Requested BATTERY_STATUS stream")

while True:
    msg = master.recv_match(type='BATTERY_STATUS', blocking=True)
    
    if msg:
        print("Battery ID:", msg.id)
        print("Voltage (mV):", msg.voltages[0])
        print("Current (cA):", msg.current_battery)
        print("-----------------------")