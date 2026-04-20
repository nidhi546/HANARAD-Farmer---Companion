import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forgotPasswordApi } from '../api/authApi';
import { useLanguage } from '../context/LanguageContext';
import { THEME } from '../constants/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    setError('');
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) { setError('Please enter your email.'); return; }
    if (!emailReg.test(email.trim())) { setError('Please enter a valid email address.'); return; }

    setLoading(true);
    try {
      await forgotPasswordApi(email.trim().toLowerCase());
      setSent(true);
    } catch (e) {
      setError(e.message || 'Failed to send reset link. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.inner}>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← {t('back')}</Text>
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>{sent ? '✅' : '🔑'}</Text>
          </View>

          {sent ? (
            <>
              <Text style={styles.title}>{t('checkEmail')}</Text>
              <Text style={styles.subtitle}>
                {t('resetSent')}{'\n'}
                <Text style={{ color: THEME.primary, fontWeight: '700' }}>{email}</Text>
              </Text>
              <Text style={styles.hint}>
                Didn't receive it? Check your spam folder or try again.
              </Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryBtnText}>{t('backToSignIn')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.title}>{t('forgotTitle')}</Text>
              <Text style={styles.subtitle}>{t('forgotSubtitle')}</Text>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>⚠️  {error}</Text>
                </View>
              ) : null}

              <Text style={styles.label}>{t('emailAddress')}</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('emailPlaceholder')}
                  placeholderTextColor={THEME.subtext}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleSend}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color={THEME.white} />
                  : <Text style={styles.primaryBtnText}>{t('sendResetLink')}</Text>
                }
              </TouchableOpacity>

              <View style={styles.loginRow}>
                <Text style={styles.loginText}>{t('rememberPassword')}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>{t('loginLink')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: THEME.background },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  backBtn: { paddingVertical: 4, marginBottom: 32, alignSelf: 'flex-start' },
  backText: { fontSize: 14, color: THEME.primary, fontWeight: '600' },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: THEME.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  iconEmoji: { fontSize: 44 },
  title: { fontSize: 26, fontWeight: '800', color: THEME.text, textAlign: 'center', marginBottom: 12 },
  subtitle: {
    fontSize: 14,
    color: THEME.subtext,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  hint: {
    fontSize: 13,
    color: THEME.subtext,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
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
    backgroundColor: THEME.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.border,
    marginBottom: 24,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: THEME.text, paddingVertical: 0 },
  primaryBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: THEME.white, letterSpacing: 0.3 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14, color: THEME.subtext },
  loginLink: { fontSize: 14, color: THEME.primary, fontWeight: '700' },
});
