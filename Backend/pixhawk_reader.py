from pymavlink import mavutil
import asyncio
import time

PIXHAWK_PORT = "COM10"
BAUDRATE = 57600


GPS_FIX_MAP = {
    0: "No GPS",
    1: "No Fix",
    2: "2D Fix",
    3: "3D Fix",
    4: "DGPS",
    5: "RTK Float",
    6: "RTK Fixed"
}


class PixhawkReader:

    def __init__(self, vehicle_state):
        self.vehicle_state = vehicle_state
        self.master = None
        self.last_rc_update = 0
        self.connected = False

    async def connect(self):

        while True:
            try:
                print("Connecting to Pixhawk...")

                self.master = mavutil.mavlink_connection(
                    PIXHAWK_PORT,
                    baud=BAUDRATE
                )

                self.master.wait_heartbeat(timeout=5)

                print("✅ Pixhawk Connected")
                self.connected = True
                return

            except Exception as e:
                print(f"❌ Pixhawk not found: {e}")
                self.connected = False
                await asyncio.sleep(3)   # wait before retry

    async def read_loop(self):

        while True:

            # ---------------- CONNECT IF NOT CONNECTED ----------------
            if not self.connected:
                await self.connect()

            try:
                msg = self.master.recv_match(blocking=False)

                if msg is None:
                    await asyncio.sleep(0.01)
                    continue

                msg_type = msg.get_type()

                # ---------------- VFR_HUD ----------------
                if msg_type == "VFR_HUD":
                    self.vehicle_state.heading = msg.heading
                    self.vehicle_state.speed = round(msg.groundspeed * 3.6, 2)

                # ---------------- GPS ----------------
                elif msg_type == "GPS_RAW_INT":
                    self.vehicle_state.gnss_satellites = msg.satellites_visible
                    self.vehicle_state.gps_status = GPS_FIX_MAP.get(
                        msg.fix_type, "Unknown"
                    )

                # ---------------- HEARTBEAT ----------------
                elif msg_type == "HEARTBEAT":
                    self.vehicle_state.vehicle_mode = self.master.flightmode


                 # ---------------- Location ----------------
                elif msg_type == "GLOBAL_POSITION_INT":
                    self.vehicle_state.lat = msg.lat / 1e7
                    self.vehicle_state.lon = msg.lon / 1e7

                
                # ---------------- RC CONNECTION ----------------
                elif msg_type == "RC_CHANNELS":

                    self.last_rc_update = time.time()

                    if msg.rssi > 0:
                        self.vehicle_state.rc_connection = True
                
                # RC timeout detection
                if time.time() - self.last_rc_update > 1.0:
                    self.vehicle_state.rc_connection = False


            except Exception as e:
                print("⚠️ Connection lost:", e)
                self.connected = False
                self.master = None
                await asyncio.sleep(2)

            await asyncio.sleep(0.01)
