from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
import csv
import io
import os
import tempfile
import threading
from database import get_db, init_db
from database import (
    Farm, Field, GeoPoint, CropSeason, Vehicle, Task, TaskExecution, TaskGeneratedPoint,
    Alert, CropLog, GrowthObservation, PestRecord, DiseaseRecord,
    SoilTest, TreatmentRecord, HarvestRecord, LogTag
)
from mission_utils import generate_mission_points, convert_points_to_latlon, transform_latlon_lists_to_xy
from mission_sender import upload_task_mission
from pixhawk_reader import is_mission_transfer_in_progress
from schemas import (
    Farm as FarmSchema, FarmCreate, FarmUpdate,
    Field as FieldSchema, FieldCreate, FieldUpdate,
    GeoPoint as GeoPointSchema, GeoPointCreate,
    CropSeason as CropSeasonSchema, CropSeasonCreate, CropSeasonUpdate,
    Vehicle as VehicleSchema, VehicleCreate,
    Task as TaskSchema, TaskCreate, TaskUpdate,
    TaskGeneratedPoint as TaskGeneratedPointSchema,
    TaskExecution as TaskExecutionSchema, TaskExecutionCreate,
    Alert as AlertSchema, AlertCreate,
    CropLog as CropLogSchema, CropLogCreate,
    GrowthObservation as GrowthObservationSchema, GrowthObservationCreate,
    PestRecord as PestRecordSchema, PestRecordCreate,
    DiseaseRecord as DiseaseRecordSchema, DiseaseRecordCreate,
    SoilTest as SoilTestSchema, SoilTestCreate,
    TreatmentRecord as TreatmentRecordSchema, TreatmentRecordCreate,
    HarvestRecord as HarvestRecordSchema, HarvestRecordCreate,
    LogTag as LogTagSchema, LogTagCreate
)

router = APIRouter(prefix="/api", tags=["api"])

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_DATA_DIR = os.path.join(BASE_DIR, "CSV_data")
GEOFENCE_INPUT_PATH = os.path.join(CSV_DATA_DIR, "geofence.csv")


# =====================
# FARMS
# =====================
@router.get("/farms", response_model=List[FarmSchema])
def get_farms(db: Session = Depends(get_db)):
    return db.query(Farm).order_by(Farm.created_at).all()


@router.get("/farms/{farm_id}", response_model=FarmSchema)
def get_farm(farm_id: int, db: Session = Depends(get_db)):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    return farm


@router.post("/farms", response_model=FarmSchema)
def create_farm(farm: FarmCreate, db: Session = Depends(get_db)):
    db_farm = Farm(**farm.dict())
    db.add(db_farm)
    db.commit()
    db.refresh(db_farm)
    return db_farm


@router.put("/farms/{farm_id}", response_model=FarmSchema)
def update_farm(farm_id: int, farm: FarmUpdate, db: Session = Depends(get_db)):
    db_farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not db_farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    update_data = farm.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_farm, key, value)
    
    db.commit()
    db.refresh(db_farm)
    return db_farm


@router.delete("/farms/{farm_id}")
def delete_farm(farm_id: int, db: Session = Depends(get_db)):
    db_farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not db_farm:
        raise HTTPException(status_code=404, detail="Farm not found")
    
    db.delete(db_farm)
    db.commit()
    return {"message": "Farm deleted successfully"}


# =====================
# FIELDS
# =====================
@router.get("/fields", response_model=List[FieldSchema])
def get_fields(farm_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    query = db.query(Field)
    if farm_id:
        query = query.filter(Field.farm_id == farm_id)
    return query.order_by(Field.created_at).all()


@router.get("/fields/{field_id}", response_model=FieldSchema)
def get_field(field_id: int, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field


@router.post("/fields", response_model=FieldSchema)
def create_field(field: FieldCreate, db: Session = Depends(get_db)):
    db_field = Field(**field.dict())
    db.add(db_field)
    db.commit()
    db.refresh(db_field)
    return db_field


@router.post("/fields/upload-csv")
async def create_field_with_geo_csv(
    farm_id: int = Form(...),
    name: str = Form(...),
    area_hectares: Optional[float] = Form(None),
    soil_type: Optional[str] = Form(None),
    csv_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    farm = db.query(Farm).filter(Farm.id == farm_id).first()
    if not farm:
        raise HTTPException(status_code=404, detail="Farm not found")

    if not csv_file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    file_bytes = await csv_file.read()
    try:
        content = file_bytes.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="CSV file must be UTF-8 encoded")

    reader = csv.DictReader(io.StringIO(content))
    if not reader.fieldnames:
        raise HTTPException(status_code=400, detail="CSV file has no header row")

    rows = list(reader)
    if not rows:
        raise HTTPException(status_code=400, detail="CSV file has no data rows")

    field = Field(
        farm_id=farm_id,
        name=name,
        area_hectares=area_hectares,
        soil_type=soil_type,
    )
    db.add(field)
    db.flush()

    def pick_value(row: dict, keys: List[str]):
        for key in keys:
            if key in row and row[key] not in (None, ""):
                return row[key]
        return None

    geo_points_to_insert: List[GeoPoint] = []
    for index, row in enumerate(rows, start=1):
        lat_raw = pick_value(row, ["latitude", "lat", "Latitude", "Lat"])
        lng_raw = pick_value(row, ["longitude", "lng", "lon", "Longitude", "Lng", "Lon"])
        seq_raw = pick_value(row, ["sequence_order", "sequence", "order", "id", "point_id"])

        if lat_raw is None or lng_raw is None:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Missing latitude/longitude values in CSV row {index}",
            )

        try:
            lat = float(lat_raw)
            lng = float(lng_raw)
            sequence_order = int(seq_raw) if seq_raw is not None else index
        except ValueError:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Invalid numeric value in CSV row {index}",
            )

        geo_points_to_insert.append(
            GeoPoint(
                field_id=field.id,
                lat=lat,
                lng=lng,
                sequence_order=sequence_order,
            )
        )

    db.add_all(geo_points_to_insert)
    db.commit()
    db.refresh(field)

    return {
        "field": field,
        "geo_points_inserted": len(geo_points_to_insert),
    }


@router.put("/fields/{field_id}", response_model=FieldSchema)
def update_field(field_id: int, field: FieldUpdate, db: Session = Depends(get_db)):
    db_field = db.query(Field).filter(Field.id == field_id).first()
    if not db_field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    update_data = field.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_field, key, value)
    
    db.commit()
    db.refresh(db_field)
    return db_field


@router.delete("/fields/{field_id}")
def delete_field(field_id: int, db: Session = Depends(get_db)):
    db_field = db.query(Field).filter(Field.id == field_id).first()
    if not db_field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    db.delete(db_field)
    db.commit()
    return {"message": "Field deleted successfully"}


# =====================
# GEO POINTS
# =====================
@router.get("/fields/{field_id}/geo-points", response_model=List[GeoPointSchema])
def get_geo_points(field_id: int, db: Session = Depends(get_db)):
    return db.query(GeoPoint).filter(GeoPoint.field_id == field_id).order_by(GeoPoint.sequence_order).all()


@router.get("/fields/{field_id}/geofence-status")
def get_field_geofence_status(field_id: int, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    point_count = db.query(GeoPoint).filter(GeoPoint.field_id == field_id).count()
    is_ready = point_count >= 3
    return {
        "field_id": field_id,
        "field_name": field.name,
        "point_count": point_count,
        "is_ready": is_ready,
        "message": "Geofence ready" if is_ready else "At least 3 geofence points are required",
    }


@router.post("/fields/{field_id}/geo-points/bulk", response_model=List[GeoPointSchema])
def bulk_save_geo_points(field_id: int, points: List[GeoPointCreate], db: Session = Depends(get_db)):
    # Delete existing points for this field
    db.query(GeoPoint).filter(GeoPoint.field_id == field_id).delete()
    
    # Insert new points
    db_points = [GeoPoint(**point.dict()) for point in points]
    db.add_all(db_points)
    db.commit()
    
    return db.query(GeoPoint).filter(GeoPoint.field_id == field_id).order_by(GeoPoint.sequence_order).all()


# =====================
# CROP SEASONS
# =====================
@router.get("/fields/{field_id}/crop-seasons", response_model=List[CropSeasonSchema])
def get_crop_seasons(field_id: int, db: Session = Depends(get_db)):
    return db.query(CropSeason).filter(CropSeason.field_id == field_id).order_by(CropSeason.sowing_date.desc()).all()


@router.get("/fields/{field_id}/crop-seasons/active", response_model=Optional[CropSeasonSchema])
def get_active_crop_season(field_id: int, db: Session = Depends(get_db)):
    return db.query(CropSeason).filter(
        CropSeason.field_id == field_id,
        CropSeason.status == "active"
    ).first()


@router.post("/crop-seasons", response_model=CropSeasonSchema)
def create_crop_season(crop_season: CropSeasonCreate, db: Session = Depends(get_db)):
    db_crop_season = CropSeason(**crop_season.dict(), status="active")
    db.add(db_crop_season)
    db.commit()
    db.refresh(db_crop_season)
    return db_crop_season


@router.put("/crop-seasons/{season_id}", response_model=CropSeasonSchema)
def update_crop_season(season_id: int, crop_season: CropSeasonUpdate, db: Session = Depends(get_db)):
    db_season = db.query(CropSeason).filter(CropSeason.id == season_id).first()
    if not db_season:
        raise HTTPException(status_code=404, detail="Crop season not found")
    
    update_data = crop_season.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_season, key, value)
    
    db.commit()
    db.refresh(db_season)
    return db_season


# =====================
# VEHICLES
# =====================
@router.get("/vehicles", response_model=List[VehicleSchema])
def get_vehicles(db: Session = Depends(get_db)):
    return db.query(Vehicle).all()


@router.get("/vehicles/{vehicle_id}", response_model=VehicleSchema)
def get_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(Vehicle).filter(Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle


@router.post("/vehicles", response_model=VehicleSchema)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    db_vehicle = Vehicle(**vehicle.dict())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    return db_vehicle


# =====================
# TASKS
# =====================
@router.get("/tasks", response_model=List[TaskSchema])
def get_tasks(
    field_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    task_type: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Task)
    if field_id:
        query = query.filter(Task.field_id == field_id)
    if status:
        query = query.filter(Task.status == status)
    if task_type:
        query = query.filter(Task.task_type == task_type)
    return query.order_by(Task.scheduled_at).all()


@router.get("/tasks/{task_id}", response_model=TaskSchema)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.post("/tasks", response_model=TaskSchema)
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    task_data = task.dict()
    col_spacing_ft = float(task_data.get("col_spacing_ft") or 4)
    row_spacing_ft = float(task_data.get("row_spacing_ft") or 10)
    border_margin_ft = float(task_data.get("border_margin_ft") or 4)
    task_data["col_spacing_ft"] = col_spacing_ft
    task_data["row_spacing_ft"] = row_spacing_ft
    task_data["border_margin_ft"] = border_margin_ft

    db_task = Task(**task_data)
    db.add(db_task)
    db.flush()

    geofence_points = (
        db.query(GeoPoint)
        .filter(GeoPoint.field_id == db_task.field_id)
        .order_by(GeoPoint.sequence_order)
        .all()
    )
    if len(geofence_points) < 3:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Selected field must have at least 3 geofence points in geo_points table",
        )

    temp_geofence_path = None
    temp_points_path = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", newline="", suffix=".csv", delete=False, encoding="utf-8") as tmp:
            writer = csv.writer(tmp)
            writer.writerow(["latitude", "longitude"])
            for gp in geofence_points:
                writer.writerow([gp.lat, gp.lng])
            temp_geofence_path = tmp.name

        generation_result = generate_mission_points(
            geofence_path=temp_geofence_path,
            col_spacing_ft=col_spacing_ft,
            row_spacing_ft=row_spacing_ft,
            border_margin_ft=border_margin_ft,
        )

        if generation_result.get("status") != "success":
            db.rollback()
            raise HTTPException(status_code=400, detail=f"Point generation failed: {generation_result.get('message', 'Unknown error')}")

        generated_points = generation_result.get("points", [])
        with tempfile.NamedTemporaryFile(mode="w", newline="", suffix=".csv", delete=False, encoding="utf-8") as tmp_points:
            writer = csv.writer(tmp_points)
            writer.writerow(["x", "y"])
            for point in generated_points:
                writer.writerow([point.get("x", 0), point.get("y", 0)])
            temp_points_path = tmp_points.name

        converted_points_df = convert_points_to_latlon(
            geofence_path=temp_geofence_path,
            points_path=temp_points_path,
        )

        if len(converted_points_df.index) != len(generated_points):
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail="Converted points count does not match generated mission points",
            )

        db_points = [
            TaskGeneratedPoint(
                task_id=db_task.id,
                sequence_order=index + 1,
                latitude=float(converted_points_df.iloc[index]["latitude"]),
                longitude=float(converted_points_df.iloc[index]["longitude"]),
            )
            for index, point in enumerate(generated_points)
        ]
        if db_points:
            db.add_all(db_points)
    finally:
        if temp_points_path and os.path.exists(temp_points_path):
            os.remove(temp_points_path)
        if temp_geofence_path and os.path.exists(temp_geofence_path):
            os.remove(temp_geofence_path)

    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/tasks/{task_id}/generated-points", response_model=List[TaskGeneratedPointSchema])
def get_task_generated_points(task_id: int, db: Session = Depends(get_db)):
    return db.query(TaskGeneratedPoint).filter(TaskGeneratedPoint.task_id == task_id).order_by(TaskGeneratedPoint.sequence_order).all()


@router.get("/tasks/{task_id}/visualization-data")
def get_task_visualization_data(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    geofence_points = (
        db.query(GeoPoint)
        .filter(GeoPoint.field_id == task.field_id)
        .order_by(GeoPoint.sequence_order)
        .all()
    )
    if len(geofence_points) < 3:
        raise HTTPException(status_code=400, detail="Selected field has insufficient geofence points")

    task_points = (
        db.query(TaskGeneratedPoint)
        .filter(TaskGeneratedPoint.task_id == task.id)
        .order_by(TaskGeneratedPoint.sequence_order)
        .all()
    )

    geofence_latlon = [{"latitude": gp.lat, "longitude": gp.lng} for gp in geofence_points]
    generated_points_latlon = [
        {"latitude": p.latitude, "longitude": p.longitude}
        for p in task_points
        if p.latitude is not None and p.longitude is not None
    ]

    transformed = transform_latlon_lists_to_xy(
        geofence_latlon=geofence_latlon,
        points_latlon=generated_points_latlon,
    )
    if transformed.get("status") != "success":
        raise HTTPException(status_code=400, detail=f"Transform failed: {transformed.get('message', 'Unknown error')}")

    return {
        "task_id": task.id,
        "field_id": task.field_id,
        "geofence": transformed.get("geofence", []),
        "points": transformed.get("points", []),
        "reference": transformed.get("reference", {}),
    }


@router.post("/tasks/{task_id}/start-mission")
def start_task_mission(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if is_mission_transfer_in_progress():
        raise HTTPException(status_code=409, detail="A mission transfer is already in progress")

    task_points_count = (
        db.query(TaskGeneratedPoint)
        .filter(TaskGeneratedPoint.task_id == task_id)
        .count()
    )
    if task_points_count == 0:
        raise HTTPException(status_code=400, detail="Task has no generated mission points")

    def run_upload():
        try:
            result = upload_task_mission(task_id)
            print(f"Task {task_id} mission upload result: {result}")
        except Exception as exc:
            print(f"Task {task_id} mission upload failed: {exc}")

    threading.Thread(target=run_upload, daemon=True).start()

    return {
        "status": "started",
        "task_id": task_id,
        "waypoints": task_points_count,
        "message": "Mission upload started",
    }


@router.put("/tasks/{task_id}", response_model=TaskSchema)
def update_task(task_id: int, task: TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = task.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
    
    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(db_task)
    db.commit()
    return {"message": "Task deleted successfully"}


# =====================
# TASK EXECUTIONS
# =====================
@router.get("/tasks/{task_id}/executions", response_model=List[TaskExecutionSchema])
def get_task_executions(task_id: int, db: Session = Depends(get_db)):
    return db.query(TaskExecution).filter(TaskExecution.task_id == task_id).order_by(TaskExecution.started_at.desc()).all()


@router.post("/task-executions", response_model=TaskExecutionSchema)
def create_task_execution(execution: TaskExecutionCreate, db: Session = Depends(get_db)):
    db_execution = TaskExecution(**execution.dict())
    db.add(db_execution)
    db.commit()
    db.refresh(db_execution)
    return db_execution


# =====================
# ALERTS
# =====================
@router.get("/alerts/unresolved", response_model=List[AlertSchema])
def get_unresolved_alerts(db: Session = Depends(get_db)):
    return db.query(Alert).filter(Alert.resolved == False).order_by(Alert.created_at.desc()).all()


@router.put("/alerts/{alert_id}/resolve")
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    db_alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not db_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db_alert.resolved = True
    db.commit()
    db.refresh(db_alert)
    return db_alert


@router.post("/alerts", response_model=AlertSchema)
def create_alert(alert: AlertCreate, db: Session = Depends(get_db)):
    db_alert = Alert(**alert.dict())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert


# =====================
# CROP LOGS
# =====================
@router.get("/crop-logs", response_model=List[CropLogSchema])
def get_crop_logs(
    field_id: Optional[int] = Query(None),
    log_type: Optional[str] = Query(None),
    is_auto_generated: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CropLog)
    if field_id:
        query = query.filter(CropLog.field_id == field_id)
    if log_type:
        query = query.filter(CropLog.log_type == log_type)
    if is_auto_generated is not None:
        query = query.filter(CropLog.is_auto_generated == is_auto_generated)
    return query.order_by(CropLog.logged_at.desc()).all()


@router.get("/crop-logs/{log_id}", response_model=CropLogSchema)
def get_crop_log(log_id: int, db: Session = Depends(get_db)):
    log = db.query(CropLog).filter(CropLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Crop log not found")
    return log


@router.post("/crop-logs", response_model=CropLogSchema)
def create_crop_log(log: CropLogCreate, db: Session = Depends(get_db)):
    db_log = CropLog(**log.dict())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log


@router.delete("/crop-logs/{log_id}")
def delete_crop_log(log_id: int, db: Session = Depends(get_db)):
    db_log = db.query(CropLog).filter(CropLog.id == log_id).first()
    if not db_log:
        raise HTTPException(status_code=404, detail="Crop log not found")
    
    db.delete(db_log)
    db.commit()
    return {"message": "Crop log deleted successfully"}


# =====================
# GROWTH OBSERVATIONS
# =====================
@router.get("/crop-logs/{log_id}/growth-observation", response_model=Optional[GrowthObservationSchema])
def get_growth_observation(log_id: int, db: Session = Depends(get_db)):
    return db.query(GrowthObservation).filter(GrowthObservation.crop_log_id == log_id).first()


@router.post("/growth-observations", response_model=GrowthObservationSchema)
def create_growth_observation(obs: GrowthObservationCreate, db: Session = Depends(get_db)):
    db_obs = GrowthObservation(**obs.dict())
    db.add(db_obs)
    db.commit()
    db.refresh(db_obs)
    return db_obs


# =====================
# PEST RECORDS
# =====================
@router.get("/crop-logs/{log_id}/pest-record", response_model=Optional[PestRecordSchema])
def get_pest_record(log_id: int, db: Session = Depends(get_db)):
    return db.query(PestRecord).filter(PestRecord.crop_log_id == log_id).first()


@router.post("/pest-records", response_model=PestRecordSchema)
def create_pest_record(record: PestRecordCreate, db: Session = Depends(get_db)):
    db_record = PestRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


# =====================
# DISEASE RECORDS
# =====================
@router.get("/crop-logs/{log_id}/disease-record", response_model=Optional[DiseaseRecordSchema])
def get_disease_record(log_id: int, db: Session = Depends(get_db)):
    return db.query(DiseaseRecord).filter(DiseaseRecord.crop_log_id == log_id).first()


@router.post("/disease-records", response_model=DiseaseRecordSchema)
def create_disease_record(record: DiseaseRecordCreate, db: Session = Depends(get_db)):
    db_record = DiseaseRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


# =====================
# SOIL TESTS
# =====================
@router.get("/crop-logs/{log_id}/soil-test", response_model=Optional[SoilTestSchema])
def get_soil_test(log_id: int, db: Session = Depends(get_db)):
    return db.query(SoilTest).filter(SoilTest.crop_log_id == log_id).first()


@router.post("/soil-tests", response_model=SoilTestSchema)
def create_soil_test(test: SoilTestCreate, db: Session = Depends(get_db)):
    db_test = SoilTest(**test.dict())
    db.add(db_test)
    db.commit()
    db.refresh(db_test)
    return db_test


# =====================
# TREATMENT RECORDS
# =====================
@router.get("/crop-logs/{log_id}/treatment-record", response_model=Optional[TreatmentRecordSchema])
def get_treatment_record(log_id: int, db: Session = Depends(get_db)):
    return db.query(TreatmentRecord).filter(TreatmentRecord.crop_log_id == log_id).first()


@router.post("/treatment-records", response_model=TreatmentRecordSchema)
def create_treatment_record(record: TreatmentRecordCreate, db: Session = Depends(get_db)):
    db_record = TreatmentRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


# =====================
# HARVEST RECORDS
# =====================
@router.get("/crop-logs/{log_id}/harvest-record", response_model=Optional[HarvestRecordSchema])
def get_harvest_record(log_id: int, db: Session = Depends(get_db)):
    return db.query(HarvestRecord).filter(HarvestRecord.crop_log_id == log_id).first()


@router.post("/harvest-records", response_model=HarvestRecordSchema)
def create_harvest_record(record: HarvestRecordCreate, db: Session = Depends(get_db)):
    db_record = HarvestRecord(**record.dict())
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record


# =====================
# LOG TAGS
# =====================
@router.get("/log-tags", response_model=List[LogTagSchema])
def get_log_tags(db: Session = Depends(get_db)):
    return db.query(LogTag).order_by(LogTag.name).all()


@router.post("/log-tags", response_model=LogTagSchema)
def create_log_tag(tag: LogTagCreate, db: Session = Depends(get_db)):
    db_tag = LogTag(**tag.dict())
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag
