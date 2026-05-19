import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import Analytics from "../utils/analytics";

export default function LoginScreen({ navigation }) {
  const { sendOtp } = useAuth();
  const { t } = useLanguage();
  const { theme, isDark } = useTheme();
  const T = theme; // shorthand

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const styles = useMemo(() => makeStyles(T), [T]);

  const validate = () => {
    if (!email.trim()) {
      setError(t("emailAddress") + " is required.");
      return false;
    }
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email.trim())) {
      setError("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await sendOtp(email.trim().toLowerCase());
      Analytics.logLogin("email");
      Analytics.logScreenView("OTPScreen");
      navigation.navigate("OTP", {
        email: email.trim().toLowerCase(),
        isRegister: false,
      });
    } catch (e) {
      setError(e.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={T.background}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>🌾</Text>
            </View>
            <Text style={styles.appName}>HANARAD Farmer-Companion</Text>
            <Text style={styles.tagline}>Smart Farming, Better Harvest</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t("welcomeBack")}</Text>
            <Text style={styles.cardSub}>{t("signInAccount")}</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {error}</Text>
              </View>
            ) : null}

            {/* Email */}
            <Text style={styles.label}>{t("emailAddress")}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder={t("emailPlaceholder")}
                placeholderTextColor={T.subtext}
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setError("");
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* OTP hint */}
            <View style={styles.otpHintBox}>
              <Text style={styles.otpHintText}>
                📱 We'll send a 6-digit OTP to your email
              </Text>
            </View>

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={T.white} />
              ) : (
                <Text style={styles.loginBtnText}>Send OTP →</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>{t("noAccount")}</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>{t("createAccount")}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(T) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: T.background },
    scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
    logoSection: { alignItems: "center", marginTop: 40, marginBottom: 32 },
    logoCircle: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: T.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      shadowColor: T.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    logoEmoji: { fontSize: 44 },
    appName: {
      fontSize: 22,
      fontWeight: "800",
      color: T.text,
    },
    tagline: { fontSize: 13, color: T.subtext, marginTop: 4 },
    card: {
      backgroundColor: T.card,
      borderRadius: 20,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: T.border,
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: "800",
      color: T.text,
      marginBottom: 4,
    },
    cardSub: { fontSize: 14, color: T.subtext, marginBottom: 20 },
    errorBox: {
      backgroundColor: T.dangerLight,
      borderRadius: 10,
      padding: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: T.danger + "44",
    },
    errorText: { fontSize: 13, color: T.danger, fontWeight: "500" },
    label: { fontSize: 13, fontWeight: "600", color: T.text, marginBottom: 6 },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: T.inputBg,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: T.border,
      marginBottom: 16,
      paddingHorizontal: 14,
      height: 52,
    },
    inputIcon: { fontSize: 16, marginRight: 10 },
    input: { flex: 1, fontSize: 15, color: T.text, paddingVertical: 0 },
    eyeBtn: { padding: 4 },
    eyeIcon: { fontSize: 18 },
    otpHintBox: {
      backgroundColor: "#FFFBEB",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: "#FDE68A",
      padding: 12,
      marginBottom: 20,
    },
    otpHintText: {
      fontSize: 13,
      color: "#92400E",
      fontWeight: "600",
      textAlign: "center",
    },
    loginBtn: {
      backgroundColor: T.primary,
      borderRadius: 14,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: T.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    loginBtnDisabled: { opacity: 0.7 },
    loginBtnText: {
      fontSize: 16,
      fontWeight: "700",
      color: T.inverse ?? "#fff",
      letterSpacing: 0.3,
    },
    registerRow: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: 24,
    },
    registerText: { fontSize: 14, color: T.subtext },
    registerLink: { fontSize: 14, color: T.primary, fontWeight: "700" },
  });
}
