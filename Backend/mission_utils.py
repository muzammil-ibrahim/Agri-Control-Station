"""
Mission generation and geofence processing utilities
"""
import os
import csv
import pandas as pd
import numpy as np
from pyproj import Transformer
from shapely.geometry import Polygon, Point
from typing import List, Tuple, Dict


def utm_zone_from_lon(lon: float) -> int:
    """Calculate UTM zone from longitude."""
    return int((lon + 180) / 6) + 1


def get_epsg_code(lat: float, lon: float) -> str:
    """Get EPSG code for given lat/lon."""
    zone = utm_zone_from_lon(lon)
    if lat >= 0:
        return f"EPSG:{32600 + zone}"
    else:
        return f"EPSG:{32700 + zone}"


def generate_mission_points(
    geofence_path: str,
    col_spacing_ft: float = 4,
    row_spacing_ft: float = 10,
    border_margin_ft: float = 4,
    output_points_path: str = None,
    output_geofence_path: str = None,
) -> Dict:
    """
    Generate mission grid points from geofence CSV.
    
    Args:
        geofence_path: Path to geofence CSV with latitude/longitude columns
        col_spacing_ft: Column spacing in feet
        row_spacing_ft: Row spacing in feet
        border_margin_ft: Border margin in feet
        output_points_path: Optional path to save generated points CSV
        output_geofence_path: Optional path to save converted geofence CSV
    
    Returns:
        Dictionary with generated points and metadata
    """
    try:
        # Convert feet → meters
        ft_to_m = 0.3048
        col_spacing_m = col_spacing_ft * ft_to_m
        row_spacing_m = row_spacing_ft * ft_to_m
        border_margin_m = border_margin_ft * ft_to_m

        # Load geofence CSV
        df_geofence = pd.read_csv(geofence_path)
        
        if df_geofence.empty:
            raise ValueError("Geofence CSV is empty")

        # Detect UTM zone and transformer
        mean_lon = df_geofence["longitude"].mean()
        mean_lat = df_geofence["latitude"].mean()
        epsg_code = get_epsg_code(mean_lat, mean_lon)
        
        transformer = Transformer.from_crs("EPSG:4326", epsg_code, always_xy=True)

        # Reference point
        ref_lat = df_geofence["latitude"].min()
        ref_lon = df_geofence["longitude"].min()
        ref_x, ref_y = transformer.transform(ref_lon, ref_lat)

        # Convert geofence to UTM (field-relative coordinates)
        df_geofence["x_m"], df_geofence["y_m"] = transformer.transform(
            df_geofence["longitude"].values,
            df_geofence["latitude"].values
        )
        df_geofence["x"] = (df_geofence["x_m"] - ref_x) * 100
        df_geofence["y"] = (df_geofence["y_m"] - ref_y) * 100
        
        # Save converted geofence if path provided
        if output_geofence_path:
            df_geofence[["x", "y"]].to_csv(output_geofence_path, index=False)

        # Create polygon & shrink
        poly = Polygon(zip(df_geofence["x_m"], df_geofence["y_m"]))
        poly_shrunk = poly.buffer(-border_margin_m)

        # Generate grid points
        min_x, min_y, max_x, max_y = poly_shrunk.bounds
        points_x = np.arange(min_x, max_x, col_spacing_m)
        points_y = np.arange(min_y, max_y, row_spacing_m)

        grid_points = []
        for y in points_y:
            for x in points_x:
                if poly_shrunk.contains(Point(x, y)):
                    grid_points.append(((x - ref_x) * 100, (y - ref_y) * 100))

        # Save points CSV if path provided
        if output_points_path:
            df_points = pd.DataFrame(grid_points, columns=["x", "y"])
            df_points.to_csv(output_points_path, index=False)

        return {
            "status": "success",
            "total_points": len(grid_points),
            "points": [{"x": p[0], "y": p[1]} for p in grid_points],
            "params": {
                "col_spacing_ft": col_spacing_ft,
                "row_spacing_ft": row_spacing_ft,
                "border_margin_ft": border_margin_ft
            }
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


def convert_points_to_latlon(
    geofence_path: str,
    points_path: str,
    output_path: str = None
) -> pd.DataFrame:
    """
    Convert field-relative XY coordinates back to lat/lon.
    
    Args:
        geofence_path: Path to geofence CSV
        points_path: Path to points CSV with x, y columns
        output_path: Optional path to save converted coordinates
    
    Returns:
        DataFrame with latitude and longitude columns
    """
    try:
        # Load geofence to recover reference and transformer
        df_geofence = pd.read_csv(geofence_path)

        # Setup transformer (same logic as generate_mission_points)
        mean_lon = df_geofence["longitude"].mean()
        mean_lat = df_geofence["latitude"].mean()
        epsg_code = get_epsg_code(mean_lat, mean_lon)
        
        transformer_to_utm = Transformer.from_crs("EPSG:4326", epsg_code, always_xy=True)
        transformer_to_latlon = Transformer.from_crs(epsg_code, "EPSG:4326", always_xy=True)

        # Reference point
        ref_lat = df_geofence["latitude"].min()
        ref_lon = df_geofence["longitude"].min()
        ref_x, ref_y = transformer_to_utm.transform(ref_lon, ref_lat)

        # Load points CSV
        df_points = pd.read_csv(points_path)

        # Convert back: x,y → UTM → lat/lon
        x_m = df_points["x"].values / 100 + ref_x
        y_m = df_points["y"].values / 100 + ref_y
        lon, lat = transformer_to_latlon.transform(x_m, y_m)

        # Result
        df_result = pd.DataFrame({
            "latitude": lat,
            "longitude": lon
        })

        # Save if path provided
        if output_path:
            df_result.to_csv(output_path, index=False)

        return df_result

    except Exception as e:
        raise RuntimeError(f"Conversion failed: {e}")


def clear_csv_files(file_paths: List[str]):
    """Clear CSV files by writing empty headers."""
    for file_path in file_paths:
        try:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            pd.DataFrame(columns=["x", "y"]).to_csv(file_path, index=False)
        except Exception as e:
            print(f"Error clearing {file_path}: {e}")
