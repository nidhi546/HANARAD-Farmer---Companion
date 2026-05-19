/**
 * MapTypeSelector — floating map-type switcher + location/zoom controls.
 *
 * Props:
 *   mapType        string   current mapType value
 *   onMapTypeChange fn      called with new mapType string
 *   mapRef         ref      ref to MapView — used for "center location" button
 *   userLocation   object   { latitude, longitude } — for centering
 *   style          object   extra style for the container
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, Animated, Platform,
} from 'react-native';

const ALL_MAP_TYPES = [
  { value: 'standard',  label: 'Standard',  icon: '🗺️', desc: 'Roads & village names',    color: '#0284C7', ios: true  },
  { value: 'satellite', label: 'Satellite', icon: '🛰️', desc: 'Real farm land view',       color: '#059669', ios: true  },
  { value: 'hybrid',    label: 'Hybrid',    icon: '🌍', desc: 'Satellite + road names',    color: '#7C3AED', ios: true  },
  { value: 'terrain',   label: 'Terrain',   icon: '⛰️', desc: 'Height & landscape',        color: '#D97706', ios: false },
];

// terrain is Android-only — Apple Maps does not support it
const MAP_TYPES = Platform.OS === 'ios'
  ? ALL_MAP_TYPES.filter(t => t.ios)
  : ALL_MAP_TYPES;

function currentInfo(type) {
  return MAP_TYPES.find(t => t.value === type) ?? MAP_TYPES[0];
}

export default function MapTypeSelector({ mapType, onMapTypeChange, mapRef, userLocation, style }) {
  const [open, setOpen] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;

  function openSheet() {
    setOpen(true);
    Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
  }

  function closeSheet() {
    Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }).start(() => setOpen(false));
  }

  function select(value) {
    onMapTypeChange(value);
    closeSheet();
  }

  function centerLocation() {
    if (!mapRef?.current || !userLocation) return;
    mapRef.current.animateToRegion(
      { ...userLocation, latitudeDelta: 0.003, longitudeDelta: 0.003 },
      600,
    );
  }

  const info = currentInfo(mapType);

  return (
    <>
      {/* Floating right-side controls */}
      <View style={[styles.fab, style]}>
        {/* Center location */}
        {userLocation && (
          <TouchableOpacity style={styles.iconBtn} onPress={centerLocation} activeOpacity={0.8}>
            <Text style={styles.iconBtnTxt}>📍</Text>
          </TouchableOpacity>
        )}

        {/* Map type toggle button */}
        <TouchableOpacity
          style={[styles.mapTypeBtn, { borderColor: info.color }]}
          onPress={openSheet}
          activeOpacity={0.85}
        >
          <Text style={styles.mapTypeBtnIcon}>{info.icon}</Text>
          <Text style={[styles.mapTypeBtnLabel, { color: info.color }]}>{info.label}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom sheet modal */}
      <Modal visible={open} transparent animationType="none" onRequestClose={closeSheet}>
        {/* Backdrop */}
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={closeSheet} />

        {/* Sheet */}
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>🗺️ Map Style</Text>
          <Text style={styles.sheetSub}>Choose the best view for your farm</Text>

          <View style={styles.grid}>
            {MAP_TYPES.map(t => {
              const active = t.value === mapType;
              return (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeCard,
                    { borderColor: active ? t.color : '#E5E7EB', backgroundColor: active ? t.color + '12' : '#F9FAFB' },
                  ]}
                  onPress={() => select(t.value)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.typeIcon}>{t.icon}</Text>
                  <Text style={[styles.typeLabel, { color: active ? t.color : '#111827' }]}>{t.label}</Text>
                  <Text style={styles.typeDesc}>{t.desc}</Text>
                  {active && (
                    <View style={[styles.activeBadge, { backgroundColor: t.color }]}>
                      <Text style={styles.activeBadgeTxt}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.cancelBtn} onPress={closeSheet}>
            <Text style={styles.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 14,
    gap: 10,
    alignItems: 'center',
  },

  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      android: { elevation: 6 },
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
    }),
  },
  iconBtnTxt: { fontSize: 20 },

  mapTypeBtn: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 60,
    ...Platform.select({
      android: { elevation: 6 },
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
    }),
  },
  mapTypeBtnIcon:  { fontSize: 22 },
  mapTypeBtnLabel: { fontSize: 10, fontWeight: '800', marginTop: 2 },

  // Modal
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.40)' },

  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    ...Platform.select({
      android: { elevation: 20 },
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12 },
    }),
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  sheetTitle:  { fontSize: 20, fontWeight: '900', color: '#111827', textAlign: 'center' },
  sheetSub:    { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, marginBottom: 20 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },

  typeCard: {
    width: '47%',
    borderWidth: 2,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  typeIcon:   { fontSize: 34, marginBottom: 4 },
  typeLabel:  { fontSize: 16, fontWeight: '900' },
  typeDesc:   { fontSize: 11, color: '#6B7280', textAlign: 'center', lineHeight: 15 },

  activeBadge: {
    position: 'absolute',
    top: 10, right: 10,
    width: 22, height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeTxt: { fontSize: 12, fontWeight: '900', color: '#fff' },

  cancelBtn: { marginTop: 18, paddingVertical: 14, alignItems: 'center', borderRadius: 14, backgroundColor: '#F3F4F6' },
  cancelTxt: { fontSize: 15, fontWeight: '800', color: '#374151' },
});
