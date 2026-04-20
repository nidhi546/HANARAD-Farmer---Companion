import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { THEME } from '../constants/theme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => { setForm(f => ({ ...f, [key]: val })); setError(''); };

  const validate = () => {
    if (!form.name.trim()) { setError('Full name is required.'); return false; }
    if (form.name.trim().length < 2) { setError('Name must be at least 2 characters.'); return false; }
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) { setError('Email is required.'); return false; }
    if (!emailReg.test(form.email.trim())) { setError('Please enter a valid email.'); return false; }
    if (form.phone && !/^\d{10}$/.test(form.phone.trim())) {
      setError('Please enter a valid 10-digit mobile number.'); return false;
    }
    if (!form.password) { setError('Password is required.'); return false; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return false; }
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return false; }
    return true;
  };

  const handleRegister = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.phone.trim(), form.password);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e) {
      setError(e.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← {t('back')}</Text>
            </TouchableOpacity>
            <View style={styles.headerLogo}>
              <Text style={styles.headerEmoji}>🌾</Text>
            </View>
            <Text style={styles.title}>{t('createAccount')}</Text>
            <Text style={styles.subtitle}>{t('joinTagline')}</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            ) : null}

            <Field label={t('fullName')} icon="👤" placeholder="e.g. Ramesh Patel"
              value={form.name} onChangeText={v => set('name', v)} />

            <Field label={t('emailAddress')} icon="✉️" placeholder={t('emailPlaceholder')}
              value={form.email} onChangeText={v => set('email', v)}
              keyboardType="email-address" autoCapitalize="none" />

            <Field label={t('mobileNumber')} icon="📱" placeholder="10-digit mobile number"
              value={form.phone} onChangeText={v => set('phone', v)}
              keyboardType="phone-pad" />

            {/* Password */}
            <Text style={styles.label}>{t('password')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder={t('passwordPlaceholder')}
                placeholderTextColor={THEME.subtext}
                value={form.password}
                onChangeText={v => set('password', v)}
                secureTextEntry={!showPass}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showPass ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text style={styles.label}>{t('confirmPassword')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder={t('confirmPassword')}
                placeholderTextColor={THEME.subtext}
                value={form.confirm}
                onChangeText={v => set('confirm', v)}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                <Text style={styles.eyeIcon}>{showConfirm ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.registerBtn, loading && styles.registerBtnDisabled]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={THEME.white} />
                : <Text style={styles.registerBtnText}>{t('createAccount')}</Text>
              }
            </TouchableOpacity>
          </View>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>{t('alreadyAccount')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>{t('loginLink')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, icon, placeholder, value, onChangeText, keyboardType, autoCapitalize }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={THEME.subtext}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          autoCapitalize={autoCapitalize || 'words'}
          autoCorrect={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  header: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  backBtn: { alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 16 },
  backText: { fontSize: 14, color: THEME.primary, fontWeight: '600' },
  headerLogo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: THEME.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  headerEmoji: { fontSize: 36 },
  title: { fontSize: 24, fontWeight: '800', color: THEME.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: THEME.subtext, marginTop: 4 },
  card: {
    backgroundColor: THEME.white,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: { fontSize: 13, color: THEME.danger, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '600', color: THEME.text, marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.inputBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.border,
    marginBottom: 16,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: THEME.text, paddingVertical: 0 },
  eyeBtn: { padding: 4 },
  eyeIcon: { fontSize: 18 },
  registerBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerBtnDisabled: { opacity: 0.7 },
  registerBtnText: { fontSize: 16, fontWeight: '700', color: THEME.white, letterSpacing: 0.3 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14, color: THEME.subtext },
  loginLink: { fontSize: 14, color: THEME.primary, fontWeight: '700' },
});
