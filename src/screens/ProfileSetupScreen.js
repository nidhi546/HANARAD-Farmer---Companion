/**
 * ProfileSetupScreen — First-time profile completion.
 *
 * Collects: avatar, name, mobile, dob, village, address, city, state,
 *           crops, language.
 *
 * On save: calls updateProfileApi(user.id, {...}) via useProfile hook,
 *          syncs local auth state, sets PROFILE_SETUP_DONE flag, then
 *          navigates to Main.
 *
 * On skip: marks flag as done and navigates to Main without API call.
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth }      from '../context/AuthContext';
import { useLanguage }  from '../context/LanguageContext';
import { useTheme }     from '../context/ThemeContext';
import { useProfile }    from '../hooks/useProfile';
import { useCropMaster } from '../hooks/useCropMaster';
import { Storage, KEYS } from '../utils/storage';

const STATES = ['Gujarat', 'Rajasthan', 'Maharashtra', 'Punjab', 'UP', 'MP', 'Bihar', 'Haryana'];

const LANGUAGES = [
  { code: 'en', label: 'English'   },
  { code: 'hi', label: 'हिंदी'     },
  { code: 'gu', label: 'ગુજરાતી'  },
  { code: 'tl', label: 'Filipino'  },
];

const AVATARS = ['👨‍🌾', '👩‍🌾', '🧑‍🌾', '👴', '👵'];

// ── Component ───────────────────────────────────────────────────────────────
export default function ProfileSetupScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { user }                    = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const { theme }                   = useTheme();
  const { saveProfile, saving }           = useProfile();
  const { crops: cropList, loading: cropsLoading } = useCropMaster();

  const email = route.params?.email ?? user?.email ?? '';

  // ── Form state ─────────────────────────────────────────────────────────
  const [avatar,   setAvatar]   = useState('👨‍🌾');
  const [name,     setName]     = useState(user?.name || '');
  const [mobile,   setMobile]   = useState(user?.phone || '');
  const [dob,      setDob]      = useState('');
  const [village,  setVillage]  = useState('');
  const [address,  setAddress]  = useState('');
  const [city,     setCity]     = useState('');
  const [state,    setState]    = useState('');
  const [crops,    setCrops]    = useState([]);
  const [nameErr,  setNameErr]  = useState('');

  // ── Refs for keyboard chain ─────────────────────────────────────────────
  const mobileRef  = useRef(null);
  const dobRef     = useRef(null);
  const villageRef = useRef(null);
  const addressRef = useRef(null);
  const cityRef    = useRef(null);

  function toggleCrop(key) {
    setCrops(prev => prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]);
  }

  // ── Save: call API then navigate ────────────────────────────────────────
  async function handleSave() {
    if (!name.trim()) {
      setNameErr('Please enter your name.');
      return;
    }
    setNameErr('');
    try {
      await saveProfile({
        name:     name.trim(),
        mobile:   mobile.trim(),
        dob:      dob.trim(),
        village:  village.trim(),
        address:  address.trim(),
        city:     city.trim(),
        state,
        crops,
        avatar,
        language,
      });
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      Alert.alert('Could not save profile', e.message || 'Please try again.');
    }
  }

  // ── Skip: mark done without API call ───────────────────────────────────
  function handleSkip() {
    Alert.alert(
      'Skip Setup?',
      'You can complete your profile later from the Profile tab.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Skip',
          onPress: async () => {
            await Storage.set(KEYS.PROFILE_SETUP_DONE, true);
            navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
          },
        },
      ],
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <Text style={styles.headerTitle}>Setup Your Profile</Text>
          <Text style={styles.headerSub}>
            Help us personalise your farming experience
          </Text>
        </View>

        <View style={styles.body}>

          {/* ── Avatar picker ─────────────────────────────────────────── */}
          <Label theme={theme}>Choose Your Avatar</Label>
          <View style={styles.avatarRow}>
            {AVATARS.map(av => (
              <TouchableOpacity
                key={av}
                style={[
                  styles.avatarBtn,
                  { borderColor: av === avatar ? theme.primary : theme.border },
                  av === avatar && { backgroundColor: theme.primary + '18' },
                ]}
                onPress={() => setAvatar(av)}
              >
                <Text style={styles.avatarEmoji}>{av}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={[styles.avatarPreview, { backgroundColor: theme.primary + '14' }]}>
            <Text style={styles.avatarPreviewEmoji}>{avatar}</Text>
          </View>

          {/* ── Basic info ────────────────────────────────────────────── */}
          <SectionTitle theme={theme} icon="👤" title="Basic Info" />

          <Label theme={theme}>Full Name *</Label>
          <TextInput
            style={[styles.input, { borderColor: nameErr ? '#EF4444' : theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="e.g. Ramesh Patel"
            placeholderTextColor={theme.subtext}
            value={name}
            onChangeText={v => { setName(v); setNameErr(''); }}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => mobileRef.current?.focus()}
          />
          {nameErr ? <Text style={styles.fieldError}>{nameErr}</Text> : null}

          <Label theme={theme}>Mobile Number</Label>
          <TextInput
            ref={mobileRef}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="+91 98765 43210"
            placeholderTextColor={theme.subtext}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            returnKeyType="next"
            onSubmitEditing={() => dobRef.current?.focus()}
          />

          <Label theme={theme}>Date of Birth (DD/MM/YYYY)</Label>
          <TextInput
            ref={dobRef}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="e.g. 15/08/1990"
            placeholderTextColor={theme.subtext}
            value={dob}
            onChangeText={setDob}
            keyboardType="numbers-and-punctuation"
            returnKeyType="next"
            onSubmitEditing={() => villageRef.current?.focus()}
          />

          {/* ── Location ──────────────────────────────────────────────── */}
          <SectionTitle theme={theme} icon="📍" title="Location" />

          <Label theme={theme}>Village / Town</Label>
          <TextInput
            ref={villageRef}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="e.g. Anand, Rajkot"
            placeholderTextColor={theme.subtext}
            value={village}
            onChangeText={setVillage}
            returnKeyType="next"
            onSubmitEditing={() => addressRef.current?.focus()}
          />

          <Label theme={theme}>Address</Label>
          <TextInput
            ref={addressRef}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="Street / Colony / Landmark"
            placeholderTextColor={theme.subtext}
            value={address}
            onChangeText={setAddress}
            returnKeyType="next"
            onSubmitEditing={() => cityRef.current?.focus()}
          />

          <Label theme={theme}>City</Label>
          <TextInput
            ref={cityRef}
            style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.card }]}
            placeholder="e.g. Ahmedabad"
            placeholderTextColor={theme.subtext}
            value={city}
            onChangeText={setCity}
            returnKeyType="done"
          />

          <Label theme={theme}>State</Label>
          <View style={styles.chipRow}>
            {STATES.map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.chip,
                  {
                    borderColor:     state === s ? theme.primary : theme.border,
                    backgroundColor: state === s ? theme.primary + '14' : theme.card,
                  },
                ]}
                onPress={() => setState(s)}
              >
                <Text style={[styles.chipText, { color: state === s ? theme.primary : theme.subtext }]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Crops ─────────────────────────────────────────────────── */}
          <SectionTitle theme={theme} icon="🌱" title="Crops You Grow" />
          <Text style={[styles.hint, { color: theme.subtext }]}>Select all that apply</Text>
          {cropsLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
          ) : (
          <View style={styles.chipRow}>
            {cropList.map(c => (
              <TouchableOpacity
                key={c.cropId}
                style={[
                  styles.cropChip,
                  {
                    borderColor:     crops.includes(c.cropId) ? theme.primary : theme.border,
                    backgroundColor: crops.includes(c.cropId) ? theme.primary + '14' : theme.card,
                  },
                ]}
                onPress={() => toggleCrop(c.cropId)}
              >
                <Text style={styles.cropIcon}>{c.icon}</Text>
                <Text style={[styles.chipText, { color: crops.includes(c.cropId) ? theme.primary : theme.subtext }]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          )}

          {/* ── Language ──────────────────────────────────────────────── */}
          <SectionTitle theme={theme} icon="🌐" title="Preferred Language" />
          <View style={styles.langRow}>
            {LANGUAGES.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[
                  styles.langBtn,
                  { borderColor: theme.border, backgroundColor: theme.card },
                  language === l.code && { backgroundColor: theme.primary + '14', borderColor: theme.primary },
                ]}
                onPress={() => changeLanguage(l.code)}
              >
                <Text style={[styles.langBtnText, { color: language === l.code ? theme.primary : theme.subtext }]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Save button ───────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: saving ? theme.subtext : theme.primary }]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.88}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveBtnText}>Start Using HANARAD</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} disabled={saving}>
            <Text style={[styles.skipBtnText, { color: theme.subtext }]}>Skip for now →</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Small local helpers (not exported — used only in this file) ─────────────
function Label({ children, theme }) {
  return (
    <Text style={[styles.label, { color: theme.subtext }]}>{children}</Text>
  );
}

function SectionTitle({ icon, title, theme }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingBottom: 48 },

  header:      { padding: 28, paddingBottom: 32, alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#fff', marginBottom: 8 },
  headerSub:   { fontSize: 14, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 20 },

  body: { paddingHorizontal: 20, paddingTop: 24 },

  // Avatar
  avatarRow:         { flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' },
  avatarBtn:         { width: 56, height: 56, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji:       { fontSize: 28 },
  avatarPreview:     { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 24 },
  avatarPreviewEmoji:{ fontSize: 52 },

  // Section header
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 4 },
  sectionIcon:   { fontSize: 16, marginRight: 6 },
  sectionTitle:  { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },

  // Field
  label:      { fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginBottom: 6, marginTop: 14, textTransform: 'uppercase' },
  input:      { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, marginBottom: 2 },
  fieldError: { fontSize: 12, color: '#EF4444', fontWeight: '600', marginBottom: 4 },
  hint:       { fontSize: 12, marginBottom: 8 },

  // Chips (state + crops)
  chipRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:     { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: 13, fontWeight: '700' },

  cropChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8 },
  cropIcon: { fontSize: 16 },

  // Language
  langRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  langBtn:     { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9 },
  langBtnText: { fontSize: 13, fontWeight: '700' },

  // Save / Skip
  saveBtn:     { borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 32, marginBottom: 12 },
  saveBtnText: { fontSize: 17, fontWeight: '900', color: '#fff' },
  skipBtn:     { alignItems: 'center', paddingVertical: 14 },
  skipBtnText: { fontSize: 15, fontWeight: '600' },
});
