import { useFocusEffect } from "expo-router";
import {
  BadgeDollarSign,
  Car,
  Droplet,
  Gauge,
  Info,
  ReceiptText,
  Tag,
  Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { APP_CONTENT_MAX_WIDTH } from "@/constants/layout";
import { deleteGasRecord, getGasRecords } from "@/lib/api";
import { formatDisplayDate } from "@/lib/fuelStats";
import type { GasRecord } from "@/types/fuel";

export default function HistorialScreen() {
  const { token } = useAuth();
  const [records, setRecords] = useState<GasRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!token) return;

    try {
      setError("");
      setPendingDeleteId(null);
      const data = await getGasRecords(token);
      setRecords(sortRecordsDesc(data.records || []));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el historial.",
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

  async function handleDeletePress(id: string) {
    if (!token || deletingId) return;

    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      setError("");
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      await deleteGasRecord(token, id);
      setRecords((current) => current.filter((record) => record.id !== id));
      setPendingDeleteId(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "No se elimino. Intentalo de nuevo.",
      );
    } finally {
      setDeletingId(null);
    }
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
          <Text style={styles.kicker}>Tus cargas</Text>
          <Text style={styles.title}>Historial</Text>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Info size={18} color="#ffb3bd" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {isLoading && records.length === 0 ? (
          <View style={styles.empty}>
            <ActivityIndicator color="#7bf1ad" size="large" />
            <Text style={styles.emptyTitle}>Cargando historial</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.empty}>
            <ReceiptText size={38} color="#7bf1ad" />
            <Text style={styles.emptyTitle}>Sin registros todavia</Text>
            <Text style={styles.emptyText}>
              Ve a Registro y agrega tu primera carga.
            </Text>
          </View>
        ) : (
          records.map((item) => (
            <View style={styles.recordCard} key={item.id}>
              <View style={styles.recordTop}>
                <View style={styles.recordTitleWrap}>
                  <Text style={styles.recordDate}>
                    {formatDisplayDate(item.fill_date)}
                  </Text>
                  <Text style={styles.recordKm}>
                    {item.odometer_km
                      ? `${item.odometer_km.toLocaleString("es-MX")} km`
                      : "Odometro sin capturar"}
                  </Text>
                </View>

                <Pressable
                  disabled={deletingId === item.id}
                  onPress={() => handleDeletePress(item.id)}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    pendingDeleteId === item.id && styles.deleteButtonConfirm,
                    (pressed || deletingId === item.id) &&
                      styles.deleteButtonPressed,
                  ]}
                >
                  {deletingId === item.id ? (
                    <ActivityIndicator color="#ff9aa5" />
                  ) : (
                    <>
                      <Trash2 size={15} color="#ff7c87" />
                      <Text style={styles.delete}>
                        {pendingDeleteId === item.id ? "Confirmar" : "Eliminar"}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>

              {pendingDeleteId === item.id ? (
                <View style={styles.confirmBox}>
                  <View style={styles.confirmTextWrap}>
                    <Info size={16} color="#ffcf7a" />
                    <Text style={styles.confirmText}>
                      Toca Confirmar para eliminar esta carga.
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setPendingDeleteId(null)}
                    style={styles.cancelDeleteButton}
                  >
                    <Text style={styles.cancelDeleteText}>Cancelar</Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.vehicleRow}>
                <Car size={15} color="#8cecb8" />
                <Text style={styles.vehicleText}>
                  {item.vehicle_name || "Sin vehiculo"}
                </Text>
                <Text style={styles.fullTankText}>
                  {item.is_full_tank ? "Tanque lleno" : "Carga parcial"}
                </Text>
              </View>

              <View style={styles.recordDetails}>
                <DetailPill
                  icon="water"
                  text={`${item.liters.toFixed(1)} L`}
                />
                <DetailPill
                  icon="money"
                  text={formatMoney(item.total_cost)}
                />
                <DetailPill
                  icon="tag"
                  text={`${formatMoney(item.price_per_liter)}/L`}
                />
                {item.odometer_km ? (
                  <DetailPill
                    icon="gauge"
                    text={`${item.odometer_km.toLocaleString("es-MX")} km`}
                  />
                ) : null}
              </View>

              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailPill({
  icon,
  text,
}: {
  icon: "water" | "money" | "tag" | "gauge";
  text: string;
}) {
  const Icon =
    icon === "water"
      ? Droplet
      : icon === "money"
        ? BadgeDollarSign
        : icon === "gauge"
          ? Gauge
          : Tag;

  return (
    <View style={styles.pill}>
      <Icon size={14} color="#8cecb8" />
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

function sortRecordsDesc(records: GasRecord[]) {
  return [...records].sort(
    (a, b) =>
      new Date(b.fill_date).getTime() - new Date(a.fill_date).getTime(),
  );
}

function formatMoney(value: number) {
  return `$${value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
  empty: {
    backgroundColor: "#102330",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#18384b",
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 12,
  },
  emptyText: {
    color: "#a9c7d4",
    textAlign: "center",
    marginTop: 6,
  },
  recordCard: {
    backgroundColor: "#102330",
    borderRadius: 24,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#18384b",
  },
  recordTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  recordTitleWrap: {
    flex: 1,
  },
  recordDate: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  recordKm: {
    color: "#a4c5d3",
    marginTop: 4,
  },
  deleteButton: {
    height: 36,
    minWidth: 92,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#5a2b34",
    backgroundColor: "#2b141b",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
  },
  deleteButtonPressed: {
    opacity: 0.75,
  },
  deleteButtonConfirm: {
    backgroundColor: "#4b1720",
    borderColor: "#ff7c87",
  },
  delete: {
    color: "#ff7c87",
    fontWeight: "900",
    fontSize: 12,
  },
  confirmBox: {
    backgroundColor: "#2b2114",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#7a4d1c",
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  confirmTextWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confirmText: {
    color: "#ffd99a",
    flex: 1,
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
  },
  cancelDeleteButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#7a4d1c",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  cancelDeleteText: {
    color: "#fff4d8",
    fontSize: 12,
    fontWeight: "900",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  vehicleText: {
    color: "#dff7e9",
    fontWeight: "900",
  },
  fullTankText: {
    color: "#9fc0cf",
    fontSize: 12,
    fontWeight: "800",
  },
  recordDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b1821",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#1f3a49",
  },
  pillText: {
    color: "#dcf2fb",
    marginLeft: 6,
    fontWeight: "800",
    fontSize: 12,
  },
  notes: {
    color: "#b8d1dd",
    marginTop: 12,
    lineHeight: 20,
  },
});
