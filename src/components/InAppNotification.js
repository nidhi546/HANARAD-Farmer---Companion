import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }         from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { useNavigation }    from '@react-navigation/native';

const TYPE_CONFIG = {
  weather: { color: '#06B6D4', icon: '⛅' },
  market:  { color: '#F59E0B', icon: '💰' },
  disease: { color: '#EF4444', icon: '🔬' },
  scheme:  { color: '#10B981', icon: '🏛️' },
  rain:    { color: '#3B82F6', icon: '🌧️' },
  crop:    { color: '#059669', icon: '🌱' },
  general: { color: '#4F46E5', icon: '🔔' },
};

export default function InAppNotification() {
  const { theme }                              = useTheme();
  const { inAppNotification, dismissInApp }    = useNotifications();
  const navigation                             = useNavigation();
  const insets                                 = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(-140)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef(null);

  useEffect(() => {
    if (!inAppNotification) return;

    // Slide down into view
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0, useNativeDriver: true,
        tension: 80, friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: 1, duration: 220, useNativeDriver: true,
      }),
    ]).start();

    timerRef.current = setTimeout(dismiss, 4500);
    return () => clearTimeout(timerRef.current);
  }, [inAppNotification]);

  function dismiss() {
    clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, { toValue: -140, duration: 260, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      dismissInApp();
      // Reset for next notification
      translateY.setValue(-140);
      opacity.setValue(0);
    });
  }

  function handlePress() {
    const screen = inAppNotification?.screen || inAppNotification?.data?.screen;
    dismiss();
    if (screen) setTimeout(() => navigation.navigate(screen), 300);
  }

  if (!inAppNotification) return null;

  const type   = inAppNotification.type ?? 'general';
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.general;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + (Platform.OS === 'android' ? 8 : 10),
          transform: [{ translateY }],
          opacity,
          backgroundColor: theme.card,
          borderLeftColor: config.color,
          shadowColor: config.color,
        },
      ]}
    >
      <TouchableOpacity style={styles.inner} onPress={handlePress} activeOpacity={0.88}>
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: config.color + '22' }]}>
          <Text style={styles.iconText}>{config.icon}</Text>
        </View>

        {/* Text */}
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {inAppNotification.title}
          </Text>
          <Text style={[styles.body, { color: theme.subtext }]} numberOfLines={2}>
            {inAppNotification.message}
          </Text>
        </View>

        {/* Dismiss */}
        <TouchableOpacity
          onPress={dismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={[styles.close, { color: theme.subtext }]}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: config.color + '22' }]}>
        <Animated.View style={[styles.progressBar, { backgroundColor: config.color }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 14, right: 14,
    zIndex: 9999,
    borderRadius: 18,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 12,
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  iconText:     { fontSize: 22 },
  textWrap:     { flex: 1 },
  title:        { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  body:         { fontSize: 12, lineHeight: 17 },
  close:        { fontSize: 13, fontWeight: '600', paddingHorizontal: 4 },
  progressTrack:{ height: 3 },
  progressBar:  { height: 3, width: '100%' },
});
