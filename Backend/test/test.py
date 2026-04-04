import math

def haversine_distance(lat1, lon1, lat2, lon2):
    # Radius of Earth in meters
    R = 6371000  

    # Convert degrees to radians
    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    # Differences
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    # Haversine formula
    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    # Distance in meters
    distance = R * c

    return distance


# 🔹 Example usage
lat1, lon1 =  17.39675062377837 , 78.49014976453466
lat2, lon2 = 17.396750984508675 , 78.49017843289745

# 17.39675062377837 | 78.49014976453466
# 17.396750984508675 | 78.49017843289745

dist = haversine_distance(lat1, lon1, lat2, lon2)

print(f"Distance: {dist:.4f} meters")