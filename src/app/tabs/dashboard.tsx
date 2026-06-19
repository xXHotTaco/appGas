import { useFocusEffect } from "expo-router";
import {
  BadgeDollarSign,
  CalendarRange,
  Car,
  ChartColumn,
  CircleGauge,
  Droplets,
  Fuel,
  Info,
  ReceiptText,
  Tag,
  TrendingUp,
} from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";

import { APP_CONTENT_MAX_WIDTH } from "@/constants/layout";
import { BrandMark } from "@/components/brand-mark";
import { useAuth } from "@/contexts/AuthContext";
import { getGasRecords, getStats, getVehicles } from "@/lib/api";
import { formatDisplayDate, shortDate } from "@/lib/fuelStats";
import type {
  GasRecord,
  StatsApiResponse,
  StatsFilter,
  StatsGroup,
  StatsResponse,
  Vehicle,
} from "@/types/fuel";

const screenWidth = Dimensions.get("window").width;
const chartWidth = Math.max(
  Math.min(screenWidth - 42, APP_CONTENT_MAX_WIDTH - 36),
  320,
);

type DashboardIconName =
  | "money"
  | "trend"
  | "water"
  | "chart"
  | "calendar-range"
  | "info"
  | "fuel"
  | "tag"
  | "receipt";

const dashboardIcons = {
  money: BadgeDollarSign,
  trend: TrendingUp,
  water: Droplets,
  chart: ChartColumn,
  "calendar-range": CalendarRange,
  info: Info,
  fuel: Fuel,
  tag: Tag,
  receipt: ReceiptText,
} satisfies Record<DashboardIconName, ElementType>;

export default function DashboardScreen() {
  const { token } = useAuth();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [records, setRecords] = useState<GasRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );

  const loadData = useCallback(async () => {
    if (!token) return;

    try {
      setError("");
      const [vehiclesData, statsData, recordsData] = await Promise.all([
        getVehicles(token),
        getStats(token, selectedVehicleId),
        getGasRecords(token, selectedVehicleId),
      ]);

      setVehicles(vehiclesData.vehicles || []);
      setStats(normalizeStatsResponse(statsData));
      setRecords(sortRecordsDesc(recordsData.records || []));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedVehicleId, token]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadData();
    }, [loadData]),
  );

  const activeVehicleId = stats?.filter?.vehicle_id ?? selectedVehicleId;
  const overallSummary = stats?.overall.summary;
  const activeVehicleName = useMemo(() => {
    if (!activeVehicleId) {
      return "Todos los vehiculos";
    }

    return (
      vehicles.find((vehicle) => vehicle.id === activeVehicleId)?.name ||
      records.find((record) => record.vehicle_id === activeVehicleId)?.vehicle_name ||
      stats?.vehicles[0]?.vehicle_name ||
      "Vehiculo"
    );
  }, [activeVehicleId, records, stats?.vehicles, vehicles]);
  const vehicleFilterOptions = useMemo<VehicleFilterOption[]>(
    () => [
      { id: null, label: "Todos" },
      ...vehicles.map((vehicle) => ({ id: vehicle.id, label: vehicle.name })),
    ],
    [vehicles],
  );
  const monthlySpentChart = useMemo(
    () => buildMonthlyChart(stats?.overall.monthly || [], "spent"),
    [stats?.overall.monthly],
  );
  const monthlyLitersChart = useMemo(
    () => buildMonthlyChart(stats?.overall.monthly || [], "liters"),
    [stats?.overall.monthly],
  );
  const efficiencyChart = useMemo(
    () => buildEfficiencyChart(stats?.overall.efficiency || [], "km_per_liter"),
    [stats?.overall.efficiency],
  );
  const costPerKmChart = useMemo(
    () => buildEfficiencyChart(stats?.overall.efficiency || [], "cost_per_km"),
    [stats?.overall.efficiency],
  );
  const overallEfficiency = stats?.overall.efficiency || [];
  const latestEfficiency =
    overallEfficiency.length > 0
      ? overallEfficiency[overallEfficiency.length - 1]
      : null;
  const vehicleChartsEmptyText = activeVehicleId
    ? "Ese vehiculo aun no tiene datos para esta grafica."
    : "Agrega registros para ver esta grafica.";
  const vehicleEfficiencyEmptyText = activeVehicleId
    ? "Ese vehiculo necesita odometro en al menos 2 cargas."
    : "Necesitas odometro en al menos 2 cargas.";

  function handleVehicleFilterChange(vehicleId: string | null) {
    setStats(null);
    setIsLoading(true);
    setSelectedVehicleId(vehicleId);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => {
              setIsLoading(true);
              loadData();
            }}
            tintColor="#7bf1ad"
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <BrandMark />
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Resumen real de tus cargas.</Text>
          </View>

          <View style={styles.heroIcon}>
            <CircleGauge size={30} color="#7bf1ad" />
          </View>
        </View>

        {error ? <ErrorBanner text={error} /> : null}

        {isLoading && !overallSummary ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#7bf1ad" size="large" />
            <Text style={styles.loadingText}>Cargando datos</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard
                icon="money"
                label="Total gastado"
                value={formatMoney(overallSummary?.total_spent || 0)}
              />
              <StatCard
                icon="water"
                label="Litros"
                value={`${formatNumber(overallSummary?.total_liters || 0, 1)} L`}
              />
              <StatCard
                icon="tag"
                label="Precio promedio"
                value={`${formatMoney(overallSummary?.avg_price_per_liter || 0)}/L`}
              />
              <StatCard
                icon="receipt"
                label="Cargas"
                value={`${overallSummary?.total_records || 0}`}
              />
              <StatCard
                icon="trend"
                label="Rendimiento"
                value={
                  latestEfficiency
                    ? `${formatNumber(latestEfficiency.km_per_liter, 2)} km/L`
                    : "Sin datos"
                }
              />
              <StatCard
                icon="fuel"
                label="Costo por km"
                value={
                  latestEfficiency
                    ? formatMoney(latestEfficiency.cost_per_km)
                    : "Sin datos"
                }
              />
            </View>

            <View style={styles.sectionHeader}>
              <Car size={20} color="#7bf1ad" />
              <Text style={styles.sectionTitle}>Filtro por vehiculo</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vehicleFilterRow}
              style={styles.vehicleFilterScroller}
            >
              {vehicleFilterOptions.map((vehicle) => {
                const isActive = (vehicle.id || null) === (activeVehicleId || null);

                return (
                  <Pressable
                    key={vehicle.id || "all"}
                    onPress={() => handleVehicleFilterChange(vehicle.id)}
                    style={({ pressed }) => [
                      styles.vehicleFilterChip,
                      isActive && styles.vehicleFilterChipActive,
                      pressed && styles.vehicleFilterChipPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.vehicleFilterChipText,
                        isActive && styles.vehicleFilterChipTextActive,
                      ]}
                    >
                      {vehicle.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {overallSummary ? (
              <Text style={styles.vehicleFilterSummary}>
                {`${activeVehicleName} | ${overallSummary.total_records} cargas | ${formatNumber(overallSummary.total_liters, 1)} L | ${formatMoney(overallSummary.total_spent)}`}
              </Text>
            ) : (
              <View style={styles.vehicleSelectorEmpty}>
                <Info size={18} color="#7bf1ad" />
                <Text style={styles.vehicleSelectorEmptyText}>
                  Agrega vehiculos o cargas para ver datos filtrados.
                </Text>
              </View>
            )}

            <ChartCard title="Gasto mensual" icon="calendar-range">
              {monthlySpentChart.labels.length > 0 ? (
                <BarChart
                  data={monthlySpentChart}
                  width={chartWidth}
                  height={230}
                  yAxisLabel="$"
                  yAxisSuffix=""
                  fromZero
                  showValuesOnTopOfBars
                  withInnerLines={false}
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
              ) : (
                <EmptyGraph text={vehicleChartsEmptyText} />
              )}
            </ChartCard>

            <ChartCard title="Litros mensuales" icon="water">
              {monthlyLitersChart.labels.length > 0 ? (
                <BarChart
                  data={monthlyLitersChart}
                  width={chartWidth}
                  height={230}
                  yAxisLabel=""
                  yAxisSuffix=" L"
                  fromZero
                  showValuesOnTopOfBars
                  withInnerLines={false}
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
              ) : (
                <EmptyGraph text={vehicleChartsEmptyText} />
              )}
            </ChartCard>

            <ChartCard title="Rendimiento km/L" icon="trend">
              {efficiencyChart.labels.length > 0 ? (
                <LineChart
                  data={efficiencyChart}
                  width={chartWidth}
                  height={230}
                  fromZero
                  bezier
                  withShadow={false}
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
              ) : (
                <EmptyGraph text={vehicleEfficiencyEmptyText} />
              )}
            </ChartCard>

            <ChartCard title="Costo por km" icon="fuel">
              {costPerKmChart.labels.length > 0 ? (
                <LineChart
                  data={costPerKmChart}
                  width={chartWidth}
                  height={230}
                  yAxisLabel="$"
                  yAxisSuffix=""
                  fromZero
                  bezier
                  withShadow={false}
                  chartConfig={chartConfig}
                  style={styles.chart}
                />
              ) : (
                <EmptyGraph text={vehicleEfficiencyEmptyText} />
              )}
            </ChartCard>

            <View style={styles.sectionHeader}>
              <ReceiptText size={20} color="#7bf1ad" />
              <Text style={styles.sectionTitle}>Ultimas cargas</Text>
            </View>

            {records.length > 0 ? (
              records.slice(0, 4).map((record) => (
                <View key={record.id} style={styles.recordRow}>
                  <View>
                    <Text style={styles.recordDate}>
                      {formatDisplayDate(record.fill_date)}
                    </Text>
                    <Text style={styles.recordMeta}>
                      {record.vehicle_name || "Sin vehiculo"}
                    </Text>
                  </View>

                  <View style={styles.recordAmounts}>
                    <Text style={styles.recordTotal}>
                      {formatMoney(record.total_cost)}
                    </Text>
                    <Text style={styles.recordMeta}>
                      {formatNumber(record.liters, 1)} L
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <EmptyGraph text="Aun no hay cargas registradas." />
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: DashboardIconName;
  label: string;
  value: string;
}) {
  const Icon = dashboardIcons[icon];

  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Icon size={20} color="#7bf1ad" />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: DashboardIconName;
  children: React.ReactNode;
}) {
  const Icon = dashboardIcons[icon];

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Icon size={20} color="#7bf1ad" />
        <Text style={styles.chartTitle}>{title}</Text>
      </View>

      {children}
    </View>
  );
}

function EmptyGraph({ text }: { text: string }) {
  return (
    <View style={styles.emptyGraph}>
      <Info size={24} color="#7bf1ad" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function ErrorBanner({ text }: { text: string }) {
  return (
    <View style={styles.errorBanner}>
      <Info size={18} color="#ffb3bd" />
      <Text style={styles.errorText}>{text}</Text>
    </View>
  );
}

type VehicleFilterOption = {
  id: string | null;
  label: string;
};

const EMPTY_SUMMARY: StatsGroup["summary"] = {
  total_records: 0,
  total_liters: 0,
  total_spent: 0,
  avg_price_per_liter: 0,
};

const EMPTY_FILTER: StatsFilter = {
  vehicle_id: null,
};

function normalizeStatsResponse(statsData: StatsApiResponse): StatsResponse {
  if (isCurrentStatsResponse(statsData)) {
    return {
      filter: normalizeStatsFilter(statsData.filter),
      overall: normalizeStatsGroup(statsData.overall),
      vehicles: Array.isArray(statsData.vehicles)
        ? statsData.vehicles.map(normalizeVehicleStats)
        : [],
    };
  }

  const legacySummary = statsData.summary || EMPTY_SUMMARY;
  const legacyMonthly = Array.isArray(statsData.monthly) ? statsData.monthly : [];
  const legacyEfficiency = Array.isArray(statsData.efficiency)
    ? statsData.efficiency
    : [];
  const hasLegacyVehicleSeries =
    legacyMonthly.length > 0 || legacyEfficiency.length > 0;

  return {
    filter: EMPTY_FILTER,
    overall: {
      summary: legacySummary,
      monthly: legacyMonthly,
      efficiency: legacyEfficiency,
    },
    vehicles: hasLegacyVehicleSeries
      ? [
          {
            vehicle_name: "General",
            summary: legacySummary,
            monthly: legacyMonthly,
            efficiency: legacyEfficiency,
          },
        ]
      : [],
  };
}

function isCurrentStatsResponse(
  statsData: StatsApiResponse,
): statsData is StatsResponse {
  return "overall" in statsData && "vehicles" in statsData;
}

function normalizeStatsFilter(
  filter?: Partial<StatsFilter> | null,
): StatsFilter {
  return {
    vehicle_id: filter?.vehicle_id || null,
  };
}

function normalizeVehicleStats(vehicleStats: StatsResponse["vehicles"][number]) {
  return {
    ...vehicleStats,
    summary: vehicleStats.summary || EMPTY_SUMMARY,
    monthly: Array.isArray(vehicleStats.monthly) ? vehicleStats.monthly : [],
    efficiency: Array.isArray(vehicleStats.efficiency)
      ? vehicleStats.efficiency
      : [],
  };
}

function normalizeStatsGroup(statsGroup?: Partial<StatsGroup> | null): StatsGroup {
  return {
    summary: statsGroup?.summary || EMPTY_SUMMARY,
    monthly: Array.isArray(statsGroup?.monthly) ? statsGroup.monthly : [],
    efficiency: Array.isArray(statsGroup?.efficiency)
      ? statsGroup.efficiency
      : [],
  };
}

function buildMonthlyChart(
  monthly: StatsGroup["monthly"],
  key: "spent" | "liters",
) {
  const entries = monthly.slice(-6);

  return {
    labels: entries.map((item) => item.month.replace("-", "/")),
    datasets: [
      {
        data: entries.map((item) => Number(item[key].toFixed(2))),
      },
    ],
  };
}

function buildEfficiencyChart(
  efficiency: StatsGroup["efficiency"],
  key: "km_per_liter" | "cost_per_km",
) {
  const entries = efficiency.slice(-6);

  return {
    labels: entries.map((item) => shortDate(item.to_date)),
    datasets: [
      {
        data: entries.map((item) => Number(item[key].toFixed(2))),
      },
    ],
  };
}

function sortRecordsDesc(records: GasRecord[]) {
  return [...records].sort(
    (a, b) =>
      new Date(b.fill_date).getTime() - new Date(a.fill_date).getTime(),
  );
}

function formatMoney(value: number) {
  return `$${formatNumber(value, 2)}`;
}

function formatNumber(value: number, decimals: number) {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const chartConfig = {
  backgroundGradientFrom: "#102330",
  backgroundGradientTo: "#102330",
  decimalPlaces: 1,
  color: (opacity = 1) => `rgba(22, 210, 107, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(231, 247, 255, ${opacity})`,
  propsForDots: {
    r: "5",
    strokeWidth: "2",
    stroke: "#08131b",
  },
  propsForBackgroundLines: {
    stroke: "#294454",
    strokeDasharray: "5 7",
  },
  fillShadowGradientFrom: "#16d26b",
  fillShadowGradientFromOpacity: 0.35,
  fillShadowGradientTo: "#16d26b",
  fillShadowGradientToOpacity: 0.04,
  barPercentage: 0.58,
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#08131b",
  },
  container: {
    width: "100%",
    maxWidth: APP_CONTENT_MAX_WIDTH,
    alignSelf: "center",
    padding: 18,
    paddingBottom: 110,
  },
  hero: {
    backgroundColor: "#102330",
    borderRadius: 28,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#18384b",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroCopy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    color: "#ffffff",
    fontSize: 34,
    fontWeight: "900",
  },
  subtitle: {
    color: "#a9c7d4",
    marginTop: 4,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: 24,
    backgroundColor: "#0b1a23",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    minHeight: 180,
    backgroundColor: "#102330",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#18384b",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#a9c7d4",
    fontWeight: "800",
    marginTop: 12,
  },
  errorBanner: {
    backgroundColor: "#321720",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#66303e",
    padding: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    color: "#ffd9de",
    flex: 1,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: "49%",
    minHeight: 128,
    backgroundColor: "#133042",
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1c455c",
  },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 16,
    backgroundColor: "#0d212d",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statLabel: {
    color: "#a7c7d6",
    fontSize: 13,
  },
  statValue: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 6,
  },
  chartCard: {
    backgroundColor: "#102330",
    borderRadius: 28,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#18384b",
    overflow: "hidden",
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chartTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginLeft: 8,
  },
  chart: {
    marginLeft: -10,
    borderRadius: 18,
  },
  vehicleFilterScroller: {
    marginBottom: 10,
  },
  vehicleFilterRow: {
    paddingBottom: 2,
    gap: 10,
  },
  vehicleFilterChip: {
    minHeight: 42,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1d4255",
    backgroundColor: "#0b1821",
    justifyContent: "center",
  },
  vehicleFilterChipActive: {
    backgroundColor: "#16d26b",
    borderColor: "#16d26b",
  },
  vehicleFilterChipPressed: {
    opacity: 0.78,
  },
  vehicleFilterChipText: {
    color: "#b8d1dd",
    fontWeight: "800",
  },
  vehicleFilterChipTextActive: {
    color: "#06110b",
  },
  vehicleFilterSingle: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 16,
    backgroundColor: "#0b1821",
    borderWidth: 1,
    borderColor: "#1d4255",
    marginBottom: 10,
  },
  vehicleFilterSingleText: {
    color: "#e6f5fb",
    fontWeight: "900",
  },
  vehicleFilterSummary: {
    color: "#9ec2d1",
    marginBottom: 16,
    fontWeight: "700",
  },
  vehicleSelectorEmpty: {
    minHeight: 62,
    backgroundColor: "#102330",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#18384b",
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  vehicleSelectorEmptyText: {
    color: "#b8d1dd",
    flex: 1,
    fontWeight: "700",
  },
  emptyGraph: {
    minHeight: 150,
    backgroundColor: "#0b1821",
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderWidth: 1,
    borderColor: "#1d3441",
  },
  emptyText: {
    color: "#b8d1dd",
    marginTop: 8,
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginLeft: 8,
  },
  recordRow: {
    backgroundColor: "#102330",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#18384b",
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  recordDate: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
  },
  recordMeta: {
    color: "#a4c5d3",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  recordAmounts: {
    alignItems: "flex-end",
  },
  recordTotal: {
    color: "#7bf1ad",
    fontSize: 16,
    fontWeight: "900",
  },
});
