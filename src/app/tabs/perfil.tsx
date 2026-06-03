import {
  LogOut,
  Mail,
  RefreshCw,
  Server,
  ShieldCheck,
  User,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { ElementType } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { API_URL } from "@/lib/api";

export default function PerfilScreen() {
  const { logout, refreshMe, user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function handleRefresh() {
    try {
      setIsRefreshing(true);
      await refreshMe();
    } catch (error) {
      Alert.alert(
        "No se actualizo",
        error instanceof Error ? error.message : "Intentalo de nuevo.",
      );
    } finally {
      setIsRefreshing(false);
    }
  }

  function confirmLogout() {
    Alert.alert("Cerrar sesion", "Quieres salir de appGas?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Salir",
        style: "destructive",
        onPress: logout,
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Cuenta</Text>
          <Text style={styles.title}>Perfil</Text>
          <Text style={styles.subtitle}>Sesion y ajustes de conexion.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={30} color="#06110b" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || "Usuario"}</Text>
            <View style={styles.inlineMeta}>
              <Mail size={14} color="#8cecb8" />
              <Text style={styles.profileEmail}>{user?.email || ""}</Text>
            </View>
          </View>
        </View>

        <InfoRow
          icon={ShieldCheck}
          label="Token"
          value="Sesion protegida"
        />
        <InfoRow icon={Server} label="API" value={API_URL} />

        <Pressable
          disabled={isRefreshing}
          onPress={handleRefresh}
          style={({ pressed }) => [
            styles.secondaryButton,
            (pressed || isRefreshing) && styles.buttonPressed,
          ]}
        >
          {isRefreshing ? (
            <ActivityIndicator color="#7bf1ad" />
          ) : (
            <>
              <RefreshCw size={18} color="#7bf1ad" />
              <Text style={styles.secondaryButtonText}>Actualizar perfil</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={confirmLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <LogOut size={18} color="#ff9aa5" />
          <Text style={styles.logoutText}>Cerrar sesion</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon size={18} color="#7bf1ad" />
      </View>
      <View style={styles.infoBody}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
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
  profileCard: {
    backgroundColor: "#102330",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "#18384b",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 22,
    backgroundColor: "#7bf1ad",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "900",
  },
  inlineMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  profileEmail: {
    color: "#a9c7d4",
    fontWeight: "800",
  },
  infoRow: {
    backgroundColor: "#102330",
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: "#18384b",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: "#0d212d",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoBody: {
    flex: 1,
  },
  infoLabel: {
    color: "#a4c5d3",
    fontWeight: "800",
    fontSize: 12,
  },
  infoValue: {
    color: "#f4fbff",
    fontWeight: "900",
    marginTop: 4,
  },
  secondaryButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#22503a",
    backgroundColor: "#112a1f",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  secondaryButtonText: {
    color: "#7bf1ad",
    fontSize: 16,
    fontWeight: "900",
  },
  logoutButton: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#5a2b34",
    backgroundColor: "#2b141b",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  logoutText: {
    color: "#ff9aa5",
    fontSize: 16,
    fontWeight: "900",
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
