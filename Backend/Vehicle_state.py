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
        "B1": 0,
        "B2": 0,
        "B3": 0,
        "B4": 0,
        "B5": 0,
    },

    actuator_x=0,
    actuator_y=0,

    wheels={
        "front_left": WheelData(rpm=0, angle=0),
        "front_right": WheelData(rpm=0, angle=0),
        "rear_left": WheelData(rpm=0, angle=0),
        "rear_right": WheelData(rpm=0, angle=0),
    },

    four_ws_active=True
)
