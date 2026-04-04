import os
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy import text

# Database URL from environment variable
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:12345678@localhost:5432/field_command_hub")

engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# =====================
# MODELS
# =====================
class Farm(Base):
    __tablename__ = "farms"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    center_lat = Column(Float, nullable=True)
    center_lng = Column(Float, nullable=True)
    geo_file_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    fields = relationship("Field", back_populates="farm", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"
    
    id = Column(Integer, primary_key=True, index=True)
    farm_id = Column(Integer, ForeignKey("farms.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    area_hectares = Column(Float, nullable=True)
    soil_type = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    farm = relationship("Farm", back_populates="fields")
    geo_points = relationship("GeoPoint", back_populates="field", cascade="all, delete-orphan")
    crop_seasons = relationship("CropSeason", back_populates="field", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="field", cascade="all, delete-orphan")
    crop_logs = relationship("CropLog", back_populates="field", cascade="all, delete-orphan")


class GeoPoint(Base):
    __tablename__ = "geo_points"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    sequence_order = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    field = relationship("Field", back_populates="geo_points")


class CropSeason(Base):
    __tablename__ = "crop_seasons"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_type = Column(String(100), nullable=False, index=True)
    variety = Column(String(255), nullable=True)
    sowing_date = Column(DateTime, nullable=True, index=True)
    expected_harvest = Column(DateTime, nullable=True)
    actual_harvest_date = Column(DateTime, nullable=True)
    growth_stage = Column(String(100), nullable=True)
    status = Column(String(50), nullable=False, server_default="active", index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    field = relationship("Field", back_populates="crop_seasons")
    crop_logs = relationship("CropLog", back_populates="crop_season", cascade="all, delete-orphan")


class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    vehicle_type = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    tasks = relationship("Task", back_populates="vehicle")


class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True)
    task_type = Column(String(100), nullable=False, index=True)
    target_quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    scheduled_at = Column(DateTime, nullable=True, index=True)
    recurrence_rule = Column(String(500), nullable=True)
    col_spacing_ft = Column(Float, nullable=False, server_default="4")
    row_spacing_ft = Column(Float, nullable=False, server_default="10")
    border_margin_ft = Column(Float, nullable=False, server_default="4")
    status = Column(String(50), nullable=False, server_default="pending", index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    field = relationship("Field", back_populates="tasks")
    vehicle = relationship("Vehicle", back_populates="tasks")
    task_executions = relationship("TaskExecution", back_populates="task", cascade="all, delete-orphan")
    generated_points = relationship("TaskGeneratedPoint", back_populates="task", cascade="all, delete-orphan")


class TaskGeneratedPoint(Base):
    __tablename__ = "task_generated_points"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence_order = Column(Integer, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    # Relationships
    task = relationship("Task", back_populates="generated_points")


class TaskExecution(Base):
    __tablename__ = "task_executions"
    
    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String(50), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    task = relationship("Task", back_populates="task_executions")


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    alert_type = Column(String(100), nullable=True)
    resolved = Column(Boolean, nullable=False, server_default="false", index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())


class CropLog(Base):
    __tablename__ = "crop_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id", ondelete="CASCADE"), nullable=False, index=True)
    crop_season_id = Column(Integer, ForeignKey("crop_seasons.id", ondelete="SET NULL"), nullable=True, index=True)
    log_type = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    notes = Column(Text, nullable=True)
    logged_by = Column(String(255), nullable=True)
    is_auto_generated = Column(Boolean, nullable=False, server_default="false")
    logged_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now(), index=True)
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    field = relationship("Field", back_populates="crop_logs")
    crop_season = relationship("CropSeason", back_populates="crop_logs")
    growth_observation = relationship("GrowthObservation", back_populates="crop_log", uselist=False, cascade="all, delete-orphan")
    pest_record = relationship("PestRecord", back_populates="crop_log", uselist=False, cascade="all, delete-orphan")
    disease_record = relationship("DiseaseRecord", back_populates="crop_log", uselist=False, cascade="all, delete-orphan")
    soil_test = relationship("SoilTest", back_populates="crop_log", uselist=False, cascade="all, delete-orphan")
    treatment_record = relationship("TreatmentRecord", back_populates="crop_log", uselist=False, cascade="all, delete-orphan")
    harvest_record = relationship("HarvestRecord", back_populates="crop_log", uselist=False, cascade="all, delete-orphan")
    tags = relationship("LogTag", secondary="crop_log_tags", back_populates="crop_logs")


class GrowthObservation(Base):
    __tablename__ = "growth_observations"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_log_id = Column(Integer, ForeignKey("crop_logs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    plant_height_cm = Column(Float, nullable=True)
    leaf_count = Column(Integer, nullable=True)
    bbch_stage = Column(String(50), nullable=True)
    canopy_cover_pct = Column(Float, nullable=True)
    vigor_rating = Column(String(50), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    crop_log = relationship("CropLog", back_populates="growth_observation")


class PestRecord(Base):
    __tablename__ = "pest_records"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_log_id = Column(Integer, ForeignKey("crop_logs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    pest_name = Column(String(255), nullable=True)
    pest_category = Column(String(100), nullable=True)
    severity = Column(String(50), nullable=True)
    affected_area_pct = Column(Float, nullable=True)
    recommended_action = Column(Text, nullable=True)
    treatment_done = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    crop_log = relationship("CropLog", back_populates="pest_record")


class DiseaseRecord(Base):
    __tablename__ = "disease_records"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_log_id = Column(Integer, ForeignKey("crop_logs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    disease_name = Column(String(255), nullable=True)
    severity = Column(String(50), nullable=True)
    affected_area_pct = Column(Float, nullable=True)
    recommended_action = Column(Text, nullable=True)
    treatment_done = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    crop_log = relationship("CropLog", back_populates="disease_record")


class SoilTest(Base):
    __tablename__ = "soil_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_log_id = Column(Integer, ForeignKey("crop_logs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    ph = Column(Float, nullable=True)
    nitrogen_ppm = Column(Float, nullable=True)
    phosphorus_ppm = Column(Float, nullable=True)
    potassium_ppm = Column(Float, nullable=True)
    moisture_pct = Column(Float, nullable=True)
    organic_matter_pct = Column(Float, nullable=True)
    temp_celsius = Column(Float, nullable=True)
    ec_ds_per_m = Column(Float, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    crop_log = relationship("CropLog", back_populates="soil_test")


class TreatmentRecord(Base):
    __tablename__ = "treatment_records"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_log_id = Column(Integer, ForeignKey("crop_logs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    product_name = Column(String(255), nullable=True)
    treatment_type = Column(String(100), nullable=True)
    dose_per_ha = Column(Float, nullable=True)
    total_quantity = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    application_method = Column(String(100), nullable=True)
    weather_conditions = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    crop_log = relationship("CropLog", back_populates="treatment_record")


class HarvestRecord(Base):
    __tablename__ = "harvest_records"
    
    id = Column(Integer, primary_key=True, index=True)
    crop_log_id = Column(Integer, ForeignKey("crop_logs.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    yield_kg = Column(Float, nullable=True)
    harvested_area_ha = Column(Float, nullable=True)
    yield_per_ha = Column(Float, nullable=True)
    quality_grade = Column(String(50), nullable=True)
    moisture_content_pct = Column(Float, nullable=True)
    storage_location = Column(String(255), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    crop_log = relationship("CropLog", back_populates="harvest_record")


class LogTag(Base):
    __tablename__ = "log_tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True, index=True)
    color = Column(String(50), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationships
    crop_logs = relationship("CropLog", secondary="crop_log_tags", back_populates="tags")


class CropLogTag(Base):
    __tablename__ = "crop_log_tags"
    __table_args__ = (
        UniqueConstraint("crop_log_id", "log_tag_id", name="uq_crop_log_tags_pair"),
    )
    
    id = Column(Integer, primary_key=True, index=True)
    crop_log_id = Column(Integer, ForeignKey("crop_logs.id", ondelete="CASCADE"), nullable=False, index=True)
    log_tag_id = Column(Integer, ForeignKey("log_tags.id", ondelete="CASCADE"), nullable=False, index=True)


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)


def apply_schema_patches():
    """Apply forward-compatible schema patches for existing databases."""
    patch_statements = [
        """
        ALTER TABLE tasks
        ADD COLUMN IF NOT EXISTS col_spacing_ft DOUBLE PRECISION NOT NULL DEFAULT 4,
        ADD COLUMN IF NOT EXISTS row_spacing_ft DOUBLE PRECISION NOT NULL DEFAULT 10,
        ADD COLUMN IF NOT EXISTS border_margin_ft DOUBLE PRECISION NOT NULL DEFAULT 4
        """,
        """
        CREATE TABLE IF NOT EXISTS task_generated_points (
            id SERIAL PRIMARY KEY,
            task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
            sequence_order INTEGER NOT NULL,
            latitude DOUBLE PRECISION NOT NULL,
            longitude DOUBLE PRECISION NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
        """,
        """
        ALTER TABLE task_generated_points
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION
        """,
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'task_generated_points' AND column_name = 'x'
            ) THEN
                EXECUTE 'ALTER TABLE task_generated_points ALTER COLUMN x DROP NOT NULL';
            END IF;

            IF EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'task_generated_points' AND column_name = 'y'
            ) THEN
                EXECUTE 'ALTER TABLE task_generated_points ALTER COLUMN y DROP NOT NULL';
            END IF;
        END
        $$
        """,
        """
        CREATE INDEX IF NOT EXISTS idx_task_generated_points_task_id
        ON task_generated_points (task_id)
        """,
    ]

    with engine.begin() as conn:
        for stmt in patch_statements:
            conn.execute(text(stmt))
