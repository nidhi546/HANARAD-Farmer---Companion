/**
 * SavedFarmsScreen — My Farms list with soft-delete.
 *
 * Delete flow:
 *   1. User taps Delete → confirmation Alert
 *   2. Optimistic update: farm removed from UI + AsyncStorage instantly
 *   3. API call: SUBMIT_DATA { docId, body: { farmStatus:'deleted' } }
 *   4. If API fails → rollback UI + cache, show error toast
 *   5. If API succeeds → show success toast
 *
 * State:
 *   farms          – active farm list
 *   loading        – initial load indicator
 *   refreshing     – pull-to-refresh indicator
 *   deletingFarmId – id of the farm currently being deleted (per-card spinner)
 *   toast          – { message, type } | null
 */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useFocusEffect }      from '@react-navigation/native';
import { useSafeAreaInsets }   from 'react-native-safe-area-context';
import { useTheme }            from '../context/ThemeContext';
import { useLanguage }         from '../context/LanguageContext';
import { useAuth }             from '../context/AuthContext';
import { Storage, KEYS }       from '../utils/storage';
import {
  getUserFarmsApi,
  deleteFarmApi,
  normaliseApiFarm,
} from '../api/farmApi';

// ── Date formatter ────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [toast]);

  if (!toast) return null;
  const bg = toast.type === 'error' ? '#EF4444' : '#10B981';

  return (
    <Animated.View style={[toastStyles.wrap, { backgroundColor: bg, opacity }]}>
      <Text style={toastStyles.icon}>{toast.type === 'error' ? '✕' : '✓'}</Text>
      <Text style={toastStyles.msg}>{toast.message}</Text>
    </Animated.View>
  );
}
const toastStyles = StyleSheet.create({
  wrap: {
    position: 'absolute', bottom: 32, left: 24, right: 24,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 8,
    zIndex: 999,
  },
  icon: { fontSize: 15, color: '#fff', fontWeight: '900' },
  msg:  { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Farm Card
// ─────────────────────────────────────────────────────────────────────────────
function FarmCard({ farm, theme, t, onDelete, onView, isDeleting }) {
  const methodIcon  = farm.method === 'walk' ? '🚶' : '✏️';
  const methodLabel = farm.method === 'walk' ? t('walkBorder') : t('drawFarm');

  return (
    <View style={[
      cardStyles.card,
      { backgroundColor: theme.card, borderColor: theme.border, opacity: isDeleting ? 0.55 : 1 },
    ]}>

      {/* Header row */}
      <View style={cardStyles.headerRow}>
        <View style={cardStyles.iconCircle}>
          <Text style={cardStyles.iconEmoji}>🌾</Text>
        </View>
        <View style={cardStyles.info}>
          <View style={cardStyles.nameRow}>
            <Text style={[cardStyles.name, { color: theme.text }]} numberOfLines={1}>
              {farm.name}
            </Text>
            {farm.warningDetected && (
              <View style={cardStyles.warnBadge}>
                <Text style={cardStyles.warnTxt}>⚠</Text>
              </View>
            )}
          </View>
          {farm.village ? (
            <Text style={[cardStyles.sub, { color: theme.subtext }]}>📍 {farm.village}</Text>
          ) : null}
        </View>
        <View style={[
          cardStyles.methodBadge,
          { backgroundColor: farm.method === 'walk' ? '#ECFDF5' : '#EEF2FF' },
        ]}>
          <Text style={cardStyles.methodIcon}>{methodIcon}</Text>
          <Text style={[cardStyles.methodLabel, { color: farm.method === 'walk' ? '#10B981' : '#4F46E5' }]}>
            {methodLabel}
          </Text>
        </View>
      </View>

      {/* Area pills */}
      {farm.area && (
        <View style={cardStyles.pillRow}>
          <View style={[cardStyles.pill, { backgroundColor: '#EEF2FF' }]}>
            <Text style={cardStyles.pillVal}>{farm.area.acres}</Text>
            <Text style={cardStyles.pillUnit}> {t('acres')}</Text>
          </View>
          <View style={[cardStyles.pill, { backgroundColor: '#FFF7ED' }]}>
            <Text style={[cardStyles.pillVal, { color: '#F97316' }]}>{farm.area.sqFt}</Text>
            <Text style={cardStyles.pillUnit}> sq ft</Text>
          </View>
          <View style={[cardStyles.pill, { backgroundColor: '#ECFDF5' }]}>
            <Text style={[cardStyles.pillVal, { color: '#10B981' }]}>{farm.area.bigha}</Text>
            <Text style={cardStyles.pillUnit}> {t('bigha')}</Text>
          </View>
        </View>
      )}

      {/* Meta row */}
      <View style={cardStyles.metaRow}>
        {farm.crop ? (
          <View style={cardStyles.metaChip}>
            <Text style={cardStyles.metaIcon}>🌱</Text>
            <Text style={[cardStyles.metaText, { color: theme.subtext }]}>{farm.crop}</Text>
          </View>
        ) : null}
        <View style={cardStyles.metaChip}>
          <Text style={cardStyles.metaIcon}>📅</Text>
          <Text style={[cardStyles.metaText, { color: theme.subtext }]}>{formatDate(farm.savedAt)}</Text>
        </View>
        {farm.area?.perimeterM ? (
          <View style={cardStyles.metaChip}>
            <Text style={cardStyles.metaIcon}>📏</Text>
            <Text style={[cardStyles.metaText, { color: theme.subtext }]}>{farm.area.perimeterM}m</Text>
          </View>
        ) : null}
      </View>

      {/* Action buttons */}
      <View style={cardStyles.actionRow}>
        <TouchableOpacity
          style={[cardStyles.actionBtn, { backgroundColor: '#EEF2FF' }]}
          onPress={() => onView(farm)}
          disabled={isDeleting}
        >
          <Text style={[cardStyles.actionBtnTxt, { color: '#4F46E5' }]}>🗺️ {t('viewFarm')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            cardStyles.actionBtn,
            { backgroundColor: isDeleting ? '#F9FAFB' : '#FFF1F2' },
          ]}
          onPress={() => onDelete(farm)}
          disabled={isDeleting}
          activeOpacity={0.75}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Text style={[cardStyles.actionBtnTxt, { color: '#EF4444' }]}>🗑️ {t('delete')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card:        { borderRadius: 20, borderWidth: 1, padding: 16, marginHorizontal: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle:  { width: 48, height: 48, borderRadius: 16, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconEmoji:   { fontSize: 26 },
  info:        { flex: 1 },
  nameRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  name:        { fontSize: 17, fontWeight: '800', flexShrink: 1 },
  warnBadge:   { backgroundColor: '#FEF3C7', borderRadius: 8, paddingHorizontal: 5, paddingVertical: 2 },
  warnTxt:     { fontSize: 12, color: '#D97706' },
  sub:         { fontSize: 12, fontWeight: '500' },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  methodIcon:  { fontSize: 13 },
  methodLabel: { fontSize: 11, fontWeight: '700' },
  pillRow:     { flexDirection: 'row', gap: 8, marginBottom: 10 },
  pill:        { flexDirection: 'row', alignItems: 'baseline', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  pillVal:     { fontSize: 15, fontWeight: '900', color: '#4F46E5' },
  pillUnit:    { fontSize: 10, color: '#888', fontWeight: '600' },
  metaRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  metaChip:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F9FAFB', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  metaIcon:    { fontSize: 12 },
  metaText:    { fontSize: 11, fontWeight: '600' },
  actionRow:   { flexDirection: 'row', gap: 10 },
  actionBtn:   { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
  actionBtnTxt:{ fontSize: 13, fontWeight: '800' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
export default function SavedFarmsScreen({ navigation }) {
  const insets    = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t }     = useLanguage();
  const { user }  = useAuth();

  const [farms,          setFarms]          = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);
  const [deletingFarmId, setDeletingFarmId] = useState(null);
  const [toast,          setToast]          = useState(null);

  // ── Toast helper ──────────────────────────────────────────────────────────
  const toastTimer = useRef(null);

  function showToast(message, type = 'success') {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  // ── Summary stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!farms.length) return null;
    const totalAcres = farms.reduce((s, f) => s + parseFloat(f.area?.acres ?? 0), 0);
    return { count: farms.length, totalAcres: totalAcres.toFixed(2) };
  }, [farms]);

  // ── Load active farms ─────────────────────────────────────────────────────
  const loadFarms = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      if (user?.id) {
        const apiFarms   = await getUserFarmsApi(user.id);
        // API already filters farmStatus != 'deleted' via the GET_DATA filter
        const normalised = apiFarms.map(normaliseApiFarm);
        setFarms(normalised);
        await Storage.set(KEYS.SAVED_FARMS, normalised);
        return;
      }
    } catch (err) {
      console.warn('[SavedFarms] API load failed, using cache:', err.message);
    } finally {
      setLoading(false);
    }
    // Fallback: AsyncStorage cache — filter active farms client-side
    const cached = (await Storage.get(KEYS.SAVED_FARMS)) ?? [];
    setFarms(cached.filter(f => f.farmStatus !== 'deleted'));
  }, [user?.id]);

  useFocusEffect(useCallback(() => { loadFarms(); }, [loadFarms]));

  async function onRefresh() {
    setRefreshing(true);
    await loadFarms(false);
    setRefreshing(false);
  }

  // ── Delete: confirmation → optimistic remove → API soft-delete → rollback ─
  function handleDelete(farm) {
    Alert.alert(
      'Delete Farm',
      `Are you sure you want to delete "${farm.name}"?\n\nThis action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text:    'Delete',
          style:   'destructive',
          onPress: () => performDelete(farm),
        },
      ],
    );
  }

  async function performDelete(farm) {
    const docId    = farm.docId ?? farm.id;  // docId is MongoDB _id
    const snapshot = farms;                  // keep for rollback

    // 1 — Set per-card loading spinner
    setDeletingFarmId(farm.id);

    // 2 — Optimistic: remove from UI + cache immediately
    const updated = farms.filter(f => f.id !== farm.id);
    setFarms(updated);
    await Storage.set(KEYS.SAVED_FARMS, updated);

    try {
      // 3 — API: SUBMIT_DATA { docId, body: { farmStatus:'deleted', updatedAt } }
      await deleteFarmApi(docId);
      showToast('Farm deleted successfully');
    } catch (err) {
      // 4 — Rollback on failure
      setFarms(snapshot);
      await Storage.set(KEYS.SAVED_FARMS, snapshot);
      showToast(
        err.message || 'Could not delete farm. Please try again.',
        'error',
      );
    } finally {
      setDeletingFarmId(null);
    }
  }

  function viewFarm(farm) {
    navigation.navigate('FarmMap', { viewFarm: farm });
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  function EmptyState() {
    return (
      <View style={emptyStyles.wrap}>
        <Text style={emptyStyles.emoji}>🌾</Text>
        <Text style={[emptyStyles.title, { color: theme.text }]}>{t('noFarmsYet')}</Text>
        <Text style={[emptyStyles.sub,   { color: theme.subtext }]}>{t('noFarmsYetSub')}</Text>
        <TouchableOpacity
          style={[emptyStyles.btn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('FarmMap')}
        >
          <Text style={emptyStyles.btnTxt}>✏️ {t('drawFirstFarm')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── FlatList header (stats banner) ────────────────────────────────────────
  function ListHeader() {
    if (!stats) return null;
    return (
      <View style={[statStyles.banner, { backgroundColor: theme.primary }]}>
        <View style={statStyles.stat}>
          <Text style={statStyles.val}>{stats.count}</Text>
          <Text style={statStyles.lbl}>{t('totalFarms')}</Text>
        </View>
        <View style={statStyles.divider} />
        <View style={statStyles.stat}>
          <Text style={statStyles.val}>{stats.totalAcres}</Text>
          <Text style={statStyles.lbl}>{t('totalAcres')}</Text>
        </View>
      </View>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>

      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10, backgroundColor: theme.primary }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.topTitle}>{t('myFarms')}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('FarmMap')}
        >
          <Text style={styles.addBtnTxt}>+ {t('addFarm')}</Text>
        </TouchableOpacity>
      </View>

      {/* Initial load spinner */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingTxt, { color: theme.subtext }]}>Loading farms…</Text>
        </View>
      ) : (
        <FlatList
          data={farms}
          keyExtractor={f => f.id}
          contentContainerStyle={[styles.list, !farms.length && styles.listEmpty]}
          ListHeaderComponent={<ListHeader />}
          ListEmptyComponent={<EmptyState />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
          renderItem={({ item }) => (
            <FarmCard
              farm={item}
              theme={theme}
              t={t}
              onDelete={handleDelete}
              onView={viewFarm}
              isDeleting={deletingFarmId === item.id}
            />
          )}
        />
      )}

      {/* Toast notification */}
      <Toast toast={toast} />

    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 },
  backBtn:   { width: 36, alignItems: 'flex-start' },
  backTxt:   { fontSize: 28, color: '#fff', fontWeight: '300' },
  topTitle:  { flex: 1, fontSize: 18, fontWeight: '900', color: '#fff', textAlign: 'center' },
  addBtn:    { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7 },
  addBtnTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt:  { fontSize: 14, fontWeight: '600' },

  list:      { paddingTop: 16, paddingBottom: 40 },
  listEmpty: { flexGrow: 1 },
});

const emptyStyles = StyleSheet.create({
  wrap:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: 60 },
  emoji:  { fontSize: 72, marginBottom: 20 },
  title:  { fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 10 },
  sub:    { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  btn:    { borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
  btnTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },
});

const statStyles = StyleSheet.create({
  banner:  { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 20, gap: 20 },
  stat:    { flex: 1, alignItems: 'center' },
  val:     { fontSize: 28, fontWeight: '900', color: '#fff' },
  lbl:     { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '600' },
  divider: { width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
});
