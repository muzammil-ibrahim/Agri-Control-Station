import paho.mqtt.client as mqtt

BROKER_IP = "10.11.102.126"

def on_connect(client, userdata, flags, rc):
    print("Connected")
    client.subscribe("agrobot/+/data")

def on_message(client, userdata, msg):

    topic = msg.topic
    payload = msg.payload.decode()

    device_id = topic.split("/")[1]

    print(f"Device: {device_id}")
    print(f"Data: {payload}")
    print("----------------")

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER_IP,1883)

client.loop_forever()