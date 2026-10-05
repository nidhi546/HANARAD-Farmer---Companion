/**
 * PermissionScreen — First-launch permission onboarding.
 * Shows one permission at a time with a large icon, local-language
 * explanation, voice guidance (expo-speech), and Allow / Skip buttons.
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Storage, KEYS } from '../utils/storage';

const { width } = Dimensions.get('window');

// ── Permission step definitions ──────────────────────────────────────────────
const STEPS = [
  {
    id: 'location',
    icon: '📍',
    color: '#4F46E5',
    bg: '#EEF2FF',
    progressColor: '#4F46E5',
    voiceEn: 'HANARAD Farmer-Companion needs your location to show local weather and crop advice for your farm area.',
    voiceHi: 'फार्मर ऐप को आपकी लोकेशन की जरूरत है ताकि आपके खेत का मौसम और फसल सलाह दिखाई जा सके।',
    voiceGu: 'ફાર્મર એપ્પ ને આપની લોકેશન જોઈએ છે જેથી આપના ખેતર નો હવામાન અને પાક સલાહ બતાવી શકાય.',
    request: async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    },
  },
  {
    id: 'notification',
    icon: '🔔',
    color: '#F59E0B',
    bg: '#FFFBEB',
    progressColor: '#F59E0B',
    voiceEn: 'Allow notifications to get rain alerts, crop care reminders, and market price updates.',
    voiceHi: 'बारिश अलर्ट, फसल देखभाल याददिलाने और बाजार भाव अपडेट के लिए नोटिफिकेशन की अनुमति दें।',
    voiceGu: 'વરસાદ ની ચેતવણી, પાક સંભાળ ની યાददिलाश, અને બજાર ભાવ અપડેટ માટે નોટિફિકેશન ની મંજૂરી આપો.',
    request: async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    },
  },
  {
    id: 'camera',
    icon: '📷',
    color: '#10B981',
    bg: '#ECFDF5',
    progressColor: '#10B981',
    voiceEn: 'Camera is needed to take photos of crop leaves and detect diseases early.',
    voiceHi: 'फसल की पत्तियों की फोटो लेने और बीमारी जल्दी पहचानने के लिए कैमरे की जरूरत है।',
    voiceGu: 'પાક ના પાંદડા ની ફોટો લેવા અને રોગ જલ્દી ઓળખવા માટે કેમેરા ની જરૂર છે.',
    request: async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    },
  },
  {
    id: 'gallery',
    icon: '🖼️',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    progressColor: '#8B5CF6',
    voiceEn: 'Gallery access lets you upload existing crop photos for disease detection.',
    voiceHi: 'गैलरी एक्सेस से आप पुरानी फसल की फोटो अपलोड करके बीमारी की जांच कर सकते हैं।',
    voiceGu: 'ગેલેરી એક્સેસ થી આપ જૂની પાક ની ફોટો અપલોડ કરી ને રોગ ની તપાસ કરી શક્શો.',
    request: async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) return true;
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getVoiceText(step, language) {
  if (language === 'hi') return step.voiceHi;
  if (language === 'gu') return step.voiceGu;
  return step.voiceEn;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function PermissionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { theme } = useTheme();

  const [stepIndex, setStepIndex] = useState(0);
  const [granting, setGranting] = useState(false);
  const [results, setResults] = useState({});

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const currentStep = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  // ── Animate in on step change ────────────────────────────────────────────
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(40);
    scaleAnim.setValue(0.8);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1,   duration: 420, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0,   duration: 380, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1,   friction: 6,   useNativeDriver: true }),
    ]).start();
  }, [stepIndex]);

  // ── Auto voice on step load ──────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => speakStep(), 800);
    return () => {
      clearTimeout(timer);
      Speech.stop();
    };
  }, [stepIndex, language]);

  function speakStep() {
    Speech.stop();
    const text = getVoiceText(currentStep, language);
    Speech.speak(text, {
      language: language === 'gu' ? 'gu-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
      rate: 0.9,
      pitch: 1.0,
    });
  }

  // ── Grant permission ─────────────────────────────────────────────────────
  async function handleAllow() {
    setGranting(true);
    try {
      const granted = await currentStep.request();
      setResults(prev => ({ ...prev, [currentStep.id]: granted }));
      if (!granted) {
        // Guide to settings if denied
        Alert.alert(
          t('permDeniedTitle'),
          t('permDeniedMsg'),
          [
            { text: t('cancel'), style: 'cancel' },
            { text: t('openSettings'), onPress: () => Linking.openSettings() },
          ],
        );
      }
      goNext();
    } catch {
      goNext();
    } finally {
      setGranting(false);
    }
  }

  function handleSkip() {
    setResults(prev => ({ ...prev, [currentStep.id]: false }));
    goNext();
  }

  function goNext() {
    Speech.stop();
    if (isLast) {
      finish();
    } else {
      setStepIndex(i => i + 1);
    }
  }

  async function finish() {
    await Storage.set(KEYS.PERMISSIONS_DONE, true);
    navigation.replace('Onboarding');
  }

  const styles = makeStyles(theme, currentStep);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      {/* ── Progress dots ── */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View
            key={s.id}
            style={[
              styles.dot,
              i === stepIndex && styles.dotActive,
              i < stepIndex  && styles.dotDone,
            ]}
          />
        ))}
      </View>

      {/* ── Step counter ── */}
      <Text style={styles.stepCounter}>
        {stepIndex + 1} / {STEPS.length}
      </Text>

      {/* ── Animated content ── */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
        ]}
      >
        {/* Big icon bubble */}
        <View style={styles.iconBubble}>
          <Text style={styles.iconEmoji}>{currentStep.icon}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{t(`perm_${currentStep.id}_title`)}</Text>

        {/* Description */}
        <Text style={styles.desc}>{t(`perm_${currentStep.id}_desc`)}</Text>

        {/* Why this matters chip */}
        <View style={styles.whyChip}>
          <Text style={styles.whyIcon}>💡</Text>
          <Text style={styles.whyText}>{t(`perm_${currentStep.id}_why`)}</Text>
        </View>
      </Animated.View>

      {/* ── Voice replay button ── */}
      <TouchableOpacity style={styles.voiceBtn} onPress={speakStep}>
        <Text style={styles.voiceBtnIcon}>🔊</Text>
        <Text style={styles.voiceBtnText}>{t('listenAgain')}</Text>
      </TouchableOpacity>

      {/* ── Action buttons ── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.allowBtn, { backgroundColor: currentStep.color }]}
          onPress={handleAllow}
          disabled={granting}
          activeOpacity={0.88}
        >
          <Text style={styles.allowBtnText}>
            {granting ? '…' : t('permAllow')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleSkip}
          disabled={granting}
          activeOpacity={0.75}
        >
          <Text style={styles.skipBtnText}>
            {isLast ? t('permDone') : t('permSkip')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Bottom hint ── */}
      <Text style={styles.hint}>{t('permHint')}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
function makeStyles(theme, step) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: step.bg,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 28,
    },

    // Progress dots
    progress: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 20,
    },
    dot: {
      width: 8, height: 8, borderRadius: 4,
      backgroundColor: 'rgba(0,0,0,0.15)',
    },
    dotActive: {
      width: 24,
      backgroundColor: step.color,
    },
    dotDone: {
      backgroundColor: step.color + '88',
    },

    stepCounter: {
      fontSize: 13,
      fontWeight: '700',
      color: step.color,
      marginTop: 8,
    },

    // Animated content area
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 16,
    },

    iconBubble: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: step.color + '18',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
      shadowColor: step.color,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.22,
      shadowRadius: 24,
      elevation: 8,
      borderWidth: 3,
      borderColor: step.color + '28',
    },
    iconEmoji: { fontSize: 80 },

    title: {
      fontSize: 26,
      fontWeight: '900',
      color: '#1A1A2E',
      textAlign: 'center',
      letterSpacing: -0.5,
      marginBottom: 14,
    },
    desc: {
      fontSize: 16,
      color: '#4A4A6A',
      textAlign: 'center',
      lineHeight: 26,
      marginBottom: 22,
      paddingHorizontal: 8,
    },

    whyChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: step.color + '14',
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: step.color + '30',
    },
    whyIcon: { fontSize: 18 },
    whyText: {
      fontSize: 13,
      color: step.color,
      fontWeight: '600',
      flex: 1,
      lineHeight: 19,
    },

    // Voice replay
    voiceBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.05)',
      marginBottom: 12,
    },
    voiceBtnIcon: { fontSize: 20 },
    voiceBtnText: { fontSize: 14, fontWeight: '600', color: '#555' },

    // Actions
    actions: { width: '100%', gap: 12, marginBottom: 8 },
    allowBtn: {
      borderRadius: 18,
      paddingVertical: 18,
      alignItems: 'center',
      shadowColor: step.color,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 14,
      elevation: 6,
    },
    allowBtnText: {
      fontSize: 18,
      fontWeight: '900',
      color: '#FFFFFF',
      letterSpacing: 0.3,
    },
    skipBtn: {
      borderRadius: 18,
      paddingVertical: 16,
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.05)',
    },
    skipBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#666',
    },

    hint: {
      fontSize: 11,
      color: '#888',
      textAlign: 'center',
      marginBottom: 16,
      paddingHorizontal: 16,
    },
  });
}
