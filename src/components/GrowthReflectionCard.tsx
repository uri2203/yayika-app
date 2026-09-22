import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Card from './Card';
import {
  getGrowthReflection,
  GrowthReflection,
} from '../services/deepConnectionService';

export default function GrowthReflectionCard() {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const colors = currentColors;

  const [reflection, setReflection] = useState<GrowthReflection | null>(null);
  const [loading, setLoading] = useState(true);

  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const growAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (user?.id) loadReflection();
  }, [user?.id]);

  useEffect(() => {
    if (reflection && !loading) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(growAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [reflection, loading]);

  const loadReflection = async () => {
    if (!user?.id) return;
    try {
      const data = await getGrowthReflection(user.id);
      setReflection(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.turquoise} />
        </View>
      </Card>
    );
  }

  if (!reflection) return null;

  const plantHeight = growAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 80],
  });

  const leafOpacity = growAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View style={[styles.card, { backgroundColor: colors.white, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.header}>
        <Ionicons name="trending-up" size={18} color={colors.turquoise} />
        <Text style={[styles.title, { color: colors.text }]}>
          {t('growth_this_month')}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.plantContainer}>
          <View style={styles.plantStem}>
            <Animated.View
              style={[
                styles.plant,
                {
                  height: plantHeight,
                  backgroundColor: colors.turquoise,
                },
              ]}
            />
            <Animated.View style={[styles.leaf, { opacity: leafOpacity, left: -12, transform: [{ rotate: '-45deg' }] }]}>
              <Text style={styles.leafEmoji}>🌱</Text>
            </Animated.View>
            <Animated.View style={[styles.leaf, { opacity: leafOpacity, right: -12, transform: [{ rotate: '45deg' }] }]}>
              <Text style={styles.leafEmoji}>🌿</Text>
            </Animated.View>
          </View>
          {reflection.growth_pct > 0 && (
            <View style={[styles.growthBadge, { backgroundColor: colors.successBg }]}>
              <Ionicons name="arrow-up" size={14} color={colors.success} />
              <Text style={[styles.growthText, { color: colors.success }]}>
                {t('growth_improved')} {reflection.growth_pct}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statRow}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{reflection.days_logged}</Text>
            <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('growth_stat_days')}</Text>
          </View>

          <View style={styles.statRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.turquoise} />
            <Text style={[styles.statValue, { color: colors.text }]}>{reflection.actions_completed}</Text>
            <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('growth_stat_actions')}</Text>
          </View>

          <View style={styles.statRow}>
            <Ionicons name="people" size={16} color={colors.rose} />
            <Text style={[styles.statValue, { color: colors.text }]}>{reflection.women_connected}</Text>
            <Text style={[styles.statLabel, { color: colors.subtleText }]}>{t('growth_stat_women')}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantContainer: {
    alignItems: 'center',
    width: 100,
    marginRight: spacing.md,
  },
  plantStem: {
    height: 100,
    width: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'relative',
    overflow: 'visible',
  },
  plant: {
    width: 4,
    borderRadius: 2,
  },
  leaf: {
    position: 'absolute',
    bottom: 20,
  },
  leafEmoji: {
    fontSize: 16,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 3,
    marginTop: spacing.sm,
  },
  growthText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  statsContainer: {
    flex: 1,
    gap: spacing.sm,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    minWidth: 30,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    flex: 1,
  },
});
