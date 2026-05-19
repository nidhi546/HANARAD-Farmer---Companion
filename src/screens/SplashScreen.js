import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { useAuth }    from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Storage, KEYS } from '../utils/storage';
import { THEME } from '../constants/theme';

export default function SplashScreen({ navigation }) {
  const { isLoggedIn, loading: authLoading, isProfileComplete, user } = useAuth();
  const { langLoaded, t } = useLanguage();

  useEffect(() => {
    if (!authLoading && langLoaded) {
      init();
    }
  }, [authLoading, langLoaded]);

  const init = async () => {
    await new Promise(r => setTimeout(r, 1800));

    const languageSelected   = await Storage.get(KEYS.LANGUAGE_SELECTED);
    const disclaimerAccepted = await Storage.get(KEYS.DISCLAIMER_ACCEPTED);
    const permissionsDone    = await Storage.get(KEYS.PERMISSIONS_DONE);
    const onboardingDone     = await Storage.get(KEYS.ONBOARDING_DONE);
    const profileSetupDone   = await Storage.get(KEYS.PROFILE_SETUP_DONE);

    // Sync flag if user data already satisfies completeness (e.g. from EditProfile)
    if (isLoggedIn && !profileSetupDone && isProfileComplete(user)) {
      await Storage.set(KEYS.PROFILE_SETUP_DONE, true);
    }

    const isSetupDone = profileSetupDone || isProfileComplete(user);

    if (!languageSelected) {
      navigation.replace('LanguageSelect');
    } else if (!disclaimerAccepted) {
      navigation.replace('Disclaimer');
    } else if (!permissionsDone) {
      navigation.replace('Permissions');
    } else if (!onboardingDone) {
      navigation.replace('Onboarding');
    } else if (!isLoggedIn) {
      navigation.replace('Login');
    } else if (!isSetupDone) {
      navigation.replace('ProfileSetup');
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
      <Text style={styles.title}>HANARAD</Text>
      <Text style={styles.titleSub}>Farmer-Companion</Text>
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
  title: { fontSize: 32, fontWeight: '900', color: THEME.white, letterSpacing: 1 },
  titleSub: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)', letterSpacing: 2, marginTop: 2, textTransform: 'uppercase' },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'center' },
  spinner: { marginTop: 48 },
  poweredBy: { position: 'absolute', bottom: 40, fontSize: 11, color: 'rgba(255,255,255,0.5)' },
});
