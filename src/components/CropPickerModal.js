/**
 * CropPickerModal — full-screen searchable crop selector.
 *
 * UX flow:
 *  1. Opens as a slide-up modal (pageSheet on iOS, full-screen on Android)
 *  2. Search bar at top — debounced API search as user types
 *  3. FlatList of results with infinite scroll (loadMore on end-reached)
 *  4. Pending badge on user's own not-yet-approved submissions
 *  5. Footer: "Add New Crop" CTA — always visible below results
 *  6. Tap any row → onSelect(crop) → modal auto-closes
 *  7. ✕ button or Android back → onClose()
 *
 * Props:
 *   visible         boolean
 *   selectedCropId  string | null
 *   onSelect        (crop: object) => void
 *   onClose         () => void
 *   onAddNew        (prefillQuery: string) => void
 *   theme           ThemeContext value
 */
import React, { useCallback, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCropSearch } from '../hooks/useCropSearch';
import { CATEGORY_ICON } from '../constants/cropMaster';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCropIcon(item) {
  return item.icon || CATEGORY_ICON[item.cropCategory] || '🌱';
}

function formatSeasons(seasons) {
  if (!seasons) return '';
  return Array.isArray(seasons) ? seasons.join(' · ') : seasons;
}

// ── Crop result row ───────────────────────────────────────────────────────────

function CropResultItem({ item, isSelected, onPress, theme }) {
  const icon    = getCropIcon(item);
  const seasons = formatSeasons(item.cropSeason);

  return (
    <TouchableOpacity
      style={[
        itemS.row,
        {
          borderColor:     isSelected ? theme.primary : theme.border,
          backgroundColor: isSelected ? theme.primary + '12' : theme.card,
        },
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.75}
    >
      <View style={[itemS.iconBox, { backgroundColor: isSelected ? theme.primary + '20' : theme.light }]}>
        <Text style={itemS.icon}>{icon}</Text>
      </View>

      <View style={itemS.info}>
        <View style={itemS.nameRow}>
          <Text
            style={[itemS.name, { color: isSelected ? theme.primary : theme.text }]}
            numberOfLines={1}
          >
            {item.cropName}
          </Text>
          {item._isPending && (
            <View style={itemS.pendingBadge}>
              <Text style={itemS.pendingTxt}>Pending</Text>
            </View>
          )}
        </View>
        {item.scientificName ? (
          <Text style={[itemS.scientific, { color: theme.subtext }]} numberOfLines={1}>
            {item.scientificName}
          </Text>
        ) : null}
        {seasons ? (
          <Text style={[itemS.meta, { color: theme.subtext }]}>
            📅 {seasons}
            {item.cropCategory ? `  ·  ${item.cropCategory}` : ''}
          </Text>
        ) : item.cropCategory ? (
          <Text style={[itemS.meta, { color: theme.subtext }]}>{item.cropCategory}</Text>
        ) : null}
      </View>

      {isSelected
        ? <Text style={[itemS.checkmark, { color: theme.primary }]}>✓</Text>
        : <Text style={[itemS.chevron, { color: theme.border }]}>›</Text>}
    </TouchableOpacity>
  );
}

const itemS = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 12, borderRadius: 14, marginBottom: 8, borderWidth: 1.5,
  },
  iconBox: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, flexShrink: 0,
  },
  icon:         { fontSize: 22 },
  info:         { flex: 1 },
  nameRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  name:         { fontSize: 15, fontWeight: '700', flex: 1 },
  scientific:   { fontSize: 12, fontStyle: 'italic', marginBottom: 2 },
  meta:         { fontSize: 12 },
  pendingBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 6, backgroundColor: '#FEF3C7' },
  pendingTxt:   { fontSize: 10, fontWeight: '700', color: '#D97706' },
  checkmark:    { fontSize: 20, fontWeight: '700', marginLeft: 6 },
  chevron:      { fontSize: 22, fontWeight: '300', marginLeft: 6 },
});

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ query, theme }) {
  return (
    <View style={emS.container}>
      <Text style={emS.emoji}>🔍</Text>
      <Text style={[emS.title, { color: theme.text }]}>
        {query.trim() ? `No crops found for "${query}"` : 'No crops yet'}
      </Text>
      <Text style={[emS.sub, { color: theme.subtext }]}>
        Use "Add New Crop" below to submit your crop for review
      </Text>
    </View>
  );
}

const emS = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emoji:     { fontSize: 48, marginBottom: 12 },
  title:     { fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  sub:       { fontSize: 13, textAlign: 'center', lineHeight: 18 },
});

// ── Add-new CTA footer ────────────────────────────────────────────────────────

function AddNewFooter({ query, loadingMore, onPress, theme }) {
  return (
    <>
      {loadingMore && (
        <ActivityIndicator
          color={theme.primary}
          style={{ marginVertical: 12 }}
        />
      )}
      <TouchableOpacity
        style={[footS.btn, { borderColor: theme.primary, backgroundColor: theme.primary + '0D' }]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={footS.plus}>➕</Text>
        <View style={{ flex: 1 }}>
          <Text style={[footS.title, { color: theme.primary }]}>
            {query.trim()
              ? `Add "${query.trim()}" to crop database`
              : "Can't find your crop? Add New"}
          </Text>
          <Text style={[footS.sub, { color: theme.subtext }]}>
            Submit for review · visible to all farmers after approval
          </Text>
        </View>
      </TouchableOpacity>
    </>
  );
}

const footS = StyleSheet.create({
  btn:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 14, marginTop: 6, marginBottom: 20 },
  plus:  { fontSize: 22, marginRight: 12 },
  title: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  sub:   { fontSize: 12, lineHeight: 16 },
});

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function CropPickerModal({
  visible,
  selectedCropId,
  onSelect,
  onClose,
  onAddNew,
  theme,
}) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef(null);

  const {
    query, setQuery,
    results, loading, loadingMore, hasMore,
    loadMore,
  } = useCropSearch();

  const handleSelect = useCallback((crop) => {
    onSelect(crop);
    onClose();
  }, [onSelect, onClose]);

  const handleAddNew = useCallback(() => {
    onClose();
    onAddNew(query.trim());
  }, [onClose, onAddNew, query]);

  const renderItem = useCallback(({ item }) => {
    const id = item.cropId || item._id;
    return (
      <CropResultItem
        item={item}
        isSelected={selectedCropId === id}
        onPress={handleSelect}
        theme={theme}
      />
    );
  }, [selectedCropId, handleSelect, theme]);

  const keyExtractor = useCallback(
    (item) => item.cropId || item._id || item.cropName,
    [],
  );

  const renderFooter = useCallback(() => (
    <AddNewFooter
      query={query}
      loadingMore={loadingMore}
      onPress={handleAddNew}
      theme={theme}
    />
  ), [query, loadingMore, handleAddNew, theme]);

  const renderEmpty = useCallback(() => {
    if (loading) return null;
    return <EmptyState query={query} theme={theme} />;
  }, [loading, query, theme]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
      onShow={() => setTimeout(() => inputRef.current?.focus(), 100)}
    >
      <View style={[s.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={[s.header, { borderBottomColor: theme.border }]}>
          <View>
            <Text style={[s.headerTitle, { color: theme.text }]}>Select Crop</Text>
            <Text style={[s.headerSub, { color: theme.subtext }]}>
              {results.length > 0 ? `${results.length} available` : 'Search or browse below'}
            </Text>
          </View>
          <TouchableOpacity
            style={[s.closeBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[s.closeTxt, { color: theme.subtext }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── Search bar ──────────────────────────────────────────────── */}
        <View style={[s.searchWrap, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Search cotton, wheat, tomato…"
            placeholderTextColor={theme.subtext + '88'}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 15, color: theme.subtext }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Results list ─────────────────────────────────────────────── */}
        {loading ? (
          <View style={s.centerLoader}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[s.loadingTxt, { color: theme.subtext }]}>Loading crops…</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={[s.list, results.length === 0 && { flex: 1 }]}
            showsVerticalScrollIndicator={false}
            onEndReached={loadMore}
            onEndReachedThreshold={0.35}
            ListEmptyComponent={renderEmpty}
            ListFooterComponent={renderFooter}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          />
        )}
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub:   { fontSize: 12, marginTop: 1 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 10,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { fontSize: 13, fontWeight: '700' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginTop: 12, marginBottom: 8,
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, padding: 0 },

  list:        { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 },
  centerLoader:{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingTxt:  { fontSize: 14, marginTop: 12 },
});
