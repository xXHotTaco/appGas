import type {
  AuthUser,
  GasRecord,
  StatsApiResponse,
  Vehicle,
} from "@/types/fuel";

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || "http://127.0.0.1:8787";

type ApiRequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

type ApiEnvelope<T> = T & {
  ok: boolean;
  error?: string;
};

type AuthResponse = {
  token: string;
  user: AuthUser;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {},
  token: string | null = null,
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  const text = await response.text();
  const data = (text ? JSON.parse(text) : {}) as ApiEnvelope<T>;

  if (!response.ok || data.ok === false) {
    throw new ApiError(data.error || "Error en la peticion", response.status);
  }

  return data;
}

export function registerUser(name: string, email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginUser(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(token: string) {
  return apiRequest<{ user: AuthUser }>("/api/me", {}, token);
}

export function getVehicles(token: string) {
  return apiRequest<{ vehicles: Vehicle[] }>("/api/vehicles", {}, token);
}

export function createVehicle(
  token: string,
  data: { name: string; tank_capacity_liters: number | null },
) {
  return apiRequest<{ vehicle: Vehicle }>(
    "/api/vehicles",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function deleteVehicle(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/api/vehicles/${id}`,
    { method: "DELETE" },
    token,
  );
}

function withVehicleFilter(endpoint: string, vehicleId?: string | null) {
  if (!vehicleId) {
    return endpoint;
  }

  return `${endpoint}?vehicle_id=${encodeURIComponent(vehicleId)}`;
}

export function getGasRecords(token: string, vehicleId?: string | null) {
  return apiRequest<{ records: GasRecord[] }>(
    withVehicleFilter("/api/gas-records", vehicleId),
    {},
    token,
  );
}

export function createGasRecord(
  token: string,
  data: {
    vehicle_id?: string | null;
    fill_date: string;
    odometer_km?: number | null;
    liters: number;
    price_per_liter: number;
    is_full_tank: boolean;
    notes?: string | null;
  },
) {
  return apiRequest<{ record: GasRecord }>(
    "/api/gas-records",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    token,
  );
}

export function deleteGasRecord(token: string, id: string) {
  return apiRequest<{ ok: true }>(
    `/api/gas-records/${id}`,
    { method: "DELETE" },
    token,
  );
}

export function getStats(token: string, vehicleId?: string | null) {
  return apiRequest<StatsApiResponse>(
    withVehicleFilter("/api/stats", vehicleId),
    {},
    token,
  );
}
