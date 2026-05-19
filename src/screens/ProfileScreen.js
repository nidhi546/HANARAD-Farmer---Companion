import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { useLocation } from '../context/LocationContext';
import { useAuth }     from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme }    from '../context/ThemeContext';
import AppHeader from '../components/AppHeader';
import useNasaConfig from '../hooks/useNasaConfig';

function makeStyles(theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    profileHeader: {
      backgroundColor: theme.primary,
      alignItems: 'center',
      paddingTop: 32, paddingBottom: 28, paddingHorizontal: 24,
    },
    avatarCircle: {
      width: 80, height: 80, borderRadius: 40,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', marginBottom: 12,
    },
    avatarText:   { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
    userName:     { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
    userEmail:    { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
    locationBadge: {
      backgroundColor: 'rgba(255,255,255,0.15)',
      borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 10,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
    },
    locationBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500' },
    coordCard: {
      backgroundColor: theme.card, marginHorizontal: 16, marginTop: 16,
      borderRadius: 16, padding: 16, flexDirection: 'row',
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    coordItem:  { flex: 1, alignItems: 'center' },
    coordLabel: { fontSize: 11, color: theme.subtext, fontWeight: '500', marginBottom: 4 },
    coordValue: { fontSize: 16, fontWeight: '700', color: theme.text },
    coordDivider: { width: 1, backgroundColor: theme.border, marginHorizontal: 8 },
    section:      { paddingHorizontal: 16, marginTop: 20 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: theme.subtext, letterSpacing: 1, marginBottom: 10 },
    actionRow: {
      backgroundColor: theme.card, borderRadius: 14, padding: 14,
      flexDirection: 'row', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    actionIcon: {
      width: 38, height: 38, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
      backgroundColor: theme.light,
    },
    actionEmoji: { fontSize: 18 },
    actionLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: theme.text },
    actionArrow: { fontSize: 22, color: theme.border },
    infoCard: {
      backgroundColor: theme.card, borderRadius: 14, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    infoRow:   { flexDirection: 'row', alignItems: 'center', padding: 14 },
    infoEmoji: { fontSize: 22, width: 32, textAlign: 'center', marginRight: 12 },
    infoText:  { flex: 1 },
    infoLabel: { fontSize: 13, fontWeight: '700', color: theme.text },
    infoValue: { fontSize: 12, color: theme.subtext, marginTop: 2 },
    infoDivider: { height: 1, backgroundColor: theme.border, marginHorizontal: 14 },
    logoutBtn: {
      flexDirection: 'row', backgroundColor: '#FEF2F2',
      borderRadius: 14, padding: 16, alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: '#FECACA',
    },
    logoutEmoji: { fontSize: 18, marginRight: 8 },
    logoutText:  { fontSize: 15, fontWeight: '700', color: '#EF4444' },
    version: {
      textAlign: 'center', fontSize: 11, color: theme.subtext,
      marginTop: 24, marginBottom: 40, opacity: 0.5,
    },
  });
}

export default function ProfileScreen({ navigation }) {
  const { location }  = useLocation();
  const { user, logout } = useAuth();
  const { t }         = useLanguage();
  const { theme }     = useTheme();
  const styles        = useMemo(() => makeStyles(theme), [theme]);

  const [loggingOut, setLoggingOut] = useState(false);

  const { versionLabel } = useNasaConfig();

  const infoItems = [
    { icon: '🛰️', label: t('nasaPowerLabel'), value: versionLabel || t('nasaPowerDesc') },
    { icon: '🌐', label: t('openMeteoLabel'), value: t('openMeteoDesc') },
    { icon: '🌱', label: t('cropRulesLabel'), value: t('cropRulesDesc') },
  ];

  const getInitials = (name) => {
    if (!name) return 'FA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    Alert.alert(
      t('logoutConfirmTitle'),
      t('logoutConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'), style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            await logout();
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <AppHeader title={t('myProfile')} />

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity style={styles.avatarCircle} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.85}>
          {user?.photo
            ? <Image source={{ uri: user.photo }} style={{ width: '100%', height: '100%', borderRadius: 40 }} />
            : <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>}
        </TouchableOpacity>
        <Text style={styles.userName}>{user?.name || t('farmer')}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
        <View style={styles.locationBadge}>
          <Text style={styles.locationBadgeText}>📍 {location.city}</Text>
        </View>
      </View>

      {/* Coordinates Card */}
      <View style={styles.coordCard}>
        <View style={styles.coordItem}>
          <Text style={styles.coordLabel}>{t('latitude')}</Text>
          <Text style={styles.coordValue}>
            {location?.lat != null ? Number(location.lat).toFixed(4) : '--'}°N
          </Text>
        </View>
        <View style={styles.coordDivider} />
        <View style={styles.coordItem}>
          <Text style={styles.coordLabel}>{t('longitude')}</Text>
          <Text style={styles.coordValue}>
            {location?.lon != null ? Number(location.lon).toFixed(4) : '--'}°E
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('account')}</Text>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('EditProfile')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
            <Text style={styles.actionEmoji}>✏️</Text>
          </View>
          <Text style={styles.actionLabel}>{t('editProfile')}</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => navigation.navigate('Location')}
          activeOpacity={0.7}
        >
          <View style={styles.actionIcon}>
            <Text style={styles.actionEmoji}>📍</Text>
          </View>
          <Text style={styles.actionLabel}>{t('changeLocation')}</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Data Sources */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('dataSources')}</Text>
        <View style={styles.infoCard}>
          {infoItems.map((item, i) => (
            <View key={i}>
              {i > 0 && <View style={styles.infoDivider} />}
              <View style={styles.infoRow}>
                <Text style={styles.infoEmoji}>{item.icon}</Text>
                <View style={styles.infoText}>
                  <Text style={styles.infoLabel}>{item.label}</Text>
                  <Text style={styles.infoValue}>{item.value}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          {loggingOut
            ? <ActivityIndicator color="#EF4444" />
            : (
              <>
                <Text style={styles.logoutEmoji}>🚪</Text>
                <Text style={styles.logoutText}>{t('logout')}</Text>
              </>
            )
          }
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>{t('versionText')}</Text>
    </ScrollView>
  );
}
