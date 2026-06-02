import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { formatDisplayDate } from "../../lib/fuelStats";

import { deleteFuelRecord, getFuelRecords } from "@/lib/fuelSore";
import { FuelRecord } from "../../types/fuel";

export default function HistorialScreen() {
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

  function confirmDelete(id: string) {
    Alert.alert(
      "Eliminar registro",
      "¿Seguro que quieres eliminar esta carga?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const updated = await deleteFuelRecord(id);
            setRecords(updated);
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Tus cargas</Text>
          <Text style={styles.title}>Historial</Text>
          <Text style={styles.subtitle}>
            Consulta y elimina registros guardados.
          </Text>
        </View>

        {records.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={38} color="#7bf1ad" />
            <Text style={styles.emptyTitle}>Sin registros todavía</Text>
            <Text style={styles.emptyText}>
              Ve a Registro y agrega tu primera carga.
            </Text>
          </View>
        ) : (
          records.map((item) => {
            const pricePerLiter = item.totalPaid / item.liters;

            return (
              <View style={styles.recordCard} key={item.id}>
                <View style={styles.recordTop}>
                  <View>
                    <Text style={styles.recordDate}>
                      {formatDisplayDate(item.date)}
                    </Text>
                    <Text style={styles.recordKm}>
                      {item.odometerKm.toLocaleString("es-MX")} km
                    </Text>
                  </View>

                  <Pressable onPress={() => confirmDelete(item.id)}>
                    <Text style={styles.delete}>Eliminar</Text>
                  </Pressable>
                </View>

                <View style={styles.recordDetails}>
                  <DetailPill
                    icon="water-outline"
                    text={`${item.liters.toFixed(1)} L`}
                  />
                  <DetailPill
                    icon="cash-outline"
                    text={`$${item.totalPaid.toFixed(2)}`}
                  />
                  <DetailPill
                    icon="pricetag-outline"
                    text={`$${pricePerLiter.toFixed(2)}/L`}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailPill({
  icon,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={14} color="#8cecb8" />
      <Text style={styles.pillText}>{text}</Text>
    </View>
  );
}

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
    marginBottom: 12,
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
  delete: {
    color: "#ff7c87",
    fontWeight: "900",
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
});
