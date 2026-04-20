import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../context/LocationContext';
import { THEME } from '../constants/theme';

const CITIES = [
  { city: 'Ahmedabad', lat: 23.02, lon: 72.6 },
  { city: 'Surat',     lat: 21.17, lon: 72.83 },
  { city: 'Rajkot',   lat: 22.3,  lon: 70.78 },
  { city: 'Vadodara', lat: 22.31, lon: 73.18 },
  { city: 'Junagadh', lat: 21.52, lon: 70.46 },
  { city: 'Bhavnagar',lat: 21.76, lon: 72.15 },
  { city: 'Gandhinagar', lat: 23.22, lon: 72.65 },
  { city: 'Jamnagar', lat: 22.47, lon: 70.06 },
];

export default function LocationScreen({ navigation }) {
  const { saveLocation, getGPSLocation, loading, gpsError, setGpsError } = useLocation();
  const [search, setSearch] = useState('');

  const filtered = CITIES.filter(c =>
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  const handleGPS = async () => {
    setGpsError(null);
    const result = await getGPSLocation();

    if (result.success) {
      navigation.replace('Main');
    } else {
      if (result.reason === 'denied') {
        Alert.alert(
          'Permission Denied',
          'Location permission was denied. You can allow it in your device Settings under App Permissions.',
          [{ text: 'OK' }]
        );
      } else if (result.reason === 'disabled') {
        Alert.alert(
          'GPS Disabled',
          'Please turn on Location Services in your device settings and try again.',
          [{ text: 'OK' }]
        );
      } else if (result.reason === 'timeout') {
        Alert.alert('Timed Out', 'Could not get your location in time. Please try again or select a city.', [{ text: 'OK' }]);
      } else {
        Alert.alert('Error', result.message || 'Could not get location. Please try again.', [{ text: 'OK' }]);
      }
    }
  };

  const selectCity = async (item) => {
    await saveLocation(item);
    navigation.replace('Main');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Set Your Location</Text>
        <Text style={styles.headerSub}>We'll show weather data for your area</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* GPS Button */}
        <TouchableOpacity
          style={[styles.gpsBtn, loading && styles.gpsBtnDisabled]}
          onPress={handleGPS}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={styles.gpsBtnInner}>
              <ActivityIndicator color={THEME.white} style={{ marginRight: 10 }} />
              <Text style={styles.gpsBtnText}>Getting your location…</Text>
            </View>
          ) : (
            <View style={styles.gpsBtnInner}>
              <Text style={styles.gpsBtnIcon}>📡</Text>
              <Text style={styles.gpsBtnText}>Use GPS Location</Text>
            </View>
          )}
        </TouchableOpacity>

        {gpsError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️  {gpsError}</Text>
          </View>
        ) : null}

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or choose a city</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search city..."
            placeholderTextColor={THEME.subtext}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* City List */}
        {filtered.length === 0 ? (
          <View style={styles.noResult}>
            <Text style={styles.noResultText}>No cities found for "{search}"</Text>
          </View>
        ) : (
          filtered.map(item => (
            <TouchableOpacity
              key={item.city}
              style={styles.cityRow}
              onPress={() => selectCity(item)}
              activeOpacity={0.7}
            >
              <View style={styles.cityIconCircle}>
                <Text style={styles.cityIcon}>🏙️</Text>
              </View>
              <View style={styles.cityInfo}>
                <Text style={styles.cityName}>{item.city}</Text>
                <Text style={styles.cityCoords}>
                  {item.lat.toFixed(2)}°N, {item.lon.toFixed(2)}°E
                </Text>
              </View>
              <Text style={styles.cityArrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background },
  header: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: THEME.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  gpsBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  gpsBtnDisabled: { opacity: 0.7 },
  gpsBtnInner: { flexDirection: 'row', alignItems: 'center' },
  gpsBtnIcon: { fontSize: 20, marginRight: 10 },
  gpsBtnText: { fontSize: 16, fontWeight: '700', color: THEME.white },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 13, color: THEME.danger, fontWeight: '500' },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: THEME.border },
  dividerText: {
    fontSize: 12,
    color: THEME.subtext,
    marginHorizontal: 12,
    fontWeight: '500',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.border,
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: THEME.text },
  clearBtn: { padding: 4 },
  clearIcon: { fontSize: 14, color: THEME.subtext },
  noResult: { alignItems: 'center', paddingVertical: 32 },
  noResultText: { fontSize: 14, color: THEME.subtext },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cityIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cityIcon: { fontSize: 20 },
  cityInfo: { flex: 1 },
  cityName: { fontSize: 15, fontWeight: '700', color: THEME.text },
  cityCoords: { fontSize: 11, color: THEME.subtext, marginTop: 2 },
  cityArrow: { fontSize: 22, color: THEME.border, fontWeight: '300' },
});
