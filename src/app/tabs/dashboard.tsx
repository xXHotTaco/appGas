import { useFocusEffect } from "expo-router";
import {
  BadgeDollarSign,
  CalendarRange,
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
import { getGasRecords, getStats } from "@/lib/api";
import { formatDisplayDate, shortDate } from "@/lib/fuelStats";
import type { GasRecord, StatsResponse } from "@/types/fuel";

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!token) return;

    try {
      setError("");
      const [statsData, recordsData] = await Promise.all([
        getStats(token),
        getGasRecords(token),
      ]);

      setStats({
        summary: statsData.summary,
        monthly: statsData.monthly || [],
        efficiency: statsData.efficiency || [],
      });
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
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadData();
    }, [loadData]),
  );

  const summary = stats?.summary;
  const monthlySpentChart = useMemo(
    () => buildMonthlyChart(stats?.monthly || [], "spent"),
    [stats?.monthly],
  );
  const monthlyLitersChart = useMemo(
    () => buildMonthlyChart(stats?.monthly || [], "liters"),
    [stats?.monthly],
  );
  const efficiencyChart = useMemo(
    () => buildEfficiencyChart(stats?.efficiency || [], "km_per_liter"),
    [stats?.efficiency],
  );
  const costPerKmChart = useMemo(
    () => buildEfficiencyChart(stats?.efficiency || [], "cost_per_km"),
    [stats?.efficiency],
  );
  const latestEfficiency =
    stats?.efficiency && stats.efficiency.length > 0
      ? stats.efficiency[stats.efficiency.length - 1]
      : null;

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

        {isLoading && !summary ? (
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
                value={formatMoney(summary?.total_spent || 0)}
              />
              <StatCard
                icon="water"
                label="Litros"
                value={`${formatNumber(summary?.total_liters || 0, 1)} L`}
              />
              <StatCard
                icon="tag"
                label="Precio promedio"
                value={`${formatMoney(summary?.avg_price_per_liter || 0)}/L`}
              />
              <StatCard
                icon="receipt"
                label="Cargas"
                value={`${summary?.total_records || 0}`}
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
                <EmptyGraph text="Agrega registros para ver esta grafica." />
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
                <EmptyGraph text="Agrega registros para ver litros mensuales." />
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
                <EmptyGraph text="Necesitas odometro en al menos 2 cargas." />
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
                <EmptyGraph text="Necesitas odometro en al menos 2 cargas." />
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

function buildMonthlyChart(
  monthly: StatsResponse["monthly"],
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
  efficiency: StatsResponse["efficiency"],
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
