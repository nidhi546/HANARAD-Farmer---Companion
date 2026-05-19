import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }    from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth }     from '../context/AuthContext';
import { Storage, KEYS } from '../utils/storage';

function SectionHeader({ title, theme }) {
  return (
    <Text style={[styles.sectionHeader, { color: theme.subtext }]}>{title}</Text>
  );
}

function SettingRow({ icon, label, sublabel, right, onPress, theme, danger }) {
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: theme.card, borderColor: theme.border }]}
      onPress={onPress}
      disabled={!onPress && !right}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? '#FEE2E2' : theme.primary + '18' }]}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, { color: danger ? '#EF4444' : theme.text }]}>{label}</Text>
        {sublabel ? <Text style={[styles.rowSub, { color: theme.subtext }]}>{sublabel}</Text> : null}
      </View>
      {right}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ navigation }) {
  const insets      = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState(true);
  const [weatherAlerts,  setWeatherAlerts]  = useState(true);
  const [marketUpdates,  setMarketUpdates]  = useState(false);
  const [voiceReadout,   setVoiceReadout]   = useState(true);

  const langLabel = { en: 'English', hi: 'हिंदी', gu: 'ગુજરાતી' }[language] ?? language;

  async function handleLogout() {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ],
    );
  }

  async function handleClearData() {
    Alert.alert(
      'Clear App Data',
      'This will remove all saved farms, preferences, and profile data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await Storage.clear();
            Alert.alert('Done', 'App data cleared. Please restart the app.');
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.primary }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={{ width: 36 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Account */}
        <SectionHeader title="ACCOUNT" theme={theme} />
        <SettingRow
          icon="👤"
          label={user?.name ?? 'My Profile'}
          sublabel={user?.email ?? 'Tap to edit profile'}
          onPress={() => navigation.navigate('EditProfile')}
          right={<Text style={[styles.chevron, { color: theme.subtext }]}>›</Text>}
          theme={theme}
        />
        <SettingRow
          icon="📍"
          label="Location"
          sublabel="Update your farm location"
          onPress={() => navigation.navigate('Location')}
          right={<Text style={[styles.chevron, { color: theme.subtext }]}>›</Text>}
          theme={theme}
        />

        {/* Appearance */}
        <SectionHeader title="APPEARANCE" theme={theme} />
        <SettingRow
          icon={isDark ? '🌙' : '☀️'}
          label="Dark Mode"
          sublabel={isDark ? 'Currently: Dark' : 'Currently: Light'}
          right={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D1D5DB', true: theme.primary + '88' }}
              thumbColor={isDark ? theme.primary : '#fff'}
            />
          }
          theme={theme}
        />
        <SettingRow
          icon="🌐"
          label="Language"
          sublabel={langLabel}
          onPress={() => navigation.navigate('LanguageChange')}
          right={<Text style={[styles.chevron, { color: theme.subtext }]}>›</Text>}
          theme={theme}
        />

        {/* Notifications */}
        <SectionHeader title="NOTIFICATIONS" theme={theme} />
        <SettingRow
          icon="🔔"
          label="Push Notifications"
          sublabel="Alerts and app updates"
          right={
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#D1D5DB', true: theme.primary + '88' }}
              thumbColor={notifications ? theme.primary : '#fff'}
            />
          }
          theme={theme}
        />
        <SettingRow
          icon="🌧️"
          label="Weather Alerts"
          sublabel="Rain, storm, frost warnings"
          right={
            <Switch
              value={weatherAlerts}
              onValueChange={setWeatherAlerts}
              trackColor={{ false: '#D1D5DB', true: theme.primary + '88' }}
              thumbColor={weatherAlerts ? theme.primary : '#fff'}
            />
          }
          theme={theme}
        />
        <SettingRow
          icon="📈"
          label="Market Price Updates"
          sublabel="Daily mandi price alerts"
          right={
            <Switch
              value={marketUpdates}
              onValueChange={setMarketUpdates}
              trackColor={{ false: '#D1D5DB', true: theme.primary + '88' }}
              thumbColor={marketUpdates ? theme.primary : '#fff'}
            />
          }
          theme={theme}
        />

        {/* Accessibility */}
        <SectionHeader title="ACCESSIBILITY" theme={theme} />
        <SettingRow
          icon="🔊"
          label="Voice Readout"
          sublabel="Auto-read weather & alerts"
          right={
            <Switch
              value={voiceReadout}
              onValueChange={setVoiceReadout}
              trackColor={{ false: '#D1D5DB', true: theme.primary + '88' }}
              thumbColor={voiceReadout ? theme.primary : '#fff'}
            />
          }
          theme={theme}
        />
        <SettingRow
          icon="🎙️"
          label="Voice Guide"
          sublabel="Learn app features by voice"
          onPress={() => navigation.navigate('VoiceGuide')}
          right={<Text style={[styles.chevron, { color: theme.subtext }]}>›</Text>}
          theme={theme}
        />

        {/* Support */}
        <SectionHeader title="SUPPORT" theme={theme} />
        <SettingRow
          icon="❓"
          label="Help & Support"
          sublabel="FAQs and contact"
          onPress={() => navigation.navigate('HelpSupport')}
          right={<Text style={[styles.chevron, { color: theme.subtext }]}>›</Text>}
          theme={theme}
        />
        <SettingRow
          icon="⭐"
          label="Rate the App"
          sublabel="Share your feedback"
          onPress={() => Alert.alert('Thank you!', 'Rating feature coming soon.')}
          right={<Text style={[styles.chevron, { color: theme.subtext }]}>›</Text>}
          theme={theme}
        />
        <SettingRow
          icon="ℹ️"
          label="About"
          sublabel="Version 1.0.0 · HANARAD Farmer-Companion"
          theme={theme}
        />

        {/* Danger zone */}
        <SectionHeader title="DATA" theme={theme} />
        <SettingRow
          icon="🗑️"
          label="Clear App Data"
          sublabel="Remove all local data"
          onPress={handleClearData}
          right={<Text style={[styles.chevron, { color: '#EF4444' }]}>›</Text>}
          theme={theme}
          danger
        />
        <SettingRow
          icon="🚪"
          label="Logout"
          onPress={handleLogout}
          right={<Text style={[styles.chevron, { color: '#EF4444' }]}>›</Text>}
          theme={theme}
          danger
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingBottom: 24 },

  header:    { paddingBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  backBtn:   { width: 36, alignItems: 'flex-start' },
  backText:  { fontSize: 28, color: '#fff', fontWeight: '300' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '900', color: '#fff' },

  sectionHeader: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8 },

  row:     { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 2, borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  rowIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowIconText: { fontSize: 22 },
  rowBody: { flex: 1 },
  rowLabel:{ fontSize: 15, fontWeight: '700', marginBottom: 2 },
  rowSub:  { fontSize: 12, fontWeight: '500' },
  chevron: { fontSize: 22, fontWeight: '300' },
});
