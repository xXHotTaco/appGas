import { Stack } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { VehicleFilterProvider } from "@/contexts/VehicleFilterContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <VehicleFilterProvider>
        <RootStack />
      </VehicleFilterProvider>
    </AuthProvider>
  );
}

function RootStack() {
  const { isLoading, token } = useAuth();
  const isLoggedIn = Boolean(token);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#7bf1ad" size="large" />
        <Text style={styles.loadingText}>Cargando appGas</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={!isLoggedIn}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>

      <Stack.Protected guard={isLoggedIn}>
        <Stack.Screen name="tabs" />
        <Stack.Screen name="explore" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#08131b",
  },
  loadingText: {
    color: "#a9c7d4",
    fontWeight: "800",
    marginTop: 12,
  },
});
