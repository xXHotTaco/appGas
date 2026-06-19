import { useFocusEffect } from "expo-router";
import { Car, CirclePlus, Fuel, Info, Trash2, X } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useVehicleFilter } from "@/contexts/VehicleFilterContext";
import { APP_CONTENT_MAX_WIDTH } from "@/constants/layout";
import { createVehicle, deleteVehicle, getVehicles } from "@/lib/api";
import type { Vehicle } from "@/types/fuel";

export default function VehiculosScreen() {
  const { token } = useAuth();
  const { selectedVehicleId, setSelectedVehicleId } = useVehicleFilter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [name, setName] = useState("");
  const [tankCapacity, setTankCapacity] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(
    null,
  );
  const [vehiclePendingDelete, setVehiclePendingDelete] = useState<Vehicle | null>(
    null,
  );
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
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

  function confirmDeleteVehicle(vehicle: Vehicle) {
    setVehiclePendingDelete(vehicle);
    setDeleteStep(1);
  }

  function closeDeleteModal() {
    if (deletingVehicleId) return;

    setVehiclePendingDelete(null);
    setDeleteStep(1);
  }

  function continueDeleteVehicle() {
    setDeleteStep(2);
  }

  function submitDeleteVehicle() {
    if (!vehiclePendingDelete) return;

    void removeVehicle(vehiclePendingDelete.id);
  }

  async function removeVehicle(vehicleId: string) {
    if (!token) return;

    const remainingVehicles = vehicles.filter((vehicle) => vehicle.id !== vehicleId);
    const nextVehicleId =
      selectedVehicleId === vehicleId
        ? remainingVehicles[0]?.id || null
        : selectedVehicleId;

    try {
      setDeletingVehicleId(vehicleId);
      setError("");
      await deleteVehicle(token, vehicleId);
      setSelectedVehicleId(nextVehicleId);

      const data = await getVehicles(token);
      const nextVehicles = data.vehicles || [];
      const hasCurrentSelection =
        !!nextVehicleId &&
        nextVehicles.some((vehicle) => vehicle.id === nextVehicleId);

      if (nextVehicleId && !hasCurrentSelection) {
        setSelectedVehicleId(nextVehicles[0]?.id || null);
      }

      setVehicles(nextVehicles);
      setVehiclePendingDelete(null);
      setDeleteStep(1);
    } catch (deleteError) {
      Alert.alert(
        "No se borro",
        deleteError instanceof Error ? deleteError.message : "Intentalo de nuevo.",
      );
    } finally {
      setDeletingVehicleId(null);
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

                <Pressable
                  disabled={deletingVehicleId === vehicle.id}
                  onPress={() => confirmDeleteVehicle(vehicle)}
                  style={({ pressed }) => [
                    styles.deleteButton,
                    (pressed || deletingVehicleId === vehicle.id) &&
                      styles.deleteButtonPressed,
                  ]}
                >
                  {deletingVehicleId === vehicle.id ? (
                    <ActivityIndicator color="#ffd9de" size="small" />
                  ) : (
                    <Trash2 size={18} color="#ffd9de" />
                  )}
                </Pressable>
              </View>
            ))
          )}
        </ScrollView>

        <Modal
          visible={!!vehiclePendingDelete}
          animationType="fade"
          transparent
          onRequestClose={closeDeleteModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleWrap}>
                  <Text style={styles.modalEyebrow}>Paso {deleteStep} de 2</Text>
                  <Text style={styles.modalTitle}>
                    {deleteStep === 1 ? "Eliminar vehiculo" : "Confirmacion final"}
                  </Text>
                </View>

                <Pressable
                  disabled={!!deletingVehicleId}
                  onPress={closeDeleteModal}
                  style={({ pressed }) => [
                    styles.modalCloseButton,
                    pressed && styles.modalCloseButtonPressed,
                  ]}
                >
                  <X size={18} color="#d7edf6" />
                </Pressable>
              </View>

              <Text style={styles.modalBody}>
                {deleteStep === 1
                  ? `Se borrara "${vehiclePendingDelete?.name}" y esta accion tambien afectara a los registros del vehiculo eliminado.`
                  : `Vas a eliminar "${vehiclePendingDelete?.name}". Esta accion tambien afectara a los registros del vehiculo eliminado y no se puede deshacer.`}
              </Text>

              <View style={styles.modalActions}>
                <Pressable
                  disabled={!!deletingVehicleId}
                  onPress={closeDeleteModal}
                  style={({ pressed }) => [
                    styles.modalSecondaryButton,
                    pressed && styles.modalSecondaryButtonPressed,
                  ]}
                >
                  <Text style={styles.modalSecondaryButtonText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  disabled={!!deletingVehicleId}
                  onPress={
                    deleteStep === 1 ? continueDeleteVehicle : submitDeleteVehicle
                  }
                  style={({ pressed }) => [
                    styles.modalDangerButton,
                    (pressed || deletingVehicleId === vehiclePendingDelete?.id) &&
                      styles.modalDangerButtonPressed,
                  ]}
                >
                  {deletingVehicleId === vehiclePendingDelete?.id ? (
                    <ActivityIndicator color="#ffe6ea" size="small" />
                  ) : (
                    <Text style={styles.modalDangerButtonText}>
                      {deleteStep === 1 ? "Continuar" : "Eliminar"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#321720",
    borderWidth: 1,
    borderColor: "#66303e",
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonPressed: {
    opacity: 0.78,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(3, 10, 14, 0.72)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#102330",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#18384b",
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitleWrap: {
    flex: 1,
  },
  modalEyebrow: {
    color: "#ffb7c0",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
  },
  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#0d212d",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseButtonPressed: {
    opacity: 0.78,
  },
  modalBody: {
    color: "#c0d7e1",
    marginTop: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  modalSecondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#294454",
    backgroundColor: "#0b1821",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSecondaryButtonPressed: {
    opacity: 0.78,
  },
  modalSecondaryButtonText: {
    color: "#d8ecf5",
    fontWeight: "900",
  },
  modalDangerButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: "#a33549",
    alignItems: "center",
    justifyContent: "center",
  },
  modalDangerButtonPressed: {
    opacity: 0.84,
  },
  modalDangerButtonText: {
    color: "#ffe6ea",
    fontWeight: "900",
  },
});
