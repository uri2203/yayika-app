import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getXpEvents } from '../../config/api';

const BADGES_CONFIG = [
  { emoji: '🌙', nameKey: 'badge_1_name', descriptionKey: 'badge_1_desc', requiredEvent: 'cycle_log', categoryKey: 'cycle' },
  { emoji: '💰', nameKey: 'badge_2_name', descriptionKey: 'badge_2_desc', requiredEvent: 'transaction_added', categoryKey: 'finance' },
  { emoji: '📋', nameKey: 'badge_3_name', descriptionKey: 'badge_3_desc', requiredEvent: 'daily_checkin', categoryKey: 'productivity' },
  { emoji: '🔥', nameKey: 'badge_4_name', descriptionKey: 'badge_4_desc', requiredEvent: 'streak_7', categoryKey: 'productivity' },
  { emoji: '🌸', nameKey: 'badge_5_name', descriptionKey: 'badge_5_desc', requiredEvent: 'mood_logged', categoryKey: 'cycle' },
  { emoji: '💎', nameKey: 'badge_6_name', descriptionKey: 'badge_6_desc', requiredEvent: 'challenge_completed', categoryKey: 'special' },
  { emoji: '🎯', nameKey: 'badge_7_name', descriptionKey: 'badge_7_desc', requiredEvent: 'financial_goal', categoryKey: 'finance' },
  { emoji: '👥', nameKey: 'badge_8_name', descriptionKey: 'badge_8_desc', requiredEvent: 'community_post', categoryKey: 'social' },
  { emoji: '🏆', nameKey: 'badge_9_name', descriptionKey: 'badge_9_desc', requiredEvent: 'onboarding_complete', categoryKey: 'social' },
  { emoji: '⭐', nameKey: 'badge_10_name', descriptionKey: 'badge_10_desc', requiredEvent: 'xp_100', categoryKey: 'social' },
  { emoji: '📚', nameKey: 'badge_11_name', descriptionKey: 'badge_11_desc', requiredEvent: 'product_access', categoryKey: 'productivity' },
  { emoji: '🌟', nameKey: 'badge_12_name', descriptionKey: 'badge_12_desc', requiredEvent: 'xp_500', categoryKey: 'special' },
];

const CATEGORY_KEYS = ['all', 'cycle', 'finance', 'productivity', 'social', 'special'] as const;

export default function BadgesScreen({ navigation }: any) {
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>('all');
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [xpEventTypes, setXpEventTypes] = useState<Set<string>>(new Set());
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const events = await getXpEvents(user.id, 200);
        const types = new Set<string>();
        let xpSum = 0;
        for (const ev of events) {
          types.add(ev.event_type);
          xpSum += ev.xp_amount || 0;
        }
        setXpEventTypes(types);
        setTotalXp(xpSum);
      } catch (err) {
        console.error('Failed to fetch XP events:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const CATEGORY_LABELS: Record<string, string> = {
    all: t('badges_all'),
    cycle: t('badges_cycle'),
    finance: t('badges_finance'),
    productivity: t('badges_productivity'),
    social: t('badges_social'),
    special: t('badges_special'),
  };

  const BADGES = BADGES_CONFIG.map((b) => ({
    ...b,
    name: t(b.nameKey),
    description: t(b.descriptionKey),
    unlocked: xpEventTypes.has(b.requiredEvent) || (b.requiredEvent === 'xp_100' && totalXp >= 100) || (b.requiredEvent === 'xp_500' && totalXp >= 500),
  }));

  const filteredBadges = selectedCategoryKey === 'all'
    ? BADGES
    : BADGES.filter((b) => b.categoryKey === selectedCategoryKey);

  const unlockedCount = BADGES.filter((b) => b.unlocked).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.scrollContent, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Ionicons name="trophy" size={28} color={colors.gold} />
          <Text style={styles.headerTitle}>{t('badges_title')}</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {unlockedCount}/{BADGES.length} {t('badges_unlocked')}
          </Text>
          <View style={styles.statsBar}>
            <View style={[styles.statsFill, { width: `${(unlockedCount / BADGES.length) * 100}%` }]} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          <View style={styles.categoriesRow}>
            {CATEGORY_KEYS.map((key) => (
              <TouchableOpacity
                key={key}
                style={[styles.categoryChip, selectedCategoryKey === key && styles.categoryChipActive]}
                onPress={() => setSelectedCategoryKey(key)}
              >
                <Text style={[styles.categoryText, selectedCategoryKey === key && styles.categoryTextActive]}>
                  {CATEGORY_LABELS[key]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.badgeGrid}>
          {filteredBadges.map((badge, index) => (
            <View key={index} style={styles.badgeCard}>
              <View style={[styles.badgeCircle, badge.unlocked ? styles.badgeCircleUnlocked : styles.badgeCircleLocked]}>
                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
              </View>
              <Text style={[styles.badgeName, !badge.unlocked && styles.badgeNameLocked]} numberOfLines={1}>
                {badge.name}
              </Text>
              <Text style={[styles.badgeDescription, !badge.unlocked && styles.badgeDescriptionLocked]} numberOfLines={2}>
                {badge.description}
              </Text>
              {!badge.unlocked && (
                <View style={styles.lockedBadge}>
                  <Ionicons name="lock-closed" size={10} color={colors.subtleText} />
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  statsRow: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  statsBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  statsFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
  categoriesScroll: {
    marginBottom: spacing.lg,
  },
  categoriesRow: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    fontWeight: typography.weights.medium,
  },
  categoryTextActive: {
    color: colors.white,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '31%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badgeCircleUnlocked: {
    backgroundColor: '#FFF9E6',
  },
  badgeCircleLocked: {
    backgroundColor: colors.border,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeName: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  badgeNameLocked: {
    color: colors.subtleText,
  },
  badgeDescription: {
    fontSize: 10,
    color: colors.subtleText,
    textAlign: 'center',
    lineHeight: 14,
  },
  badgeDescriptionLocked: {
    color: colors.border,
  },
  lockedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
});
