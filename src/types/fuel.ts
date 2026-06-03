export type AuthUser = {
  id: string;
  name: string;
  email: string;
  created_at?: string;
};

export type Vehicle = {
  id: string;
  name: string;
  tank_capacity_liters: number | null;
  created_at?: string;
};

export type GasRecord = {
  id: string;
  vehicle_id?: string | null;
  vehicle_name?: string | null;
  fill_date: string;
  odometer_km?: number | null;
  liters: number;
  price_per_liter: number;
  total_cost: number;
  is_full_tank?: boolean | number;
  notes?: string | null;
  created_at?: string;
};

export type StatsSummary = {
  total_records: number;
  total_liters: number;
  total_spent: number;
  avg_price_per_liter: number;
};

export type MonthlyStats = {
  month: string;
  liters: number;
  spent: number;
  records: number;
};

export type EfficiencyStats = {
  from_date: string;
  to_date: string;
  km_driven: number;
  liters: number;
  km_per_liter: number;
  cost_per_km: number;
};

export type StatsResponse = {
  summary: StatsSummary;
  monthly: MonthlyStats[];
  efficiency: EfficiencyStats[];
};

export type FuelRecord = GasRecord;
