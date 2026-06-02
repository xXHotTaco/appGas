import { router } from "expo-router";
import { CalendarDays, ChevronDown, Save, X } from "lucide-react-native";
import { useState } from "react";
import {
    Alert,
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

export default function RegistroScreen() {
  const [date, setDate] = useState(getToday());
  const [odometerKm, setOdometerKm] = useState("");
  const [liters, setLiters] = useState("");
  const [totalPaid, setTotalPaid] = useState("");
  const [calendarVisible, setCalendarVisible] = useState(false);

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

    Alert.alert("Listo", "Carga guardada correctamente.", [
      {
        text: "Ver dashboard",
        onPress: () => router.push("/tabs/dashboard"),
      },
      {
        text: "Agregar otra",
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
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
