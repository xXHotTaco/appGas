import { router } from "expo-router";
import {
  CalendarDays,
  CheckCheck,
  ChevronDown,
  Droplets,
  Gauge,
  ReceiptText,
  Save,
  X,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { formatDisplayDate, getToday } from "../../lib/fuelStats";

import { addFuelRecord } from "@/lib/fuelSore";
import { FuelRecord } from "../../types/fuel";

const TOAST_DURATION_MS = 3600;
const shouldUseNativeDriver = Platform.OS !== "web";

export default function RegistroScreen() {
  const [date, setDate] = useState(getToday());
  const [odometerKm, setOdometerKm] = useState("");
  const [liters, setLiters] = useState("");
  const [totalPaid, setTotalPaid] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [savedToast, setSavedToast] = useState<FuelRecord | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-18)).current;
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  function showSuccessToast(record: FuelRecord) {
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
    const parsedKm = parseFloat(odometerKm);
    const parsedLiters = parseFloat(liters);
    const parsedPaid = parseFloat(totalPaid);

    if (
      !date ||
      Number.isNaN(parsedKm) ||
      Number.isNaN(parsedLiters) ||
      Number.isNaN(parsedPaid) ||
      parsedKm <= 0 ||
      parsedLiters <= 0 ||
      parsedPaid <= 0
    ) {
      Alert.alert(
        "Faltan datos",
        "Llena correctamente fecha, kilometraje, litros y total pagado.",
      );
      return;
    }

    const newRecord: FuelRecord = {
      id: Date.now().toString(),
      date,
      odometerKm: parsedKm,
      liters: parsedLiters,
      totalPaid: parsedPaid,
    };

    await addFuelRecord(newRecord);

    setDate(getToday());
    setOdometerKm("");
    setLiters("");
    setTotalPaid("");
    showSuccessToast(newRecord);
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
                {formatDisplayDate(savedToast.date)} ·{" "}
                {savedToast.odometerKm.toLocaleString("es-MX")} km
              </Text>

              <View style={styles.toastPills}>
                <ToastPill
                  icon={Droplets}
                  text={`${savedToast.liters.toFixed(1)} L`}
                />
                <ToastPill
                  icon={ReceiptText}
                  text={`$${savedToast.totalPaid.toFixed(2)}`}
                />
                <ToastPill
                  icon={Gauge}
                  text={`${savedToast.odometerKm.toLocaleString("es-MX")} km`}
                />
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
        style={{ flex: 1 }}
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
              Guarda cada carga para calcular rendimiento y próximas visitas.
            </Text>
          </View>

          <View style={styles.card}>
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

            <Text style={styles.label}>Kilometraje actual</Text>
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
              keyboardType="numeric"
            />

            <Text style={styles.label}>Total pagado</Text>
            <TextInput
              style={styles.input}
              value={totalPaid}
              onChangeText={setTotalPaid}
              placeholder="Ej. 910"
              placeholderTextColor="#7f97a3"
              keyboardType="numeric"
            />

            <Pressable style={styles.button} onPress={saveRecord}>
              <Save size={19} color="#06110b" />
              <Text style={styles.buttonText}>Guardar carga</Text>
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
  icon: React.ElementType;
  text: string;
}) {
  return (
    <View style={styles.toastPill}>
      <Icon size={13} color="#9bf5be" />
      <Text style={styles.toastPillText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  button: {
    backgroundColor: "#16d26b",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 4,
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
});
