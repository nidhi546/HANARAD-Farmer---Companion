/**
 * NEARBY STORES SCREEN
 * ─────────────────────────────────────────────────────────────────
 * Free API : Overpass API  (OpenStreetMap)
 * Cost     : 100% FREE — no API key, no registration ever
 * ─────────────────────────────────────────────────────────────────
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking, RefreshControl,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import { useLocation } from '../context/LocationContext';
import AppHeader       from '../components/AppHeader';
import { getNearbyStores } from '../api/storesApi';

const RADIUS_OPTIONS = [
  { label: '5 km',  value: 5000  },
  { label: '10 km', value: 10000 },
  { label: '20 km', value: 20000 },
  { label: '50 km', value: 50000 },
];

function makeStyles(theme) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: theme.background },
    center:      { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
    loadingText: { marginTop: 12, fontSize: 14, color: theme.subtext },

    // Free badge
    freeBadge: {
      flexDirection: 'row', alignItems: 'center',
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: '#EEF2FF', borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    freeBadgeText: { fontSize: 12, fontWeight: '600', color: '#4338CA', flex: 1 },

    // Radius selector
    sectionTitle: {
      fontSize: 13, fontWeight: '700', color: theme.subtext,
      letterSpacing: 0.8, marginHorizontal: 16, marginTop: 16, marginBottom: 8,
    },
    radiusRow: {
      flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 4,
    },
    radiusBtn: {
      paddingHorizontal: 16, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1.5,
      borderColor: theme.border, backgroundColor: theme.card,
    },
    radiusBtnActive: { borderColor: theme.primary, backgroundColor: theme.light },
    radiusBtnText:   { fontSize: 13, fontWeight: '600', color: theme.subtext },
    radiusBtnTextActive: { color: theme.primary },

    // Count
    countText: {
      fontSize: 12, color: theme.subtext, fontWeight: '500',
      marginHorizontal: 16, marginBottom: 10,
    },

    // Store card
    storeCard: {
      backgroundColor: theme.card, marginHorizontal: 16,
      marginBottom: 10, borderRadius: 16, padding: 14,
      flexDirection: 'row', alignItems: 'flex-start',
      borderWidth: 1, borderColor: theme.border,
    },
    storeIconBox: {
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: theme.light,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    storeIcon:     { fontSize: 22 },
    storeInfo:     { flex: 1 },
    storeName:     { fontSize: 15, fontWeight: '700', color: theme.text },
    storeType:     { fontSize: 12, color: theme.subtext, marginTop: 2 },
    storeAddress:  { fontSize: 11, color: theme.subtext, marginTop: 4, lineHeight: 16 },
    storeDistance: {
      fontSize: 13, fontWeight: '800', color: theme.primary,
      alignSelf: 'flex-start', marginLeft: 8,
    },

    // Action buttons
    storeActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
    storeBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 9, borderRadius: 10, borderWidth: 1,
    },
    storeBtnText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },

    // Empty / error state
    emptyBox:  { alignItems: 'center', paddingVertical: 60 },
    emptyEmoji:{ fontSize: 56, marginBottom: 16 },
    emptyTitle:{ fontSize: 18, fontWeight: '800', color: theme.text, marginBottom: 8 },
    emptyText: { fontSize: 13, color: theme.subtext, textAlign: 'center', lineHeight: 20, paddingHorizontal: 24 },

    // Tip card
    tipCard: {
      backgroundColor: theme.card, margin: 16, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: theme.border,
    },
    tipTitle: { fontSize: 13, fontWeight: '700', color: theme.text, marginBottom: 6 },
    tipText:  { fontSize: 12, color: theme.subtext, lineHeight: 18 },

    bottomPad: { height: 32 },
  });
}

function openMaps(lat, lon, name) {
  const label = encodeURIComponent(name);
  Linking.openURL(`https://maps.google.com/?q=${lat},${lon}&label=${label}`);
}

export default function NearbyStoresScreen() {
  const { t }         = useLanguage();
  const { theme }     = useTheme();
  const { location }  = useLocation();
  const styles        = useMemo(() => makeStyles(theme), [theme]);

  const [stores, setStores]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState(null);
  const [radius, setRadius]         = useState(15000);

  useEffect(() => { load(); }, [location, radius]);

  const load = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError(null);
    try {
      const data = await getNearbyStores(location.lat, location.lon, radius);
      setStores(data);
    } catch (e) {
      console.log(e);
      setError('Could not fetch stores. Check your internet and try again.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [location, radius]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Searching nearby stores…</Text>
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
      <AppHeader title="Nearby Stores" subtitle={`📍 ${location.city}`} />

      {/* Free badge */}
      <View style={styles.freeBadge}>
        <Text style={styles.freeBadgeText}>
          🟢 Overpass / OpenStreetMap — 100% free, no API key needed
        </Text>
      </View>

      {/* Radius selector */}
      <Text style={styles.sectionTitle}>SEARCH RADIUS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map(r => (
            <TouchableOpacity
              key={r.value}
              style={[styles.radiusBtn, radius === r.value && styles.radiusBtnActive]}
              onPress={() => setRadius(r.value)}
            >
              <Text style={[styles.radiusBtnText, radius === r.value && styles.radiusBtnTextActive]}>
                {r.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Error */}
      {error ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>⚠️</Text>
          <Text style={styles.emptyTitle}>Connection Error</Text>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : stores.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyTitle}>No stores found</Text>
          <Text style={styles.emptyText}>
            No agricultural stores are mapped on OpenStreetMap within {radius / 1000} km.
            Try increasing the radius, or contribute stores at openstreetmap.org.
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.countText}>
            {stores.length} store{stores.length !== 1 ? 's' : ''} found within {radius / 1000} km
          </Text>

          {stores.map((store, i) => (
            <View key={store.id || i} style={styles.storeCard}>
              <View style={styles.storeIconBox}>
                <Text style={styles.storeIcon}>{store.icon}</Text>
              </View>
              <View style={styles.storeInfo}>
                <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
                <Text style={styles.storeType}>{store.type}</Text>
                {store.address ? (
                  <Text style={styles.storeAddress} numberOfLines={2}>{store.address}</Text>
                ) : null}
                <View style={styles.storeActions}>
                  <TouchableOpacity
                    style={[styles.storeBtn, { borderColor: theme.primary, backgroundColor: theme.light }]}
                    onPress={() => openMaps(store.lat, store.lon, store.name)}
                    activeOpacity={0.8}
                  >
                    <Text>🗺️</Text>
                    <Text style={[styles.storeBtnText, { color: theme.primary }]}>Maps</Text>
                  </TouchableOpacity>
                  {store.phone && (
                    <TouchableOpacity
                      style={[styles.storeBtn, { borderColor: theme.secondary, backgroundColor: theme.light }]}
                      onPress={() => Linking.openURL(`tel:${store.phone}`)}
                      activeOpacity={0.8}
                    >
                      <Text>📞</Text>
                      <Text style={[styles.storeBtnText, { color: theme.secondary }]}>Call</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <Text style={styles.storeDistance}>
                {store.distance < 1
                  ? `${(store.distance * 1000).toFixed(0)}m`
                  : `${store.distance.toFixed(1)}km`}
              </Text>
            </View>
          ))}
        </>
      )}

      {/* Tip card */}
      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Can't find your local store?</Text>
        <Text style={styles.tipText}>
          Help other farmers by adding your nearest agri shop to OpenStreetMap (openstreetmap.org) — it's free and benefits the whole community.
        </Text>
      </View>

      <View style={styles.bottomPad} />
    </ScrollView>
  );
}
