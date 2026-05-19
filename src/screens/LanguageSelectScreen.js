import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../context/LanguageContext';
import { Storage, KEYS } from '../utils/storage';
import { THEME } from '../constants/theme';

const { width } = Dimensions.get('window');

const LANGUAGES = [
  {
    code: 'gu',
    label: 'ગુજરાતી',
    sublabel: 'Gujarati',
    flag: '🌾',
    bg: '#EEF2FF',
    border: '#4F46E5',
  },
  {
    code: 'hi',
    label: 'हिन्दी',
    sublabel: 'Hindi',
    flag: '🌱',
    bg: '#FFF7ED',
    border: '#EA580C',
  },
  {
    code: 'en',
    label: 'English',
    sublabel: 'English',
    flag: '🌍',
    bg: '#F5F3FF',
    border: '#8B5CF6',
  },
  {
    code: 'tl',
    label: 'Filipino',
    sublabel: 'Tagalog',
    flag: '🇵🇭',
    bg: '#FEF2F2',
    border: '#DC2626',
  },
];

export default function LanguageSelectScreen({ navigation }) {
  const { changeLanguage, t } = useLanguage();
  const [selected, setSelected] = useState('gu');

  const handleContinue = async () => {
    await changeLanguage(selected);
    await Storage.set(KEYS.LANGUAGE_SELECTED, true);
    navigation.replace('Onboarding');
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      {/* Header illustration */}
      <View style={styles.top}>
        <Text style={styles.flagBig}>🌾</Text>
        <Text style={styles.appName}>HANARAD Farmer-Companion</Text>
        <Text style={styles.heading}>
          {t('chooseLanguage')}
          {'\n'}ভাষा ਚੁਣੋ / भाषा चुनें
        </Text>
        <Text style={styles.sub}>{t('chooseLanguageSub')}</Text>
      </View>

      {/* Language cards */}
      <View style={styles.cardsContainer}>
        {LANGUAGES.map((lang) => {
          const isSelected = selected === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.langCard,
                { borderColor: isSelected ? lang.border : THEME.border },
                isSelected && { backgroundColor: lang.bg },
              ]}
              onPress={() => setSelected(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <View style={styles.langText}>
                <Text style={[styles.langLabel, isSelected && { color: lang.border }]}>
                  {lang.label}
                </Text>
                <Text style={styles.langSublabel}>{lang.sublabel}</Text>
              </View>
              <View style={[
                styles.radioOuter,
                isSelected && { borderColor: lang.border },
              ]}>
                {isSelected && (
                  <View style={[styles.radioInner, { backgroundColor: lang.border }]} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Continue */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.continueBtnText}>{t('continueBtn')} →</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background },
  top: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  flagBig: { fontSize: 56, marginBottom: 8 },
  appName: { fontSize: 22, fontWeight: '800', color: THEME.primary, marginBottom: 16 },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: THEME.text,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 8,
  },
  sub: { fontSize: 13, color: THEME.subtext, textAlign: 'center', lineHeight: 20 },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 14,
  },
  langCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: THEME.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  langFlag: { fontSize: 36, marginRight: 16 },
  langText: { flex: 1 },
  langLabel: { fontSize: 22, fontWeight: '800', color: THEME.text },
  langSublabel: { fontSize: 13, color: THEME.subtext, marginTop: 2 },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bottom: { paddingHorizontal: 24, paddingBottom: 16, paddingTop: 12 },
  continueBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  continueBtnText: { fontSize: 17, fontWeight: '800', color: THEME.white, letterSpacing: 0.3 },
});
