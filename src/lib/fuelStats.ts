import { FuelRecord } from "../types/fuel";
import { sortRecordsAsc } from "./fuelSore";

export function calculateStats(records: FuelRecord[]) {
  const sorted = sortRecordsAsc(records);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlySpent = sorted
    .filter((record) => {
      const d = new Date(`${record.date}T00:00:00`);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, record) => sum + record.totalPaid, 0);

  const totalSpent = sorted.reduce((sum, record) => sum + record.totalPaid, 0);
  const totalLiters = sorted.reduce((sum, record) => sum + record.liters, 0);

  let totalKm = 0;
  let litersForEfficiency = 0;
  let totalDays = 0;
  let dayIntervals = 0;

  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const current = sorted[i];

    const kmDiff = current.odometerKm - previous.odometerKm;

    if (kmDiff > 0 && current.liters > 0) {
      totalKm += kmDiff;
      litersForEfficiency += current.liters;
    }

    const daysDiff =
      (new Date(`${current.date}T00:00:00`).getTime() -
        new Date(`${previous.date}T00:00:00`).getTime()) /
      (1000 * 60 * 60 * 24);

    if (daysDiff > 0) {
      totalDays += daysDiff;
      dayIntervals++;
    }
  }

  const averageKmPerLiter =
    litersForEfficiency > 0 ? totalKm / litersForEfficiency : 0;

  const averageDaysBetweenFills =
    dayIntervals > 0 ? totalDays / dayIntervals : 0;

  let nextFillDate = "";

  if (sorted.length > 0 && averageDaysBetweenFills > 0) {
    const lastDate = new Date(`${sorted[sorted.length - 1].date}T00:00:00`);
    lastDate.setDate(lastDate.getDate() + Math.round(averageDaysBetweenFills));
    nextFillDate = toISODate(lastDate);
  }

  return {
    monthlySpent,
    totalSpent,
    totalLiters,
    totalKm,
    averageKmPerLiter,
    averageDaysBetweenFills,
    nextFillDate,
  };
}

export function getSpendingChartData(records: FuelRecord[]) {
  const sorted = sortRecordsAsc(records).slice(-6);

  return {
    labels: sorted.map((r) => shortDate(r.date)),
    datasets: [
      {
        data: sorted.map((r) => Number(r.totalPaid.toFixed(2))),
      },
    ],
  };
}

export function getLitersChartData(records: FuelRecord[]) {
  const sorted = sortRecordsAsc(records).slice(-6);

  return {
    labels: sorted.map((r) => shortDate(r.date)),
    datasets: [
      {
        data: sorted.map((r) => Number(r.liters.toFixed(1))),
      },
    ],
  };
}

export function getEfficiencyChartData(records: FuelRecord[]) {
  const sorted = sortRecordsAsc(records);

  const points: { label: string; value: number }[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const current = sorted[i];

    const kmDiff = current.odometerKm - previous.odometerKm;

    if (kmDiff > 0 && current.liters > 0) {
      points.push({
        label: shortDate(current.date),
        value: Number((kmDiff / current.liters).toFixed(2)),
      });
    }
  }

  const lastSix = points.slice(-6);

  return {
    labels: lastSix.map((p) => p.label),
    datasets: [
      {
        data: lastSix.map((p) => p.value),
      },
    ],
  };
}

export function getMonthlySpendingChartData(records: FuelRecord[]) {
  const monthlyMap: Record<string, number> = {};

  records.forEach((record) => {
    const d = new Date(`${record.date}T00:00:00`);
    const key = `${d.getMonth() + 1}/${String(d.getFullYear()).slice(-2)}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + record.totalPaid;
  });

  const entries = Object.entries(monthlyMap).slice(-6);

  return {
    labels: entries.map(([label]) => label),
    datasets: [
      {
        data: entries.map(([, value]) => Number(value.toFixed(2))),
      },
    ],
  };
}

export function getToday() {
  return new Date().toISOString().split("T")[0];
}

export function toISODate(date: Date) {
  return date.toISOString().split("T")[0];
}

export function formatDisplayDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function shortDate(dateString: string) {
  const d = new Date(`${dateString}T00:00:00`);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}
