import { Link } from "expo-router";
import {
  CheckCircle,
  CircleAlert,
  Eye,
  EyeOff,
  UserPlus,
} from "lucide-react-native";
import { useMemo, useState } from "react";
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

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const passwordChecks = useMemo(
    () => ({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
    }),
    [password],
  );
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const nameError =
    cleanName.length === 0
      ? "Escribe tu nombre."
      : cleanName.length < 3
        ? "El nombre debe tener al menos 3 caracteres."
        : /\d/.test(cleanName)
          ? "El nombre no debe contener numeros."
          : "";
  const emailError =
    cleanEmail.length === 0
      ? "Escribe tu correo."
      : !isValidEmail(cleanEmail)
        ? "Escribe un correo valido, por ejemplo hola@test.com."
        : "";
  const passwordError =
    password.length === 0
      ? "Escribe una contrasena."
      : !isPasswordStrong
        ? "La contrasena necesita cumplir los requisitos."
        : "";
  const shouldShowNameError = hasSubmitted || name.length > 0;
  const shouldShowEmailError = hasSubmitted || email.length > 0;
  const shouldShowPasswordError = hasSubmitted || password.length > 0;

  async function handleRegister() {
    setHasSubmitted(true);
    setFormError("");

    if (nameError || emailError || passwordError) {
      return;
    }

    try {
      setIsSubmitting(true);
      await register(cleanName, cleanEmail, password);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Intentalo de nuevo.",
      );
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
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Tu historial queda protegido.</Text>
          </View>

          <View style={styles.card}>
            {formError ? (
              <View style={styles.errorBanner}>
                <CircleAlert size={18} color="#ffcf7a" />
                <Text style={styles.errorBannerText}>{formError}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Nombre</Text>
            <TextInput
              autoCapitalize="words"
              autoComplete="name"
              onChangeText={setName}
              placeholder="Juan Perez"
              placeholderTextColor="#7f97a3"
              style={[
                styles.input,
                shouldShowNameError && nameError ? styles.inputError : null,
              ]}
              value={name}
            />
            {shouldShowNameError && nameError ? (
              <Text style={styles.fieldError}>{nameError}</Text>
            ) : null}

            <Text style={styles.label}>Correo</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="hola@test.com"
              placeholderTextColor="#7f97a3"
              style={[
                styles.input,
                shouldShowEmailError && emailError ? styles.inputError : null,
              ]}
              value={email}
            />
            {shouldShowEmailError && emailError ? (
              <Text style={styles.fieldError}>{emailError}</Text>
            ) : null}

            <Text style={styles.label}>Contraseña</Text>
            <View
              style={[
                styles.passwordRow,
                shouldShowPasswordError && passwordError
                  ? styles.inputError
                  : null,
              ]}
            >
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
            {shouldShowPasswordError && passwordError ? (
              <Text style={styles.fieldError}>{passwordError}</Text>
            ) : null}

            <View style={styles.passwordChecklist}>
              <PasswordRule
                isValid={passwordChecks.length}
                text="Minimo 8 caracteres"
              />
              <PasswordRule
                isValid={passwordChecks.upper}
                text="Una mayuscula"
              />
              <PasswordRule
                isValid={passwordChecks.lower}
                text="Una minuscula"
              />
              <PasswordRule isValid={passwordChecks.number} text="Un numero" />
            </View>

            <Pressable
              disabled={isSubmitting}
              onPress={handleRegister}
              style={({ pressed }) => [
                styles.button,
                (pressed || isSubmitting) && styles.buttonPressed,
              ]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#06110b" />
              ) : (
                <>
                  <UserPlus size={19} color="#06110b" />
                  <Text style={styles.buttonText}>Crear cuenta</Text>
                </>
              )}
            </Pressable>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Ya tienes cuenta?</Text>
              <Link href="/login" asChild>
                <Pressable>
                  <Text style={styles.footerLink}>Inicia sesion</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordRule({
  isValid,
  text,
}: {
  isValid: boolean;
  text: string;
}) {
  return (
    <View style={styles.passwordRule}>
      {isValid ? (
        <CheckCircle size={15} color="#7bf1ad" />
      ) : (
        <CircleAlert size={15} color="#7f97a3" />
      )}
      <Text
        style={[
          styles.passwordRuleText,
          isValid && styles.passwordRuleTextValid,
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
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
  errorBanner: {
    backgroundColor: "#2b2114",
    borderColor: "#a8651b",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    padding: 12,
  },
  errorBannerText: {
    color: "#ffd99a",
    flex: 1,
    fontSize: 13,
    fontWeight: "800",
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
  inputError: {
    borderColor: "#ff7c87",
  },
  fieldError: {
    color: "#ff9aa5",
    fontSize: 12,
    fontWeight: "800",
    lineHeight: 17,
    marginTop: -8,
    marginBottom: 12,
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
  passwordChecklist: {
    backgroundColor: "#0b1821",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#1f3a49",
    gap: 8,
    marginBottom: 14,
    marginTop: -2,
    padding: 12,
  },
  passwordRule: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  passwordRuleText: {
    color: "#8fa9b5",
    fontSize: 12,
    fontWeight: "800",
  },
  passwordRuleTextValid: {
    color: "#bdfbd4",
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
