/**
 * AppHeader — shared screen header with back button.
 * Replaces the old drawer-menu button with a proper ‹ back arrow.
 */
import React, { useMemo } from 'react';
import {
  View, Text, Pressable, StyleSheet, StatusBar, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { shadow, ripple, typography, spacing, radius, MIN_TOUCH } from '../utils/ui';

export default function AppHeader({ title, subtitle, rightComponent, onBack }) {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { theme }  = useTheme();

  const styles = useMemo(() => makeStyles(theme), [theme]);

  const headerPaddingTop = insets.top + (Platform.OS === 'android' ? 6 : 8);

  function handleBack() {
    if (onBack) { onBack(); return; }
    if (navigation.canGoBack()) navigation.goBack();
  }

  return (
    <View style={[styles.header, { paddingTop: headerPaddingTop }, shadow(4)]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.headerBg}
        translucent={false}
      />

      {/* Back button */}
      <Pressable
        style={styles.backBtn}
        onPress={handleBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        {...ripple('rgba(255,255,255,0.2)', true)}
      >
        <Text style={styles.backArrow}>‹</Text>
      </Pressable>

      {/* Title block */}
      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle
          ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          : null}
      </View>

      {/* Optional right slot */}
      <View style={styles.rightSlot}>
        {rightComponent ?? null}
      </View>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    header: {
      backgroundColor: theme.headerBg,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing[4],
      paddingBottom: Platform.select({ ios: 14, android: 12 }),
    },
    backBtn: {
      width: MIN_TOUCH,
      height: MIN_TOUCH,
      justifyContent: 'center',
      alignItems: 'flex-start',
      borderRadius: radius.sm,
      overflow: 'hidden',
    },
    backArrow: {
      fontSize: 32,
      color: theme.headerText,
      fontWeight: '300',
      lineHeight: 36,
      marginTop: -2,
    },
    titleBlock: {
      flex: 1,
      alignItems: 'center',
    },
    title: {
      ...typography.h4,
      color: theme.headerText,
    },
    subtitle: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.headerText + 'BF',
      marginTop: 1,
    },
    rightSlot: {
      width: MIN_TOUCH,
      height: MIN_TOUCH,
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
  });
}
