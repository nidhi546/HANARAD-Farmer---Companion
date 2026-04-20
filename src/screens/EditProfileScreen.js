import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Image, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { SafeAreaView }   from 'react-native-safe-area-context';
import * as ImagePicker   from 'expo-image-picker';
import { useAuth }        from '../context/AuthContext';
import { useLanguage }    from '../context/LanguageContext';
import { useTheme }       from '../context/ThemeContext';

// ── Constants ──────────────────────────────────────────────────────────────
const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
];

// Weighted fields for completion %
const COMPLETION_WEIGHTS = [
  { key: 'name',    w: 20 },
  { key: 'email',   w: 20 },
  { key: 'phone',   w: 15 },
  { key: 'photo',   w: 15 },
  { key: 'city',    w: 10 },
  { key: 'state',   w: 10 },
  { key: 'dob',     w: 10 },
];

function calcCompletion(form) {
  const score = COMPLETION_WEIGHTS.reduce((sum, { key, w }) => {
    const v = form[key];
    return sum + (v && String(v).trim() !== '' ? w : 0);
  }, 0);
  return score;
}

function getCompletionColor(pct) {
  if (pct >= 80) return '#10B981';
  if (pct >= 50) return '#F59E0B';
  return '#EF4444';
}

// ── Styles ─────────────────────────────────────────────────────────────────
function makeStyles(theme, isDark) {
  return StyleSheet.create({
    root:   { flex: 1, backgroundColor: theme.background },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 120 },

    // Header bar
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
    backTxt:    { fontSize: 20, color: '#FFFFFF', fontWeight: '700' },
    headerTitle:{ flex: 1, fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    headerSave: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderRadius: 10, paddingHorizontal: 14, paddingVertical: 6,
    },
    headerSaveTxt: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

    // Completion bar
    completionBox: {
      backgroundColor: theme.card,
      marginHorizontal: 16, marginTop: 16, borderRadius: 14,
      padding: 14,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    },
    completionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    completionLabel: { fontSize: 13, fontWeight: '700', color: theme.text },
    completionPct:   { fontSize: 13, fontWeight: '800' },
    progressTrack: { height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' },
    progressFill:  { height: 8, borderRadius: 4 },

    // Photo section
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
    photoName: { fontSize: 18, fontWeight: '800', color: theme.text, marginTop: 10 },
    photoEmail:{ fontSize: 13, color: theme.subtext, marginTop: 2 },

    // Section
    section: { marginHorizontal: 16, marginTop: 16 },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    },
    sectionIcon: { fontSize: 16, marginRight: 6 },
    sectionTitle: { fontSize: 12, fontWeight: '700', color: theme.subtext, letterSpacing: 1 },

    // Field card
    fieldCard: {
      backgroundColor: theme.card, borderRadius: 14, overflow: 'hidden',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    fieldRow: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
    fieldLabel: { fontSize: 11, fontWeight: '700', color: theme.subtext, letterSpacing: 0.5, marginBottom: 4 },
    fieldInput: {
      fontSize: 15, color: theme.text, paddingBottom: 10,
      borderBottomWidth: 1, borderBottomColor: theme.border,
    },
    fieldInputLast: { borderBottomWidth: 0, paddingBottom: 12 },
    fieldDivider: { height: 1, backgroundColor: theme.border, marginHorizontal: 14 },
    requiredDot: { color: '#EF4444' },

    // Error text
    errorText: { fontSize: 11, color: '#EF4444', marginTop: 4, marginLeft: 14 },

    // Language switcher
    langRow: { flexDirection: 'row', gap: 8, padding: 14 },
    langBtn: {
      flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
      borderWidth: 1.5, borderColor: theme.border, backgroundColor: theme.background,
    },
    langBtnActive: { backgroundColor: theme.light, borderColor: theme.primary },
    langBtnTxt:    { fontSize: 13, fontWeight: '700', color: theme.subtext },
    langBtnTxtActive: { color: theme.primary },

    // Change password toggle
    pwdToggle: {
      backgroundColor: theme.card, borderRadius: 14,
      padding: 14, flexDirection: 'row', alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    pwdToggleIcon: { fontSize: 18, marginRight: 10 },
    pwdToggleTxt:  { flex: 1, fontSize: 14, fontWeight: '600', color: theme.text },
    pwdToggleArrow:{ fontSize: 18, color: theme.subtext },

    // Save button
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

    // Toast
    toast: {
      position: 'absolute', top: 16, left: 24, right: 24,
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
  const { user, updateUser }       = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const { theme, isDark }          = useTheme();
  const styles                     = useMemo(() => makeStyles(theme, isDark), [theme, isDark]);

  // ── Form state ─────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    name:     user?.name     || '',
    username: user?.username || '',
    email:    user?.email    || '',
    phone:    user?.phone    || '',
    dob:      user?.dob      || '',
    address:  user?.address  || '',
    city:     user?.city     || '',
    state:    user?.state    || '',
    country:  user?.country  || 'India',
    photo:    user?.photo    || null,
  });

  const [errors,    setErrors]    = useState({});
  const [saving,    setSaving]    = useState(false);
  const [showPwd,   setShowPwd]   = useState(false);
  const [pwdForm,   setPwdForm]   = useState({ current: '', newPwd: '', confirm: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [toast,     setToast]     = useState(null); // { msg, ok }

  const completion = useMemo(() => calcCompletion(form), [form]);
  const completionColor = getCompletionColor(completion);

  const set = useCallback((key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: null }));
  }, []);

  const getInitials = (name) =>
    (name || 'FA').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  // ── Toast helper ───────────────────────────────────────────────────────
  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Photo picker ───────────────────────────────────────────────────────
  const handlePhoto = () => {
    Alert.alert(t('photoOptions'), '', [
      {
        text: t('fromCamera'), onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed'); return; }
          const res = await ImagePicker.launchCameraAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.7,
          });
          if (!res.canceled) set('photo', res.assets[0].uri);
        },
      },
      {
        text: t('fromGallery'), onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Permission needed'); return; }
          const res = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true, aspect: [1, 1], quality: 0.7,
          });
          if (!res.canceled) set('photo', res.assets[0].uri);
        },
      },
      form.photo ? { text: t('removePhoto'), style: 'destructive', onPress: () => set('photo', null) } : null,
      { text: t('cancel'), style: 'cancel' },
    ].filter(Boolean));
  };

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim())  e.name  = t('requiredField');
    if (!form.email.trim()) e.email = t('requiredField');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = t('invalidEmail');
    if (form.phone.trim() && !/^[+\d\s\-()]{8,15}$/.test(form.phone.trim())) e.phone = t('invalidPhone');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePwd = () => {
    const e = {};
    if (!pwdForm.current) e.current = t('requiredField');
    if (!pwdForm.newPwd || pwdForm.newPwd.length < 6) e.newPwd = 'Min. 6 characters';
    if (pwdForm.newPwd !== pwdForm.confirm) e.confirm = t('passwordMismatch');
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save profile ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateUser({
        name:     form.name.trim(),
        username: form.username.trim(),
        email:    form.email.trim().toLowerCase(),
        phone:    form.phone.trim(),
        dob:      form.dob.trim(),
        address:  form.address.trim(),
        city:     form.city.trim(),
        state:    form.state.trim(),
        country:  form.country.trim(),
        photo:    form.photo,
      });
      showToast(t('profileUpdated'), true);
    } catch (e) {
      showToast(e.message || 'Failed to save.', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ─────────────────────────────────────────────────────
  const handleChangePwd = async () => {
    if (!validatePwd()) return;
    setSaving(true);
    try {
      // Local mock: just save the new password flag
      await updateUser({ passwordChanged: true });
      setPwdForm({ current: '', newPwd: '', confirm: '' });
      setShowPwd(false);
      showToast(t('passwordChanged'), true);
    } catch (e) {
      showToast('Failed to change password.', false);
    } finally {
      setSaving(false);
    }
  };

  // ── Field component ─────────────────────────────────────────────────────
  const Field = ({ label, fkey, placeholder, keyboard = 'default', required = false, isLast = false, secure = false }) => (
    <>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>
          {label}{required && <Text style={styles.requiredDot}> *</Text>}
        </Text>
        <TextInput
          style={[styles.fieldInput, isLast && styles.fieldInputLast,
            errors[fkey] && { borderBottomColor: '#EF4444' }]}
          value={form[fkey]}
          onChangeText={v => set(fkey, v)}
          placeholder={placeholder}
          placeholderTextColor={theme.subtext + '80'}
          keyboardType={keyboard}
          autoCapitalize={keyboard === 'email-address' ? 'none' : 'words'}
          secureTextEntry={secure}
        />
        {errors[fkey] && <Text style={styles.errorText}>{errors[fkey]}</Text>}
      </View>
      {!isLast && <View style={styles.fieldDivider} />}
    </>
  );

  const PwdField = ({ label, fkey, isLast = false }) => (
    <>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          style={[styles.fieldInput, isLast && styles.fieldInputLast,
            pwdErrors[fkey] && { borderBottomColor: '#EF4444' }]}
          value={pwdForm[fkey]}
          onChangeText={v => { setPwdForm(p => ({ ...p, [fkey]: v })); setPwdErrors(e => ({ ...e, [fkey]: null })); }}
          placeholder="••••••••"
          placeholderTextColor={theme.subtext + '80'}
          secureTextEntry
          autoCapitalize="none"
        />
        {pwdErrors[fkey] && <Text style={styles.errorText}>{pwdErrors[fkey]}</Text>}
      </View>
      {!isLast && <View style={styles.fieldDivider} />}
    </>
  );

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* ── Header ── */}
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
        >

          {/* ── Completion bar ── */}
          <View style={styles.completionBox}>
            <View style={styles.completionRow}>
              <Text style={styles.completionLabel}>{t('profileCompletion')}</Text>
              <Text style={[styles.completionPct, { color: completionColor }]}>{completion}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${completion}%`, backgroundColor: completionColor }]} />
            </View>
          </View>

          {/* ── Photo ── */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={handlePhoto} activeOpacity={0.85}>
              <View style={styles.photoWrap}>
                {form.photo
                  ? <Image source={{ uri: form.photo }} style={styles.photoImg} />
                  : <View style={styles.photoInit}><Text style={styles.photoInitTxt}>{getInitials(form.name)}</Text></View>}
                <View style={styles.photoBadge}>
                  <Text style={styles.photoBadgeTxt}>📷</Text>
                </View>
              </View>
            </TouchableOpacity>
            <Text style={styles.photoName}>{form.name || t('farmer')}</Text>
            <Text style={styles.photoEmail}>{form.email || ''}</Text>
          </View>

          {/* ── Personal Info ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionTitle}>{t('profileInfo')}</Text>
            </View>
            <View style={styles.fieldCard}>
              <Field label={t('fullName')}    fkey="name"     placeholder="e.g. Ramesh Patel" required />
              <Field label={t('usernameLabel')} fkey="username" placeholder="e.g. ramesh_farmer" />
              <Field label={t('emailAddress')} fkey="email"   placeholder="you@example.com" keyboard="email-address" required />
              <Field label={t('phoneNumber')} fkey="phone"    placeholder="+91 98765 43210" keyboard="phone-pad" />
              <Field label={t('dateOfBirth')} fkey="dob"      placeholder="DD/MM/YYYY" keyboard="numeric" isLast />
            </View>
          </View>

          {/* ── Location ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📍</Text>
              <Text style={styles.sectionTitle}>{t('locationInfo')}</Text>
            </View>
            <View style={styles.fieldCard}>
              <Field label={t('addressLabel')}  fkey="address" placeholder={t('addressPlaceholder')} />
              <Field label={t('cityLabel')}     fkey="city"    placeholder={t('cityPlaceholder')} />
              <Field label={t('stateLabel')}    fkey="state"   placeholder={t('statePlaceholder')} />
              <Field label={t('countryLabel')}  fkey="country" placeholder="India" isLast />
            </View>
          </View>

          {/* ── Language ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🌐</Text>
              <Text style={styles.sectionTitle}>{t('languagePref')}</Text>
            </View>
            <View style={styles.fieldCard}>
              <View style={styles.langRow}>
                {[{ code: 'en', label: 'English' }, { code: 'hi', label: 'हिंदी' }, { code: 'gu', label: 'ગુજરાતી' }].map(l => (
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

          {/* ── Change Password ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🔒</Text>
              <Text style={styles.sectionTitle}>{t('securitySection')}</Text>
            </View>
            <TouchableOpacity style={styles.pwdToggle} onPress={() => setShowPwd(p => !p)} activeOpacity={0.7}>
              <Text style={styles.pwdToggleIcon}>🔑</Text>
              <Text style={styles.pwdToggleTxt}>{t('changePassword')}</Text>
              <Text style={styles.pwdToggleArrow}>{showPwd ? '▾' : '›'}</Text>
            </TouchableOpacity>

            {showPwd && (
              <View style={[styles.fieldCard, { marginTop: 8 }]}>
                <PwdField label={t('currentPassword')} fkey="current" />
                <PwdField label={t('newPassword')}     fkey="newPwd" />
                <PwdField label={t('confirmNewPassword')} fkey="confirm" isLast />
                <TouchableOpacity
                  style={{ margin: 14, marginTop: 4, backgroundColor: theme.primary, borderRadius: 10, padding: 12, alignItems: 'center' }}
                  onPress={handleChangePwd}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  {saving
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>{t('changePassword')}</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Floating Save ── */}
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

      {/* ── Toast ── */}
      {toast && (
        <View style={[styles.toast, { backgroundColor: toast.ok ? '#DCFCE7' : '#FEF2F2', top: 80 }]}>
          <Text style={{ fontSize: 18 }}>{toast.ok ? '✅' : '❌'}</Text>
          <Text style={[styles.toastTxt, { color: toast.ok ? '#15803D' : '#DC2626' }]}>{toast.msg}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
