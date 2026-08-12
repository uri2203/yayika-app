import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';

export default function SplashScreen({ navigation }: any) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const { t } = useLanguage();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    const subtitleTimer = setTimeout(() => {
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 500);

    const navTimer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2000);

    return () => {
      clearTimeout(subtitleTimer);
      clearTimeout(navTimer);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.logoContainer,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          <Text style={styles.logo}>Yayika</Text>
        </Animated.View>

        <Animated.View style={{ opacity: subtitleOpacity }}>
          <Text style={styles.subtitle}>{t('splash_subtitle')}</Text>
        </Animated.View>
      </View>

      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.white} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: spacing.md,
  },
  logo: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    color: colors.white,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingContainer: {
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
});
