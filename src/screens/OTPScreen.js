import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth }       from '../context/AuthContext';
import { useLanguage }   from '../context/LanguageContext';
import { useTheme }      from '../context/ThemeContext';
import { useAuthFlow }   from '../hooks/useAuthFlow';

const OTP_LENGTH  = 6;
const RESEND_SEC  = 30;

export default function OTPScreen({ navigation, route }) {
  const insets              = useSafeAreaInsets();
  const { login, sendOtp }  = useAuth();
  const { t }               = useLanguage();
  const { theme }           = useTheme();

  const { resolvePostLoginRoute } = useAuthFlow();
  const email = route.params?.email ?? '';

  const [otp,           setOtp]           = useState(Array(OTP_LENGTH).fill(''));
  const [timer,         setTimer]         = useState(RESEND_SEC);
  const [loading,       setLoading]       = useState(false);
  const [resending,     setResending]     = useState(false);
  const [error,         setError]         = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);

  const inputRefs = useRef([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  // Entrance fade-in
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1, duration: 450, useNativeDriver: true,
    }).start();
  }, []);

  // Countdown until resend is available
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  // Auto-submit when every digit is filled
  useEffect(() => {
    if (otp.every(d => d !== '')) {
      verify();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:   0, duration: 50, useNativeDriver: true }),
    ]).start();
  }

  function handleDigit(text, index) {
    setError('');
    const digit = text.replace(/\D/g, '').slice(-1);
    const next  = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e, index) {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const next    = [...otp];
      next[index - 1] = '';
      setOtp(next);
    }
  }

  const verify = useCallback(async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      shake();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const loggedInUser = await login(email, code);
      const nextRoute    = await resolvePostLoginRoute(loggedInUser);

      if (nextRoute === 'ProfileSetup') {
        navigation.replace('ProfileSetup', { email });
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
      }
    } catch (e) {
      const msg = e.message || 'Verification failed. Please try again.';
      setError(msg);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      shake();
    } finally {
      setLoading(false);
    }
  }, [otp, email, login, navigation]);

  const resendOTP = async () => {
    setResendSuccess(false);
    setError('');
    setResending(true);
    try {
      await sendOtp(email);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimer(RESEND_SEC);
      setResendSuccess(true);
      inputRefs.current[0]?.focus();
    } catch (e) {
      setError(e.message || 'Could not resend OTP. Try again.');
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = email.replace(/(.{2}).+(@.+)/, '$1****$2');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}
    >
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        style={{ opacity: fadeAnim }}
      >
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: theme.primary }]}>‹ Back</Text>
        </TouchableOpacity>

        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: theme.primary + '18' }]}>
          <Text style={styles.iconEmoji}>📱</Text>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Enter OTP</Text>
        <Text style={[styles.sub, { color: theme.subtext }]}>
          A 6-digit code was sent to {maskedEmail}
        </Text>

        {/* OTP inputs */}
        <Animated.View
          style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}
        >
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={r => (inputRefs.current[i] = r)}
              style={[
                styles.otpBox,
                {
                  borderColor:     digit ? theme.primary : theme.border,
                  backgroundColor: digit ? theme.primary + '10' : theme.card,
                  color:           theme.text,
                },
              ]}
              value={digit}
              onChangeText={v => handleDigit(v, i)}
              onKeyPress={e => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              selectTextOnFocus
              editable={!loading}
            />
          ))}
        </Animated.View>

        {/* Error */}
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {/* Resend success */}
        {resendSuccess ? (
          <Text style={styles.successText}>✅ New OTP sent to {maskedEmail}</Text>
        ) : null}

        {/* Verify button */}
        <TouchableOpacity
          style={[
            styles.verifyBtn,
            { backgroundColor: loading ? theme.subtext : theme.primary },
          ]}
          onPress={verify}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.verifyBtnText}>✅ Verify OTP</Text>}
        </TouchableOpacity>

        {/* Timer / Resend */}
        <View style={styles.resendRow}>
          {resending ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : timer > 0 ? (
            <Text style={[styles.timerText, { color: theme.subtext }]}>
              Resend OTP in {timer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={resendOTP} disabled={resending}>
              <Text style={[styles.resendText, { color: theme.primary }]}>
                🔄 Resend OTP
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { paddingHorizontal: 28, paddingBottom: 40, alignItems: 'center' },

  backBtn:  { alignSelf: 'flex-start', paddingVertical: 10, marginBottom: 8 },
  backText: { fontSize: 16, fontWeight: '700' },

  iconCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  iconEmoji: { fontSize: 52 },

  title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 10 },
  sub:   { fontSize: 15, textAlign: 'center', marginBottom: 28, lineHeight: 22 },

  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  otpBox: {
    width: 48, height: 58, borderRadius: 14, borderWidth: 2,
    fontSize: 24, fontWeight: '900', textAlign: 'center',
  },

  errorText:   { color: '#EF4444', fontSize: 13, fontWeight: '600', marginBottom: 14, textAlign: 'center' },
  successText: { color: '#10B981', fontSize: 13, fontWeight: '600', marginBottom: 14, textAlign: 'center' },

  verifyBtn: {
    width: '100%', borderRadius: 18, paddingVertical: 18,
    alignItems: 'center', marginBottom: 18,
  },
  verifyBtnText: { fontSize: 17, fontWeight: '900', color: '#fff' },

  resendRow:  { flexDirection: 'row', marginBottom: 8, minHeight: 24, alignItems: 'center' },
  timerText:  { fontSize: 14, fontWeight: '600' },
  resendText: { fontSize: 14, fontWeight: '700' },
});
