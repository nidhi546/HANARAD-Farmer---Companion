import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Storage, KEYS } from '../utils/storage';
import { THEME } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    emoji: '🌾',
    title: 'Welcome to FarmerApp',
    description:
      'Your smart farming companion. Get real-time weather, crop advice, and agricultural alerts — all in one place.',
    bg: '#EEF2FF',
    accent: THEME.primary,
  },
  {
    id: '2',
    emoji: '🛰️',
    title: 'NASA-Powered Weather',
    description:
      'Access accurate historical weather data directly from NASA POWER satellites. Plan your farming with confidence.',
    bg: '#F5F3FF',
    accent: '#8B5CF6',
  },
  {
    id: '3',
    emoji: '🌱',
    title: 'Smart Crop Advisor',
    description:
      'Get crop recommendations tailored to your local climate. Know which crops will thrive in your region and when.',
    bg: '#FFFBEB',
    accent: '#D97706',
  },
  {
    id: '4',
    emoji: '🔔',
    title: 'Real-Time Alerts',
    description:
      'Stay ahead of extreme heat, heavy rain, and strong winds with smart weather alerts built for farmers.',
    bg: '#FEF2F2',
    accent: '#DC2626',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const handleSkip = async () => {
    await finish();
  };

  const handleGetStarted = async () => {
    await finish();
  };

  const finish = async () => {
    await Storage.set(KEYS.ONBOARDING_DONE, true);
    navigation.replace('Login');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  const renderSlide = ({ item }) => (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.emojiContainer, { backgroundColor: item.bg }]}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={[styles.title, { color: item.accent }]}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const isLast = activeIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.background} />

      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged.current}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === activeIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        {isLast ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleGetStarted} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Get Started 🚀</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Next →</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 14,
    color: THEME.subtext,
    fontWeight: '500',
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 20,
  },
  emojiContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  emoji: {
    fontSize: 72,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 15,
    color: THEME.subtext,
    textAlign: 'center',
    lineHeight: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.border,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: THEME.primary,
  },
  btnRow: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  primaryBtn: {
    backgroundColor: THEME.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: THEME.white,
    letterSpacing: 0.3,
  },
});
