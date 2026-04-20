import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Storage, KEYS } from '../utils/storage';
import { THEME } from '../constants/theme';

export default function SplashScreen({ navigation }) {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { langLoaded, t } = useLanguage();

  useEffect(() => {
    if (!authLoading && langLoaded) {
      init();
    }
  }, [authLoading, langLoaded]);

  const init = async () => {
    await new Promise(r => setTimeout(r, 1800));

    const languageSelected = await Storage.get(KEYS.LANGUAGE_SELECTED);
    const onboardingDone   = await Storage.get(KEYS.ONBOARDING_DONE);

    if (!languageSelected) {
      navigation.replace('LanguageSelect');
    } else if (!onboardingDone) {
      navigation.replace('Onboarding');
    } else if (!isLoggedIn) {
      navigation.replace('Login');
    } else {
      navigation.replace('Main');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      <View style={styles.logoCircle}>
        <Text style={styles.emoji}>🌾</Text>
      </View>
      <Text style={styles.title}>FarmerApp</Text>
      <Text style={styles.subtitle}>{t('tagline')}</Text>
      <ActivityIndicator size="small" color="rgba(255,255,255,0.6)" style={styles.spinner} />
      <Text style={styles.poweredBy}>{t('poweredBy')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  emoji: { fontSize: 60 },
  title: { fontSize: 36, fontWeight: '800', color: THEME.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'center' },
  spinner: { marginTop: 48 },
  poweredBy: { position: 'absolute', bottom: 40, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
});
