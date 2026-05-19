/**
 * MyCropsScreen — User's crop list with Active / Harvested tabs.
 *
 * Data source: API only (getUserCropsApi) — no local cache or dummy data.
 * Auto-refreshes via useFocusEffect every time the screen comes into focus
 * (picks up crops just added in AddCropScreen without manual reload).
 *
 * Mark as Harvested:
 *  1. Optimistic: move card to Harvested tab immediately in local state
 *  2. Call updateUserCropApi(crop._id, { cropStatus: 'harvested' })
 *     → API updates the EXISTING record (docId = crop._id), no new record created
 *  3. On failure: rollback by re-fetching from API
 */
import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, StatusBar,
} from 'react-native';
import { SafeAreaView }                   from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect }  from '@react-navigation/native';
import { useAuth }                        from '../context/AuthContext';
import { useTheme }                       from '../context/ThemeContext';
import { CROP_STATUS }                    from '../constants/cropMaster';
import AppHeader                          from '../components/AppHeader';
import {
  getUserCropsApi, updateUserCropApi, deleteUserCropApi,
} from '../api/cropApi';

// ─────────────────────────────────────────────────────────────────────────────
// STAGE COLOR MAP
// ─────────────────────────────────────────────────────────────────────────────

const STAGE_COLORS = {
  seedling:   { bg: '#FEF9C3', text: '#A16207' },
  vegetative: { bg: '#DCFCE7', text: '#15803D' },
  flowering:  { bg: '#FCE7F3', text: '#BE185D' },
  fruiting:   { bg: '#FEE2E2', text: '#B91C1C' },
  ripening:   { bg: '#FEF3C7', text: '#B45309' },
  harvested:  { bg: '#DCFCE7', text: '#15803D' },
};

// ─────────────────────────────────────────────────────────────────────────────
// CROP CARD
// ─────────────────────────────────────────────────────────────────────────────

function CropCard({ item, onMarkHarvested, onDelete, isUpdating, theme }) {
  const isHarvested = item.cropStatus === CROP_STATUS.HARVESTED;
  const icon        = item.cropIcon || '🌱';
  // _id is the real database identifier returned by the API
  const cropId      = item._id || item.docId;

  const stageKey   = (item.currentStage || '').toLowerCase();
  const stageLabel = stageKey ? stageKey.charAt(0).toUpperCase() + stageKey.slice(1) : null;
  const stageColor = STAGE_COLORS[stageKey] || { bg: theme.primary + '1A', text: theme.primary };

  function confirmDelete() {
    Alert.alert(
      'Delete Crop?',
      `Remove "${item.cropName}" from your list? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(cropId) },
      ],
    );
  }

  function confirmHarvest() {
    Alert.alert(
      'Mark as Harvested?',
      `Move "${item.cropName}" to the Harvested tab?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Harvest', onPress: () => onMarkHarvested(cropId) },
      ],
    );
  }

  return (
    <View
      style={[
        card.root,
        { backgroundColor: theme.card, borderLeftColor: isHarvested ? '#22C55E' : theme.primary },
      ]}
    >
      {/* ── Top row: icon + info + delete ── */}
      <View style={card.topRow}>
        <View style={[card.iconWrap, { backgroundColor: theme.primary + '15' }]}>
          <Text style={card.icon}>{icon}</Text>
        </View>

        <View style={{ flex: 1 }}>
          {/* Name + harvested badge */}
          <View style={card.nameRow}>
            <Text style={[card.name, { color: theme.text }]} numberOfLines={1}>
              {item.cropName}
            </Text>
            {isHarvested && (
              <View style={card.harvestedBadge}>
                <Text style={card.harvestedBadgeTxt}>✓ Harvested</Text>
              </View>
            )}
          </View>

          {/* Season · land area */}
          {(item.cropSeason || item.landArea) ? (
            <Text style={[card.metaTxt, { color: theme.subtext }]}>
              {[
                item.cropSeason,
                item.landArea ? `${item.landArea} ${item.landUnit || 'acre'}` : null,
              ].filter(Boolean).join('  ·  ')}
            </Text>
          ) : null}

          {/* Stage pill + sowing date */}
          <View style={card.pillRow}>
            {stageLabel ? (
              <View style={[card.stagePill, { backgroundColor: stageColor.bg }]}>
                <Text style={[card.stageTxt, { color: stageColor.text }]}>{stageLabel}</Text>
              </View>
            ) : null}
            {item.sowingDate ? (
              <Text style={[card.sowTxt, { color: theme.subtext }]}>Sown: {item.sowingDate}</Text>
            ) : null}
          </View>
        </View>

        {/* Delete ✕ */}
        <TouchableOpacity
          style={card.deleteBtn}
          onPress={confirmDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[card.deleteTxt, { color: theme.subtext + '70' }]}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ── Mark as Harvested — active crops only ── */}
      {!isHarvested && (
        <TouchableOpacity
          style={[card.harvestBtn, { opacity: isUpdating ? 0.5 : 1 }]}
          onPress={confirmHarvest}
          disabled={isUpdating}
          activeOpacity={0.75}
        >
          {isUpdating
            ? <ActivityIndicator size="small" color="#22C55E" />
            : <Text style={card.harvestBtnTxt}>🌾  Mark as Harvested</Text>
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

const card = StyleSheet.create({
  root: {
    borderRadius: 16, marginBottom: 12, padding: 14, borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 3,
  },
  topRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  iconWrap: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 },
  icon:     { fontSize: 26 },
  nameRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' },
  name:     { fontSize: 16, fontWeight: '800', flex: 1, marginRight: 6 },
  metaTxt:  { fontSize: 12, fontWeight: '500', marginBottom: 6 },
  pillRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stagePill:{ borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  stageTxt: { fontSize: 11, fontWeight: '700' },
  sowTxt:   { fontSize: 12 },
  deleteBtn:{ paddingLeft: 8, paddingTop: 2 },
  deleteTxt:{ fontSize: 16, fontWeight: '700' },
  harvestedBadge:    { backgroundColor: '#DCFCE7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  harvestedBadgeTxt: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  harvestBtn:    { marginTop: 12, borderWidth: 1.5, borderColor: '#22C55E', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  harvestBtnTxt: { fontSize: 13, fontWeight: '700', color: '#22C55E' },
});

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────

function EmptyState({ tab, onAdd, theme }) {
  return (
    <View style={es.wrap}>
      <Text style={es.emoji}>{tab === 'active' ? '🌱' : '🌾'}</Text>
      <Text style={[es.title, { color: theme.text }]}>
        {tab === 'active' ? 'No active crops yet' : 'No harvested crops'}
      </Text>
      <Text style={[es.sub, { color: theme.subtext }]}>
        {tab === 'active'
          ? 'Start tracking your crops, sowing dates, and growth stages.'
          : 'Crops you mark as harvested will appear here.'}
      </Text>
      {tab === 'active' && (
        <TouchableOpacity style={[es.btn, { backgroundColor: theme.primary }]} onPress={onAdd}>
          <Text style={es.btnTxt}>+ Add First Crop</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const es = StyleSheet.create({
  wrap:   { alignItems: 'center', paddingVertical: 64, paddingHorizontal: 32 },
  emoji:  { fontSize: 64, marginBottom: 16 },
  title:  { fontSize: 20, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  sub:    { fontSize: 14, textAlign: 'center', lineHeight: 22, opacity: 0.7 },
  btn:    { marginTop: 24, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  btnTxt: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

// ─────────────────────────────────────────────────────────────────────────────
// SCREEN
// ─────────────────────────────────────────────────────────────────────────────

export default function MyCropsScreen() {
  const navigation = useNavigation();
  const { theme }  = useTheme();
  const { user }   = useAuth();
  const styles     = useMemo(() => makeStyles(theme), [theme]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [crops,          setCrops]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [refreshing,     setRefreshing]     = useState(false);
  const [updatingCropId, setUpdatingCropId] = useState(null);
  const [tab,            setTab]            = useState('active');

  // ── Derived lists from API data ────────────────────────────────────────────
  const activeCrops    = useMemo(() => crops.filter(c => c.cropStatus === CROP_STATUS.ACTIVE),    [crops]);
  const harvestedCrops = useMemo(() => crops.filter(c => c.cropStatus === CROP_STATUS.HARVESTED), [crops]);
  const displayList    = tab === 'active' ? activeCrops : harvestedCrops;

  // ── Fetch all crops for this user from API ─────────────────────────────────
  const fetchCrops = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await getUserCropsApi(user.id);
      setCrops(Array.isArray(data) ? data : []);
    } catch {
      Alert.alert('Error', 'Could not load crops. Please try again.');
    }
  }, [user?.id]);

  // ── Auto-refresh every time this screen comes into focus ──────────────────
  // Ensures newly added crops from AddCropScreen appear without manual refresh
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchCrops().finally(() => setLoading(false));
    }, [fetchCrops]),
  );

  // ── Pull-to-refresh ────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCrops();
    setRefreshing(false);
  }, [fetchCrops]);

  // ── Mark as Harvested ─────────────────────────────────────────────────────
  // Uses the crop's _id (real DB identifier) to update the EXISTING record.
  // Optimistic: move card to Harvested tab immediately, rollback on failure.
  const handleMarkHarvested = useCallback(async (cropId) => {
    setUpdatingCropId(cropId);

    // Optimistic local update — card moves to Harvested tab right away
    setCrops(prev =>
      prev.map(c =>
        c._id === cropId ? { ...c, cropStatus: CROP_STATUS.HARVESTED } : c,
      ),
    );

    try {
      // Pass _id as docId → API updates existing record, does NOT create new one
      await updateUserCropApi(cropId, { cropStatus: CROP_STATUS.HARVESTED });
    } catch {
      // Rollback: re-fetch real state from API
      Alert.alert('Error', 'Could not update crop. Please try again.');
      await fetchCrops();
    } finally {
      setUpdatingCropId(null);
    }
  }, [fetchCrops]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (cropId) => {
    // Optimistic: remove from list immediately
    setCrops(prev => prev.filter(c => c._id !== cropId));

    try {
      await deleteUserCropApi(cropId);
    } catch {
      Alert.alert('Error', 'Could not delete crop.');
      await fetchCrops(); // rollback
    }
  }, [fetchCrops]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.background} />
      <AppHeader title="My Crops" subtitle={`${activeCrops.length} active`} />

      {/* ── Tab bar ── */}
      <View style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {[
          { key: 'active',    label: 'Active',    count: activeCrops.length    },
          { key: 'harvested', label: 'Harvested', count: harvestedCrops.length },
        ].map(t => {
          const isActive = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[
                styles.tabItem,
                isActive && { borderBottomColor: theme.primary, borderBottomWidth: 2.5 },
              ]}
              onPress={() => setTab(t.key)}
            >
              <View style={styles.tabContent}>
                <Text style={[styles.tabLabel, { color: isActive ? theme.primary : theme.subtext }]}>
                  {t.label}
                </Text>
                <View style={[styles.tabBadge, { backgroundColor: isActive ? theme.primary : theme.border }]}>
                  <Text style={[styles.tabBadgeTxt, { color: isActive ? '#fff' : theme.subtext }]}>
                    {t.count}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── List ── */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingTxt, { color: theme.subtext }]}>Loading crops…</Text>
        </View>
      ) : (
        <FlatList
          data={displayList}
          keyExtractor={(item) => item._id || item.docId}
          renderItem={({ item }) => (
            <CropCard
              item={item}
              onMarkHarvested={handleMarkHarvested}
              onDelete={handleDelete}
              isUpdating={updatingCropId === item._id}
              theme={theme}
            />
          )}
          contentContainerStyle={[
            styles.list,
            displayList.length === 0 && { flex: 1 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              tab={tab}
              onAdd={() => navigation.navigate('AddCrop')}
              theme={theme}
            />
          }
        />
      )}

      {/* ── FAB ── */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('AddCrop')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabTxt}>+ Add Crop</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

function makeStyles(theme) {
  return StyleSheet.create({
    root:       { flex: 1 },
    center:     { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingTxt: { fontSize: 14, fontWeight: '500' },

    tabBar:     { flexDirection: 'row', borderBottomWidth: 1 },
    tabItem:    { flex: 1, alignItems: 'center', paddingVertical: 13, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
    tabContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    tabLabel:   { fontSize: 14, fontWeight: '700' },
    tabBadge:   { borderRadius: 10, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
    tabBadgeTxt:{ fontSize: 12, fontWeight: '800' },

    list: { padding: 16, paddingBottom: 100 },

    fab: {
      position: 'absolute', bottom: 24, right: 20, left: 20,
      borderRadius: 16, paddingVertical: 16, alignItems: 'center',
      shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    fabTxt: { fontSize: 16, fontWeight: '900', color: '#fff' },
  });
}
