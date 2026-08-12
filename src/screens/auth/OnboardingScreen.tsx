import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';

const { width } = Dimensions.get('window');

export default function OnboardingScreen({ navigation }: any) {
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useLanguage();

  const slides = [
    {
      emoji: '🌙',
      title: t('onboarding_1_title'),
      description: t('onboarding_1_desc'),
      color: colors.primary,
    },
    {
      emoji: '💰',
      title: t('onboarding_2_title'),
      description: t('onboarding_2_desc'),
      color: colors.gold,
    },
    {
      emoji: '🚀',
      title: t('onboarding_3_title'),
      description: t('onboarding_3_desc'),
      color: colors.turquoise,
    },
  ];

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const goToNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    }
  };

  const skipToLast = () => {
    scrollRef.current?.scrollTo({ x: (slides.length - 1) * width, animated: true });
  };

  const handleStart = async () => {
    try {
      await SecureStore.setItemAsync('onboarded', 'true');
    } catch {}
    navigation.replace('Login');
  };

  const isLast = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={skipToLast} style={styles.skipButton}>
        <Text style={styles.skipText}>{t('onboarding_skip')}</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={[styles.title, { color: slide.color }]}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
                index === currentIndex && { backgroundColor: slides[currentIndex].color },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.nextButton,
            { backgroundColor: isLast ? colors.turquoise : colors.primary },
          ]}
          onPress={isLast ? handleStart : goToNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextText}>{isLast ? t('onboarding_start') : t('onboarding_next')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    zIndex: 1,
  },
  skipText: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    fontWeight: typography.weights.medium,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.xxl,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.sizes.lg,
    color: colors.subtleText,
    textAlign: 'center',
    lineHeight: 26,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginHorizontal: 5,
  },
  activeDot: {
    width: 28,
    borderRadius: borderRadius.full,
  },
  nextButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: borderRadius.xl,
    minWidth: 200,
    alignItems: 'center',
  },
  nextText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
});
