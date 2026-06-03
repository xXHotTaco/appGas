import { router, useFocusEffect } from "expo-router";
import {
  CalendarDays,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Gauge,
  ReceiptText,
  Save,
  X,
} from "lucide-react-native";
import type { ElementType } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

import { APP_CONTENT_MAX_WIDTH } from "@/constants/layout";
import { useAuth } from "@/contexts/AuthContext";
import { createGasRecord, getVehicles } from "@/lib/api";
import { formatDisplayDate, getToday } from "@/lib/fuelStats";
import type { GasRecord, Vehicle } from "@/types/fuel";

const TOAST_DURATION_MS = 3600;
const shouldUseNativeDriver = Platform.OS !== "web";

export default function RegistroScreen() {
  const { token } = useAuth();
  const [date, setDate] = useState(getToday());
  const [odometerKm, setOdometerKm] = useState("");
  const [liters, setLiters] = useState("");
  const [pricePerLiter, setPricePerLiter] = useState("");
  const [notes, setNotes] = useState("");
  const [isFullTank, setIsFullTank] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [savedToast, setSavedToast] = useState<GasRecord | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-18)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null,
    [selectedVehicleId, vehicles],
  );

  useFocusEffect(
    useCallback(() => {
      async function loadVehicles() {
        if (!token) return;

        try {
          const data = await getVehicles(token);
          setVehicles(data.vehicles || []);
        } catch (error) {
          Alert.alert(
            "No se cargaron vehiculos",
            error instanceof Error ? error.message : "Intentalo de nuevo.",
          );
        }
      }

      loadVehicles();
    }, [token]),
  );

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  function showSuccessToast(record: GasRecord) {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }

    setSavedToast(record);
    toastOpacity.setValue(0);
    toastTranslateY.setValue(-18);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: shouldUseNativeDriver,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: shouldUseNativeDriver,
      }),
    ]).start();

    toastTimeoutRef.current = setTimeout(() => {
      hideSuccessToast();
    }, TOAST_DURATION_MS);
  }

  function hideSuccessToast(callback?: () => void) {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: shouldUseNativeDriver,
      }),
      Animated.timing(toastTranslateY, {
        toValue: -18,
        duration: 180,
        useNativeDriver: shouldUseNativeDriver,
      }),
    ]).start(() => {
      setSavedToast(null);
      callback?.();
    });
  }

  async function saveRecord() {
    if (!token) return;

    const parsedKm = odometerKm.trim()
      ? parseInputNumber(odometerKm)
      : null;
    const parsedLiters = parseInputNumber(liters);
    const parsedPrice = parseInputNumber(pricePerLiter);

    if (
      !date ||
      Number.isNaN(parsedLiters) ||
      Number.isNaN(parsedPrice) ||
      parsedLiters <= 0 ||
      parsedPrice <= 0 ||
      (parsedKm !== null && (Number.isNaN(parsedKm) || parsedKm <= 0))
    ) {
      Alert.alert(
        "Faltan datos",
        "Llena fecha, litros y precio por litro. El odometro es opcional.",
      );
      return;
    }

    try {
      setIsSaving(true);
      const response = await createGasRecord(token, {
        vehicle_id: selectedVehicleId,
        fill_date: date,
        odometer_km: parsedKm,
        liters: parsedLiters,
        price_per_liter: parsedPrice,
        is_full_tank: isFullTank,
        notes: notes.trim() || null,
      });

      setDate(getToday());
      setOdometerKm("");
      setLiters("");
      setPricePerLiter("");
      setNotes("");
      setIsFullTank(true);
      showSuccessToast(response.record);
    } catch (error) {
      Alert.alert(
        "No se guardo",
        error instanceof Error ? error.message : "Intentalo de nuevo.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {savedToast ? (
        <Animated.View
          style={[
            styles.toastWrap,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <View style={styles.toastCard}>
            <View style={styles.toastBadge}>
              <CheckCheck size={18} color="#0b1a12" />
            </View>

            <View style={styles.toastBody}>
              <Text style={styles.toastTitle}>Carga guardada</Text>
              <Text style={styles.toastSubtitle}>
                {formatDisplayDate(savedToast.fill_date)}
                {savedToast.odometer_km
                  ? ` - ${savedToast.odometer_km.toLocaleString("es-MX")} km`
                  : ""}
              </Text>

              <View style={styles.toastPills}>
                <ToastPill
                  icon={Droplets}
                  text={`${savedToast.liters.toFixed(1)} L`}
                />
                <ToastPill
                  icon={ReceiptText}
                  text={`$${savedToast.total_cost.toFixed(2)}`}
                />
                {savedToast.odometer_km ? (
                  <ToastPill
                    icon={Gauge}
                    text={`${savedToast.odometer_km.toLocaleString("es-MX")} km`}
                  />
                ) : null}
              </View>

              <Pressable
                style={styles.toastAction}
                onPress={() =>
                  hideSuccessToast(() => router.push("/tabs/dashboard"))
                }
              >
                <Text style={styles.toastActionText}>Ver dashboard</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.toastClose}
              onPress={() => hideSuccessToast()}
            >
              <X size={16} color="#9ac8b0" />
            </Pressable>
          </View>
        </Animated.View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            savedToast ? styles.containerWithToast : null,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <Text style={styles.kicker}>Nueva carga</Text>
            <Text style={styles.title}>Registro</Text>
            <Text style={styles.subtitle}>
              Guarda litros, precio y odometro.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Vehiculo</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.vehicleOptions}
            >
              <Pressable
                onPress={() => setSelectedVehicleId(null)}
                style={[
                  styles.vehicleChip,
                  !selectedVehicleId && styles.vehicleChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.vehicleChipText,
                    !selectedVehicleId && styles.vehicleChipTextActive,
                  ]}
                >
                  Sin vehiculo
                </Text>
              </Pressable>

              {vehicles.map((vehicle) => {
                const isActive = vehicle.id === selectedVehicleId;

                return (
                  <Pressable
                    key={vehicle.id}
                    onPress={() => setSelectedVehicleId(vehicle.id)}
                    style={[
                      styles.vehicleChip,
                      isActive && styles.vehicleChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.vehicleChipText,
                        isActive && styles.vehicleChipTextActive,
                      ]}
                    >
                      {vehicle.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.label}>Fecha</Text>
            <Pressable
              style={styles.dateButton}
              onPress={() => setCalendarVisible(true)}
            >
              <View style={styles.dateLeft}>
                <CalendarDays size={18} color="#d7edf6" />
                <Text style={styles.dateButtonText}>
                  {formatDisplayDate(date)}
                </Text>
              </View>
              <ChevronDown size={18} color="#9fc0cf" />
            </Pressable>

            <Text style={styles.label}>Odometro en km</Text>
            <TextInput
              style={styles.input}
              value={odometerKm}
              onChangeText={setOdometerKm}
              placeholder="Ej. 50420"
              placeholderTextColor="#7f97a3"
              keyboardType="numeric"
            />

            <Text style={styles.label}>Litros cargados</Text>
            <TextInput
              style={styles.input}
              value={liters}
              onChangeText={setLiters}
              placeholder="Ej. 38"
              placeholderTextColor="#7f97a3"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Precio por litro</Text>
            <TextInput
              style={styles.input}
              value={pricePerLiter}
              onChangeText={setPricePerLiter}
              placeholder="Ej. 24.50"
              placeholderTextColor="#7f97a3"
              keyboardType="decimal-pad"
            />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.switchTitle}>Tanque lleno</Text>
                <Text style={styles.switchMeta}>
                  {isFullTank ? "Si" : "No"}
                </Text>
              </View>
              <Switch
                value={isFullTank}
                onValueChange={setIsFullTank}
                thumbColor={isFullTank ? "#7bf1ad" : "#8fa9b5"}
                trackColor={{ false: "#213746", true: "#1c6b42" }}
              />
            </View>

            <Text style={styles.label}>Notas</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder={
                selectedVehicle
                  ? `Ej. Carga de ${selectedVehicle.name}`
                  : "Ej. Carga inicial"
              }
              placeholderTextColor="#7f97a3"
              multiline
              textAlignVertical="top"
            />

            <Pressable
              disabled={isSaving}
              style={({ pressed }) => [
                styles.button,
                (pressed || isSaving) && styles.buttonPressed,
              ]}
              onPress={saveRecord}
            >
              {isSaving ? (
                <ActivityIndicator color="#06110b" />
              ) : (
                <>
                  <Save size={19} color="#06110b" />
                  <Text style={styles.buttonText}>Guardar carga</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={calendarVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona una fecha</Text>
              <Pressable onPress={() => setCalendarVisible(false)}>
                <X size={22} color="#d7edf6" />
              </Pressable>
            </View>

            <Calendar
              current={date}
              renderArrow={(direction) => (
                <View style={styles.calendarArrow}>
                  {direction === "left" ? (
                    <ChevronLeft size={20} color="#7bf1ad" strokeWidth={3} />
                  ) : (
                    <ChevronRight size={20} color="#7bf1ad" strokeWidth={3} />
                  )}
                </View>
              )}
              onDayPress={(day) => {
                setDate(day.dateString);
                setCalendarVisible(false);
              }}
              markedDates={{
                [date]: {
                  selected: true,
                  selectedColor: "#16d26b",
                },
              }}
              theme={{
                backgroundColor: "#122430",
                calendarBackground: "#122430",
                textSectionTitleColor: "#9fc0cf",
                selectedDayBackgroundColor: "#16d26b",
                selectedDayTextColor: "#07120a",
                todayTextColor: "#7bf1ad",
                dayTextColor: "#f3fbff",
                textDisabledColor: "#47606d",
                monthTextColor: "#f3fbff",
                arrowColor: "#7bf1ad",
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ToastPill({
  icon: Icon,
  text,
}: {
  icon: ElementType;
  text: string;
}) {
  return (
    <View style={styles.toastPill}>
      <Icon size={13} color="#9bf5be" />
      <Text style={styles.toastPillText}>{text}</Text>
    </View>
  );
}

function parseInputNumber(value: string) {
  return Number(value.replace(",", "."));
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: "#08131b",
  },
  toastWrap: {
    position: "absolute",
    top: 16,
    left: 18,
    right: 18,
    zIndex: 30,
  },
  toastCard: {
    backgroundColor: "#0f2018",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#214f37",
    padding: 14,
    flexDirection: "row",
    shadowColor: "#000000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 10,
  },
  toastBadge: {
    width: 36,
    height: 36,
    borderRadius: 14,
    backgroundColor: "#7bf1ad",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  toastBody: {
    flex: 1,
  },
  toastTitle: {
    color: "#f7fff9",
    fontSize: 16,
    fontWeight: "900",
  },
  toastSubtitle: {
    color: "#b8d8c4",
    marginTop: 2,
    fontSize: 12,
  },
  toastPills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  toastPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#112a1f",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#244b38",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toastPillText: {
    color: "#e6fff0",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 6,
  },
  toastAction: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#183825",
    borderWidth: 1,
    borderColor: "#2a6546",
  },
  toastActionText: {
    color: "#8ef0b6",
    fontSize: 12,
    fontWeight: "900",
  },
  toastClose: {
    marginLeft: 12,
    alignSelf: "flex-start",
    padding: 4,
  },
  container: {
    width: "100%",
    maxWidth: APP_CONTENT_MAX_WIDTH,
    alignSelf: "center",
    padding: 18,
    paddingBottom: 110,
  },
  containerWithToast: {
    paddingTop: 96,
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
  card: {
    backgroundColor: "#102330",
    borderRadius: 28,
    padding: 16,
    borderWidth: 1,
    borderColor: "#18384b",
  },
  label: {
    color: "#a6c5d3",
    fontSize: 13,
    marginBottom: 8,
    fontWeight: "700",
  },
  vehicleOptions: {
    gap: 8,
    paddingBottom: 14,
  },
  vehicleChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#1f3a49",
    backgroundColor: "#0b1821",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  vehicleChipActive: {
    backgroundColor: "#16d26b",
    borderColor: "#16d26b",
  },
  vehicleChipText: {
    color: "#d7edf6",
    fontWeight: "800",
  },
  vehicleChipTextActive: {
    color: "#06110b",
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
  notesInput: {
    minHeight: 94,
  },
  dateButton: {
    backgroundColor: "#0b1821",
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: "#1f3a49",
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateButtonText: {
    color: "#f4fbff",
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "700",
  },
  switchRow: {
    backgroundColor: "#0b1821",
    borderRadius: 17,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#1f3a49",
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  switchTitle: {
    color: "#f4fbff",
    fontWeight: "900",
  },
  switchMeta: {
    color: "#9fc0cf",
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#122430",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e3d4d",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  calendarArrow: {
    width: 36,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d212d",
    borderWidth: 1,
    borderColor: "#1f4658",
  },
});
