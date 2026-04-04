from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


# =====================
# FARMS
# =====================
class FarmBase(BaseModel):
    name: str
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None
    geo_file_url: Optional[str] = None


class FarmCreate(FarmBase):
    pass


class FarmUpdate(BaseModel):
    name: Optional[str] = None
    center_lat: Optional[float] = None
    center_lng: Optional[float] = None


class Farm(FarmBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================
# FIELDS
# =====================
class FieldBase(BaseModel):
    farm_id: int
    name: str
    area_hectares: Optional[float] = None
    soil_type: Optional[str] = None


class FieldCreate(FieldBase):
    pass


class FieldUpdate(BaseModel):
    name: Optional[str] = None
    area_hectares: Optional[float] = None
    soil_type: Optional[str] = None


class Field(FieldBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================
# GEO POINTS
# =====================
class GeoPointBase(BaseModel):
    lat: float
    lng: float
    sequence_order: int


class GeoPointCreate(GeoPointBase):
    field_id: int


class GeoPoint(GeoPointBase):
    id: int
    field_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# CROP SEASONS
# =====================
class CropSeasonBase(BaseModel):
    field_id: int
    crop_type: str
    variety: Optional[str] = None
    sowing_date: Optional[datetime] = None
    expected_harvest: Optional[datetime] = None
    growth_stage: Optional[str] = None


class CropSeasonCreate(CropSeasonBase):
    pass


class CropSeasonUpdate(BaseModel):
    growth_stage: Optional[str] = None
    status: Optional[str] = None
    actual_harvest_date: Optional[datetime] = None


class CropSeason(CropSeasonBase):
    id: int
    status: str
    actual_harvest_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================
# VEHICLES
# =====================
class VehicleBase(BaseModel):
    name: str
    vehicle_type: Optional[str] = None


class VehicleCreate(VehicleBase):
    pass


class Vehicle(VehicleBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# TASKS
# =====================
class TaskBase(BaseModel):
    field_id: int
    vehicle_id: Optional[int] = None
    task_type: str
    target_quantity: Optional[float] = None
    unit: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    recurrence_rule: Optional[str] = None
    col_spacing_ft: Optional[float] = 4
    row_spacing_ft: Optional[float] = 10
    border_margin_ft: Optional[float] = 4


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    field_id: Optional[int] = None
    vehicle_id: Optional[int] = None
    task_type: Optional[str] = None
    target_quantity: Optional[float] = None
    unit: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    recurrence_rule: Optional[str] = None
    status: Optional[str] = None
    col_spacing_ft: Optional[float] = None
    row_spacing_ft: Optional[float] = None
    border_margin_ft: Optional[float] = None


class Task(TaskBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TaskGeneratedPointBase(BaseModel):
    task_id: int
    sequence_order: int
    latitude: float
    longitude: float


class TaskGeneratedPoint(TaskGeneratedPointBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# TASK EXECUTIONS
# =====================
class TaskExecutionBase(BaseModel):
    task_id: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class TaskExecutionCreate(TaskExecutionBase):
    pass


class TaskExecution(TaskExecutionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# ALERTS
# =====================
class AlertBase(BaseModel):
    title: str
    message: str
    alert_type: Optional[str] = None


class AlertCreate(AlertBase):
    pass


class Alert(AlertBase):
    id: int
    resolved: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================
# CROP LOGS
# =====================
class CropLogBase(BaseModel):
    field_id: int
    crop_season_id: Optional[int] = None
    log_type: str
    title: str
    notes: Optional[str] = None
    logged_by: Optional[str] = None
    is_auto_generated: Optional[bool] = False


class CropLogCreate(CropLogBase):
    pass


class CropLog(CropLogBase):
    id: int
    logged_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =====================
# GROWTH OBSERVATIONS
# =====================
class GrowthObservationBase(BaseModel):
    crop_log_id: int
    plant_height_cm: Optional[float] = None
    leaf_count: Optional[int] = None
    bbch_stage: Optional[str] = None
    canopy_cover_pct: Optional[float] = None
    vigor_rating: Optional[str] = None


class GrowthObservationCreate(GrowthObservationBase):
    pass


class GrowthObservation(GrowthObservationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# PEST RECORDS
# =====================
class PestRecordBase(BaseModel):
    crop_log_id: int
    pest_name: Optional[str] = None
    pest_category: Optional[str] = None
    severity: Optional[str] = None
    affected_area_pct: Optional[float] = None
    recommended_action: Optional[str] = None
    treatment_done: Optional[bool] = False


class PestRecordCreate(PestRecordBase):
    pass


class PestRecord(PestRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# DISEASE RECORDS
# =====================
class DiseaseRecordBase(BaseModel):
    crop_log_id: int
    disease_name: Optional[str] = None
    severity: Optional[str] = None


class DiseaseRecordCreate(DiseaseRecordBase):
    pass


class DiseaseRecord(DiseaseRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# SOIL TESTS
# =====================
class SoilTestBase(BaseModel):
    crop_log_id: int
    ph: Optional[float] = None
    nitrogen_ppm: Optional[float] = None
    phosphorus_ppm: Optional[float] = None
    potassium_ppm: Optional[float] = None
    moisture_pct: Optional[float] = None
    organic_matter_pct: Optional[float] = None
    temp_celsius: Optional[float] = None
    ec_ds_per_m: Optional[float] = None


class SoilTestCreate(SoilTestBase):
    pass


class SoilTest(SoilTestBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# TREATMENT RECORDS
# =====================
class TreatmentRecordBase(BaseModel):
    crop_log_id: int
    product_name: Optional[str] = None
    treatment_type: Optional[str] = None
    dose_per_ha: Optional[float] = None
    total_quantity: Optional[float] = None
    unit: Optional[str] = None
    application_method: Optional[str] = None
    weather_conditions: Optional[str] = None


class TreatmentRecordCreate(TreatmentRecordBase):
    pass


class TreatmentRecord(TreatmentRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# HARVEST RECORDS
# =====================
class HarvestRecordBase(BaseModel):
    crop_log_id: int
    yield_kg: Optional[float] = None
    harvested_area_ha: Optional[float] = None
    yield_per_ha: Optional[float] = None
    quality_grade: Optional[str] = None
    moisture_content_pct: Optional[float] = None
    storage_location: Optional[str] = None


class HarvestRecordCreate(HarvestRecordBase):
    pass


class HarvestRecord(HarvestRecordBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# =====================
# LOG TAGS
# =====================
class LogTagBase(BaseModel):
    name: str
    color: Optional[str] = None


class LogTagCreate(LogTagBase):
    pass


class LogTag(LogTagBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
