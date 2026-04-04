import time
from typing import List, Tuple

from database import SessionLocal, Task, TaskGeneratedPoint
from pixhawk_reader import get_connection_lock, get_shared_master, set_mission_transfer_in_progress
from pymavlink import mavutil

DEFAULT_ALT = 10.0
REQUEST_TIMEOUT = 10
MAX_TIMEOUT_RETRIES = 5
MAX_SEND_RETRIES_PER_SEQ = 3
RETRY_DELAY_SEC = 0.5


def load_task_waypoints(task_id: int) -> List[Tuple[float, float]]:
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        if not task:
            raise ValueError(f"Task {task_id} not found")

        points = (
            db.query(TaskGeneratedPoint)
            .filter(TaskGeneratedPoint.task_id == task_id)
            .order_by(TaskGeneratedPoint.sequence_order)
            .all()
        )

        waypoints = [
            (float(point.latitude), float(point.longitude))
            for point in points
            if point.latitude is not None and point.longitude is not None
        ]
        if not waypoints:
            raise ValueError(f"No generated points found for task {task_id}")

        return waypoints
    finally:
        db.close()


def send_mission_count(connection, count):
    connection.mav.mission_count_send(
        connection.target_system,
        connection.target_component,
        count,
    )


def send_waypoint(connection, req_type, seq, lat, lon):
        connection.mav.mission_item_int_send(
            connection.target_system,
            connection.target_component,
            seq,
            mavutil.mavlink.MAV_FRAME_GLOBAL_RELATIVE_ALT,
            mavutil.mavlink.MAV_CMD_NAV_WAYPOINT,
            0,
            1,
            0,
            0,
            0,
            0,
            int(lat * 1e7),
            int(lon * 1e7),
            DEFAULT_ALT,
        )


def upload_task_mission(task_id: int):
    connection = get_shared_master()
    if connection is None:
        raise RuntimeError("Pixhawk connection is not available")

    waypoints = load_task_waypoints(task_id)
    set_mission_transfer_in_progress(True)
    try:
        with get_connection_lock():
            send_mission_count(connection, len(waypoints))

            sent_sequences = set()
            last_completed_seq = -1
            timeout_retries = 0

            while len(sent_sequences) < len(waypoints):
                msg = connection.recv_match(
                    type=["MISSION_REQUEST_INT", "MISSION_REQUEST"],
                    blocking=True,
                    timeout=REQUEST_TIMEOUT,
                )

                if msg is None:
                    timeout_retries += 1
                    if timeout_retries > MAX_TIMEOUT_RETRIES:
                        raise TimeoutError("Timed out waiting for mission request from Pixhawk")

                    send_mission_count(connection, len(waypoints))
                    continue

                timeout_retries = 0
                req_type = msg.get_type()
                seq = msg.seq

                if seq >= len(waypoints):
                    continue

                lat, lon = waypoints[seq]
                sent_ok = False
                for attempt in range(1, MAX_SEND_RETRIES_PER_SEQ + 1):
                    try:
                        send_waypoint(connection, req_type, seq, lat, lon)
                        sent_ok = True
                        break
                    except Exception:
                        if attempt < MAX_SEND_RETRIES_PER_SEQ:
                            time.sleep(RETRY_DELAY_SEC)

                if not sent_ok:
                    raise RuntimeError(f"Failed to send waypoint seq={seq}")

                sent_sequences.add(seq)
                if seq > last_completed_seq:
                    last_completed_seq = seq

            ack = connection.recv_match(type="MISSION_ACK", blocking=True, timeout=10)
            if ack is None:
                return {
                    "status": "completed_without_ack",
                    "task_id": task_id,
                    "waypoints_sent": len(waypoints),
                }

            return {
                "status": "mission_uploaded",
                "task_id": task_id,
                "waypoints_sent": len(waypoints),
                "ack_type": ack.get_type(),
            }
    finally:
        set_mission_transfer_in_progress(False)