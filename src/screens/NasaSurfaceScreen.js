/**
 * NasaSurfaceScreen
 * Displays the NASA POWER surface parameter catalog + live farm metrics
 * fetched from the AG (Agricultural) community endpoints.
 */
import React, {
  useState,
  useEffect,
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
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocation } from "../context/LocationContext";
import { useTheme } from "../context/ThemeContext";
import {
  getSurfaceParameterCatalog,
  getSurfaceData,
  parseCatalog,
  getLatestValues,
  computeAverage,
  computeAllAverages,
  getNasaDateRange,
  LIVE_FARM_PARAMS,
  FARMER_IDS,
} from "../api/nasaSurfaceApi";
import useNasaConfig from "../hooks/useNasaConfig";
import useNasaGroupings from "../hooks/useNasaGroupings";

const { width } = Dimensions.get("window");
const FAV_KEY = "nasa_fav_locations";

// ── Category definitions ──────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "all", label: "All", icon: "🌐", color: "#4F46E5", bg: "#EEF2FF" },
  {
    id: "temperature",
    label: "Temperature",
    icon: "🌡️",
    color: "#EF4444",
    bg: "#FEF2F2",
  },
  {
    id: "precipitation",
    label: "Rain",
    icon: "🌧️",
    color: "#3B82F6",
    bg: "#EFF6FF",
  },
  {
    id: "humidity",
    label: "Humidity",
    icon: "💧",
    color: "#06B6D4",
    bg: "#ECFEFF",
  },
  { id: "solar", label: "Solar", icon: "☀️", color: "#F59E0B", bg: "#FFFBEB" },
  { id: "wind", label: "Wind", icon: "💨", color: "#8B5CF6", bg: "#F5F3FF" },
  {
    id: "pressure",
    label: "Pressure",
    icon: "🔵",
    color: "#64748B",
    bg: "#F8FAFC",
  },
  { id: "soil", label: "Soil", icon: "🌱", color: "#059669", bg: "#ECFDF5" },
  // { id: 'other',         label: 'Other',       icon: '📊', color: '#78716C', bg: '#F5F5F4' },
];

// Key metrics to show in the live dashboard (id, label, icon, unit override)
const METRIC_DEFS = [
  { id: "T2M", label: "Avg Temp", icon: "🌡️", unitOverride: "°C" },
  { id: "T2M_MAX", label: "Max Temp", icon: "🔴", unitOverride: "°C" },
  { id: "T2M_MIN", label: "Min Temp", icon: "🔵", unitOverride: "°C" },
  { id: "PRECTOTCORR", label: "Rainfall", icon: "🌧️", unitOverride: "mm" },
  { id: "RH2M", label: "Humidity", icon: "💧", unitOverride: "%" },
  { id: "WS10M", label: "Wind Speed", icon: "💨", unitOverride: "m/s" },
  {
    id: "ALLSKY_SFC_SW_DWN",
    label: "Solar Rad.",
    icon: "☀️",
    unitOverride: "MJ/m²",
  },
  { id: "GWETROOT", label: "Soil Moisture", icon: "🌿", unitOverride: "frac" },
];

const NEXT_API_RECS = [
  {
    title: "NASA POWER Daily Data",
    desc: "Fetch daily T2M, PRECTOT, RH2M values for any date range.",
    endpoint: "/api/temporal/daily/point",
    icon: "📅",
    color: "#4F46E5",
  },
  {
    title: "NASA POWER Climatology",
    desc: "Long-term 30-year averages — great for crop calendar planning.",
    endpoint: "/api/temporal/climatology/point",
    icon: "📈",
    color: "#059669",
  },
  {
    title: "NASA POWER Monthly",
    desc: "Monthly aggregates for season-level analysis.",
    endpoint: "/api/temporal/monthly/point",
    icon: "🗓️",
    color: "#F59E0B",
  },
  {
    title: "NASA EONET Alerts",
    desc: "Live disaster events: droughts, floods, wildfires near your farm.",
    endpoint: "https://eonet.gsfc.nasa.gov/api/v3/events",
    icon: "🚨",
    color: "#EF4444",
  },
  {
    title: "Open-Meteo Forecast",
    desc: "7-day hourly forecast — free, no API key needed.",
    endpoint: "https://api.open-meteo.com/v1/forecast",
    icon: "🌤️",
    color: "#06B6D4",
  },
];

// ── Farmer Conditions Summary ─────────────────────────────────────────────────
function getFarmerCondition(liveVals) {
  const temp = parseFloat(liveVals.T2M_MAX?.value ?? liveVals.T2M?.value ?? 0);
  const rain = parseFloat(liveVals.PRECTOTCORR?.value ?? 0);
  const humid = parseFloat(liveVals.RH2M?.value ?? 0);
  const wind = parseFloat(liveVals.WS10M?.value ?? 0);
  const soil = parseFloat(liveVals.GWETROOT?.value ?? -1);

  const items = [];

  if (temp > 40)
    items.push({
      icon: "🔥",
      label: "Heat stress risk",
      color: "#EF4444",
      bg: "#FEF2F2",
    });
  else if (temp < 5)
    items.push({
      icon: "❄️",
      label: "Frost risk tonight",
      color: "#3B82F6",
      bg: "#EFF6FF",
    });
  else
    items.push({
      icon: "✅",
      label: `Temp OK (${temp.toFixed(1)}°C)`,
      color: "#059669",
      bg: "#ECFDF5",
    });

  if (rain > 20)
    items.push({
      icon: "🌊",
      label: "Heavy rain — delay field ops",
      color: "#EF4444",
      bg: "#FEF2F2",
    });
  else if (rain > 5)
    items.push({
      icon: "🌧️",
      label: "Good rainfall day",
      color: "#059669",
      bg: "#ECFDF5",
    });
  else
    items.push({
      icon: "🏜️",
      label: "Low rain — check irrigation",
      color: "#F59E0B",
      bg: "#FFFBEB",
    });

  if (wind > 10)
    items.push({
      icon: "💨",
      label: "High wind — avoid spraying",
      color: "#EF4444",
      bg: "#FEF2F2",
    });
  else
    items.push({
      icon: "🌬️",
      label: `Wind ${wind.toFixed(1)} m/s`,
      color: "#64748B",
      bg: "#F8FAFC",
    });

  if (humid > 85)
    items.push({
      icon: "💦",
      label: "High humidity — disease risk",
      color: "#F59E0B",
      bg: "#FFFBEB",
    });
  else if (humid > 0)
    items.push({
      icon: "💧",
      label: `Humidity ${humid.toFixed(0)}%`,
      color: "#059669",
      bg: "#ECFDF5",
    });

  if (soil >= 0)
    items.push(
      soil > 0.5
        ? {
            icon: "🌱",
            label: "Soil moisture adequate",
            color: "#059669",
            bg: "#ECFDF5",
          }
        : {
            icon: "⚠️",
            label: "Low soil moisture",
            color: "#F59E0B",
            bg: "#FFFBEB",
          },
    );

  return items;
}

function FarmerSummaryCard({ liveVals, dateRange, styles, theme }) {
  const items = getFarmerCondition(liveVals);
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>
        🌾 Farm Conditions · Last {dateRange}d
      </Text>
      <View style={styles.summaryGrid}>
        {items.map((item, i) => (
          <View
            key={i}
            style={[styles.summaryItem, { backgroundColor: item.bg }]}
          >
            <Text style={styles.summaryItemIcon}>{item.icon}</Text>
            <Text
              style={[styles.summaryItemLabel, { color: item.color }]}
              numberOfLines={2}
            >
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles(theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: theme.background },
    centered: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },

    // Header
    header: {
      backgroundColor: theme.primary,
      paddingHorizontal: 20,
      paddingBottom: 24,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: "rgba(255,255,255,0.15)",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "900",
      color: "#FFFFFF",
      flex: 1,
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 12,
      color: "rgba(255,255,255,0.6)",
      marginTop: 2,
    },
    nasaBadge: {
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
    },
    nasaBadgeText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#A5B4FC",
      letterSpacing: 0.8,
    },

    // Location bar
    locationBar: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.12)",
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    locationBarIcon: { fontSize: 16, marginRight: 8 },
    locationBarText: {
      flex: 1,
      fontSize: 13,
      color: "#FFFFFF",
      fontWeight: "600",
    },
    locationBarCoords: {
      fontSize: 11,
      color: "rgba(255,255,255,0.55)",
      marginTop: 1,
    },
    locationBarRight: { flexDirection: "row", gap: 8 },
    locationBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.18)",
    },
    locationBtnText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },

    // Date range pills
    dateRow: {
      flexDirection: "row",
      gap: 8,
      marginTop: 12,
    },
    datePill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1.5,
      borderColor: "rgba(255,255,255,0.2)",
    },
    datePillActive: {
      backgroundColor: "#4F46E5",
      borderColor: "#4F46E5",
    },
    datePillText: {
      fontSize: 12,
      fontWeight: "700",
      color: "rgba(255,255,255,0.7)",
    },
    datePillTextActive: { color: "#FFFFFF" },

    // Section headers
    section: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: 20,
      marginTop: 24,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: theme.text,
      letterSpacing: -0.3,
    },
    sectionBadge: {
      backgroundColor: theme.primary + "18",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    sectionBadgeText: { fontSize: 12, fontWeight: "700", color: theme.primary },

    // Live metric cards (horizontal scroll)
    metricsScroll: { paddingLeft: 20, paddingRight: 6 },
    metricCard: {
      width: 120,
      marginRight: 12,
      borderRadius: 22,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
      justifyContent: "space-between",
      minHeight: 140,
    },
    metricIconBox: {
      width: 46,
      height: 46,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    metricIcon: { fontSize: 24 },
    metricVal: {
      fontSize: 22,
      fontWeight: "900",
      color: theme.text,
      letterSpacing: -0.5,
    },
    metricUnit: { fontSize: 11, fontWeight: "600", color: theme.subtext },
    metricLabel: {
      fontSize: 11,
      fontWeight: "600",
      color: theme.subtext,
      marginTop: 4,
    },
    metricNoData: { fontSize: 13, fontWeight: "700", color: theme.subtext },
    metricDate: { fontSize: 10, color: theme.subtext, marginTop: 4 },
    metricAvg: { fontSize: 10, color: theme.subtext, marginTop: 2 },

    // Search
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderRadius: 16,
      marginHorizontal: 20,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    searchIcon: { fontSize: 15, marginRight: 8, opacity: 0.4 },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: theme.text,
      paddingVertical: 0,
    },
    searchClear: { fontSize: 16, color: theme.subtext, paddingLeft: 8 },

    // Category filter pills
    categoryRow: { paddingLeft: 20, paddingRight: 4, marginTop: 12 },
    catPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    catPillActive: { borderColor: theme.primary, backgroundColor: theme.light },
    catPillIcon: { fontSize: 14, marginRight: 5 },
    catPillText: { fontSize: 12, fontWeight: "600", color: theme.subtext },
    catPillTextActive: { color: theme.primary, fontWeight: "700" },

    // Parameter list
    paramListWrap: { marginHorizontal: 20, marginTop: 16 },
    paramGroupHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
      marginBottom: 8,
    },
    paramGroupIcon: { fontSize: 16, marginRight: 8 },
    paramGroupLabel: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      flex: 1,
    },
    paramGroupCount: { fontSize: 12, fontWeight: "600", color: theme.subtext },

    paramCard: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
      flexDirection: "row",
      alignItems: "center",
    },
    paramCardFarmer: {
      borderColor: "#4F46E5" + "40",
      backgroundColor: "#EEF2FF",
    },
    paramCardLeft: { flex: 1 },
    paramId: {
      fontSize: 12,
      fontWeight: "800",
      color: theme.primary,
      marginBottom: 2,
    },
    paramLabel: { fontSize: 13, color: theme.text, lineHeight: 18 },
    paramUnit: { fontSize: 11, color: theme.subtext, marginTop: 2 },
    farmerTag: {
      backgroundColor: "#10B981" + "20",
      borderRadius: 6,
      paddingHorizontal: 7,
      paddingVertical: 2,
      alignSelf: "flex-end",
      marginLeft: 8,
    },
    farmerTagText: { fontSize: 10, fontWeight: "800", color: "#059669" },

    // Empty / error states
    emptyBox: { alignItems: "center", paddingVertical: 32 },
    emptyIcon: { fontSize: 36, marginBottom: 10 },
    emptyText: { fontSize: 14, color: theme.subtext, textAlign: "center" },

    errorBox: {
      marginHorizontal: 20,
      borderRadius: 16,
      padding: 20,
      backgroundColor: "#FEF2F2",
      borderLeftWidth: 4,
      borderLeftColor: "#EF4444",
      marginTop: 16,
    },
    errorTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: "#DC2626",
      marginBottom: 4,
    },
    errorMsg: { fontSize: 13, color: "#7F1D1D", lineHeight: 18 },
    retryBtn: {
      marginTop: 12,
      alignSelf: "flex-start",
      backgroundColor: "#EF4444",
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    retryBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },

    // ── Location Modal ────────────────────────────────────────────
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.52)",
      justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 32,
      borderTopRightRadius: 32,
      paddingHorizontal: 24,
      paddingBottom: 36, 
      // maxHeight: "88%",
    },
    // drag handle
    modalHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.border,
      alignSelf: "center",
      marginTop: 12,
      marginBottom: 20,
    },
    // header row inside modal
    modalHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    modalIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: theme.primary + "18",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    modalIconText: { fontSize: 20 },
    modalTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: "900",
      color: theme.text,
      letterSpacing: -0.3,
    },
    modalCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: theme.inputBg,
      alignItems: "center",
      justifyContent: "center",
    },
    modalCloseTxt: { fontSize: 14, color: theme.subtext },

    // GPS button (outlined, not filled)
    gpsBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: 16,
      paddingVertical: 14,
      borderWidth: 2,
      borderColor: theme.primary,
      backgroundColor: theme.primary + "0D",
      marginBottom: 20,
    },
    gpsBtnIcon: { fontSize: 20 },
    gpsBtnText: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.primary,
    },

    // OR divider
    orRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 18,
      gap: 10,
    },
    orLine: { flex: 1, height: 1, backgroundColor: theme.border },
    orText: { fontSize: 12, fontWeight: "700", color: theme.subtext },

    // Section label inside modal
    modalSectionLabel: {
      fontSize: 11,
      fontWeight: "800",
      color: theme.subtext,
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 8,
    },

    // Input with label
    modalInputLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.subtext,
      marginBottom: 5,
      marginTop: 2,
    },
    modalInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.inputBg,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingHorizontal: 14,
      height: 50,
      marginBottom: 10,
    },
    modalInputIcon: { fontSize: 16, marginRight: 10 },
    modalInput: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      paddingVertical: 0,
    },

    // Action buttons row (Cancel + Apply)
    modalRow: { flexDirection: "row", gap: 10, marginTop: 6, marginBottom: 20 },
    modalCancelBtn: {
      flex: 1,
      backgroundColor: theme.inputBg,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: theme.border,
    },
    modalCancelBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.subtext,
    },
    modalSaveBtn: {
      flex: 1,
      backgroundColor: theme.primary,
      borderRadius: 14,
      paddingVertical: 13,
      alignItems: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    modalBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

    // Divider between sections
    modalDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginBottom: 18,
    },

    // Save favorites row
    favSaveRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 16,
    },
    favSaveInput: {
      flex: 1,
      backgroundColor: theme.inputBg,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: theme.border,
      paddingHorizontal: 14,
      height: 46,
      fontSize: 14,
      color: theme.text,
    },
    favSaveBtn: {
      backgroundColor: "#059669",
      borderRadius: 14,
      paddingHorizontal: 16,
      height: 46,
      alignItems: "center",
      justifyContent: "center",
    },
    favSaveBtnText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },

    // Saved locations list
    favItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 4,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    favItemIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.primary + "18",
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    favItemLeft: { flex: 1 },
    favItemName: { fontSize: 14, fontWeight: "700", color: theme.text },
    favItemCoord: { fontSize: 12, color: theme.subtext, marginTop: 2 },
    favDeleteBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#FEF2F2",
    },
    favDeleteText: { fontSize: 14, color: "#EF4444" },

    // Farmer Summary Card
    summaryCard: {
      marginHorizontal: 20,
      marginTop: 16,
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    },
    summaryTitle: {
      fontSize: 13,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 12,
      letterSpacing: -0.2,
    },
    summaryGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    summaryItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
      flexBasis: "47%",
    },
    summaryItemIcon: { fontSize: 14 },
    summaryItemLabel: {
      fontSize: 11,
      fontWeight: "700",
      flex: 1,
      lineHeight: 15,
    },

    // Surface roughness detail cards
    detailCard: {
      backgroundColor: theme.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
      borderLeftWidth: 4,
    },
    detailKey: { fontSize: 12, fontWeight: "800", marginBottom: 2 },
    detailName: { fontSize: 13, color: theme.text, lineHeight: 18 },
    detailAnnualBadge: {
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: "center",
      marginLeft: 12,
    },
    detailAnnualVal: { fontSize: 22, fontWeight: "900" },
    detailAnnualLabel: { fontSize: 10, fontWeight: "600", marginTop: 1 },
    monthRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 },
    monthCell: {
      alignItems: "center",
      minWidth: 38,
      backgroundColor: theme.background,
      borderRadius: 8,
      paddingVertical: 5,
      paddingHorizontal: 4,
    },
    monthLabel: { fontSize: 9, color: theme.subtext, fontWeight: "600" },
    monthVal: { fontSize: 12, fontWeight: "800", marginTop: 2 },

    // Surface roughness cards (horizontal scroll)
    surfaceCard: {
      width: 140,
      marginRight: 12,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1.5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.07,
      shadowRadius: 8,
      elevation: 2,
      minHeight: 150,
      justifyContent: "space-between",
    },
    surfaceKey: {
      fontSize: 11,
      fontWeight: "800",
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    surfaceName: { fontSize: 12, color: theme.text, lineHeight: 17, flex: 1 },
    surfaceRoughBadge: {
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: "center",
      marginTop: 10,
    },
    surfaceRoughVal: { fontSize: 20, fontWeight: "900" },
    surfaceRoughLabel: { fontSize: 10, fontWeight: "600", marginTop: 1 },
    viewMoreBtn: {
      marginTop: 4,
      marginBottom: 8,
      backgroundColor: theme.primary + "12",
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.primary + "30",
    },
    viewMoreText: { fontSize: 13, fontWeight: "700", color: theme.primary },

    // Next API section
    nextApiCard: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
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
    nextApiIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    nextApiIcon: { fontSize: 22 },
    nextApiTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: theme.text,
      marginBottom: 4,
    },
    nextApiDesc: { fontSize: 12, color: theme.subtext, lineHeight: 17 },
    nextApiEndpoint: {
      fontSize: 10,
      color: theme.primary,
      marginTop: 4,
      fontWeight: "600",
    },
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getCategoryMeta(id) {
  return (
    CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
  );
}

function formatDate(nasaDateStr) {
  if (!nasaDateStr || nasaDateStr.length < 8) return "";
  const y = nasaDateStr.slice(0, 4);
  const m = nasaDateStr.slice(4, 6);
  const d = nasaDateStr.slice(6, 8);
  return `${d}/${m}/${y}`;
}

function groupByCategory(params) {
  const map = {};
  for (const p of params) {
    if (!map[p.category]) map[p.category] = [];
    map[p.category].push(p);
  }
  return map;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function NasaSurfaceScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { location, getGPSLocation } = useLocation();
  const { theme } = useTheme();

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { versionLabel } = useNasaConfig();
  const { getParamName } = useNasaGroupings();

  // Location state (active location used for API calls)
  const [activeLoc, setActiveLoc] = useState({
    lat: location.lat,
    lon: location.lon,
    city: location.city,
  });
  const [showLocModal, setShowLocModal] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLon, setManualLon] = useState("");
  const [favName, setFavName] = useState("");
  const [favorites, setFavorites] = useState([]);

  // Date range
  const [dateRange, setDateRange] = useState("7"); // '7' | '30'

  // Data state
  const [catalog, setCatalog] = useState([]);
  const [surfaceRaw, setSurfaceRaw] = useState({});
  const [liveVals, setLiveVals] = useState({});
  const [liveAvgs, setLiveAvgs] = useState({});
  const [rawLiveData, setRawLiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [catalogErr, setCatalogErr] = useState(null);
  const [liveErr, setLiveErr] = useState(null);

  // UI state
  const [searchText, setSearchText] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Sync active location with context location
  useEffect(() => {
    setActiveLoc({ lat: location.lat, lon: location.lon, city: location.city });
  }, [location]);

  // Load favorites from storage
  useEffect(() => {
    AsyncStorage.getItem(FAV_KEY).then((raw) => {
      if (raw) setFavorites(JSON.parse(raw));
    });
  }, []);

  // Load data when activeLoc or dateRange changes
  useEffect(() => {
    loadAll();
  }, [activeLoc, dateRange]);

  const loadAll = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setCatalogErr(null);
    setLiveErr(null);
    fadeAnim.setValue(0);

    const { start, end } = getNasaDateRange(parseInt(dateRange, 10));

    const [catalogResult, liveResult] = await Promise.allSettled([
      getSurfaceParameterCatalog(),
      getSurfaceData(
        activeLoc.lat,
        activeLoc.lon,
        LIVE_FARM_PARAMS,
        start,
        end,
      ),
    ]);

    if (catalogResult.status === "fulfilled") {
      const raw = catalogResult.value;
      setCatalog(parseCatalog(raw));
      // Store raw surface entries (vegtype_*, seaice, openwater, airport*)
      if (raw && typeof raw === "object") setSurfaceRaw(raw);
    } else {
      setCatalogErr(catalogResult.reason?.message || "Failed to load catalog");
    }

    if (liveResult.status === "fulfilled") {
      const raw = liveResult.value;
      setRawLiveData(raw);
      setLiveVals(getLatestValues(raw));
      setLiveAvgs(computeAllAverages(raw, LIVE_FARM_PARAMS));
    } else {
      setRawLiveData(null);
      setLiveAvgs({});
      setLiveErr(liveResult.reason?.message || "Failed to load live data");
    }

    setLoading(false);
    setRefreshing(false);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 450,
      useNativeDriver: true,
    }).start();
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAll(true);
  }, [activeLoc, dateRange]);

  // ── Favorite location helpers ─────────────────────────────────────────────
  const saveFavorites = async (list) => {
    setFavorites(list);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(list));
  };

  const addFavorite = () => {
    const name = favName.trim() || activeLoc.city;
    const entry = { name, lat: activeLoc.lat, lon: activeLoc.lon };
    saveFavorites([...favorites, entry]);
    setFavName("");
    Alert.alert("Saved!", `"${name}" added to favorites.`);
  };

  const removeFavorite = (idx) => {
    const updated = favorites.filter((_, i) => i !== idx);
    saveFavorites(updated);
  };

  // ── Manual location apply ─────────────────────────────────────────────────
  const applyManualLocation = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    if (
      isNaN(lat) ||
      isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      Alert.alert(
        "Invalid",
        "Enter valid lat (−90 to 90) and lon (−180 to 180).",
      );
      return;
    }
    setActiveLoc({
      lat,
      lon,
      city: `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E`,
    });
    setShowLocModal(false);
  };

  const applyGPS = async () => {
    setShowLocModal(false);
    await getGPSLocation();
  };

  // ── Filtered & grouped catalog ────────────────────────────────────────────
  const filteredParams = useMemo(() => {
    let list = catalog;
    if (activeCategory !== "all")
      list = list.filter((p) => p.category === activeCategory);
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      list = list.filter(
        (p) =>
          p.id.toLowerCase().includes(q) || p.label.toLowerCase().includes(q),
      );
    }
    return list;
  }, [catalog, activeCategory, searchText]);

  const groupedParams = useMemo(
    () => groupByCategory(filteredParams),
    [filteredParams],
  );

  const displayCategories = useMemo(
    () =>
      activeCategory === "all"
        ? CATEGORIES.filter(
            (c) => c.id !== "all" && groupedParams[c.id]?.length > 0,
          )
        : [CATEGORIES.find((c) => c.id === activeCategory)].filter(Boolean),
    [activeCategory, groupedParams],
  );

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={[styles.header, { paddingTop: 20 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ fontSize: 18, color: "#FFFFFF" }}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>NASA Surface Data</Text>
              <Text style={styles.headerSubtitle}>
                Loading parameter catalog…
              </Text>
            </View>
            <View style={styles.nasaBadge}>
              <Text style={styles.nasaBadgeText}>{versionLabel || 'NASA POWER'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.centered}>
          <Text style={{ fontSize: 48, marginBottom: 20 }}>🛰️</Text>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text
            style={{
              fontSize: 14,
              color: theme.subtext,
              marginTop: 16,
              textAlign: "center",
            }}
          >
            Fetching NASA POWER data…{"\n"}This may take a moment.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* ── HEADER ───────────────────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={{ fontSize: 18, color: "#FFFFFF" }}>←</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>NASA Surface Data</Text>
              <Text style={styles.headerSubtitle}>
                Agricultural Community · {catalog.length} parameters loaded
              </Text>
            </View>
            <View style={styles.nasaBadge}>
              <Text style={styles.nasaBadgeText}>{versionLabel || 'NASA POWER'}</Text>
            </View>
          </View>

          {/* Location bar */}
          <TouchableOpacity
            style={styles.locationBar}
            onPress={() => setShowLocModal(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.locationBarIcon}>📍</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.locationBarText} numberOfLines={1}>
                {activeLoc.city}
              </Text>
              <Text style={styles.locationBarCoords}>
                {parseFloat(activeLoc.lat).toFixed(4)}°N,{" "}
                {parseFloat(activeLoc.lon).toFixed(4)}°E
              </Text>
            </View>
            <View style={styles.locationBarRight}>
              {favorites.length > 0 && (
                <View style={styles.locationBtn}>
                  <Text style={styles.locationBtnText}>
                    ⭐ {favorites.length}
                  </Text>
                </View>
              )}
              <View style={styles.locationBtn}>
                <Text style={styles.locationBtnText}>Edit ›</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Date range pills */}
          <View style={styles.dateRow}>
            {[
              { val: "7", label: "7 Days" },
              { val: "14", label: "14 Days" },
              { val: "30", label: "30 Days" },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.val}
                style={[
                  styles.datePill,
                  dateRange === opt.val && styles.datePillActive,
                ]}
                onPress={() => setDateRange(opt.val)}
              >
                <Text
                  style={[
                    styles.datePillText,
                    dateRange === opt.val && styles.datePillTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {/* ── LIVE FARM METRICS ──────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌾 Key Farm Metrics</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>
                {liveVals && Object.keys(liveVals).length > 0
                  ? `Latest · ${formatDate(Object.values(liveVals)[0]?.date)}`
                  : "Live Data"}
              </Text>
            </View>
          </View>

          {liveErr ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Live Data Unavailable</Text>
              <Text style={styles.errorMsg}>{liveErr}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => loadAll()}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.metricsScroll}
            >
              {METRIC_DEFS.map((m) => {
                const entry = liveVals[m.id];
                const avg = liveAvgs[m.id];
                const catId =
                  m.id === "GWETROOT"
                    ? "soil"
                    : m.id.startsWith("T2M")
                      ? "temperature"
                      : m.id === "PRECTOTCORR"
                        ? "precipitation"
                        : m.id === "RH2M"
                          ? "humidity"
                          : m.id.startsWith("WS")
                            ? "wind"
                            : "solar";
                const cat = getCategoryMeta(catId);
                return (
                  <View
                    key={m.id}
                    style={[styles.metricCard, { backgroundColor: cat.bg }]}
                  >
                    <View
                      style={[
                        styles.metricIconBox,
                        { backgroundColor: cat.color + "22" },
                      ]}
                    >
                      <Text style={styles.metricIcon}>{m.icon}</Text>
                    </View>
                    {entry ? (
                      <>
                        <Text style={styles.metricVal}>{entry.value}</Text>
                        <Text style={styles.metricUnit}>{m.unitOverride}</Text>
                        <Text style={styles.metricLabel}>{m.label}</Text>
                        {avg && avg !== entry.value && (
                          <Text style={styles.metricAvg}>avg {avg}</Text>
                        )}
                      </>
                    ) : (
                      <>
                        <Text style={styles.metricNoData}>N/A</Text>
                        <Text style={styles.metricLabel}>{m.label}</Text>
                      </>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Farmer Conditions Summary */}
          {!liveErr && Object.keys(liveVals).length > 0 && (
            <FarmerSummaryCard
              liveVals={liveVals}
              dateRange={dateRange}
              styles={styles}
              theme={theme}
            />
          )}

          {/* ── SURFACE ROUGHNESS DETAIL ──────────────────────────── */}
          {Object.keys(surfaceRaw).length > 0 && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  🌍 Surface Roughness Types
                </Text>
                <TouchableOpacity
                  style={styles.sectionBadge}
                  onPress={() =>
                    navigation.navigate("SurfaceRoughnessAll", { surfaceRaw })
                  }
                >
                  <Text style={styles.sectionBadgeText}>View More ›</Text>
                </TouchableOpacity>
              </View>
              <View style={{ marginHorizontal: 20 }}>
                {Object.entries(surfaceRaw)
                  .slice(0, 5)
                  .map(([key, val]) => {
                    const r = val?.Roughness || {};
                    const annual = r.Annual ?? "—";
                    const months = [
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
                    const monthKeys = [
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ];
                    const isVeg = key.startsWith("vegtype");
                    const color = isVeg
                      ? "#059669"
                      : key === "openwater"
                        ? "#3B82F6"
                        : key.includes("ice")
                          ? "#0EA5E9"
                          : "#F59E0B";
                    return (
                      <View
                        key={key}
                        style={[styles.detailCard, { borderLeftColor: color }]}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.detailKey, { color }]}>
                              {key}
                            </Text>
                            <Text style={styles.detailName}>
                              {val?.Long_Name || key}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.detailAnnualBadge,
                              { backgroundColor: color + "18" },
                            ]}
                          >
                            <Text style={[styles.detailAnnualVal, { color }]}>
                              {annual}
                            </Text>
                            <Text style={[styles.detailAnnualLabel, { color }]}>
                              annual
                            </Text>
                          </View>
                        </View>
                        <View style={styles.monthRow}>
                          {monthKeys.map((mk, i) => (
                            <View key={mk} style={styles.monthCell}>
                              <Text style={styles.monthLabel}>{months[i]}</Text>
                              <Text style={[styles.monthVal, { color }]}>
                                {r[mk] ?? "—"}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    );
                  })}
                <TouchableOpacity
                  style={styles.viewMoreBtn}
                  onPress={() =>
                    navigation.navigate("SurfaceRoughnessAll", { surfaceRaw })
                  }
                >
                  <Text style={styles.viewMoreText}>
                    View All {Object.keys(surfaceRaw).length} Surface Types ›
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {catalogErr && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTitle}>Surface Data Unavailable</Text>
              <Text style={styles.errorMsg}>{catalogErr}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => loadAll()}
              >
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── PARAMETER CATALOG ────────────────────────────────────── */}
          {catalog.length > 0 && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📋 Parameter Catalog</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{catalog.length} params</Text>
                </View>
              </View>

              {/* Search */}
              <View style={styles.searchRow}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search parameters…"
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

              {/* Category pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catPill,
                      activeCategory === cat.id && styles.catPillActive,
                    ]}
                    onPress={() => setActiveCategory(cat.id)}
                  >
                    <Text style={styles.catPillIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.catPillText,
                        activeCategory === cat.id && styles.catPillTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Param list */}
              <View style={styles.paramListWrap}>
                {filteredParams.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>🔎</Text>
                    <Text style={styles.emptyText}>No parameters match your search.</Text>
                  </View>
                ) : (
                  displayCategories.map((cat) => {
                    const params = groupedParams[cat.id] || [];
                    if (!params.length) return null;
                    return (
                      <View key={cat.id}>
                        <View style={styles.paramGroupHeader}>
                          <Text style={styles.paramGroupIcon}>{cat.icon}</Text>
                          <Text style={[styles.paramGroupLabel, { color: cat.color }]}>
                            {cat.label}
                          </Text>
                          <Text style={styles.paramGroupCount}>{params.length}</Text>
                        </View>
                        {params.map((p) => (
                          <View
                            key={p.id}
                            style={[
                              styles.paramCard,
                              p.isFarmerKey && styles.paramCardFarmer,
                            ]}
                          >
                            <View style={styles.paramCardLeft}>
                              <Text style={[styles.paramId, { color: cat.color }]}>
                                {p.id}
                              </Text>
                              <Text style={styles.paramLabel}>
                                {getParamName(p.id) || p.label}
                              </Text>
                              {p.unit ? (
                                <Text style={styles.paramUnit}>{p.unit}</Text>
                              ) : null}
                            </View>
                            {p.isFarmerKey && (
                              <View style={styles.farmerTag}>
                                <Text style={styles.farmerTagText}>FARM</Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}

          {/* ── NEXT API RECOMMENDATIONS ──────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📡 Next API Integrations</Text>
          </View>
          <View style={{ marginHorizontal: 20 }}>
            {NEXT_API_RECS.map((rec, i) => (
              <View key={i} style={styles.nextApiCard}>
                <View
                  style={[
                    styles.nextApiIconBox,
                    { backgroundColor: rec.color + "20" },
                  ]}
                >
                  <Text style={styles.nextApiIcon}>{rec.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nextApiTitle}>{rec.title}</Text>
                  <Text style={styles.nextApiDesc}>{rec.desc}</Text>
                  <Text style={styles.nextApiEndpoint} numberOfLines={1}>
                    {rec.endpoint}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 48 }} />
        </Animated.View>
      </ScrollView>

      {/* ── LOCATION MODAL ──────────────────────────────────────────────────── */}
      <Modal
        visible={showLocModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLocModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLocModal(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* Prevent tap-through to overlay */}
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalSheet}>

                {/* ── Drag handle ───────────────────────────────────────── */}
                <View style={styles.modalHandle} />

                {/* ── Header ────────────────────────────────────────────── */}
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalIconCircle}>
                    <Text style={styles.modalIconText}>📍</Text>
                  </View>
                  <Text style={styles.modalTitle}>Select Location</Text>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setShowLocModal(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.modalCloseTxt}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Use GPS ───────────────────────────────────────────── */}
                <TouchableOpacity style={styles.gpsBtn} onPress={applyGPS} activeOpacity={0.75}>
                  <Text style={styles.gpsBtnIcon}>📡</Text>
                  <Text style={styles.gpsBtnText}>Use My GPS Location</Text>
                </TouchableOpacity>

                {/* ── OR divider ────────────────────────────────────────── */}
                <View style={styles.orRow}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>OR ENTER MANUALLY</Text>
                  <View style={styles.orLine} />
                </View>

                {/* ── Manual coordinate inputs ──────────────────────────── */}
                <Text style={styles.modalInputLabel}>Latitude</Text>
                <View style={styles.modalInputWrapper}>
                  <Text style={styles.modalInputIcon}>🌐</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 23.0225"
                    placeholderTextColor={theme.subtext}
                    keyboardType="decimal-pad"
                    value={manualLat}
                    onChangeText={setManualLat}
                    returnKeyType="next"
                  />
                </View>

                <Text style={styles.modalInputLabel}>Longitude</Text>
                <View style={styles.modalInputWrapper}>
                  <Text style={styles.modalInputIcon}>🗺️</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 72.5714"
                    placeholderTextColor={theme.subtext}
                    keyboardType="decimal-pad"
                    value={manualLon}
                    onChangeText={setManualLon}
                    returnKeyType="done"
                  />
                </View>

                {/* ── Cancel / Apply ────────────────────────────────────── */}
                <View style={styles.modalRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => setShowLocModal(false)}
                  >
                    <Text style={styles.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalSaveBtn}
                    onPress={applyManualLocation}
                  >
                    <Text style={styles.modalBtnText}>✓ Apply</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Save to Favorites ─────────────────────────────────── */}
                <View style={styles.modalDivider} />
                <Text style={styles.modalSectionLabel}>⭐ Save Current Location</Text>
                <View style={styles.favSaveRow}>
                  <TextInput
                    style={styles.favSaveInput}
                    placeholder={`Name (default: ${activeLoc.city})`}
                    placeholderTextColor={theme.subtext}
                    value={favName}
                    onChangeText={setFavName}
                    returnKeyType="done"
                  />
                  <TouchableOpacity style={styles.favSaveBtn} onPress={addFavorite}>
                    <Text style={styles.favSaveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Saved Locations list ──────────────────────────────── */}
                {favorites.length > 0 && (
                  <>
                    <View style={styles.modalDivider} />
                    <Text style={styles.modalSectionLabel}>Saved Locations</Text>
                    <ScrollView
                      style={{ maxHeight: 180 }}
                      showsVerticalScrollIndicator={false}
                      bounces={false}
                    >
                      {favorites.map((fav, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.favItem}
                          onPress={() => {
                            setActiveLoc({ lat: fav.lat, lon: fav.lon, city: fav.name });
                            setShowLocModal(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <View style={styles.favItemIcon}>
                            <Text style={{ fontSize: 16 }}>📍</Text>
                          </View>
                          <View style={styles.favItemLeft}>
                            <Text style={styles.favItemName}>{fav.name}</Text>
                            <Text style={styles.favItemCoord}>
                              {parseFloat(fav.lat).toFixed(4)}°N, {parseFloat(fav.lon).toFixed(4)}°E
                            </Text>
                          </View>
                          <TouchableOpacity
                            style={styles.favDeleteBtn}
                            onPress={() => removeFavorite(i)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Text style={styles.favDeleteText}>✕</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}
