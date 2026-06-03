import { Link } from "expo-router";
import { CircleAlert, Eye, EyeOff, LogIn } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/contexts/AuthContext";
import { AUTH_CONTENT_MAX_WIDTH } from "@/constants/layout";
import { ApiError } from "@/lib/api";

type LoginToast = {
  title: string;
  message: string;
};

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<LoginToast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
      }
    };
  }, []);

  function showToast(nextToast: LoginToast) {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
    }

    setToast(nextToast);
    toastTimer.current = setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, 4500);
  }

  async function handleLogin() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      showToast({
        title: "Faltan datos",
        message: "Escribe tu correo y contraseña.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setToast(null);
      await login(cleanEmail, password);
    } catch (error) {
      if (error instanceof ApiError && [401, 403].includes(error.status)) {
        showToast({
          title: "Credenciales incorrectas",
          message: "El correo o la contraseña son incorrectos.",
        });
        return;
      }

      showToast({
        title: "No se pudo iniciar sesion",
        message:
          error instanceof Error ? error.message : "Intentalo de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
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
        >
          <View style={styles.hero}>
            <Text style={styles.kicker}>appGas</Text>
            <Text style={styles.title}>Iniciar sesion</Text>
          </View>

          <View style={styles.card}>
            {toast ? (
              <View style={styles.toast}>
                <View style={styles.toastIcon}>
                  <CircleAlert size={20} color="#ffcf7a" />
                </View>
                <View style={styles.toastBody}>
                  <Text style={styles.toastTitle}>{toast.title}</Text>
                  <Text style={styles.toastMessage}>{toast.message}</Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.label}>Correo</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="hola@test.com"
              placeholderTextColor="#7f97a3"
              style={styles.input}
              value={email}
            />

            <Text style={styles.label}>Contraseña</Text>
            <View style={styles.passwordRow}>
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                onChangeText={setPassword}
                placeholder="123456"
                placeholderTextColor="#7f97a3"
                secureTextEntry={!isPasswordVisible}
                style={[styles.input, styles.passwordInput]}
                value={password}
              />
              <Pressable
                accessibilityLabel={
                  isPasswordVisible
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
                accessibilityRole="button"
                onPress={() => setIsPasswordVisible((current) => !current)}
                style={({ pressed }) => [
                  styles.eyeButton,
                  pressed && styles.eyeButtonPressed,
                ]}
              >
                {isPasswordVisible ? (
                  <EyeOff size={21} color="#a9c7d4" />
                ) : (
                  <Eye size={21} color="#a9c7d4" />
                )}
              </Pressable>
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.button,
                (pressed || isSubmitting) && styles.buttonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#06110b" />
              ) : (
                <>
                  <LogIn size={19} color="#06110b" />
                  <Text style={styles.buttonText}>Entrar</Text>
                </>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>No tienes cuenta?</Text>
              <Link href="/register" asChild>
                <Pressable>
                  <Text style={styles.footerLink}>Registrate</Text>
                </Pressable>
              </Link>
            </View>
          </View>
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
    flexGrow: 1,
    justifyContent: "center",
    width: "100%",
    maxWidth: AUTH_CONTENT_MAX_WIDTH,
    alignSelf: "center",
    padding: 18,
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
  toast: {
    backgroundColor: "#2b2114",
    borderColor: "#a8651b",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 14,
    padding: 12,
  },
  toastIcon: {
    alignItems: "center",
    backgroundColor: "#3b2b14",
    borderRadius: 14,
    height: 36,
    justifyContent: "center",
    marginRight: 10,
    width: 36,
  },
  toastBody: {
    flex: 1,
  },
  toastTitle: {
    color: "#fff4d8",
    fontSize: 14,
    fontWeight: "900",
  },
  toastMessage: {
    color: "#ffd99a",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 3,
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
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0b1821",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#1f3a49",
    marginBottom: 14,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    marginBottom: 0,
    paddingRight: 8,
  },
  eyeButton: {
    width: 48,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeButtonPressed: {
    opacity: 0.7,
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
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
  },
  footerText: {
    color: "#a9c7d4",
    fontWeight: "700",
  },
  footerLink: {
    color: "#7bf1ad",
    fontWeight: "900",
  },
});
