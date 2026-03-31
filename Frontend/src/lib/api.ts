import { supabase } from "@/integrations/supabase/client";

// =====================
// FARMS
// =====================
export const farmsApi = {
  list: () => supabase.from("farms").select("*").order("created_at"),
  get: (id: number) => supabase.from("farms").select("*").eq("id", id).single(),
  create: (data: { name: string; center_lat?: number; center_lng?: number; geo_file_url?: string }) =>
    supabase.from("farms").insert(data).select().single(),
  update: (id: number, data: Partial<{ name: string; center_lat: number; center_lng: number }>) =>
    supabase.from("farms").update(data).eq("id", id).select().single(),
  delete: (id: number) => supabase.from("farms").delete().eq("id", id),
};

// =====================
// FIELDS
// =====================
export const fieldsApi = {
  list: (farmId?: number) => {
    let q = supabase.from("fields").select("*").order("created_at");
    if (farmId) q = q.eq("farm_id", farmId);
    return q;
  },
  get: (id: number) => supabase.from("fields").select("*").eq("id", id).single(),
  create: (data: { farm_id: number; name: string; area_hectares?: number; soil_type?: string }) =>
    supabase.from("fields").insert(data).select().single(),
  update: (id: number, data: Partial<{ name: string; area_hectares: number; soil_type: string }>) =>
    supabase.from("fields").update(data).eq("id", id).select().single(),
  delete: (id: number) => supabase.from("fields").delete().eq("id", id),
};

// =====================
// GEO POINTS
// =====================
export const geoPointsApi = {
  listByField: (fieldId: number) =>
    supabase.from("geo_points").select("*").eq("field_id", fieldId).order("sequence_order"),
  bulkSave: async (fieldId: number, points: { lat: number; lng: number; sequence_order: number }[]) => {
    await supabase.from("geo_points").delete().eq("field_id", fieldId);
    return supabase.from("geo_points").insert(points.map((p) => ({ ...p, field_id: fieldId }))).select();
  },
};

// =====================
// CROP SEASONS
// =====================
export const cropSeasonsApi = {
  listByField: (fieldId: number) =>
    supabase.from("crop_seasons").select("*").eq("field_id", fieldId).order("sowing_date", { ascending: false }),
  getActive: (fieldId: number) =>
    supabase.from("crop_seasons").select("*").eq("field_id", fieldId).eq("status", "active").maybeSingle(),
  create: (data: { field_id: number; crop_type: string; variety?: string; sowing_date?: string; expected_harvest?: string; growth_stage?: string }) =>
    supabase.from("crop_seasons").insert({ ...data, status: "active" }).select().single(),
  update: (id: number, data: Partial<{ growth_stage: string; status: string; actual_harvest_date: string }>) =>
    supabase.from("crop_seasons").update(data).eq("id", id).select().single(),
};

// =====================
// VEHICLES
// =====================
export const vehiclesApi = {
  list: () => supabase.from("vehicles").select("*"),
  get: (id: number) => supabase.from("vehicles").select("*").eq("id", id).single(),
};

// =====================
// TASKS
// =====================
export const tasksApi = {
  list: (filters?: { field_id?: number; status?: string; task_type?: string }) => {
    let q = supabase.from("tasks").select("*, fields(name), vehicles(name)").order("scheduled_at");
    if (filters?.field_id) q = q.eq("field_id", filters.field_id);
    if (filters?.status) q = q.eq("status", filters.status);
    if (filters?.task_type) q = q.eq("task_type", filters.task_type);
    return q;
  },
  get: (id: number) => supabase.from("tasks").select("*, fields(name), vehicles(name)").eq("id", id).single(),
  create: (data: {
    field_id: number; vehicle_id?: number; task_type: string;
    target_quantity?: number; unit?: string; scheduled_at?: string; recurrence_rule?: string;
  }) => supabase.from("tasks").insert(data).select().single(),
  update: (id: number, data: Partial<{
    field_id: number; vehicle_id: number; task_type: string;
    target_quantity: number; unit: string; scheduled_at: string; recurrence_rule: string; status: string;
  }>) => supabase.from("tasks").update(data).eq("id", id).select().single(),
  delete: (id: number) => supabase.from("tasks").delete().eq("id", id),
};

// =====================
// TASK EXECUTIONS
// =====================
export const taskExecutionsApi = {
  listByTask: (taskId: number) =>
    supabase.from("task_executions").select("*").eq("task_id", taskId).order("started_at", { ascending: false }),
};

// =====================
// ALERTS
// =====================
export const alertsApi = {
  listUnresolved: () => supabase.from("alerts").select("*").eq("resolved", false).order("created_at", { ascending: false }),
  resolve: (id: number) => supabase.from("alerts").update({ resolved: true }).eq("id", id),
};

// =====================
// CROP LOGS
// =====================
export const cropLogsApi = {
  list: (filters?: { field_id?: number; log_type?: string; is_auto_generated?: boolean }) => {
    let q = supabase.from("crop_logs").select("*, fields(name), crop_seasons(crop_type, variety), crop_log_tags(log_tags(name, color))").order("logged_at", { ascending: false });
    if (filters?.field_id) q = q.eq("field_id", filters.field_id);
    if (filters?.log_type) q = q.eq("log_type", filters.log_type);
    if (filters?.is_auto_generated !== undefined) q = q.eq("is_auto_generated", filters.is_auto_generated);
    return q;
  },
  get: (id: number) => supabase.from("crop_logs").select("*").eq("id", id).single(),
  create: (data: {
    field_id: number; crop_season_id?: number; log_type: string;
    title: string; notes?: string; logged_by?: string; is_auto_generated?: boolean;
  }) => supabase.from("crop_logs").insert(data).select().single(),
  delete: (id: number) => supabase.from("crop_logs").delete().eq("id", id),
};

// Sub-type detail fetchers
export const growthObservationsApi = {
  getByLog: (logId: number) => supabase.from("growth_observations").select("*").eq("crop_log_id", logId).maybeSingle(),
  create: (data: { crop_log_id: number; plant_height_cm?: number; leaf_count?: number; bbch_stage?: string; canopy_cover_pct?: number; vigor_rating?: string }) =>
    supabase.from("growth_observations").insert(data).select().single(),
};

export const pestRecordsApi = {
  getByLog: (logId: number) => supabase.from("pest_records").select("*").eq("crop_log_id", logId).maybeSingle(),
  create: (data: { crop_log_id: number; pest_name?: string; pest_category?: string; severity?: string; affected_area_pct?: number; recommended_action?: string; treatment_done?: boolean }) =>
    supabase.from("pest_records").insert(data).select().single(),
};

export const diseaseRecordsApi = {
  getByLog: (logId: number) => supabase.from("disease_records").select("*").eq("crop_log_id", logId).maybeSingle(),
  create: (data: { crop_log_id: number; disease_name?: string | null; severity?: string | null }) =>
    supabase.from("disease_records").insert(data).select().single(),
};

export const soilTestsApi = {
  getByLog: (logId: number) => supabase.from("soil_tests").select("*").eq("crop_log_id", logId).maybeSingle(),
  create: (data: { crop_log_id: number; ph?: number; nitrogen_ppm?: number; phosphorus_ppm?: number; potassium_ppm?: number; moisture_pct?: number; organic_matter_pct?: number; temp_celsius?: number; ec_ds_per_m?: number }) =>
    supabase.from("soil_tests").insert(data).select().single(),
};

export const treatmentRecordsApi = {
  getByLog: (logId: number) => supabase.from("treatment_records").select("*").eq("crop_log_id", logId).maybeSingle(),
  create: (data: { crop_log_id: number; product_name?: string; treatment_type?: string; dose_per_ha?: number; total_quantity?: number; unit?: string; application_method?: string; weather_conditions?: string }) =>
    supabase.from("treatment_records").insert(data).select().single(),
};

export const harvestRecordsApi = {
  getByLog: (logId: number) => supabase.from("harvest_records").select("*").eq("crop_log_id", logId).maybeSingle(),
  create: (data: { crop_log_id: number; yield_kg?: number; harvested_area_ha?: number; yield_per_ha?: number; quality_grade?: string; moisture_content_pct?: number; storage_location?: string }) =>
    supabase.from("harvest_records").insert(data).select().single(),
};

// =====================
// LOG TAGS
// =====================
export const logTagsApi = {
  list: () => supabase.from("log_tags").select("*").order("name"),
};
