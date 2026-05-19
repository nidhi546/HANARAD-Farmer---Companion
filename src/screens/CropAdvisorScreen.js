/**
 * CropAdvisorScreen — Climate-aware crop recommendations + user crop summary.
 *
 * Architecture:
 *  - Tab A "Recommendations": ranks all 14 master crops by scored algorithm
 *  - Tab B "My Crops": shows active crops + link to MyCropsScreen
 *  - Climate profile card uses NASA POWER climatology via powerApi
 *  - Weather cache: stores last successful climate in AsyncStorage to avoid
 *    repeat API hits on every open (TTL: 24 hours)
 *
 * Scoring: cropEngine.rankCrops() — score 0–100, badge Excellent→Avoid
 */
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { getClimatology } from "../api/powerApi";
import { useLocation } from "../context/LocationContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigation } from "@react-navigation/native";
import { useCrops } from "../hooks/useCrops";
import { useCropMaster } from "../hooks/useCropMaster";
import { Storage, KEYS } from "../utils/storage";
import AppHeader from "../components/AppHeader";
import {
  rankCrops,
  getCurrentSeason,
  getSeasonWindow,
} from "../utils/cropEngine";

const CLIMATE_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ── Climate profile card ──────────────────────────────────────────────────────
function ClimateCard({ climate, season, city, theme, styles }) {
  return (
    <View style={styles.climateCard}>
      <View style={styles.climateCardHeader}>
        <View>
          <Text style={styles.climateTitle}>Climate Profile</Text>
          <Text style={[styles.climateCity, { color: theme.subtext }]}>
            📍 {city}
          </Text>
        </View>
        <View
          style={[
            styles.seasonBadge,
            { backgroundColor: theme.primary + "18" },
          ]}
        >
          <Text style={[styles.seasonBadgeTxt, { color: theme.primary }]}>
            {season} · {getSeasonWindow(season)}
          </Text>
        </View>
      </View>
      <View style={styles.climateRow}>
        <ClimateStat
          emoji="🌡️"
          value={`${climate.temp.toFixed(1)}°C`}
          label="Avg Temp"
          theme={theme}
        />
        <View
          style={[styles.climateDivider, { backgroundColor: theme.border }]}
        />
        <ClimateStat
          emoji="🌧️"
          value={`${climate.rain.toFixed(0)} mm`}
          label="Seasonal Rain"
          theme={theme}
        />
        <View
          style={[styles.climateDivider, { backgroundColor: theme.border }]}
        />
        <ClimateStat
          emoji="💧"
          value={`${climate.humidity.toFixed(0)}%`}
          label="Humidity"
          theme={theme}
        />
      </View>
    </View>
  );
}

function ClimateStat({ emoji, value, label, theme }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text style={{ fontSize: 26, marginBottom: 4 }}>{emoji}</Text>
      <Text style={{ fontSize: 18, fontWeight: "800", color: theme.text }}>
        {value}
      </Text>
      <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

// ── Recommendation card ───────────────────────────────────────────────────────
function RecommendationCard({ item, onAdd, alreadyAdded, theme }) {
  const { crop, score, badge } = item;

  return (
    <View
      style={[
        rc.card,
        { backgroundColor: theme.card, borderLeftColor: badge.color },
      ]}
    >
      <View style={[rc.iconCircle, { backgroundColor: crop.bgColor }]}>
        <Text style={rc.icon}>{crop.icon}</Text>
      </View>

      <View style={rc.info}>
        <View style={rc.nameRow}>
          <Text style={[rc.name, { color: theme.text }]} numberOfLines={1}>
            {crop.name}
          </Text>
          <View style={[rc.scoreBadge, { backgroundColor: badge.bg }]}>
            <Text style={[rc.scoreTxt, { color: badge.color }]}>
              {badge.emoji} {badge.label}
            </Text>
          </View>
        </View>

        <View style={rc.metaRow}>
          <Text style={[rc.season, { color: theme.subtext }]}>
            {crop.seasons.join(" / ")}
          </Text>
          <View style={[rc.scoreBar, { backgroundColor: theme.border }]}>
            <View
              style={[
                rc.scoreBarFill,
                { width: `${score}%`, backgroundColor: badge.color },
              ]}
            />
          </View>
          <Text style={[rc.scorePct, { color: badge.color }]}>{score}</Text>
        </View>

        <Text style={[rc.tip, { color: theme.subtext }]} numberOfLines={2}>
          {crop.tipShort}
        </Text>
      </View>

      <TouchableOpacity
        style={[
          rc.addBtn,
          { backgroundColor: alreadyAdded ? theme.border : theme.primary },
        ]}
        onPress={() => onAdd(crop)}
        disabled={alreadyAdded}
      >
        <Text
          style={[
            rc.addBtnTxt,
            { color: alreadyAdded ? theme.subtext : "#fff" },
          ]}
        >
          {alreadyAdded ? "✓" : "+"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const rc = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    marginBottom: 10,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  icon: { fontSize: 26 },
  info: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  name: { fontSize: 15, fontWeight: "800", flex: 1, color: "#1F2937" },
  scoreBadge: { borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2 },
  scoreTxt: { fontSize: 11, fontWeight: "700" },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 6,
  },
  season: { fontSize: 11, flex: 1 },
  scoreBar: { width: 60, height: 5, borderRadius: 3, overflow: "hidden" },
  scoreBarFill: { height: 5, borderRadius: 3 },
  scorePct: { fontSize: 12, fontWeight: "800", width: 24, textAlign: "right" },
  tip: { fontSize: 12, lineHeight: 16 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
    flexShrink: 0,
  },
  addBtnTxt: { fontSize: 18, fontWeight: "800" },
});

// ── My Crops summary strip ────────────────────────────────────────────────────
function MyCropStrip({ activeCrops, cropList, onViewAll, onAdd, theme }) {
  const { width: screenWidth } = useWindowDimensions();
  // Show ~3 cards + partial 4th; account for scroll container's 16px horizontal padding
  const cardWidth = Math.floor((screenWidth - 32 - 40) / 3.4);

  if (activeCrops.length === 0) {
    return (
      <View style={[mcs.empty, { backgroundColor: theme.card }]}>
        <Text style={mcs.emptyEmoji}>🌱</Text>
        <Text style={[mcs.emptyTitle, { color: theme.text }]}>
          No crops added yet
        </Text>
        <Text style={[mcs.emptySub, { color: theme.subtext }]}>
          Add your first crop to track growth stages.
        </Text>
        <TouchableOpacity
          style={[mcs.emptyBtn, { backgroundColor: theme.primary }]}
          onPress={onAdd}
        >
          <Text style={mcs.emptyBtnTxt}>+ Add Crop</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return (
    <View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8 }}
        style={{ marginBottom: 4 }}
      >
        {activeCrops.slice(0, 6).map((c) => (
          <TouchableOpacity
            key={c.docId || c._id}
            style={[
              mcs.cropPill,
              {
                width: cardWidth,
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={onViewAll}
          >
            <Text style={mcs.pillIcon}>
              {(c.cropId &&
                cropList.find((m) => m.cropId === c.cropId)?.icon) ||
                "🌱"}
            </Text>
            <Text
              style={[mcs.pillName, { color: theme.text }]}
              numberOfLines={1}
            >
              {c.cropName}
            </Text>
            <Text style={[mcs.pillStage, { color: theme.subtext }]}>
              {c.currentStage || "seedling"}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            mcs.cropPill,
            mcs.viewAllPill,
            {
              width: cardWidth,
              backgroundColor: theme.primary + "14",
              borderColor: theme.primary,
            },
          ]}
          onPress={onViewAll}
        >
          <Text style={[mcs.pillName, { color: theme.primary }]}>
            View All →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const mcs = StyleSheet.create({
  empty: {
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    marginBottom: 4,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 18 },
  emptyBtn: {
    marginTop: 14,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyBtnTxt: { fontSize: 14, fontWeight: "800", color: "#fff" },
  cropPill: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginRight: 8,
    alignItems: "center",
  },
  viewAllPill: { justifyContent: "center", borderWidth: 1.5 },
  pillIcon: { fontSize: 24, marginBottom: 4 },
  pillName: { fontSize: 11, fontWeight: "700", textAlign: "center" },
  pillStage: { fontSize: 10, textAlign: "center", marginTop: 2 },
});

// ── Score filter bar ──────────────────────────────────────────────────────────
const FILTERS = [
  { key: "all", label: "All" },
  { key: "excellent", label: "✅ 80+" },
  { key: "good", label: "👍 65+" },
  { key: "moderate", label: "⚠️ 50+" },
];

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CropAdvisorScreen() {
  const { location } = useLocation();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const { activeCrops, addCrop, userCrops } = useCrops();
  const {
    crops: cropList,
    loading: cropsLoading,
    refreshCrops,
  } = useCropMaster();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [climate, setClimate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState("recs"); // 'recs' | 'mine'
  const [filter, setFilter] = useState("all");

  const season = getCurrentSeason();

  // NASA POWER climatology returns 3-letter month keys (JAN…DEC) + ANN.
  // Average only the months that belong to the current farming season so the
  // card reflects seasonal conditions rather than an annual mean.
  const SEASON_MONTHS = {
    Kharif: ["JUN", "JUL", "AUG", "SEP", "OCT"],
    Rabi: ["NOV", "DEC", "JAN", "FEB", "MAR"],
    Zaid: ["MAR", "APR", "MAY"],
  };

  // ── Load climate ──────────────────────────────────────────────────────────
  const loadClimate = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      try {
        // Try cache first (TTL 24h) — invalidate if location changed
        if (!isRefresh) {
          const cached = await Storage.get(KEYS.CLIMATE_CACHE);
          const locationMatch =
            cached?.lat === location.lat && cached?.lon === location.lon;
          if (
            cached &&
            locationMatch &&
            Date.now() - cached.timestamp < CLIMATE_CACHE_TTL
          ) {
            setClimate(cached.data);
            setLoading(false);
            setRefreshing(false);
            return;
          }
        }

        const res = await getClimatology(location.lat, location.lon);
        const p = res.properties.parameter;
        const seasonMonths =
          SEASON_MONTHS[season] ??
          Object.keys(p.T2M).filter((m) => m !== "ANN");

        const avg = (param) =>
          seasonMonths.reduce((s, m) => s + (param[m] ?? 0), 0) /
          seasonMonths.length;

        const data = {
          temp: avg(p.T2M),
          rain: avg(p.PRECTOTCORR),
          humidity: avg(p.RH2M),
        };
        setClimate(data);
        await Storage.set(KEYS.CLIMATE_CACHE, {
          data,
          timestamp: Date.now(),
          lat: location.lat,
          lon: location.lon,
        });
      } catch (e) {
        // Keep stale cache if available
        const cached = await Storage.get(KEYS.CLIMATE_CACHE);
        if (cached) setClimate(cached.data);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [location, season],
  );

  useEffect(() => {
    loadClimate();
  }, [loadClimate]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClimate(true);
    refreshCrops();
  };

  // ── Rank crops (API data drives this) ─────────────────────────────────────
  const ranked = useMemo(() => {
    if (!climate || cropList.length === 0) return [];
    return rankCrops(cropList, climate, season);
  }, [climate, cropList, season]);

  const filtered = useMemo(() => {
    if (filter === "all") return ranked;
    if (filter === "excellent") return ranked.filter((r) => r.score >= 80);
    if (filter === "good") return ranked.filter((r) => r.score >= 65);
    if (filter === "moderate") return ranked.filter((r) => r.score >= 50);
    return ranked;
  }, [ranked, filter]);

  // ── Add a crop from recommendations ──────────────────────────────────────
  function handleQuickAdd(crop) {
    navigation.navigate("AddCrop", { preselected: crop.cropId });
  }

  function isAdded(cropId) {
    return userCrops.some(
      (c) => c.cropId === cropId && c.cropStatus === "active",
    );
  }

  // ── Loading state — wait for both climate AND crop catalogue ─────────────
  if (loading || cropsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingTxt, { color: theme.subtext }]}>
          {cropsLoading ? "Loading crop catalogue…" : "Analysing climate data…"}
        </Text>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AppHeader title={t("crops")} subtitle={`📍 ${location.city}`} />

      {/* Tabs */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.card, borderBottomColor: theme.border },
        ]}
      >
        {[
          { key: "recs", label: "Recommendations" },
          { key: "mine", label: `My Crops (${activeCrops.length})` },
        ].map((tb) => (
          <TouchableOpacity
            key={tb.key}
            style={[
              styles.tabItem,
              tab === tb.key && {
                borderBottomColor: theme.primary,
                borderBottomWidth: 2.5,
              },
            ]}
            onPress={() => setTab(tb.key)}
          >
            <Text
              style={[
                styles.tabTxt,
                { color: tab === tb.key ? theme.primary : theme.subtext },
              ]}
            >
              {tb.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* Climate card (always visible) */}
        {climate && (
          <ClimateCard
            climate={climate}
            season={season}
            city={location.city}
            theme={theme}
            styles={styles}
          />
        )}

        {/* ── Recommendations tab ──────────────────────────────────── */}
        {tab === "recs" && (
          <>
            {/* Filter bar */}
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              {FILTERS.map((f) => (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.filterChip,
                    {
                      borderColor:
                        filter === f.key ? theme.primary : theme.border,
                      backgroundColor:
                        filter === f.key ? theme.primary + "14" : theme.card,
                    },
                  ]}
                  onPress={() => setFilter(f.key)}
                >
                  <Text
                    style={[
                      styles.filterTxt,
                      {
                        color: filter === f.key ? theme.primary : theme.subtext,
                      },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                {filtered.length} crops ranked for {location.city}
              </Text>
            </View>

            {filtered.map((item) => (
              <RecommendationCard
                key={item.crop.cropId}
                item={item}
                onAdd={handleQuickAdd}
                alreadyAdded={isAdded(item.crop.cropId)}
                theme={theme}
              />
            ))}
          </>
        )}

        {/* ── My Crops tab ─────────────────────────────────────────── */}
        {tab === "mine" && (
          <>
            <MyCropStrip
              activeCrops={activeCrops}
              cropList={cropList}
              onViewAll={() => navigation.navigate("MyCrops")}
              onAdd={() => navigation.navigate("AddCrop")}
              theme={theme}
            />

            {activeCrops.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.viewAllBtn,
                  {
                    borderColor: theme.primary,
                    backgroundColor: theme.primary + "10",
                  },
                ]}
                onPress={() => navigation.navigate("MyCrops")}
              >
                <Text style={[styles.viewAllTxt, { color: theme.primary }]}>
                  Manage All Crops →
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {/* FAB — always visible */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate("AddCrop")}
        activeOpacity={0.85}
      >
        <Text style={styles.fabTxt}>+ Add Crop</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    loadingTxt: { marginTop: 12, fontSize: 14 },

    tabBar: { flexDirection: "row", borderBottomWidth: 1 },
    tabItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 2.5,
      borderBottomColor: "transparent",
    },
    tabTxt: { fontSize: 13, fontWeight: "700" },

    scroll: { paddingHorizontal: 16, paddingBottom: 100 },

    // Climate card
    climateCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      marginVertical: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    climateCardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      marginBottom: 14,
    },
    climateTitle: { fontSize: 14, fontWeight: "800", color: theme.text },
    climateCity: { fontSize: 12, marginTop: 2 },
    seasonBadge: {
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    seasonBadgeTxt: { fontSize: 12, fontWeight: "700" },
    climateRow: { flexDirection: "row", alignItems: "center" },
    climateDivider: { width: 1, height: 48 },

    // Filter
    filterScroll: { marginBottom: 12 },
    filterChip: {
      borderWidth: 1.5,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
      marginRight: 8,
    },
    filterTxt: { fontSize: 13, fontWeight: "600" },

    section: { marginBottom: 10 },
    sectionTitle: { fontSize: 13, fontWeight: "600" },

    viewAllBtn: {
      borderWidth: 1.5,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 12,
    },
    viewAllTxt: { fontSize: 15, fontWeight: "700" },

    fab: {
      position: "absolute",
      bottom: 20,
      right: 16,
      left: 16,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: "center",
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    fabTxt: { fontSize: 16, fontWeight: "900", color: "#fff" },
  });
}
