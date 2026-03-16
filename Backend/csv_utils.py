"""
CSV file management utilities
"""
import os
import csv
from typing import List, Tuple, Optional
from datetime import datetime


class CSVDataLogger:
    """Handle logging of GPS/position data to CSV files."""
    
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.ensure_directory()
        self.initialize_file()
    
    def ensure_directory(self):
        """Create directory if it doesn't exist."""
        directory = os.path.dirname(self.filepath)
        if directory:
            os.makedirs(directory, exist_ok=True)
    
    def initialize_file(self):
        """Initialize CSV with headers if it doesn't exist."""
        if not os.path.exists(self.filepath):
            with open(self.filepath, mode="w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(["latitude", "longitude", "label", "timestamp", "fix_quality", "h_accuracy"])
    
    def log_point(self, lat: float, lon: float, label: str = None, 
                  timestamp: str = None, fix_quality: str = None, h_accuracy: float = None):
        """Log a single GPS point to CSV."""
        if not timestamp:
            timestamp = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
        
        with open(self.filepath, mode="a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([lat, lon, label or "", timestamp, fix_quality or "", h_accuracy or ""])
    
    def clear(self):
        """Clear the CSV file and reinitialize."""
        self.initialize_file()
    
    def get_last_point(self) -> Optional[Tuple[float, float]]:
        """Get the last logged point's coordinates."""
        try:
            with open(self.filepath, mode="r") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                if rows:
                    last = rows[-1]
                    return float(last["latitude"]), float(last["longitude"])
        except Exception as e:
            print(f"Error reading last point: {e}")
        return None


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance between two points on Earth.
    
    Args:
        lat1, lon1: First point coordinates
        lat2, lon2: Second point coordinates
    
    Returns:
        Distance in meters
    """
    import math
    R = 6371000  # Earth's radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def get_fix_quality_name(fix_type: int) -> str:
    """Convert fix type code to human-readable string."""
    fix_quality_map = {
        0: "No Fix",
        1: "Dead Reckoning",
        2: "2D-Fix",
        3: "3D-Fix",
        4: "RTK-Float",
        5: "RTK-Fixed"
    }
    return fix_quality_map.get(fix_type, "Unknown")
