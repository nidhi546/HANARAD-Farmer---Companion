/**
 * MANDI SCREEN — Live Market Prices
 * Free API: data.gov.in (AGMARKNET)
 * Falls back to local sample data if key is not yet configured.
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import AppHeader       from '../components/AppHeader';
import { getLivePrices } from '../api/mandiApi';
import { FEATURES }      from '../config/apiKeys';
import Analytics         from '../utils/analytics';

// Commodity emoji map
const CROP_ICON = {
  cotton: '🌿', groundnut: '🥜', castor: '🌾', cumin: '🌱',
  bajra: '🌾', wheat: '🌾', sesame: '🌰', maize: '🌽',
  rice: '🍚', onion: '🧅', garlic: '🧄', potato: '🥔',
  default: '🌾',
};
const getIcon = (name = '') => {
  const key = name.toLowerCase();
  return Object.keys(CROP_ICON).find(k => key.includes(k))
    ? CROP_ICON[Object.keys(CROP_ICON).find(k => key.includes(k))]
    : CROP_ICON.default;
};

// Price trend arrow
const trend = (modal, min) => modal > min ? '▲' : modal < min ? '▼' : '—';
const trendColor = (modal, min, theme) =>
  modal > min ? theme.success : modal < min ? theme.danger : theme.subtext;

function makeStyles(theme) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: theme.background },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
    loadingText: { marginTop: 12, fontSize: 14, color: theme.subtext },

    // Live / fallback badge
    statusBar: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginTop: 12,
      padding: 10, borderRadius: 10,
    },
    statusDot:  { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    statusText: { fontSize: 12, fontWeight: '600', flex: 1 },
    statusHint: { fontSize: 11, color: theme.subtext },

    // Search bar
    searchBar: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: theme.card, borderRadius: 12,
      marginHorizontal: 16, marginTop: 10,
      paddingHorizontal: 14, paddingVertical: 10,
      borderWidth: 1, borderColor: theme.border,
    },
    searchIcon:  { fontSize: 16, marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: theme.text },

    // Filter tabs
    filterRow: {
      flexDirection: 'row', paddingHorizontal: 16,
      marginTop: 12, marginBottom: 4, gap: 8,
    },
    filterTab: {
      paddingHorizontal: 14, paddingVertical: 6,
      borderRadius: 20, borderWidth: 1.5,
      borderColor: theme.border, backgroundColor: theme.card,
    },
    filterTabActive: { backgroundColor: theme.light, borderColor: theme.primary },
    filterTabText:   { fontSize: 13, fontWeight: '600', color: theme.subtext },
    filterTabTextActive: { color: theme.primary },

    // Section header
    sectionHeader: {
      paddingHorizontal: 16, paddingVertical: 8,
      backgroundColor: theme.background,
    },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: theme.subtext, letterSpacing: 0.8 },

    // Price card
    priceCard: {
      backgroundColor: theme.card,
      marginHorizontal: 16, marginBottom: 8,
      borderRadius: 14, padding: 14,
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1, borderColor: theme.border,
    },
    priceIconBox: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: theme.light,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    priceIcon:    { fontSize: 22 },
    priceInfo:    { flex: 1 },
    priceName:    { fontSize: 15, fontWeight: '700', color: theme.text },
    priceMarket:  { fontSize: 11, color: theme.subtext, marginTop: 2 },
    priceDate:    { fontSize: 10, color: theme.subtext, marginTop: 1 },
    priceRight:   { alignItems: 'flex-end' },
    priceModal:   { fontSize: 18, fontWeight: '900', color: theme.text },
    priceUnit:    { fontSize: 10, color: theme.subtext },
    priceRange:   { fontSize: 11, color: theme.subtext, marginTop: 3 },
    priceTrend:   { fontSize: 14, fontWeight: '800', marginTop: 2 },

    // Empty
    emptyBox: {
      alignItems: 'center', paddingVertical: 60,
    },
    emptyEmoji: { fontSize: 48, marginBottom: 12 },
    emptyText:  { fontSize: 14, color: theme.subtext },

    // Setup card
    setupCard: {
      backgroundColor: theme.card, margin: 16,
      borderRadius: 16, padding: 20,
      borderWidth: 1.5, borderColor: theme.primary,
    },
    setupTitle: { fontSize: 16, fontWeight: '800', color: theme.primary, marginBottom: 8 },
    setupStep:  { fontSize: 13, color: theme.text, lineHeight: 22, marginBottom: 4 },
    setupNote:  { fontSize: 12, color: theme.subtext, marginTop: 8, lineHeight: 18 },

    bottomPad: { height: 32 },
  });
}

const MARKETS = ['All', 'Rajkot', 'Ahmedabad', 'Surat', 'Junagadh', 'Amreli'];

export default function MandiScreen() {
  const { t }           = useLanguage();
  const { theme }       = useTheme();
  const { location }    = useLocation();
  const styles          = useMemo(() => makeStyles(theme), [theme]);

  const [prices, setPrices]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch]         = useState('');
  const [activeMarket, setActiveMarket] = useState('All');

  useEffect(() => { loadPrices(); Analytics.logScreenView('MandiScreen'); Analytics.logMandiViewed(); }, []);

  const loadPrices = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getLivePrices('Gujarat');
      setPrices(data);
    } catch (e) { console.log(e); }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadPrices(true); }, []);

  const filtered = useMemo(() => {
    let list = prices;
    if (activeMarket !== 'All') {
      list = list.filter(p =>
        p.market?.toLowerCase().includes(activeMarket.toLowerCase())
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.commodity?.toLowerCase().includes(q) ||
        p.market?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [prices, search, activeMarket]);

  // Group by market
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(p => {
      const key = p.market;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [filtered]);

  const isLive = prices.length > 0 && prices[0]?.isLive;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading market prices…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
          colors={[theme.primary]} tintColor={theme.primary} />
      }
    >
      <AppHeader title="Market Prices" subtitle="Mandi Bhav" />

      {/* Live / Sample badge */}
      <View style={[styles.statusBar, {
        backgroundColor: isLive ? '#ECFDF5' : '#FEF3C7',
      }]}>
        <View style={[styles.statusDot, { backgroundColor: isLive ? theme.success : theme.warning }]} />
        <Text style={[styles.statusText, { color: isLive ? '#065F46' : '#92400E' }]}>
          {isLive ? '🟢 Live data from AGMARKNET' : '🟡 Sample data (Gujarat APMCs)'}
        </Text>
        <Text style={styles.statusHint}>{isLive ? 'Today' : 'Configure API'}</Text>
      </View>

      {/* Setup guide if key not configured */}
      {!FEATURES.LIVE_MANDI_PRICES && (
        <View style={styles.setupCard}>
          <Text style={styles.setupTitle}>🔑 Get FREE Live Prices</Text>
          <Text style={styles.setupStep}>1. Visit data.gov.in/user/register</Text>
          <Text style={styles.setupStep}>2. Register (free, no credit card)</Text>
          <Text style={styles.setupStep}>3. Get your API key</Text>
          <Text style={styles.setupStep}>4. Paste it in src/config/apiKeys.js</Text>
          <Text style={styles.setupNote}>
            Until then, sample Gujarat APMC prices are shown below.
          </Text>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search crop or market…"
          placeholderTextColor={theme.subtext}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Market filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        {MARKETS.map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.filterTab, activeMarket === m && styles.filterTabActive]}
            onPress={() => setActiveMarket(m)}
          >
            <Text style={[styles.filterTabText, activeMarket === m && styles.filterTabTextActive]}>
              {m}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Grouped price list */}
      {Object.keys(grouped).length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      ) : (
        Object.entries(grouped).map(([market, rows]) => (
          <View key={market}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                🏪 {market.toUpperCase()}
              </Text>
            </View>
            {rows.map((p, i) => (
              <View key={i} style={styles.priceCard}>
                <View style={styles.priceIconBox}>
                  <Text style={styles.priceIcon}>{getIcon(p.commodity)}</Text>
                </View>
                <View style={styles.priceInfo}>
                  <Text style={styles.priceName} numberOfLines={1}>
                    {p.commodity} {p.variety && p.variety !== 'Local' ? `(${p.variety})` : ''}
                  </Text>
                  <Text style={styles.priceMarket}>{p.market}</Text>
                  <Text style={styles.priceDate}>{p.date}</Text>
                </View>
                <View style={styles.priceRight}>
                  <Text style={styles.priceModal}>₹{p.modalPrice?.toLocaleString('en-IN')}</Text>
                  <Text style={styles.priceUnit}>/quintal</Text>
                  <Text style={styles.priceRange}>
                    ₹{p.minPrice?.toLocaleString('en-IN')} – ₹{p.maxPrice?.toLocaleString('en-IN')}
                  </Text>
                  <Text style={[styles.priceTrend, { color: trendColor(p.modalPrice, p.minPrice, theme) }]}>
                    {trend(p.modalPrice, p.minPrice)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))
      )}

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}
