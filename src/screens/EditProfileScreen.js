import React, { useState, useMemo, useCallback, useRef, memo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Image, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar, Modal, Keyboard,
} from 'react-native';
import { SafeAreaView }     from 'react-native-safe-area-context';
import DateTimePicker       from '@react-native-community/datetimepicker';
import { pickFromCamera, pickFromGallery } from '../utils/imagePicker';
import { useAuth }          from '../context/AuthContext';
import { useLanguage }      from '../context/LanguageContext';
import { useTheme }         from '../context/ThemeContext';
import { updateProfileApi } from '../api/profileApi';

// ── Constants ──────────────────────────────────────────────────────────────
const COMPLETION_WEIGHTS = [
  { key: 'name',  w: 20 },
  { key: 'email', w: 20 },
  { key: 'phone', w: 15 },
  { key: 'photo', w: 15 },
  { key: 'city',  w: 10 },
  { key: 'state', w: 10 },
  { key: 'dob',   w: 10 },
];

function calcCompletion(vals) {
  return COMPLETION_WEIGHTS.reduce((sum, { key, w }) => {
    const v = vals[key];
    return sum + (v && String(v).trim() !== '' ? w : 0);
  }, 0);
}

function getCompletionColor(pct) {
  if (pct >= 80) return '#10B981';
  if (pct >= 50) return '#F59E0B';
  return '#EF4444';
}

function parseDate(str) {
  const parts = str.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const dt = new Date(+y, +m - 1, +d);
    if (!isNaN(dt.getTime())) return dt;
  }
  return new Date(2000, 0, 1);
}

function formatDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}/${m}/${date.getFullYear()}`;
}

// ── FormInput — defined OUTSIDE to prevent re-mount on every render ────────
const FormInput = memo(React.forwardRef(function FormInput(
  { label, value, onChangeText, placeholder, keyboardType, autoCapitalize,
    returnKeyType, onSubmitEditing, error, required, theme, isLast },
  ref,
) {
  return (
    <>
      <View style={fi.row}>
        <Text style={[fi.label, { color: theme.subtext }]}>
          {label}{required ? <Text style={fi.required}> *</Text> : null}
        </Text>
        <TextInput
          ref={ref}
          style={[
            fi.input,
            { color: theme.text, borderBottomColor: error ? '#EF4444' : theme.border },
            isLast && fi.inputLast,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.subtext + '80'}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'words'}
          autoCorrect={false}
          returnKeyType={returnKeyType || 'next'}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={returnKeyType === 'done'}
          underlineColorAndroid="transparent"
        />
        {error ? <Text style={fi.error}>{error}</Text> : null}
      </View>
      {!isLast && <View style={[fi.divider, { backgroundColor: theme.border }]} />}
    </>
  );
}));

const fi = StyleSheet.create({
  row:      { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  label:    { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  required: { color: '#EF4444' },
  input: {
    fontSize: 15, paddingBottom: 10, paddingVertical: 0,
    borderBottomWidth: 1,
  },
  inputLast: { borderBottomWidth: 0, paddingBottom: 12 },
  divider:   { height: 1, marginHorizontal: 14 },
  error:     { fontSize: 11, color: '#EF4444', marginTop: 2 },
});

// ── DOBField — native DateTimePicker (iOS modal / Android dialog) ──────────
const DOBField = memo(function DOBField({ label, value, onChange, error, theme, isLast }) {
  const [showPicker,  setShowPicker]  = useState(false);
  const [iosTempDate, setIosTempDate] = useState(null);

  const parsedDate  = value ? parseDate(value) : new Date(2000, 0, 1);
  const displayText = value || 'Select date of birth';
  const hasValue    = Boolean(value);

  const openPicker = () => {
    Keyboard.dismiss();
    setIosTempDate(parsedDate);
    setShowPicker(true);
  };

  if (Platform.OS === 'android') {
    return (
      <>
        <View style={fi.row}>
          <Text style={[fi.label, { color: theme.subtext }]}>{label}</Text>
          <TouchableOpacity onPress={openPicker} activeOpacity={0.7}>
            <Text style={[
              fi.input,
              { borderBottomColor: error ? '#EF4444' : theme.border },
              { color: hasValue ? theme.text : theme.subtext + '80' },
              isLast && fi.inputLast,
            ]}>
              {displayText}
            </Text>
          </TouchableOpacity>
          {error ? <Text style={fi.error}>{error}</Text> : null}
          {showPicker && (
            <DateTimePicker
              value={parsedDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              minimumDate={new Date(1940, 0, 1)}
              onChange={(evt, date) => {
                setShowPicker(false);
                if (evt.type !== 'dismissed' && date) onChange(formatDate(date));
              }}
            />
          )}
        </View>
        {!isLast && <View style={[fi.divider, { backgroundColor: theme.border }]} />}
      </>
    );
  }

  // iOS — bottom-sheet modal with spinner
  return (
    <>
      <View style={fi.row}>
        <Text style={[fi.label, { color: theme.subtext }]}>{label}</Text>
        <TouchableOpacity onPress={openPicker} activeOpacity={0.7}>
          <Text style={[
            fi.input,
            { borderBottomColor: error ? '#EF4444' : theme.border },
            { color: hasValue ? theme.text : theme.subtext + '80' },
            isLast && fi.inputLast,
          ]}>
            {displayText}
          </Text>
        </TouchableOpacity>
        {error ? <Text style={fi.error}>{error}</Text> : null}
      </View>
      {!isLast && <View style={[fi.divider, { backgroundColor: theme.border }]} />}

      <Modal visible={showPicker} transparent animationType="slide">
        <TouchableOpacity
          style={dobs.overlay}
          onPress={() => setShowPicker(false)}
          activeOpacity={1}
        />
        <View style={dobs.sheet}>
          <View style={dobs.header}>
            <TouchableOpacity onPress={() => setShowPicker(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={dobs.cancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={dobs.title}>{label}</Text>
            <TouchableOpacity
              onPress={() => { if (iosTempDate) onChange(formatDate(iosTempDate)); setShowPicker(false); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={dobs.done}>Done</Text>
            </TouchableOpacity>
          </View>
          <DateTimePicker
            value={iosTempDate || parsedDate}
            mode="date"
            display="spinner"
            maximumDate={new Date()}
            minimumDate={new Date(1940, 0, 1)}
            onChange={(_, date) => { if (date) setIosTempDate(date); }}
            style={{ height: 200 }}
          />
        </View>
      </Modal>
    </>
  );
});

const dobs = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  title:  { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  cancel: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  done:   { fontSize: 15, color: '#16A34A', fontWeight: '700' },
});

// ── Styles ─────────────────────────────────────────────────────────────────
function makeStyles(theme) {
  return StyleSheet.create({
    root:          { flex: 1, backgroundColor: theme.background },
    scroll:        { flex: 1 },
    scrollContent: { paddingBottom: 120 },

    header: {
      backgroundColor: theme.primary,
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 16, paddingBottom: 14,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.18)',
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    backTxt:     { fontSize: 20, color: '#FFFFFF', fontWeight: '700' },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    headerSave: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6,
    },
    headerSaveTxt: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

    completionBox: {
      backgroundColor: theme.card,
      marginHorizontal: 16, marginTop: 16, borderRadius: 14, padding: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    completionRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    completionLabel:{ fontSize: 13, fontWeight: '700', color: theme.text },
    completionPct:  { fontSize: 13, fontWeight: '800' },
    progressTrack:  { height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' },
    progressFill:   { height: 8, borderRadius: 4 },

    photoSection: { alignItems: 'center', paddingVertical: 24 },
    photoWrap: {
      width: 110, height: 110, borderRadius: 55,
      borderWidth: 3, borderColor: theme.primary,
      overflow: 'hidden', position: 'relative',
    },
    photoImg:  { width: '100%', height: '100%' },
    photoInit: {
      width: '100%', height: '100%',
      backgroundColor: theme.primary,
      alignItems: 'center', justifyContent: 'center',
    },
    photoInitTxt: { fontSize: 38, fontWeight: '800', color: '#FFFFFF' },
    photoBadge: {
      position: 'absolute', bottom: 0, right: 0,
      backgroundColor: theme.primary, width: 32, height: 32,
      borderRadius: 16, alignItems: 'center', justifyContent: 'center',
      borderWidth: 2, borderColor: theme.card,
    },
    photoBadgeTxt: { fontSize: 15 },
    photoName:  { fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 10 },
    photoEmail: { fontSize: 13, color: theme.subtext, marginTop: 2 },

    section:       { marginHorizontal: 16, marginTop: 16 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    sectionIcon:   { fontSize: 16, marginRight: 6 },
    sectionTitle:  { fontSize: 12, fontWeight: '700', color: theme.subtext, letterSpacing: 1 },

    fieldCard: {
      backgroundColor: theme.card, borderRadius: 14, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },

    langRow:       { flexDirection: 'row', gap: 8, padding: 14 },
    langBtn: {
      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
      borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.background,
    },
    langBtnActive:    { backgroundColor: theme.light, borderColor: theme.primary },
    langBtnTxt:       { fontSize: 13, fontWeight: '700', color: theme.subtext },
    langBtnTxtActive: { color: theme.primary },

    saveBtn: {
      position: 'absolute', bottom: 24, left: 24, right: 24,
      backgroundColor: theme.primary, borderRadius: 16,
      paddingVertical: 16, alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: 8,
      shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
    },
    saveBtnDisabled: { opacity: 0.65 },
    saveBtnTxt: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 },

    toast: {
      position: 'absolute', top: 80, left: 24, right: 24,
      borderRadius: 12, padding: 14,
      flexDirection: 'row', alignItems: 'center', gap: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
    },
    toastTxt: { fontSize: 14, fontWeight: '600', flex: 1 },
  });
}

// ══════════════════════════════════════════════════════════════════════════
export default function EditProfileScreen({ navigation }) {
  const { user, updateUser }            = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const { theme, isDark }               = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // ── Individual field state (avoids whole-form re-render on each keystroke)
  const [name,    setName]    = useState(user?.name     || '');
  const [username,setUsername]= useState(user?.username || '');
  const [email,   setEmail]   = useState(user?.email    || '');
  const [phone,   setPhone]   = useState(user?.phone    || '');
  const [dob,     setDob]     = useState(user?.dob      || '');
  const [address, setAddress] = useState(user?.address  || '');
  const [city,    setCity]    = useState(user?.city     || '');
  const [state_,  setState_]  = useState(user?.state    || '');
  const [country, setCountry] = useState(user?.country  || 'India');
  const [photo,   setPhoto]   = useState(user?.photo    || null);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState(null);

  // ── Refs for keyboard focus chain ──────────────────────────────────────
  const nameRef     = useRef(null);
  const usernameRef = useRef(null);
  const emailRef    = useRef(null);
  const phoneRef    = useRef(null);
  const addressRef  = useRef(null);
  const cityRef     = useRef(null);
  const stateRef    = useRef(null);
  const countryRef  = useRef(null);

  // ── Stable onChange callbacks (referential equality for memo) ──────────
  const onChangeName     = useCallback(v => { setName(v);     setErrors(e => ({ ...e, name: null }));    }, []);
  const onChangeUsername = useCallback(v => { setUsername(v); setErrors(e => ({ ...e, username: null })); }, []);
  const onChangeEmail    = useCallback(v => { setEmail(v);    setErrors(e => ({ ...e, email: null }));   }, []);
  const onChangePhone    = useCallback(v => { setPhone(v);    setErrors(e => ({ ...e, phone: null }));   }, []);
  const onChangeDob      = useCallback(v => { setDob(v);      setErrors(e => ({ ...e, dob: null }));     }, []);
  const onChangeAddress  = useCallback(v => { setAddress(v);  setErrors(e => ({ ...e, address: null })); }, []);
  const onChangeCity     = useCallback(v => { setCity(v);     setErrors(e => ({ ...e, city: null }));    }, []);
  const onChangeState_   = useCallback(v => { setState_(v);   setErrors(e => ({ ...e, state: null }));   }, []);
  const onChangeCountry  = useCallback(v => { setCountry(v);  setErrors(e => ({ ...e, country: null })); }, []);

  // ── Completion ─────────────────────────────────────────────────────────
  const completion = useMemo(
    () => calcCompletion({ name, email, phone, photo, city, state: state_, dob }),
    [name, email, phone, photo, city, state_, dob],
  );
  const completionColor = getCompletionColor(completion);

  const getInitials = (n) =>
    (n || 'FA').split(' ').map(x => x[0]).join('').toUpperCase().slice(0, 2);

  // ── Toast ──────────────────────────────────────────────────────────────
  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Photo picker ───────────────────────────────────────────────────────
  const handlePhoto = useCallback(() => {
    Alert.alert(t('photoOptions'), '', [
      { text: t('fromCamera'),  onPress: async () => { const u = await pickFromCamera(t);  if (u) setPhoto(u); } },
      { text: t('fromGallery'), onPress: async () => { const u = await pickFromGallery(t); if (u) setPhoto(u); } },
      photo
        ? { text: t('removePhoto'), style: 'destructive', onPress: () => setPhoto(null) }
        : null,
      { text: t('cancel'), style: 'cancel' },
    ].filter(Boolean));
  }, [photo, t]);

  // ── Validation ─────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!name.trim())  e.name  = t('requiredField');
    if (!email.trim()) e.email = t('requiredField');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = t('invalidEmail');
    if (phone.trim() && !/^[+\d\s\-()]{8,15}$/.test(phone.trim())) e.phone = t('invalidPhone');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ───────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const docId = user?._id ?? user?.id;
      if (!docId) throw new Error('User session not found. Please log in again.');

      await updateProfileApi(docId, {
        username: (username.trim() || name.trim()).toLowerCase().replace(/\s+/g, '_'),
        mobile:   phone.trim(),
        dob:      dob.trim(),
        address:  address.trim(),
        city:     city.trim(),
        state:    state_.trim(),
        language,
      });

      await updateUser({
        name:    name.trim(),
        username: username.trim(),
        email:   email.trim().toLowerCase(),
        phone:   phone.trim(),
        dob:     dob.trim(),
        address: address.trim(),
        city:    city.trim(),
        state:   state_.trim(),
        country: country.trim(),
        photo,
      });

      showToast(t('profileUpdated'), true);
    } catch (e) {
      showToast(e.message || 'Failed to save profile.', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backTxt}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('editProfileTitle')}</Text>
        <TouchableOpacity style={styles.headerSave} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          {saving
            ? <ActivityIndicator size="small" color="#FFFFFF" />
            : <Text style={styles.headerSaveTxt}>{t('save')}</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          {/* Completion bar */}
          <View style={styles.completionBox}>
            <View style={styles.completionRow}>
              <Text style={styles.completionLabel}>{t('profileCompletion')}</Text>
              <Text style={[styles.completionPct, { color: completionColor }]}>{completion}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%`, backgroundColor: completionColor }]} />
            </View>
          </View>

          {/* Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={handlePhoto} activeOpacity={0.85}>
              <View style={styles.photoWrap}>
                {photo
                  ? <Image source={{ uri: photo }} style={styles.photoImg} />
                  : <View style={styles.photoInit}><Text style={styles.photoInitTxt}>{getInitials(name)}</Text></View>}
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeTxt}>📷</Text>
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.photoName}>{name || t('farmer')}</Text>
            <Text style={styles.photoEmail}>{email || ''}</Text>
          </View>

          {/* Personal Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionTitle}>{t('profileInfo')}</Text>
            </View>
            <View style={styles.fieldCard}>
              <FormInput
                ref={nameRef}
                label={t('fullName')}
                value={name}
                onChangeText={onChangeName}
                placeholder="e.g. Ramesh Patel"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => usernameRef.current?.focus()}
                error={errors.name}
                required
                theme={theme}
              />
              <FormInput
                ref={usernameRef}
                label={t('usernameLabel')}
                value={username}
                onChangeText={onChangeUsername}
                placeholder="e.g. ramesh_farmer"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                error={errors.username}
                theme={theme}
              />
              <FormInput
                ref={emailRef}
                label={t('emailAddress')}
                value={email}
                onChangeText={onChangeEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => phoneRef.current?.focus()}
                error={errors.email}
                required
                theme={theme}
              />
              <FormInput
                ref={phoneRef}
                label={t('phoneNumber')}
                value={phone}
                onChangeText={onChangePhone}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                error={errors.phone}
                theme={theme}
              />
              <DOBField
                label={t('dateOfBirth')}
                value={dob}
                onChange={onChangeDob}
                error={errors.dob}
                theme={theme}
                isLast
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📍</Text>
              <Text style={styles.sectionTitle}>{t('locationInfo')}</Text>
            </View>
            <View style={styles.fieldCard}>
              <FormInput
                ref={addressRef}
                label={t('addressLabel')}
                value={address}
                onChangeText={onChangeAddress}
                placeholder={t('addressPlaceholder')}
                returnKeyType="next"
                onSubmitEditing={() => cityRef.current?.focus()}
                error={errors.address}
                theme={theme}
              />
              <FormInput
                ref={cityRef}
                label={t('cityLabel')}
                value={city}
                onChangeText={onChangeCity}
                placeholder={t('cityPlaceholder')}
                returnKeyType="next"
                onSubmitEditing={() => stateRef.current?.focus()}
                error={errors.city}
                theme={theme}
              />
              <FormInput
                ref={stateRef}
                label={t('stateLabel')}
                value={state_}
                onChangeText={onChangeState_}
                placeholder={t('statePlaceholder')}
                returnKeyType="next"
                onSubmitEditing={() => countryRef.current?.focus()}
                error={errors.state}
                theme={theme}
              />
              <FormInput
                ref={countryRef}
                label={t('countryLabel')}
                value={country}
                onChangeText={onChangeCountry}
                placeholder="India"
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
                error={errors.country}
                theme={theme}
                isLast
              />
            </View>
          </View>

          {/* Language */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🌐</Text>
              <Text style={styles.sectionTitle}>{t('languagePref')}</Text>
            </View>
            <View style={styles.fieldCard}>
              <View style={styles.langRow}>
                {[
                  { code: 'en', label: 'English' },
                  { code: 'hi', label: 'हिंदी' },
                  { code: 'gu', label: 'ગુજરાતી' },
                ].map(l => (
                  <TouchableOpacity
                    key={l.code}
                    style={[styles.langBtn, language === l.code && styles.langBtnActive]}
                    onPress={() => changeLanguage(l.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.langBtnTxt, language === l.code && styles.langBtnTxtActive]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.88}
      >
        {saving
          ? <ActivityIndicator color="#FFFFFF" />
          : <><Text style={{ fontSize: 18 }}>💾</Text><Text style={styles.saveBtnTxt}>{t('saveChanges')}</Text></>}
      </TouchableOpacity>

      {/* Toast */}
      {toast && (
        <View style={[styles.toast, { backgroundColor: toast.ok ? '#DCFCE7' : '#FEF2F2' }]}>
          <Text style={{ fontSize: 18 }}>{toast.ok ? '✅' : '❌'}</Text>
          <Text style={[styles.toastTxt, { color: toast.ok ? '#15803D' : '#DC2626' }]}>{toast.msg}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
