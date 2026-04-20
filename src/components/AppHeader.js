import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function AppHeader({ title, subtitle }) {
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();
  const { theme }  = useTheme();

  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      <TouchableOpacity
        style={styles.menuBtn}
        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <View style={styles.bar} />
        <View style={[styles.bar, { width: 17 }]} />
        <View style={[styles.bar, { width: 13 }]} />
      </TouchableOpacity>

      <View style={styles.titleBlock}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>

      <View style={styles.menuBtn} />
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    header: {
      backgroundColor: theme.primary,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 14,
    },
    menuBtn:    { width: 36, height: 36, justifyContent: 'center', gap: 5 },
    bar:        { height: 2.5, width: 22, backgroundColor: '#FFFFFF', borderRadius: 2 },
    titleBlock: { flex: 1, alignItems: 'center' },
    title:      { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
    subtitle:   { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  });
}
