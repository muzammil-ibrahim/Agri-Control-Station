from models import VehicleData, WheelData

vehicle_state = VehicleData(
    lat = 0,
    lon = 0,
    connected=False,
    speed=0,
    heading=0,
    gps_status="No GPS",
    vehicle_mode="Auto",
    gnss_satellites=0,
    camera=False,
    rc_connection=False,

    batteries={
        "B1": 60,
        "B2": 50,
        "B3": 20,
        "B4": 50,
        "B5": 10,
    },

    actuator_x=100,
    actuator_y=30,

    wheels={
        "front_left": WheelData(rpm=20, angle=-45),
        "front_right": WheelData(rpm=42, angle=-30),
        "rear_left": WheelData(rpm=39, angle=45),
        "rear_right": WheelData(rpm=41, angle=30),
    },

    four_ws_active=True
)
