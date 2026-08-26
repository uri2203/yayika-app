import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getXpEvents, getProgress, getCheckins } from '../../config/api';

type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

interface BadgeConfig {
  key: string;
  icon: string;
  nameKey: string;
  descKey: string;
  category: string;
  tier: BadgeTier;
  requirement: string;
  requirementValue: number;
  eventType?: string;
}

const BADGES: BadgeConfig[] = [
  // Streak
  { key: 'streak_3', icon: '🔥', nameKey: 'badge_streak3_name', descKey: 'badge_streak3_desc', category: 'streak', tier: 'bronze', requirement: 'streak', requirementValue: 3 },
  { key: 'streak_7', icon: '🔥', nameKey: 'badge_streak7_name', descKey: 'badge_streak7_desc', category: 'streak', tier: 'silver', requirement: 'streak', requirementValue: 7 },
  { key: 'streak_14', icon: '🔥', nameKey: 'badge_streak14_name', descKey: 'badge_streak14_desc', category: 'streak', tier: 'gold', requirement: 'streak', requirementValue: 14 },
  { key: 'streak_30', icon: '🔥', nameKey: 'badge_streak30_name', descKey: 'badge_streak30_desc', category: 'streak', tier: 'diamond', requirement: 'streak', requirementValue: 30 },

  // Check-in
  { key: 'checkin_1', icon: '📋', nameKey: 'badge_checkin1_name', descKey: 'badge_checkin1_desc', category: 'checkin', tier: 'bronze', requirement: 'checkin_count', requirementValue: 1 },
  { key: 'checkin_10', icon: '📋', nameKey: 'badge_checkin10_name', descKey: 'badge_checkin10_desc', category: 'checkin', tier: 'silver', requirement: 'checkin_count', requirementValue: 10 },
  { key: 'checkin_30', icon: '📋', nameKey: 'badge_checkin30_name', descKey: 'badge_checkin30_desc', category: 'checkin', tier: 'gold', requirement: 'checkin_count', requirementValue: 30 },
  { key: 'checkin_100', icon: '📋', nameKey: 'badge_checkin100_name', descKey: 'badge_checkin100_desc', category: 'checkin', tier: 'diamond', requirement: 'checkin_count', requirementValue: 100 },

  // Cycle
  { key: 'cycle_first', icon: '🌙', nameKey: 'badge_first_phase_name', descKey: 'badge_first_phase_desc', category: 'cycle', tier: 'bronze', requirement: 'event_type', requirementValue: 0, eventType: 'cycle_log' },
  { key: 'cycle_7', icon: '🌙', nameKey: 'badge_cycle7_name', descKey: 'badge_cycle7_desc', category: 'cycle', tier: 'silver', requirement: 'event_type', requirementValue: 0, eventType: 'cycle_log_7' },
  { key: 'cycle_30', icon: '🌙', nameKey: 'badge_conscious_cycle_name', descKey: 'badge_conscious_cycle_desc', category: 'cycle', tier: 'gold', requirement: 'event_type', requirementValue: 0, eventType: 'cycle_log_30' },
  { key: 'mood_logged', icon: '🌸', nameKey: 'badge_mood_name', descKey: 'badge_mood_desc', category: 'cycle', tier: 'bronze', requirement: 'event_type', requirementValue: 0, eventType: 'mood_logged' },

  // Challenge
  { key: 'challenge_first', icon: '🎯', nameKey: 'badge_challenge_first_name', descKey: 'badge_challenge_first_desc', category: 'challenge', tier: 'bronze', requirement: 'event_type', requirementValue: 0, eventType: 'challenge_completed' },
  { key: 'challenge_5', icon: '🎯', nameKey: 'badge_productive_name', descKey: 'badge_productive_desc', category: 'challenge', tier: 'silver', requirement: 'event_type', requirementValue: 0, eventType: 'challenge_completed_5' },
  { key: 'challenge_10', icon: '🎯', nameKey: 'badge_challenge10_name', descKey: 'badge_challenge10_desc', category: 'challenge', tier: 'gold', requirement: 'event_type', requirementValue: 0, eventType: 'challenge_completed_10' },

  // Financial
  { key: 'finance_first', icon: '💰', nameKey: 'badge_saver_name', descKey: 'badge_saver_desc', category: 'financial', tier: 'bronze', requirement: 'event_type', requirementValue: 0, eventType: 'transaction_added' },
  { key: 'finance_goal', icon: '💰', nameKey: 'badge_goal_met_name', descKey: 'badge_goal_met_desc', category: 'financial', tier: 'silver', requirement: 'event_type', requirementValue: 0, eventType: 'financial_goal' },
  { key: 'finance_budget', icon: '💰', nameKey: 'badge_budget_name', descKey: 'badge_budget_desc', category: 'financial', tier: 'gold', requirement: 'event_type', requirementValue: 0, eventType: 'budget_created' },

  // Course
  { key: 'course_first', icon: '📚', nameKey: 'badge_student_name', descKey: 'badge_student_desc', category: 'course', tier: 'bronze', requirement: 'event_type', requirementValue: 0, eventType: 'product_access' },
  { key: 'course_complete', icon: '📚', nameKey: 'badge_course_complete_name', descKey: 'badge_course_complete_desc', category: 'course', tier: 'silver', requirement: 'event_type', requirementValue: 0, eventType: 'course_completed' },
  { key: 'course_5stars', icon: '⭐', nameKey: 'badge_5stars_name', descKey: 'badge_5stars_desc', category: 'course', tier: 'gold', requirement: 'event_type', requirementValue: 0, eventType: 'five_star_review' },

  // Social
  { key: 'social_post', icon: '👥', nameKey: 'badge_influencer_name', descKey: 'badge_influencer_desc', category: 'social', tier: 'bronze', requirement: 'event_type', requirementValue: 0, eventType: 'community_post' },
  { key: 'social_10_referrals', icon: '👥', nameKey: 'badge_top10_name', descKey: 'badge_top10_desc', category: 'social', tier: 'silver', requirement: 'referrals', requirementValue: 10 },
  { key: 'social_share', icon: '👥', nameKey: 'badge_share_name', descKey: 'badge_share_desc', category: 'social', tier: 'bronze', requirement: 'event_type', requirementValue: 0, eventType: 'shared_product' },

  // Referral
  { key: 'referral_first', icon: '🤝', nameKey: 'badge_referral_first_name', descKey: 'badge_referral_first_desc', category: 'referral', tier: 'bronze', requirement: 'referrals', requirementValue: 1 },
  { key: 'referral_5', icon: '🤝', nameKey: 'badge_referral5_name', descKey: 'badge_referral5_desc', category: 'referral', tier: 'silver', requirement: 'referrals', requirementValue: 5 },
  { key: 'referral_25', icon: '🤝', nameKey: 'badge_referral25_name', descKey: 'badge_referral25_desc', category: 'referral', tier: 'gold', requirement: 'referrals', requirementValue: 25 },

  // Special
  { key: 'onboarding_complete', icon: '🏆', nameKey: 'badge_guerrera_name', descKey: 'badge_guerrera_desc', category: 'special', tier: 'bronze', requirement: 'event_type', requirementValue: 0, eventType: 'onboarding_complete' },
  { key: 'xp_100', icon: '⭐', nameKey: 'badge_first_steps_name', descKey: 'badge_first_steps_desc', category: 'special', tier: 'bronze', requirement: 'xp', requirementValue: 100 },
  { key: 'xp_500', icon: '🌟', nameKey: 'badge_rising_name', descKey: 'badge_rising_desc', category: 'special', tier: 'silver', requirement: 'xp', requirementValue: 500 },
  { key: 'xp_1000', icon: '💫', nameKey: 'badge_legend_name', descKey: 'badge_legend_desc', category: 'special', tier: 'gold', requirement: 'xp', requirementValue: 1000 },
  { key: 'all_badges', icon: '👑', nameKey: 'badge_queen_name', descKey: 'badge_queen_desc', category: 'special', tier: 'diamond', requirement: 'all_badges', requirementValue: 0 },
];

const CATEGORIES = [
  { key: 'all', labelKey: 'badges_all', icon: 'grid' },
  { key: 'streak', labelKey: 'badges_streak', icon: 'flame' },
  { key: 'checkin', labelKey: 'badges_checkin', icon: 'checkmark-circle' },
  { key: 'cycle', labelKey: 'badges_cycle', icon: 'moon' },
  { key: 'challenge', labelKey: 'badges_challenge', icon: 'trophy' },
  { key: 'financial', labelKey: 'badges_finance', icon: 'wallet' },
  { key: 'course', labelKey: 'badges_course', icon: 'book' },
  { key: 'social', labelKey: 'badges_social', icon: 'people' },
  { key: 'referral', labelKey: 'badges_referral', icon: 'hand-left' },
  { key: 'special', labelKey: 'badges_special', icon: 'star' },
] as const;

const TIER_COLORS: Record<BadgeTier, string> = {
  bronze: '#CD7F32',
  silver: '#A8A8A8',
  gold: '#D4A843',
  diamond: '#2DD4BF',
};

const TIER_BG: Record<BadgeTier, string> = {
  bronze: '#FFF3E0',
  silver: '#F5F5F5',
  gold: '#FFF9E6',
  diamond: '#E0F7FA',
};

export default function BadgesScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const colors = currentColors;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: spacing.md,
      marginBottom: spacing.lg,
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    progressCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    progressInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    progressLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
    progressPct: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.primary },
    progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 4 },
    xpRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 4 },
    xpText: { fontSize: typography.sizes.xs, color: colors.subtleText },
    catScroll: { marginBottom: spacing.lg },
    catRow: { flexDirection: 'row', gap: spacing.sm },
    catChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 4,
    },
    catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    catText: { fontSize: typography.sizes.xs, color: colors.subtleText, fontWeight: typography.weights.medium },
    catTextActive: { color: colors.white },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    badgeCard: {
      width: '31%',
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
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
    badgeIcon: { fontSize: 24 },
    badgeIconLocked: { opacity: 0.4 },
    tierDot: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 18,
      height: 18,
      borderRadius: 9,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 2,
      borderColor: colors.white,
    },
    tierDotText: { fontSize: 8, fontWeight: typography.weights.bold, color: colors.white },
    badgeName: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      color: colors.text,
      textAlign: 'center',
      marginBottom: 2,
    },
    badgeNameLocked: { color: colors.subtleText },
    badgeDesc: { fontSize: 10, color: colors.subtleText, textAlign: 'center', lineHeight: 14 },
    badgeDescLocked: { color: colors.border },
    badgeDate: { fontSize: 9, color: colors.turquoise, marginTop: 4 },
    lockedBadge: { marginTop: 4 },
  });

  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [eventTypes, setEventTypes] = useState<Set<string>>(new Set());
  const [totalXp, setTotalXp] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [checkinCount, setCheckinCount] = useState(0);
  const [earnedDates, setEarnedDates] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const [events, progress, checkins] = await Promise.all([
          getXpEvents(user.id, 300),
          getProgress(user.id).catch(() => null),
          getCheckins(user.id).catch(() => []),
        ]);

        const types = new Set<string>();
        const dates: Record<string, string> = {};
        let xpSum = 0;
        for (const ev of events) {
          types.add(ev.event_type);
          xpSum += ev.xp_amount || 0;
          if (!dates[ev.event_type] && ev.created_at) {
            dates[ev.event_type] = ev.created_at;
          }
        }
        setEventTypes(types);
        setTotalXp(xpSum);
        setStreakDays(progress?.streak_days ?? 0);
        setCheckinCount(checkins?.length ?? 0);
        setEarnedDates(dates);
      } catch (err) {
        console.error('Failed to load badges data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const isBadgeEarned = useCallback((badge: BadgeConfig): boolean => {
    switch (badge.requirement) {
      case 'streak':
        return streakDays >= badge.requirementValue;
      case 'checkin_count':
        return checkinCount >= badge.requirementValue;
      case 'event_type':
        return eventTypes.has(badge.eventType!);
      case 'xp':
        return totalXp >= badge.requirementValue;
      case 'referrals':
        return eventTypes.has('referral_made') && checkinCount >= badge.requirementValue;
      case 'all_badges': {
        const otherBadges = BADGES.filter((b) => b.key !== 'all_badges');
        return otherBadges.every((b) => isBadgeEarned(b));
      }
      default:
        return false;
    }
  }, [eventTypes, totalXp, streakDays, checkinCount]);

  const getEarnDate = (badge: BadgeConfig): string | null => {
    if (badge.requirement === 'event_type' && badge.eventType && earnedDates[badge.eventType]) {
      const d = new Date(earnedDates[badge.eventType]);
      return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    return null;
  };

  const filteredBadges = selectedCategory === 'all'
    ? BADGES
    : BADGES.filter((b) => b.category === selectedCategory);

  const earnedCount = BADGES.filter((b) => isBadgeEarned(b)).length;
  const progressPct = Math.round((earnedCount / BADGES.length) * 100);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('badges_title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>{earnedCount}/{BADGES.length} {t('badges_unlocked')}</Text>
            <Text style={styles.progressPct}>{progressPct}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <View style={styles.xpRow}>
            <Ionicons name="star" size={14} color={colors.gold} />
            <Text style={styles.xpText}>{totalXp} XP total</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          <View style={styles.catRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catChip, selectedCategory === cat.key && styles.catChipActive]}
                onPress={() => setSelectedCategory(cat.key)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={14}
                  color={selectedCategory === cat.key ? colors.white : colors.subtleText}
                />
                <Text style={[styles.catText, selectedCategory === cat.key && styles.catTextActive]}>
                  {t(cat.labelKey)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.badgeGrid}>
          {filteredBadges.map((badge) => {
            const earned = isBadgeEarned(badge);
            const dateStr = getEarnDate(badge);
            return (
              <View
                key={badge.key}
                style={[styles.badgeCard, earned && { borderColor: TIER_COLORS[badge.tier] + '60' }]}
              >
                <View style={[styles.badgeCircle, { backgroundColor: earned ? TIER_BG[badge.tier] : colors.border }]}>
                  <Text style={[styles.badgeIcon, !earned && styles.badgeIconLocked]}>{badge.icon}</Text>
                  {earned && (
                    <View style={[styles.tierDot, { backgroundColor: TIER_COLORS[badge.tier] }]}>
                      <Text style={styles.tierDotText}>{badge.tier.charAt(0).toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.badgeName, !earned && styles.badgeNameLocked]} numberOfLines={1}>
                  {t(badge.nameKey)}
                </Text>
                <Text style={[styles.badgeDesc, !earned && styles.badgeDescLocked]} numberOfLines={2}>
                  {t(badge.descKey)}
                </Text>
                {earned && dateStr ? (
                  <Text style={styles.badgeDate}>{dateStr}</Text>
                ) : !earned ? (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={10} color={colors.subtleText} />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
