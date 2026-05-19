/**
 * DASHBOARD — HomeScreen
 * Fully dynamic production-ready implementation.
 *
 * Data sources:
 *   weather        → Open-Meteo via useDashboard (30-min cache)
 *   alerts         → Derived from weather thresholds
 *   features grid  → Backend (dashboard_features module, 24-h cache)
 *   expert help    → Backend (dashboard_config module, 24-h cache)
 *   farm tips      → Backend carousel (farm_tips module, 6-h cache)
 *   crop recs      → Backend (crop_recommendations module, 2-h cache)
 *   notification badge → Backend (notifications module, always fresh)
 *   user info      → AuthContext
 *   location       → LocationContext
 *
 * UI design is UNCHANGED — all styles are identical to the original.
 */
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Animated,
  TextInput,
  Linking,
} from "react-native";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocation } from "../context/LocationContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { getWeatherIcon } from "../utils/helpers";
import Analytics from "../utils/analytics";
import useDashboard from "../hooks/useDashboard";

const { width } = Dimensions.get("window");

// ── Time-based greeting ───────────────────────────────────────────────────────
function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 12) return t("greetingMorning");
  if (h < 17) return t("greetingAfternoon");
  return t("greetingEvening");
}

// ── Formatted date string ─────────────────────────────────────────────────────
function getFormattedDate() {
  const d = new Date();
  const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// ── Weather condition label ───────────────────────────────────────────────────
function getWeatherDesc(temp, rain) {
  if (rain > 10) return "Heavy rainfall expected";
  if (rain > 3) return "Light showers likely";
  if (temp > 35) return "Very hot and sunny";
  if (temp > 28) return "Sunny and warm";
  if (temp < 15) return "Cold conditions";
  return "Partly cloudy";
}

// ── Styles factory ────────────────────────────────────────────────────────────
function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },

    // ── Loading ────────────────────────────────────────────────────────────
    loadRoot: {
      flex: 1,
      backgroundColor: theme.background,
      alignItems: "center",
      justifyContent: "center",
    },
    loadBadge: {
      width: 90,
      height: 90,
      borderRadius: 28,
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 10,
    },
    loadEmoji: { fontSize: 44 },
    loadTitle: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.text,
      letterSpacing: -0.5,
    },
    loadSub: { fontSize: 14, color: theme.subtext, marginTop: 8 },

    // ── Header ─────────────────────────────────────────────────────────────
    header: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingBottom: 30,
    },
    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    menuBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
    },
    menuBar: { height: 2.5, backgroundColor: "#FFFFFF", borderRadius: 2 },
    headerSpacer: { flex: 1 },
    headerIcons: { flexDirection: "row", gap: 10 },
    headerIconBtn: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
    },
    headerIconText: { fontSize: 18 },
    avatarRing: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.25)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.5)",
    },
    avatarLetter: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },

    greetingLabel: {
      fontSize: 13,
      color: "rgba(255,255,255,0.7)",
      fontWeight: "500",
      marginBottom: 4,
    },
    greetingName: {
      fontSize: 26,
      fontWeight: "900",
      color: "#FFFFFF",
      letterSpacing: -0.5,
    },
    greetingDate: {
      fontSize: 12,
      color: "rgba(255,255,255,0.6)",
      marginTop: 6,
    },

    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 14,
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 22,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    locationPin: { fontSize: 14, marginRight: 6 },
    locationCity: { fontSize: 13, color: "#FFFFFF", fontWeight: "700" },
    locationArr: {
      fontSize: 13,
      color: "rgba(255,255,255,0.6)",
      marginLeft: 6,
    },

    // ── Notification badge ─────────────────────────────────────────────────
    notifBadge: {
      position: "absolute",
      top: -3,
      right: -3,
      backgroundColor: "#EF4444",
      borderRadius: 8,
      minWidth: 15,
      height: 15,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 3,
      borderWidth: 1.5,
      borderColor: theme.primary,
    },
    notifBadgeTxt: { fontSize: 8, fontWeight: "900", color: "#fff" },

    // ── Curved cutout at bottom of header ─────────────────────────────────
    headerCurve: {
      height: 28,
      backgroundColor: theme.primary,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
    },

    // ── Search bar ─────────────────────────────────────────────────────────
    searchOuter: {
      marginHorizontal: 20,
      marginTop: 20,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 13,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.07,
      shadowRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchIconText: { fontSize: 17, marginRight: 10, opacity: 0.45 },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      paddingVertical: 0,
    },
    searchClear: { fontSize: 16, color: theme.subtext, paddingLeft: 8 },

    // ── Weather error banner ────────────────────────────────────────────────
    weatherErrBanner: {
      marginHorizontal: 20,
      marginTop: 10,
      borderRadius: 12,
      padding: 10,
      backgroundColor: "#FFF7ED",
      flexDirection: "row",
      alignItems: "center",
      borderLeftWidth: 3,
      borderLeftColor: "#F59E0B",
    },
    weatherErrTxt: {
      fontSize: 12,
      color: "#92400E",
      fontWeight: "600",
      marginLeft: 8,
      flex: 1,
    },

    // ── Alert banners ───────────────────────────────────────────────────────
    alertBanner: {
      marginHorizontal: 20,
      marginTop: 12,
      borderRadius: 16,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      borderLeftWidth: 4,
    },
    alertIcon: { fontSize: 20, marginRight: 10 },
    alertText: { flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 19 },

    // ── Section header ──────────────────────────────────────────────────────
    sectionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 20,
      marginTop: 28,
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 17,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.3,
    },
    sectionAction: { fontSize: 13, fontWeight: "700", color: theme.primary },

    // ── Quick stats (horizontal scroll) ────────────────────────────────────
    statsScroll: { paddingLeft: 20 },
    statCard: {
      width: 110,
      marginRight: 12,
      borderRadius: 20,
      padding: 16,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    statIconRing: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    statIcon: { fontSize: 24 },
    statValue: { fontSize: 18, fontWeight: "900", color: theme.text },
    statUnit: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.subtext,
      marginTop: 1,
    },
    statLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: theme.subtext,
      marginTop: 4,
      textAlign: "center",
    },

    // ── Weather hero ────────────────────────────────────────────────────────
    weatherCard: {
      marginHorizontal: 20,
      borderRadius: 28,
      overflow: "hidden",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 22,
      elevation: 10,
    },
    weatherBody: { backgroundColor: theme.primary, padding: 24 },
    weatherTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    weatherLeft: { flex: 1 },
    weatherTag: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginBottom: 12,
    },
    weatherTagText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#FFFFFF",
      letterSpacing: 1,
    },
    weatherTemp: { fontSize: 40, fontWeight: "900", color: "#FFFFFF" },
    weatherDegree: {
      fontSize: 32,
      fontWeight: "700",
      color: "rgba(255,255,255,0.8)",
    },
    weatherRange: {
      fontSize: 14,
      color: "rgba(255,255,255,0.75)",
      marginTop: 6,
    },
    weatherDesc: { fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4 },
    weatherEmoji: { fontSize: 50, lineHeight: 88 },
    weatherDivider: {
      height: 1,
      backgroundColor: "rgba(255,255,255,0.15)",
      marginVertical: 20,
    },
    weatherStats: { flexDirection: "row" },
    weatherStat: { flex: 1, alignItems: "center" },
    weatherStatDiv: { width: 1, backgroundColor: "rgba(255,255,255,0.15)" },
    weatherStatEmoji: { fontSize: 20, marginBottom: 8 },
    weatherStatVal: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
    weatherStatLbl: {
      fontSize: 10,
      color: "rgba(255,255,255,0.65)",
      marginTop: 4,
      textAlign: "center",
      fontWeight: "600",
    },
    weatherFooter: {
      backgroundColor: "rgba(0,0,0,0.18)",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      gap: 6,
    },
    weatherFooterText: {
      fontSize: 13,
      fontWeight: "700",
      color: "rgba(255,255,255,0.9)",
    },
    weatherFooterArrow: { fontSize: 16, color: "rgba(255,255,255,0.65)" },

    // ── Module grid ─────────────────────────────────────────────────────────
    moduleGrid: { paddingHorizontal: 20, gap: 14 },
    moduleRow: { flexDirection: "row", gap: 14 },
    moduleCard: {
      flex: 1,
      borderRadius: 22,
      padding: 18,
      minHeight: 140,
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.07,
      shadowRadius: 10,
      elevation: 3,
    },
    moduleTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    moduleIconBox: {
      width: 52,
      height: 52,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    moduleArrow: { fontSize: 14, opacity: 0.35, marginTop: 4 },
    moduleIcon: { fontSize: 26 },
    moduleLabel: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.text,
      lineHeight: 19,
    },

    // ── Helpline CTA card ────────────────────────────────────────────────────
    helperCard: {
      marginHorizontal: 20,
      borderRadius: 24,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primary,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.28,
      shadowRadius: 16,
      elevation: 8,
    },
    helperLeft: { flex: 1, marginRight: 16 },
    helperTag: {
      alignSelf: "flex-start",
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 8,
    },
    helperTagText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#FFFFFF",
      letterSpacing: 0.8,
    },
    helperTitle: { fontSize: 16, fontWeight: "900", color: "#FFFFFF" },
    helperNum: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 },
    helperBtn: {
      backgroundColor: "#FFFFFF",
      borderRadius: 16,
      paddingHorizontal: 18,
      paddingVertical: 12,
      alignItems: "center",
    },
    helperBtnEmoji: { fontSize: 20, marginBottom: 4 },
    helperBtnText: { fontSize: 12, fontWeight: "800", color: theme.primary },

    // ── Tips card ─────────────────────────────────────────────────────────
    tipsCard: {
      marginHorizontal: 20,
      borderRadius: 22,
      padding: 18,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      alignItems: "flex-start",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    tipsIconCircle: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: "#FFFBEB",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 14,
    },
    tipsEmoji: { fontSize: 24 },
    tipsRight: { flex: 1 },
    tipsTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 6,
    },
    tipsBody: { fontSize: 13, color: theme.subtext, lineHeight: 20 },

    // ── Crop recommendation cards ──────────────────────────────────────────
    recScroll: { paddingLeft: 20 },
    recCard: {
      width: 148,
      marginRight: 12,
      borderRadius: 20,
      padding: 16,
      alignItems: "center",
      backgroundColor: "#F0FDF4",
      borderWidth: 1,
      borderColor: "#D1FAE5",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    recIcon: { fontSize: 38, marginBottom: 8 },
    recName: {
      fontSize: 13,
      fontWeight: "800",
      color: theme.text,
      textAlign: "center",
      marginBottom: 4,
    },
    recReason: {
      fontSize: 10,
      color: theme.subtext,
      textAlign: "center",
      lineHeight: 15,
      marginBottom: 8,
      minHeight: 30,
    },
    recBadge: {
      backgroundColor: "#059669",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    recBadgeTxt: { fontSize: 9, fontWeight: "700", color: "#fff" },

    // ── Quick nav strip ──────────────────────────────────────────────────────
    navStrip: { flexDirection: "row", marginHorizontal: 20, gap: 10 },
    navBtn: {
      flex: 1,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 6,
      elevation: 2,
    },
    navBtnPrimary: {
      backgroundColor: theme.light,
      borderColor: theme.primary + "40",
    },
    navBtnIcon: { fontSize: 22, marginBottom: 5 },
    navBtnLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.subtext,
      textAlign: "center",
    },
    navBtnLabelPrimary: { color: theme.primary },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { location } = useLocation();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const { user } = useAuth();
  // console.log("usre>>",user)
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // ── All dynamic data from the single hook ─────────────────────────────────
  const {
    weather,
    alerts,
    features,
    expertConfig,
    tips,
    recommendations,
    unreadCount,
    initialLoading,
    refreshing,
    weatherError,
    refresh,
  } = useDashboard({ userId: user?.id, location });

  // ── Search ─────────────────────────────────────────────────────────────────
  const [searchText, setSearchText] = useState("");

  // ── Entrance animation ─────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (!initialLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 480,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [initialLoading]);

  // ── Analytics ──────────────────────────────────────────────────────────────
  useEffect(() => {
    Analytics.logScreenView("HomeScreen");
    Analytics.logEvent(Analytics.Events.APP_OPEN);
  }, []);

  // ── User details ───────────────────────────────────────────────────────────
  const avatarLetter = user?.name ? user.name.charAt(0).toUpperCase() : "F";
  const firstName = user?.username ? user.username.split(" ")[0] : t("farmer");

  // ── Feature grid: filtered by search, paired into rows ───────────────────
  const visibleModules = useMemo(() => {
    const enabled = features.filter((f) => f.enabled !== false);
    if (!searchText.trim()) return enabled;
    const q = searchText.toLowerCase();
    return enabled.filter((m) => t(m.labelKey).toLowerCase().includes(q));
  }, [searchText, t, features]);

  const moduleRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < visibleModules.length; i += 2) {
      rows.push(visibleModules.slice(i, i + 2));
    }
    return rows;
  }, [visibleModules]);

  // ── Loading screen ────────────────────────────────────────────────────────
  if (initialLoading) {
    return (
      <View style={[styles.loadRoot, { paddingTop: insets.top }]}>
        <View style={styles.loadBadge}>
          <Text style={styles.loadEmoji}>🌾</Text>
        </View>
        <Text style={styles.loadTitle}>HANARAD</Text>
        <ActivityIndicator color={theme.primary} style={{ marginTop: 16 }} />
        <Text style={styles.loadSub}>{t("loading")}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          colors={[theme.primary]}
          tintColor={theme.primary}
        />
      }
    >
      {/* ══════════════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════════════ */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        {/* Top row: menu ── spacer ── notifications + avatar */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={[styles.menuBar, { width: 20 }]} />
            <View style={[styles.menuBar, { width: 14 }]} />
            <View style={[styles.menuBar, { width: 9 }]} />
          </TouchableOpacity>

          <View style={styles.headerSpacer} />

          <View style={styles.headerIcons}>
            {/* Bell with dynamic unread badge */}
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => navigation.navigate("Alerts")}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.headerIconText}>🔔</Text>
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeTxt}>
                    {unreadCount > 99 ? "99+" : String(unreadCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarRing}
              onPress={() => navigation.navigate("ProfileTab")}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Greeting block — dynamic name + time-aware greeting */}
        <Text style={styles.greetingLabel}>{getGreeting(t)}</Text>
        <Text style={styles.greetingName}>
          {firstName?.charAt(0).toUpperCase() + firstName?.slice(1)}! 🌾
        </Text>
        <Text style={styles.greetingDate}>{getFormattedDate()}</Text>
        {/* Location pill — tappable to switch location / farm */}
        <TouchableOpacity
          style={styles.locationRow}
          onPress={() => navigation.navigate("Location")}
          activeOpacity={0.75}
        >
          <Text style={styles.locationPin}>📍</Text>
          <Text style={styles.locationCity}>{location.city}</Text>
          <Text style={styles.locationArr}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Curved bottom of header */}
      <View style={styles.headerCurve} />

      {/* ══════════════════════════════════════════════════════
          SEARCH BAR
      ══════════════════════════════════════════════════════ */}
      <View style={styles.searchOuter}>
        <Text style={styles.searchIconText}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search features, crops, prices…"
          placeholderTextColor={theme.subtext}
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ══════════════════════════════════════════════════════
          WEATHER ERROR BANNER (only when offline / API down)
      ══════════════════════════════════════════════════════ */}
      {weatherError && (
        <View style={styles.weatherErrBanner}>
          <Text>⚠️</Text>
          <Text style={styles.weatherErrTxt}>{weatherError}</Text>
        </View>
      )}

      {/* ══════════════════════════════════════════════════════
          WEATHER ALERTS (dynamic — derived from live forecast)
      ══════════════════════════════════════════════════════ */}
      {alerts.map((a, i) => (
        <View
          key={i}
          style={[
            styles.alertBanner,
            {
              backgroundColor: a.type === "danger" ? "#FEF2F2" : "#FFFBEB",
              borderLeftColor:
                a.type === "danger" ? theme.danger : theme.warning,
            },
          ]}
        >
          <Text style={styles.alertIcon}>
            {a.type === "danger" ? "⛔" : "⚠️"}
          </Text>
          <Text
            style={[
              styles.alertText,
              { color: a.type === "danger" ? theme.danger : "#92400E" },
            ]}
          >
            {t(a.key)}
          </Text>
        </View>
      ))}

      {/* Animated content wrapper */}
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        {/* ════════════════════════════════════════════════════
            QUICK WEATHER STATS ROW (dynamic from forecast API)
        ════════════════════════════════════════════════════ */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>📊 Today's Overview</Text>
          <TouchableOpacity onPress={() => navigation.navigate("WeatherTab")}>
            <Text style={styles.sectionAction}>Details ›</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statsScroll}
        >
          <StatCard
            icon="🌡️"
            value={weather ? `${weather.max}°` : "--"}
            unit="C"
            label="Max Temp"
            bg="#FFF7ED"
            ringBg="#FED7AA"
            styles={styles}
          />
          <StatCard
            icon="💧"
            value={weather ? `${weather.humidity}` : "--"}
            unit="%"
            label="Humidity"
            bg="#ECFEFF"
            ringBg="#A5F3FC"
            styles={styles}
          />
          <StatCard
            icon="🌧️"
            value={weather ? `${weather.rain}` : "--"}
            unit="mm"
            label="Rainfall"
            bg="#EEF2FF"
            ringBg="#C7D2FE"
            styles={styles}
          />
          <StatCard
            icon="💨"
            value={weather ? `${weather.wind}` : "--"}
            unit="m/s"
            label="Wind"
            bg="#F5F3FF"
            ringBg="#DDD6FE"
            styles={styles}
          />
          <StatCard
            icon="🌡️"
            value={weather ? `${weather.min}°` : "--"}
            unit="C"
            label="Min Temp"
            bg="#F0FDF4"
            ringBg="#BBF7D0"
            styles={styles}
          />
        </ScrollView>

        {/* ════════════════════════════════════════════════════
            WEATHER HERO CARD (dynamic from forecast API)
        ════════════════════════════════════════════════════ */}
        <View style={{ ...styles.sectionRow, marginTop: 24 }}>
          <Text style={styles.sectionTitle}>🌤️ {t("todayWeather")}</Text>
        </View>

        <TouchableOpacity
          style={styles.weatherCard}
          onPress={() => navigation.navigate("WeatherTab")}
          activeOpacity={0.95}
        >
          <View style={styles.weatherBody}>
            <View style={styles.weatherTopRow}>
              <View style={styles.weatherLeft}>
                <View style={styles.weatherTag}>
                  <Text style={styles.weatherTagText}>LIVE FORECAST</Text>
                </View>
                <Text style={styles.weatherTemp}>
                  {weather?.temp ?? "--"}
                  <Text style={styles.weatherDegree}>°C</Text>
                </Text>
                <Text style={styles.weatherRange}>
                  ↑ {weather?.max ?? "--"}°C · ↓ {weather?.min ?? "--"}°C
                </Text>
                <Text style={styles.weatherDesc}>
                  {weather
                    ? getWeatherDesc(
                        parseFloat(weather.temp),
                        parseFloat(weather.rain),
                      )
                    : "Loading weather…"}
                </Text>
              </View>
              <Text style={styles.weatherEmoji}>
                {weather
                  ? getWeatherIcon(
                      parseFloat(weather.temp),
                      parseFloat(weather.rain),
                    )
                  : "🌤️"}
              </Text>
            </View>

            <View style={styles.weatherDivider} />

            <View style={styles.weatherStats}>
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatEmoji}>🌧️</Text>
                <Text style={styles.weatherStatVal}>
                  {weather?.rain ?? "--"} mm
                </Text>
                <Text style={styles.weatherStatLbl}>{t("rainfall")}</Text>
              </View>
              <View style={styles.weatherStatDiv} />
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatEmoji}>💧</Text>
                <Text style={styles.weatherStatVal}>
                  {weather?.humidity ?? "--"}%
                </Text>
                <Text style={styles.weatherStatLbl}>{t("humidity")}</Text>
              </View>
              <View style={styles.weatherStatDiv} />
              <View style={styles.weatherStat}>
                <Text style={styles.weatherStatEmoji}>💨</Text>
                <Text style={styles.weatherStatVal}>
                  {weather?.wind ?? "--"} m/s
                </Text>
                <Text style={styles.weatherStatLbl}>{t("windSpeed")}</Text>
              </View>
            </View>
          </View>

          <View style={styles.weatherFooter}>
            <Text style={styles.weatherFooterText}>View 7-day forecast</Text>
            <Text style={styles.weatherFooterArrow}>›</Text>
          </View>
        </TouchableOpacity>

        {/* ════════════════════════════════════════════════════
            QUICK NAV STRIP
        ════════════════════════════════════════════════════ */}
        <View style={{ ...styles.sectionRow }}>
          <Text style={styles.sectionTitle}>🔗 Quick Links</Text>
        </View>
        <View style={styles.navStrip}>
          <TouchableOpacity
            style={[styles.navBtn, styles.navBtnPrimary]}
            onPress={() => navigation.navigate("History")}
          >
            <Text style={styles.navBtnIcon}>📈</Text>
            <Text style={[styles.navBtnLabel, styles.navBtnLabelPrimary]}>
              History
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.navigate("CropsTab")}
          >
            <Text style={styles.navBtnIcon}>🌱</Text>
            <Text style={styles.navBtnLabel}>Crop{"\n"}Advisor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.navigate("Mandi")}
          >
            <Text style={styles.navBtnIcon}>💰</Text>
            <Text style={styles.navBtnLabel}>Market{"\n"}Prices</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => navigation.navigate("ProfileTab")}
          >
            <Text style={styles.navBtnIcon}>👤</Text>
            <Text style={styles.navBtnLabel}>My{"\n"}Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════
            FEATURE MODULE GRID (backend-driven, searchable)
        ════════════════════════════════════════════════════ */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>⚡ All Features</Text>
          {searchText.length > 0 && (
            <Text style={styles.sectionAction}>
              {visibleModules.length} found
            </Text>
          )}
        </View>

        <View style={styles.moduleGrid}>
          {moduleRows.map((row, ri) => (
            <View key={ri} style={styles.moduleRow}>
              {row.map((mod) => (
                <TouchableOpacity
                  key={mod.id ?? mod.key}
                  style={[styles.moduleCard, { backgroundColor: mod.bg }]}
                  onPress={() => navigation.navigate(mod.screen)}
                  activeOpacity={0.82}
                >
                  <View style={styles.moduleTopRow}>
                    <View
                      style={[
                        styles.moduleIconBox,
                        { backgroundColor: mod.color + "25" },
                      ]}
                    >
                      <Text style={styles.moduleIcon}>{mod.icon}</Text>
                    </View>
                    <Text style={[styles.moduleArrow, { color: mod.color }]}>
                      ›
                    </Text>
                  </View>
                  <Text style={styles.moduleLabel}>{t(mod.labelKey)}</Text>
                </TouchableOpacity>
              ))}
              {/* Pad odd rows */}
              {row.length === 1 && <View style={{ flex: 1 }} />}
            </View>
          ))}
          {visibleModules.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <Text style={{ fontSize: 40 }}>🔍</Text>
              <Text
                style={{ fontSize: 14, color: theme.subtext, marginTop: 8 }}
              >
                No features match "{searchText}"
              </Text>
            </View>
          )}
        </View>

        {/* ════════════════════════════════════════════════════
            EXPERT HELP CTA (dynamic from backend config)
        ════════════════════════════════════════════════════ */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>📞 Expert Help</Text>
        </View>

        <View style={styles.helperCard}>
          <View style={styles.helperLeft}>
            <View style={styles.helperTag}>
              <Text style={styles.helperTagText}>{expertConfig.tagline}</Text>
            </View>
            <Text style={styles.helperTitle}>{expertConfig.name}</Text>
            <Text style={styles.helperNum}>
              {expertConfig.number} · {expertConfig.hours}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.helperBtn}
            onPress={() => Linking.openURL(expertConfig.telUrl)}
            activeOpacity={0.85}
          >
            <Text style={styles.helperBtnEmoji}>📞</Text>
            <Text style={styles.helperBtnText}>Call Now</Text>
          </TouchableOpacity>
        </View>

        {/* ════════════════════════════════════════════════════
            FARM TIPS — dynamic carousel (seasonal / tagged)
        ════════════════════════════════════════════════════ */}
        <View style={{ ...styles.sectionRow }}>
          <Text style={styles.sectionTitle}>💡 Farm Tips</Text>
          <TouchableOpacity onPress={() => navigation.navigate("HelpSupport")}>
            <Text style={styles.sectionAction}>More ›</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 20, paddingRight: 8 }}
          decelerationRate="fast"
          snapToInterval={width - 72}
          snapToAlignment="start"
        >
          {tips.map((tip) => (
            <View
              key={tip._id ?? tip.tipId}
              style={[
                styles.tipsCard,
                { marginHorizontal: 0, marginRight: 12, width: width - 72 },
              ]}
            >
              <View style={styles.tipsIconCircle}>
                <Text style={styles.tipsEmoji}>{tip.icon ?? "💡"}</Text>
              </View>
              <View style={styles.tipsRight}>
                <Text style={styles.tipsTitle}>{tip.title}</Text>
                <Text style={styles.tipsBody}>{tip.body}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ════════════════════════════════════════════════════
            CROP RECOMMENDATIONS (hidden when empty)
        ════════════════════════════════════════════════════ */}
        {recommendations.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>🌾 Crop Recommendations</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recScroll}
            >
              {recommendations.map((rec) => (
                <View key={rec._id ?? rec.cropName} style={styles.recCard}>
                  <Text style={styles.recIcon}>{rec.icon ?? "🌾"}</Text>
                  <Text style={styles.recName}>{rec.cropName}</Text>
                  <Text style={styles.recReason} numberOfLines={2}>
                    {rec.reason}
                  </Text>
                  {rec.confidence > 0 && (
                    <View style={styles.recBadge}>
                      <Text style={styles.recBadgeTxt}>
                        {rec.confidence}% match
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        <View style={{ height: 48 }} />
      </Animated.View>
    </ScrollView>
  );
}

// ── Stat Card sub-component ───────────────────────────────────────────────────
function StatCard({ icon, value, unit, label, bg, ringBg, styles }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIconRing, { backgroundColor: ringBg }]}>
        <Text style={styles.statIcon}>{icon}</Text>
      </View>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statUnit}> {unit}</Text>
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
