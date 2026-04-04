# fast_receiver_simple.py

from pymavlink import mavutil

PORT = 'COM10'

master = mavutil.mavlink_connection(PORT)

received = set()
max_seq = -1

print("Listening...")

while True:
    msg = master.recv_match(blocking=True)

    if not msg:
        continue

    t = msg.get_type()

    if t == "MISSION_ITEM_INT":
        seq = msg.seq
        received.add(seq)

        if seq > max_seq:
            max_seq = seq

    elif t == "COMMAND_LONG":
        if msg.command == 3000:
            print("END received")

            missing = [i for i in range(max_seq+1) if i not in received]

            print("Missing:", missing[:10], "... total:", len(missing))
            break