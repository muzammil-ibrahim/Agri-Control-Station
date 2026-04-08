"""
Mission generation and geofence processing utilities
"""
import os
import csv
from statistics import mean
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


# def generate_mission_points(
#     geofence_path: str,
#     col_spacing_ft: float = 0,
#     row_spacing_ft: float = 0,
#     border_margin_ft: float = 0,
#     output_points_path: str = None,
#     output_geofence_path: str = None,
# ) -> Dict:
#     """
#     Generate mission grid points from geofence CSV.
    
#     Args:
#         geofence_path: Path to geofence CSV with latitude/longitude columns
#         col_spacing_ft: Column spacing in feet
#         row_spacing_ft: Row spacing in feet
#         border_margin_ft: Border margin in feet
#         output_points_path: Optional path to save generated points CSV
#         output_geofence_path: Optional path to save converted geofence CSV
    
#     Returns:
#         Dictionary with generated points and metadata
#     """
#     try:
#         # Convert feet → meters
#         ft_to_m = 0.3048
#         col_spacing_m = col_spacing_ft * ft_to_m
#         row_spacing_m = row_spacing_ft * ft_to_m
#         border_margin_m = border_margin_ft * ft_to_m

#         # Load geofence CSV
#         df_geofence = pd.read_csv(geofence_path)
        
#         if df_geofence.empty:
#             raise ValueError("Geofence CSV is empty")

#         # Detect UTM zone and transformer
#         mean_lon = df_geofence["longitude"].mean()
#         mean_lat = df_geofence["latitude"].mean()
#         epsg_code = get_epsg_code(mean_lat, mean_lon)
        
#         transformer = Transformer.from_crs("EPSG:4326", epsg_code, always_xy=True)

#         # Reference point
#         ref_lat = df_geofence["latitude"].min()
#         ref_lon = df_geofence["longitude"].min()
#         ref_x, ref_y = transformer.transform(ref_lon, ref_lat)

#         # Convert geofence to UTM (field-relative coordinates)
#         df_geofence["x_m"], df_geofence["y_m"] = transformer.transform(
#             df_geofence["longitude"].values,
#             df_geofence["latitude"].values
#         )
#         df_geofence["x"] = (df_geofence["x_m"] - ref_x) * 100
#         df_geofence["y"] = (df_geofence["y_m"] - ref_y) * 100
        
#         # Save converted geofence if path provided
#         if output_geofence_path:
#             df_geofence[["x", "y"]].to_csv(output_geofence_path, index=False)

#         # Create polygon & shrink
#         poly = Polygon(zip(df_geofence["x_m"], df_geofence["y_m"]))
#         poly_shrunk = poly.buffer(-border_margin_m)

#         # Generate grid points
#         min_x, min_y, max_x, max_y = poly_shrunk.bounds
#         points_x = np.arange(min_x, max_x, col_spacing_m)
#         points_y = np.arange(min_y, max_y, row_spacing_m)

#         grid_points = []
#         for y in points_y:
#             for x in points_x:
#                 if poly_shrunk.contains(Point(x, y)):
#                     grid_points.append(((x - ref_x) * 100, (y - ref_y) * 100))

#         # Save points CSV if path provided
#         if output_points_path:
#             df_points = pd.DataFrame(grid_points, columns=["x", "y"])
#             df_points.to_csv(output_points_path, index=False)

#         return {
#             "status": "success",
#             "total_points": len(grid_points),
#             "points": [{"x": p[0], "y": p[1]} for p in grid_points],
#             "params": {
#                 "col_spacing_ft": col_spacing_ft,
#                 "row_spacing_ft": row_spacing_ft,
#                 "border_margin_ft": border_margin_ft
#             }
#         }

#     except Exception as e:
#         return {"status": "error", "message": str(e)}





def get_longest_edge_angle(polygon: Polygon) -> float:
    """Returns the angle (radians) of the longest edge of the polygon exterior."""
    coords = list(polygon.exterior.coords)
    longest_len = 0
    angle = 0.0
    for i in range(len(coords) - 1):
        x1, y1 = coords[i]
        x2, y2 = coords[i + 1]
        edge_len = np.hypot(x2 - x1, y2 - y1)
        if edge_len > longest_len:
            longest_len = edge_len
            angle = np.arctan2(y2 - y1, x2 - x1)
    return angle


def generate_mission_points(
    geofence_path: str,
    col_spacing_ft: float = 0,
    row_spacing_ft: float = 0,
    border_margin_ft: float = 0,
    output_points_path: str = None,
    output_geofence_path: str = None,
) -> Dict:
    """
    Generate mission grid points aligned to the longest edge of the field polygon.

    Args:
        geofence_path: Path to geofence CSV with latitude/longitude columns
        col_spacing_ft: Column spacing in feet (along field direction)
        row_spacing_ft: Row spacing in feet (across field direction)
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

        # Detect UTM zone and build transformer
        mean_lon = df_geofence["longitude"].mean()
        mean_lat = df_geofence["latitude"].mean()
        epsg_code = get_epsg_code(mean_lat, mean_lon)
        transformer = Transformer.from_crs("EPSG:4326", epsg_code, always_xy=True)

        # Reference point (for relative cm-scale output)
        ref_lat = df_geofence["latitude"].min()
        ref_lon = df_geofence["longitude"].min()
        ref_x, ref_y = transformer.transform(ref_lon, ref_lat)

        # Convert geofence vertices to UTM
        utm_x, utm_y = transformer.transform(
            df_geofence["longitude"].values,
            df_geofence["latitude"].values,
        )
        df_geofence["x_m"] = utm_x
        df_geofence["y_m"] = utm_y
        df_geofence["x"] = (utm_x - ref_x) * 100
        df_geofence["y"] = (utm_y - ref_y) * 100

        if output_geofence_path:
            df_geofence[["x", "y"]].to_csv(output_geofence_path, index=False)

        # Build polygon in UTM and shrink by margin
        poly = Polygon(zip(utm_x, utm_y))
        poly_shrunk = poly.buffer(-border_margin_m)
        if poly_shrunk.is_empty:
            raise ValueError("Border margin is too large; polygon collapsed.")

        # ── KEY FIX: align grid to longest edge ──────────────────────────────
        # Use the shrunk polygon for angle detection (more robust to margin)
        base_poly = poly_shrunk if isinstance(poly_shrunk, Polygon) else poly
        angle = get_longest_edge_angle(base_poly)

        # Rotation matrices: rotate field → axis-aligned, then back
        cos_a, sin_a = np.cos(-angle), np.sin(-angle)   # forward (field→axis)
        cos_b, sin_b = np.cos(angle),  np.sin(angle)    # inverse (axis→field)

        def rotate_fwd(x, y):
            return cos_a * x - sin_a * y, sin_a * x + cos_a * y

        def rotate_inv(x, y):
            return cos_b * x - sin_b * y, sin_b * x + cos_b * y

        # Rotate the shrunk polygon into the aligned frame
        shrunk_coords = np.array(poly_shrunk.exterior.coords)
        rot_x, rot_y = rotate_fwd(shrunk_coords[:, 0], shrunk_coords[:, 1])
        poly_rot = Polygon(zip(rot_x, rot_y))

        min_x, min_y, max_x, max_y = poly_rot.bounds
        xs = np.arange(min_x, max_x, col_spacing_m)
        ys = np.arange(min_y, max_y, row_spacing_m)

        # Sample grid in the rotated frame, keep points inside, rotate back
        grid_points = []
        for y in ys:
            for x in xs:
                if poly_rot.contains(Point(x, y)):
                    # Rotate back to UTM
                    rx, ry = rotate_inv(x, y)
                    # Convert to field-relative cm
                    grid_points.append(
                        ((rx - ref_x) * 100, (ry - ref_y) * 100)
                    )

        if output_points_path:
            pd.DataFrame(grid_points, columns=["x", "y"]).to_csv(
                output_points_path, index=False
            )

        return {
            "status": "success",
            "total_points": len(grid_points),
            "points": [{"x": p[0], "y": p[1]} for p in grid_points],
            "params": {
                "col_spacing_ft": col_spacing_ft,
                "row_spacing_ft": row_spacing_ft,
                "border_margin_ft": border_margin_ft,
                "field_angle_deg": round(np.degrees(angle), 2),
            },
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


def transform_latlon_lists_to_xy(
    geofence_latlon: List[Dict[str, float]],
    points_latlon: List[Dict[str, float]],
) -> Dict:
    """
    Transform geofence and mission points from lat/lon to field-relative XY.

    This uses the same projection and reference-point logic as generate_mission_points
    so visualization coordinates match mission generation behavior.
    """
    if not geofence_latlon:
        return {"status": "error", "message": "Geofence points are required"}

    try:
        df_geofence = pd.DataFrame(geofence_latlon)
        if "latitude" not in df_geofence.columns or "longitude" not in df_geofence.columns:
            raise ValueError("Geofence points must contain latitude and longitude")

        mean_lon = df_geofence["longitude"].mean()
        mean_lat = df_geofence["latitude"].mean()
        epsg_code = get_epsg_code(mean_lat, mean_lon)
        transformer = Transformer.from_crs("EPSG:4326", epsg_code, always_xy=True)

        ref_lat = df_geofence["latitude"].min()
        ref_lon = df_geofence["longitude"].min()
        ref_x, ref_y = transformer.transform(ref_lon, ref_lat)

        g_x_m, g_y_m = transformer.transform(df_geofence["longitude"].values, df_geofence["latitude"].values)
        geofence_xy = [
            {"x": float((x_m - ref_x) * 100), "y": float((y_m - ref_y) * 100)}
            for x_m, y_m in zip(g_x_m, g_y_m)
        ]

        points_xy: List[Dict[str, float]] = []
        if points_latlon:
            df_points = pd.DataFrame(points_latlon)
            if "latitude" not in df_points.columns or "longitude" not in df_points.columns:
                raise ValueError("Mission points must contain latitude and longitude")

            p_x_m, p_y_m = transformer.transform(df_points["longitude"].values, df_points["latitude"].values)
            points_xy = [
                {"x": float((x_m - ref_x) * 100), "y": float((y_m - ref_y) * 100)}
                for x_m, y_m in zip(p_x_m, p_y_m)
            ]

        return {
            "status": "success",
            "geofence": geofence_xy,
            "points": points_xy,
            "reference": {"epsg": epsg_code},
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


def clear_csv_files(file_paths: List[str]):
    """Clear CSV files by writing empty headers."""
    for file_path in file_paths:
        try:
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            pd.DataFrame(columns=["x", "y"]).to_csv(file_path, index=False)
        except Exception as e:
            print(f"Error clearing {file_path}: {e}")
