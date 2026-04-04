// Local API Client - Replaces Supabase
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

type ApiError = { message: string };
type ApiResult<T> = { data: T | null; error: ApiError | null };

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: any;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const { method = "GET", body } = options;

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return { data: null, error: { message: error.detail || `HTTP ${response.status}` } };
    }

    const data = (await response.json()) as T;
    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    return { data: null, error: { message } };
  }
}

// =====================
// FARMS
// =====================
export const farmsApi = {
  list: () => apiRequest("/farms"),
  get: (id: number) => apiRequest(`/farms/${id}`),
  create: (data: { name: string; center_lat?: number; center_lng?: number; geo_file_url?: string }) =>
    apiRequest("/farms", { method: "POST", body: data }),
  update: (id: number, data: Partial<{ name: string; center_lat: number; center_lng: number }>) =>
    apiRequest(`/farms/${id}`, { method: "PUT", body: data }),
  delete: (id: number) => apiRequest(`/farms/${id}`, { method: "DELETE" }),
};

// =====================
// FIELDS
// =====================
export const fieldsApi = {
  list: (farmId?: number) => {
    const params = farmId ? `?farm_id=${farmId}` : "";
    return apiRequest(`/fields${params}`);
  },
  get: (id: number) => apiRequest(`/fields/${id}`),
  create: (data: { farm_id: number; name: string; area_hectares?: number; soil_type?: string }) =>
    apiRequest("/fields", { method: "POST", body: data }),
  update: (id: number, data: Partial<{ name: string; area_hectares: number; soil_type: string }>) =>
    apiRequest(`/fields/${id}`, { method: "PUT", body: data }),
  delete: (id: number) => apiRequest(`/fields/${id}`, { method: "DELETE" }),
  createWithCsv: async (data: {
    farm_id: number;
    name: string;
    area_hectares?: number;
    soil_type?: string;
    csv_file: File;
  }) => {
    try {
      const formData = new FormData();
      formData.append("farm_id", String(data.farm_id));
      formData.append("name", data.name);
      if (data.area_hectares !== undefined) formData.append("area_hectares", String(data.area_hectares));
      if (data.soil_type) formData.append("soil_type", data.soil_type);
      formData.append("csv_file", data.csv_file);

      const response = await fetch(`${API_BASE_URL}/fields/upload-csv`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { data: null, error: { message: error.detail || `HTTP ${response.status}` } };
      }

      const payload = await response.json();
      return { data: payload, error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      return { data: null, error: { message } };
    }
  },
};

// =====================
// GEO POINTS
// =====================
export const geoPointsApi = {
  listByField: (fieldId: number) => apiRequest(`/fields/${fieldId}/geo-points`),
  geofenceStatus: (fieldId: number) => apiRequest(`/fields/${fieldId}/geofence-status`),
  bulkSave: async (fieldId: number, points: { lat: number; lng: number; sequence_order: number }[]) => {
    const pointsData = points.map((p) => ({ ...p, field_id: fieldId }));
    return apiRequest(`/fields/${fieldId}/geo-points/bulk`, { method: "POST", body: pointsData });
  },
};

// =====================
// CROP SEASONS
// =====================
export const cropSeasonsApi = {
  listByField: (fieldId: number) => apiRequest(`/fields/${fieldId}/crop-seasons`),
  getActive: (fieldId: number) => apiRequest(`/fields/${fieldId}/crop-seasons/active`),
  create: (data: { field_id: number; crop_type: string; variety?: string; sowing_date?: string; expected_harvest?: string; growth_stage?: string }) =>
    apiRequest("/crop-seasons", { method: "POST", body: data }),
  update: (id: number, data: Partial<{ growth_stage: string; status: string; actual_harvest_date: string }>) =>
    apiRequest(`/crop-seasons/${id}`, { method: "PUT", body: data }),
};

// =====================
// VEHICLES
// =====================
export const vehiclesApi = {
  list: () => apiRequest("/vehicles"),
  get: (id: number) => apiRequest(`/vehicles/${id}`),
};

// =====================
// TASKS
// =====================
export const tasksApi = {
  list: (filters?: { field_id?: number; status?: string; task_type?: string }) => {
    const params = new URLSearchParams();
    if (filters?.field_id) params.append("field_id", filters.field_id.toString());
    if (filters?.status) params.append("status", filters.status);
    if (filters?.task_type) params.append("task_type", filters.task_type);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest(`/tasks${query}`);
  },
  get: (id: number) => apiRequest(`/tasks/${id}`),
  getVisualizationData: (id: number) => apiRequest<{
    task_id: number;
    field_id: number;
    geofence: Array<{ x: number; y: number }>;
    points: Array<{ x: number; y: number }>;
    reference?: { epsg?: string };
  }>(`/tasks/${id}/visualization-data`),
  startMission: (id: number) => apiRequest<{ status: string; task_id: number; waypoints: number; message: string }>(
    `/tasks/${id}/start-mission`,
    { method: "POST" }
  ),
  create: (data: {
    field_id: number; vehicle_id?: number; task_type: string;
    target_quantity?: number; unit?: string; scheduled_at?: string; recurrence_rule?: string;
  }) => apiRequest("/tasks", { method: "POST", body: data }),
  update: (id: number, data: Partial<{
    field_id: number; vehicle_id: number; task_type: string;
    target_quantity: number; unit: string; scheduled_at: string; recurrence_rule: string; status: string;
  }>) => apiRequest(`/tasks/${id}`, { method: "PUT", body: data }),
  delete: (id: number) => apiRequest(`/tasks/${id}`, { method: "DELETE" }),
};

// =====================
// TASK EXECUTIONS
// =====================
export const taskExecutionsApi = {
  listByTask: (taskId: number) => apiRequest(`/tasks/${taskId}/executions`),
};

// =====================
// ALERTS
// =====================
export const alertsApi = {
  listUnresolved: () => apiRequest("/alerts/unresolved"),
  resolve: (id: number) => apiRequest(`/alerts/${id}/resolve`, { method: "PUT" }),
};

// =====================
// CROP LOGS
// =====================
export const cropLogsApi = {
  list: (filters?: { field_id?: number; log_type?: string; is_auto_generated?: boolean }) => {
    const params = new URLSearchParams();
    if (filters?.field_id) params.append("field_id", filters.field_id.toString());
    if (filters?.log_type) params.append("log_type", filters.log_type);
    if (filters?.is_auto_generated !== undefined) params.append("is_auto_generated", filters.is_auto_generated.toString());
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiRequest(`/crop-logs${query}`);
  },
  get: (id: number) => apiRequest(`/crop-logs/${id}`),
  create: (data: {
    field_id: number; crop_season_id?: number; log_type: string;
    title: string; notes?: string; logged_by?: string; is_auto_generated?: boolean;
  }) => apiRequest("/crop-logs", { method: "POST", body: data }),
  delete: (id: number) => apiRequest(`/crop-logs/${id}`, { method: "DELETE" }),
};

// Sub-type detail fetchers
export const growthObservationsApi = {
  getByLog: (logId: number) => apiRequest(`/crop-logs/${logId}/growth-observation`),
  create: (data: { crop_log_id: number; plant_height_cm?: number; leaf_count?: number; bbch_stage?: string; canopy_cover_pct?: number; vigor_rating?: string }) =>
    apiRequest("/growth-observations", { method: "POST", body: data }),
};

export const pestRecordsApi = {
  getByLog: (logId: number) => apiRequest(`/crop-logs/${logId}/pest-record`),
  create: (data: { crop_log_id: number; pest_name?: string; pest_category?: string; severity?: string; affected_area_pct?: number; recommended_action?: string; treatment_done?: boolean }) =>
    apiRequest("/pest-records", { method: "POST", body: data }),
};

export const diseaseRecordsApi = {
  getByLog: (logId: number) => apiRequest(`/crop-logs/${logId}/disease-record`),
  create: (data: { crop_log_id: number; disease_name?: string | null; severity?: string | null }) =>
    apiRequest("/disease-records", { method: "POST", body: data }),
};

export const soilTestsApi = {
  getByLog: (logId: number) => apiRequest(`/crop-logs/${logId}/soil-test`),
  create: (data: { crop_log_id: number; ph?: number; nitrogen_ppm?: number; phosphorus_ppm?: number; potassium_ppm?: number; moisture_pct?: number; organic_matter_pct?: number; temp_celsius?: number; ec_ds_per_m?: number }) =>
    apiRequest("/soil-tests", { method: "POST", body: data }),
};

export const treatmentRecordsApi = {
  getByLog: (logId: number) => apiRequest(`/crop-logs/${logId}/treatment-record`),
  create: (data: { crop_log_id: number; product_name?: string; treatment_type?: string; dose_per_ha?: number; total_quantity?: number; unit?: string; application_method?: string; weather_conditions?: string }) =>
    apiRequest("/treatment-records", { method: "POST", body: data }),
};

export const harvestRecordsApi = {
  getByLog: (logId: number) => apiRequest(`/crop-logs/${logId}/harvest-record`),
  create: (data: { crop_log_id: number; yield_kg?: number; harvested_area_ha?: number; yield_per_ha?: number; quality_grade?: string; moisture_content_pct?: number; storage_location?: string }) =>
    apiRequest("/harvest-records", { method: "POST", body: data }),
};

// =====================
// LOG TAGS
// =====================
export const logTagsApi = {
  list: () => apiRequest("/log-tags"),
};
