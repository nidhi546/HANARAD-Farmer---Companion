import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../constants/theme';

export default function WeatherCard({ label, value, unit, icon }) {
  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.value}>{value}<Text style={styles.unit}>{unit}</Text></Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    width: '47%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  icon: { fontSize: 22 },
  value: { fontSize: 20, fontWeight: '800', color: THEME.text },
  unit: { fontSize: 13, fontWeight: '500', color: THEME.subtext },
  label: { fontSize: 11, color: THEME.subtext, marginTop: 4, textAlign: 'center' },
});
