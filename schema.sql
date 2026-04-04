CREATE TABLE farms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    geo_file_url VARCHAR(500),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fields (
    id SERIAL PRIMARY KEY,
    farm_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    area_hectares DOUBLE PRECISION,
    soil_type VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fields_farm
        FOREIGN KEY (farm_id)
        REFERENCES farms (id)
        ON DELETE CASCADE
);

CREATE TABLE geo_points (
    id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    sequence_order INTEGER NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_geo_points_field
        FOREIGN KEY (field_id)
        REFERENCES fields (id)
        ON DELETE CASCADE
);

CREATE TABLE crop_seasons (
    id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    variety VARCHAR(255),
    sowing_date TIMESTAMP WITHOUT TIME ZONE,
    expected_harvest TIMESTAMP WITHOUT TIME ZONE,
    actual_harvest_date TIMESTAMP WITHOUT TIME ZONE,
    growth_stage VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_crop_seasons_field
        FOREIGN KEY (field_id)
        REFERENCES fields (id)
        ON DELETE CASCADE
);

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    vehicle_type VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL,
    vehicle_id INTEGER,
    task_type VARCHAR(100) NOT NULL,
    target_quantity DOUBLE PRECISION,
    unit VARCHAR(50),
    scheduled_at TIMESTAMP WITHOUT TIME ZONE,
    recurrence_rule VARCHAR(500),
    col_spacing_ft DOUBLE PRECISION NOT NULL DEFAULT 4,
    row_spacing_ft DOUBLE PRECISION NOT NULL DEFAULT 10,
    border_margin_ft DOUBLE PRECISION NOT NULL DEFAULT 4,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tasks_field
        FOREIGN KEY (field_id)
        REFERENCES fields (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_tasks_vehicle
        FOREIGN KEY (vehicle_id)
        REFERENCES vehicles (id)
        ON DELETE SET NULL
);

CREATE TABLE task_executions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL,
    started_at TIMESTAMP WITHOUT TIME ZONE,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_task_executions_task
        FOREIGN KEY (task_id)
        REFERENCES tasks (id)
        ON DELETE CASCADE
);

    CREATE TABLE task_generated_points (
        id SERIAL PRIMARY KEY,
        task_id INTEGER NOT NULL,
        sequence_order INTEGER NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_task_generated_points_task
        FOREIGN KEY (task_id)
        REFERENCES tasks (id)
        ON DELETE CASCADE
    );

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    alert_type VARCHAR(100),
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crop_logs (
    id SERIAL PRIMARY KEY,
    field_id INTEGER NOT NULL,
    crop_season_id INTEGER,
    log_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    notes TEXT,
    logged_by VARCHAR(255),
    is_auto_generated BOOLEAN NOT NULL DEFAULT FALSE,
    logged_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_crop_logs_field
        FOREIGN KEY (field_id)
        REFERENCES fields (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_crop_logs_crop_season
        FOREIGN KEY (crop_season_id)
        REFERENCES crop_seasons (id)
        ON DELETE SET NULL
);

CREATE TABLE growth_observations (
    id SERIAL PRIMARY KEY,
    crop_log_id INTEGER NOT NULL,
    plant_height_cm DOUBLE PRECISION,
    leaf_count INTEGER,
    bbch_stage VARCHAR(50),
    canopy_cover_pct DOUBLE PRECISION,
    vigor_rating VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_growth_observations_crop_log UNIQUE (crop_log_id),
    CONSTRAINT fk_growth_observations_crop_log
        FOREIGN KEY (crop_log_id)
        REFERENCES crop_logs (id)
        ON DELETE CASCADE
);

CREATE TABLE pest_records (
    id SERIAL PRIMARY KEY,
    crop_log_id INTEGER NOT NULL,
    pest_name VARCHAR(255),
    pest_category VARCHAR(100),
    severity VARCHAR(50),
    affected_area_pct DOUBLE PRECISION,
    recommended_action TEXT,
    treatment_done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pest_records_crop_log UNIQUE (crop_log_id),
    CONSTRAINT fk_pest_records_crop_log
        FOREIGN KEY (crop_log_id)
        REFERENCES crop_logs (id)
        ON DELETE CASCADE
);

CREATE TABLE disease_records (
    id SERIAL PRIMARY KEY,
    crop_log_id INTEGER NOT NULL,
    disease_name VARCHAR(255),
    severity VARCHAR(50),
    affected_area_pct DOUBLE PRECISION,
    recommended_action TEXT,
    treatment_done BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_disease_records_crop_log UNIQUE (crop_log_id),
    CONSTRAINT fk_disease_records_crop_log
        FOREIGN KEY (crop_log_id)
        REFERENCES crop_logs (id)
        ON DELETE CASCADE
);

CREATE TABLE soil_tests (
    id SERIAL PRIMARY KEY,
    crop_log_id INTEGER NOT NULL,
    ph DOUBLE PRECISION,
    nitrogen_ppm DOUBLE PRECISION,
    phosphorus_ppm DOUBLE PRECISION,
    potassium_ppm DOUBLE PRECISION,
    moisture_pct DOUBLE PRECISION,
    organic_matter_pct DOUBLE PRECISION,
    temp_celsius DOUBLE PRECISION,
    ec_ds_per_m DOUBLE PRECISION,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_soil_tests_crop_log UNIQUE (crop_log_id),
    CONSTRAINT fk_soil_tests_crop_log
        FOREIGN KEY (crop_log_id)
        REFERENCES crop_logs (id)
        ON DELETE CASCADE
);

CREATE TABLE treatment_records (
    id SERIAL PRIMARY KEY,
    crop_log_id INTEGER NOT NULL,
    product_name VARCHAR(255),
    treatment_type VARCHAR(100),
    dose_per_ha DOUBLE PRECISION,
    total_quantity DOUBLE PRECISION,
    unit VARCHAR(50),
    application_method VARCHAR(100),
    weather_conditions VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_treatment_records_crop_log UNIQUE (crop_log_id),
    CONSTRAINT fk_treatment_records_crop_log
        FOREIGN KEY (crop_log_id)
        REFERENCES crop_logs (id)
        ON DELETE CASCADE
);

CREATE TABLE harvest_records (
    id SERIAL PRIMARY KEY,
    crop_log_id INTEGER NOT NULL,
    yield_kg DOUBLE PRECISION,
    harvested_area_ha DOUBLE PRECISION,
    yield_per_ha DOUBLE PRECISION,
    quality_grade VARCHAR(50),
    moisture_content_pct DOUBLE PRECISION,
    storage_location VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_harvest_records_crop_log UNIQUE (crop_log_id),
    CONSTRAINT fk_harvest_records_crop_log
        FOREIGN KEY (crop_log_id)
        REFERENCES crop_logs (id)
        ON DELETE CASCADE
);

CREATE TABLE log_tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    color VARCHAR(50),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crop_log_tags (
    id SERIAL PRIMARY KEY,
    crop_log_id INTEGER NOT NULL,
    log_tag_id INTEGER NOT NULL,
    CONSTRAINT uq_crop_log_tags_pair UNIQUE (crop_log_id, log_tag_id),
    CONSTRAINT fk_crop_log_tags_crop_log
        FOREIGN KEY (crop_log_id)
        REFERENCES crop_logs (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_crop_log_tags_log_tag
        FOREIGN KEY (log_tag_id)
        REFERENCES log_tags (id)
        ON DELETE CASCADE
);

CREATE INDEX idx_fields_farm_id ON fields (farm_id);
CREATE INDEX idx_geo_points_field_id ON geo_points (field_id);
CREATE INDEX idx_crop_seasons_field_id ON crop_seasons (field_id);
CREATE INDEX idx_tasks_field_id ON tasks (field_id);
CREATE INDEX idx_tasks_vehicle_id ON tasks (vehicle_id);
CREATE INDEX idx_task_executions_task_id ON task_executions (task_id);
CREATE INDEX idx_task_generated_points_task_id ON task_generated_points (task_id);
CREATE INDEX idx_crop_logs_field_id ON crop_logs (field_id);
CREATE INDEX idx_crop_logs_crop_season_id ON crop_logs (crop_season_id);
CREATE INDEX idx_growth_observations_crop_log_id ON growth_observations (crop_log_id);
CREATE INDEX idx_pest_records_crop_log_id ON pest_records (crop_log_id);
CREATE INDEX idx_disease_records_crop_log_id ON disease_records (crop_log_id);
CREATE INDEX idx_soil_tests_crop_log_id ON soil_tests (crop_log_id);
CREATE INDEX idx_treatment_records_crop_log_id ON treatment_records (crop_log_id);
CREATE INDEX idx_harvest_records_crop_log_id ON harvest_records (crop_log_id);
CREATE INDEX idx_crop_log_tags_crop_log_id ON crop_log_tags (crop_log_id);
CREATE INDEX idx_crop_log_tags_log_tag_id ON crop_log_tags (log_tag_id);
