import AsyncStorage from "@react-native-async-storage/async-storage";
import { FuelRecord } from "../types/fuel";

const STORAGE_KEY = "@appGas:fuelRecords";

export function sortRecordsDesc(records: FuelRecord[]) {
  return [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

export function sortRecordsAsc(records: FuelRecord[]) {
  return [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export async function getFuelRecords(): Promise<FuelRecord[]> {
  const saved = await AsyncStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  const parsed: FuelRecord[] = JSON.parse(saved);
  return sortRecordsDesc(parsed);
}

export async function saveFuelRecords(records: FuelRecord[]) {
  const sorted = sortRecordsDesc(records);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  return sorted;
}

export async function addFuelRecord(record: FuelRecord) {
  const current = await getFuelRecords();
  return saveFuelRecords([...current, record]);
}

export async function deleteFuelRecord(id: string) {
  const current = await getFuelRecords();
  return saveFuelRecords(current.filter((record) => record.id !== id));
}
