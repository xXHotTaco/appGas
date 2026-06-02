import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { CircleGauge } from "lucide-react-native";
import React, { useCallback, useMemo, useState } from "react";
import {
    Dimensions,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BarChart, LineChart } from "react-native-chart-kit";
import {
    calculateStats,
    formatDisplayDate,
    getEfficiencyChartData,
    getLitersChartData,
    getMonthlySpendingChartData,
    getSpendingChartData,
} from "../../lib/fuelStats";

import { getFuelRecords } from "@/lib/fuelSore";
import { FuelRecord } from "../../types/fuel";

const screenWidth = Dimensions.get("window").width;
const chartWidth = Math.max(screenWidth - 42, 320);
type IoniconName = keyof typeof Ionicons.glyphMap;

export default function DashboardScreen() {
  const [records, setRecords] = useState<FuelRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  async function loadData() {
    const data = await getFuelRecords();
    setRecords(data);
  }

  const stats = useMemo(() => calculateStats(records), [records]);
  const spendingChartData = useMemo(
    () => getSpendingChartData(records),
    [records],
  );
  const litersChartData = useMemo(() => getLitersChartData(records), [records]);
  const efficiencyChartData = useMemo(
    () => getEfficiencyChartData(records),
    [records],
  );
  const monthlyChartData = useMemo(
    () => getMonthlySpendingChartData(records),
    [records],
  );

  const hasRecords = records.length > 0;
  const hasEfficiency = efficiencyChartData.labels.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View>
            <Text style={styles.kicker}>appGas</Text>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>
              Tu resumen, tendencias y próxima carga.
            </Text>
          </View>

          <View style={styles.heroIcon}>
            <CircleGauge size={30} color="#7bf1ad" />
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="cash-outline"
            label="Gasto del mes"
            value={`$${stats.monthlySpent.toFixed(2)}`}
          />
          <StatCard
            icon="analytics-outline"
            label="Rendimiento"
            value={`${stats.averageKmPerLiter.toFixed(2)} km/L`}
          />
          <StatCard
            icon="water-outline"
            label="Litros totales"
            value={`${stats.totalLiters.toFixed(1)} L`}
          />
          <StatCard
            icon="calendar-number-outline"
            label="Próxima carga"
            value={
              stats.nextFillDate
                ? formatDisplayDate(stats.nextFillDate)
                : "Sin datos"
            }
          />
        </View>

        <ChartCard title="Gasto por carga" icon="bar-chart-outline">
          {hasRecords ? (
            <BarChart
              data={spendingChartData}
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
            <EmptyGraph text="Agrega registros para ver esta gráfica." />
          )}
        </ChartCard>

        <ChartCard title="Rendimiento km/L" icon="trending-up-outline">
          {hasEfficiency ? (
            <LineChart
              data={efficiencyChartData}
              width={chartWidth}
              height={230}
              fromZero
              bezier
              withShadow={false}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          ) : (
            <EmptyGraph text="Necesitas al menos 2 registros para calcular rendimiento." />
          )}
        </ChartCard>

        <ChartCard title="Litros por carga" icon="water-outline">
          {hasRecords ? (
            <BarChart
              data={litersChartData}
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
            <EmptyGraph text="Agrega registros para ver litros por carga." />
          )}
        </ChartCard>

        <ChartCard title="Gasto mensual" icon="calendar-outline">
          {hasRecords ? (
            <LineChart
              data={monthlyChartData}
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
            <EmptyGraph text="Agrega registros para ver gasto mensual." />
          )}
        </ChartCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: IoniconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>
        <Ionicons name={icon} size={20} color="#7bf1ad" />
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
  icon: IoniconName;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <Ionicons name={icon} size={20} color="#7bf1ad" />
        <Text style={styles.chartTitle}>{title}</Text>
      </View>

      {children}
    </View>
  );
}

function EmptyGraph({ text }: { text: string }) {
  return (
    <View style={styles.emptyGraph}>
      <Ionicons name="information-circle-outline" size={24} color="#7bf1ad" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
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
  kicker: {
    color: "#7bf1ad",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 4,
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
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
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
    fontSize: 21,
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
});
