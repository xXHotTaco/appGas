import { useFocusEffect } from "expo-router";
import { Car, CirclePlus, Fuel, Info } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { createVehicle, getVehicles } from "@/lib/api";
import type { Vehicle } from "@/types/fuel";

export default function VehiculosScreen() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [name, setName] = useState("");
  const [tankCapacity, setTankCapacity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    if (!token) return;

    try {
      setError("");
      const data = await getVehicles(token);
      setVehicles(data.vehicles || []);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudieron cargar los vehiculos.",
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

  async function saveVehicle() {
    if (!token) return;

    const cleanName = name.trim();
    const parsedCapacity = Number(tankCapacity.replace(",", "."));

    if (!cleanName || Number.isNaN(parsedCapacity) || parsedCapacity <= 0) {
      Alert.alert(
        "Revisa tus datos",
        "Escribe nombre y capacidad del tanque mayor a cero.",
      );
      return;
    }

    try {
      setIsSaving(true);
      const response = await createVehicle(token, {
        name: cleanName,
        tank_capacity_liters: parsedCapacity,
      });
      setVehicles((current) => [response.vehicle, ...current]);
      setName("");
      setTankCapacity("");
    } catch (saveError) {
      Alert.alert(
        "No se guardo",
        saveError instanceof Error ? saveError.message : "Intentalo de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
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
            <Text style={styles.kicker}>Tus autos</Text>
            <Text style={styles.title}>Vehiculos</Text>
            <Text style={styles.subtitle}>Crea autos para tus cargas.</Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Info size={18} color="#ffb3bd" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.label}>Nombre</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Mi carro"
              placeholderTextColor="#7f97a3"
              style={styles.input}
            />

            <Text style={styles.label}>Capacidad del tanque</Text>
            <TextInput
              value={tankCapacity}
              onChangeText={setTankCapacity}
              placeholder="45"
              placeholderTextColor="#7f97a3"
              keyboardType="decimal-pad"
              style={styles.input}
            />

            <Pressable
              disabled={isSaving}
              onPress={saveVehicle}
              style={({ pressed }) => [
                styles.button,
                (pressed || isSaving) && styles.buttonPressed,
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color="#06110b" />
              ) : (
                <>
                  <CirclePlus size={19} color="#06110b" />
                  <Text style={styles.buttonText}>Crear vehiculo</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.sectionHeader}>
            <Car size={20} color="#7bf1ad" />
            <Text style={styles.sectionTitle}>Guardados</Text>
          </View>

          {isLoading && vehicles.length === 0 ? (
            <View style={styles.empty}>
              <ActivityIndicator color="#7bf1ad" size="large" />
              <Text style={styles.emptyTitle}>Cargando vehiculos</Text>
            </View>
          ) : vehicles.length === 0 ? (
            <View style={styles.empty}>
              <Car size={38} color="#7bf1ad" />
              <Text style={styles.emptyTitle}>Sin vehiculos todavia</Text>
              <Text style={styles.emptyText}>
                Agrega uno para relacionarlo con tus cargas.
              </Text>
            </View>
          ) : (
            vehicles.map((vehicle) => (
              <View key={vehicle.id} style={styles.vehicleCard}>
                <View style={styles.vehicleIcon}>
                  <Car size={22} color="#7bf1ad" />
                </View>
                <View style={styles.vehicleBody}>
                  <Text style={styles.vehicleName}>{vehicle.name}</Text>
                  <View style={styles.vehicleMetaRow}>
                    <Fuel size={14} color="#8cecb8" />
                    <Text style={styles.vehicleMeta}>
                      {vehicle.tank_capacity_liters
                        ? `${vehicle.tank_capacity_liters.toFixed(1)} L`
                        : "Sin capacidad"}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  card: {
    backgroundColor: "#102330",
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: "#18384b",
    marginBottom: 18,
  },
  label: {
    color: "#a6c5d3",
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "700",
  },
  input: {
    backgroundColor: "#0b1821",
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 15,
    color: "#f4fbff",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#1f3a49",
    marginBottom: 14,
  },
  button: {
    minHeight: 54,
    backgroundColor: "#16d26b",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 4,
  },
  buttonPressed: {
    opacity: 0.78,
  },
  buttonText: {
    color: "#06110b",
    fontSize: 16,
    fontWeight: "900",
    marginLeft: 8,
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
  vehicleCard: {
    backgroundColor: "#102330",
    borderRadius: 24,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#18384b",
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleIcon: {
    width: 46,
    height: 46,
    borderRadius: 18,
    backgroundColor: "#0d212d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  vehicleBody: {
    flex: 1,
  },
  vehicleName: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
  },
  vehicleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  vehicleMeta: {
    color: "#a4c5d3",
    fontWeight: "800",
  },
});
