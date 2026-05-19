import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme }         from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';

import HomeScreen        from '../screens/HomeScreen';
import WeatherScreen     from '../screens/WeatherScreen';
import SavedFarmsScreen  from '../screens/SavedFarmsScreen';
import CropAdvisorScreen from '../screens/CropAdvisorScreen';
import ProfileScreen     from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

const TABS = [
  { name: 'HomeTab',    emoji: '🏠',  label: 'Home',    color: '#6366F1' },
  { name: 'WeatherTab', emoji: '🌤️', label: 'Weather', color: '#0EA5E9' },
  { name: 'FarmTab',    emoji: '🌾',  label: 'Farm',    color: '#F59E0B' },
  { name: 'CropsTab',   emoji: '🌿',  label: 'Crops',   color: '#10B981' },
  { name: 'ProfileTab', emoji: '👤',  label: 'Profile', color: '#EC4899' },
];

// ── Custom tab bar ────────────────────────────────────────────────────────────
function CustomBar({ state, navigation }) {
  const insets          = useSafeAreaInsets();
  const { isDark }      = useTheme();
  const { unreadCount } = useNotifications();

  const barBg   = isDark ? '#18181B' : '#FFFFFF';
  const dimText = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.30)';

  function go(index) {
    const route   = state.routes[index];
    const focused = state.index === index;
    const event   = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
  }

  return (
    <View style={[S.root, { paddingBottom: insets.bottom || 12 }]} pointerEvents="box-none">

      {/* ── Centre FAB — floats above the bar ── */}
      <View style={S.fabRow} pointerEvents="box-none">
        {[0, 1, null, 3, 4].map((i, slot) => {
          if (i === null) {
            // Centre slot — render the raised FAB
            const active = state.index === 2;
            return (
              <View key="fab" style={S.fabSlot}>
                <TouchableOpacity
                  style={[S.fab, active && S.fabActive]}
                  onPress={() => go(2)}
                  activeOpacity={0.85}
                >
                  <Text style={S.fabEmoji}>🌾</Text>
                  <Text style={[S.fabLabel, { color: active ? '#fff' : '#FDE68A' }]}>
                    Farm
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }
          return <View key={slot} style={S.fabSlotEmpty} />;
        })}
      </View>

      {/* ── Main pill bar ── */}
      <View style={[S.bar, { backgroundColor: barBg }]}>
        {TABS.map((tab, i) => {
          if (i === 2) {
            // Centre gap — leave space for the FAB
            return <View key="gap" style={S.gapSlot} />;
          }

          const active = state.index === i;
          const hasBadge = i === 0 && unreadCount > 0;

          return (
            <TouchableOpacity
              key={tab.name}
              style={S.tabBtn}
              onPress={() => go(i)}
              activeOpacity={0.7}
            >
              {/* Active top bar */}
              <View style={[S.topBar, active && { backgroundColor: tab.color }]} />

              {/* Icon bubble */}
              <View style={[
                S.iconBubble,
                active && { backgroundColor: tab.color + '1A' },
              ]}>
                <Text style={[S.tabEmoji, { opacity: active ? 1 : 0.38 }]}>
                  {tab.emoji}
                </Text>
              </View>

              {/* Label */}
              <Text style={[
                S.tabLabel,
                { color: active ? tab.color : dimText },
              ]}>
                {tab.label}
              </Text>

              {/* Badge */}
              {hasBadge && (
                <View style={S.badge}>
                  <Text style={S.badgeTxt}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

    </View>
  );
}

// ── Navigator ─────────────────────────────────────────────────────────────────
export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={props => <CustomBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab"    component={HomeScreen}        />
      <Tab.Screen name="WeatherTab" component={WeatherScreen}     />
      <Tab.Screen name="FarmTab"    component={SavedFarmsScreen}  />
      <Tab.Screen name="CropsTab"   component={CropAdvisorScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen}     />
    </Tab.Navigator>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const BAR_H    = 62;
const FAB_D    = 60;
const FAB_LIFT = 26;   // how far FAB rises above bar top

const S = StyleSheet.create({

  root: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
  },

  // ── FAB row — sits just above the bar ─────────────────────────────────────
  fabRow: {
    flexDirection:  'row',
    width:          width - 32,
    alignSelf:      'center',
    marginBottom:   -(FAB_D / 2),   // half of FAB overlaps into bar
    zIndex:         10,
  },
  fabSlot:      { flex: 1, alignItems: 'center' },
  fabSlotEmpty: { flex: 1 },

  fab: {
    width:        FAB_D,
    height:       FAB_D,
    borderRadius: FAB_D / 2,
    backgroundColor: '#92400E',
    alignItems:   'center',
    justifyContent: 'center',
    borderWidth:  3,
    borderColor:  '#FBBF24',
    shadowColor:  '#F59E0B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius:  14,
    elevation:    16,
    gap: 1,
  },
  fabActive: {
    backgroundColor: '#D97706',
    borderColor:    '#FDE68A',
    shadowOpacity:   0.75,
  },
  fabEmoji: { fontSize: 22, lineHeight: 26 },
  fabLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },

  // ── Pill bar ──────────────────────────────────────────────────────────────
  bar: {
    flexDirection:  'row',
    alignSelf:      'center',
    width:          width - 32,
    height:         BAR_H,
    borderRadius:   20,
    alignItems:     'center',
    paddingHorizontal: 4,
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius:  12,
    elevation:     12,
    overflow:      Platform.OS === 'android' ? 'hidden' : 'visible',
  },

  // Gap slot in bar where FAB lives
  gapSlot: { flex: 1.2 },

  // Each tab button
  tabBtn: {
    flex: 1,
    alignItems:   'center',
    justifyContent: 'center',
    height:       '100%',
    gap: 3,
    paddingTop: 6,
  },

  // Coloured top accent bar (shows when active)
  topBar: {
    position:     'absolute',
    top:          0,
    width:        28,
    height:       3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },

  // Small bubble background behind icon when active
  iconBubble: {
    width:        38,
    height:       32,
    borderRadius: 12,
    alignItems:   'center',
    justifyContent: 'center',
  },

  tabEmoji: { fontSize: 21 },
  tabLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.1 },

  // Badge
  badge: {
    position: 'absolute', top: 4, right: 4,
    minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5, borderColor: '#fff',
  },
  badgeTxt: { fontSize: 9, fontWeight: '900', color: '#fff' },
});
