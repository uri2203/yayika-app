import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { typography, spacing, borderRadius } from '../../config/theme';
import Card from '../../components/Card';
import { FutureSelf, SocialProofWidget } from '../../components/retention';
import CircleActivityFeed from '../../components/CircleActivityFeed';
import BadgeShowcase from '../../components/BadgeShowcase';
import CompletionAnxiety from '../../components/CompletionAnxiety';
import StreakBanner from '../../components/StreakBanner';
import DailyActionCard from '../../components/DailyActionCard';
import EmotionalProfileCard from '../../components/EmotionalProfileCard';
import DailySurprise from '../../components/DailySurprise';
import PaywallModal from '../../components/PaywallModal';
import WisdomExchangeCard from '../../components/WisdomExchangeCard';
import GrowthReflectionCard from '../../components/GrowthReflectionCard';
import DailyDesireCard from '../../components/DailyDesireCard';
import SurpriseInsightCard from '../../components/SurpriseInsightCard';
import EmotionalCheckin from '../../components/EmotionalCheckin';
import { FirstWeekBanner } from '../../components/FirstWeekHook';
import {
  getProgress,
  getCycleLog,
  aiAffirmations,
  aiWeeklyChallenges,
  getCommunityFeed,
  stripeMarketplaceCheckout,
  getSubscriptions,
} from '../../config/api';

interface CommunityPost {
  id: string;
  user_name: string;
  content: string;
  category: string;
  created_at: string;
  like_count: number;
  comment_count: number;
}

interface ActiveChallenge {
  id: string;
  enrollment_id: string;
  title: string;
  description: string;
  xp_reward: number;
  progress_pct: number;
  checkins_done: number;
  checkins_required: number;
}

function getCyclePhaseColors(colors: any): Record<string, string> {
  return {
    menstrual: colors.phaseMenstrual,
    follicular: colors.phaseFollicular,
    ovulatory: colors.phaseOvulatory,
    luteal: colors.phaseLuteal,
  };
}

const CYCLE_PHASE_ICONS: Record<string, string> = {
  menstrual: 'water',
  follicular: 'flower',
  ovulatory: 'sunny',
  luteal: 'moon',
};

function timeAgo(dateStr: string, t: (key: string) => string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return t('common_now');
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return `${Math.floor(diffDay / 7)}${t('common_weeks_abbrev')}`;
}

export default function PortalDashboard({ navigation }: any) {
  const { user, profile, progress } = useAuth();
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const colors = currentColors;
  const { isEnabled } = useFeatureFlags();

  const [localProgress, setLocalProgress] = useState(progress);
  const [affirmation, setAffirmation] = useState('');
  const [activeChallenges, setActiveChallenges] = useState<ActiveChallenge[]>([]);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cyclePhase, setCyclePhase] = useState<string | null>(null);
  const [energyLevel, setEnergyLevel] = useState<number | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState('');
  const [subscriptionActive, setSubscriptionActive] = useState(false);

  const userName = profile?.full_name || user?.user_metadata?.name || t('home_guerrera');
  const isPremium = subscriptionActive;
  const xpTotal = localProgress?.xp_total ?? progress?.xp_total ?? 0;
  const streakDays = localProgress?.streak_days ?? progress?.streak_days ?? 0;
  const level = Math.floor(xpTotal / 100) + 1;
  const xpInLevel = xpTotal % 100;
  const modulesCompleted = Math.floor(xpTotal / 50);
  const badgesEarned = Math.floor(xpTotal / 200);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [progressData, challengesData, communityData, cycleLogData, subData] = await Promise.allSettled([
        getProgress(user.id),
        aiWeeklyChallenges(),
        getCommunityFeed(undefined, 3, 0),
        getCycleLog(user.id, 1),
        getSubscriptions(user.id),
      ]);

      if (subData.status === 'fulfilled') {
        const sub = subData.value;
        const active = sub && (sub.status === 'active' || sub.status === 'trialing') && (!sub.current_period_end || new Date(sub.current_period_end) > new Date());
        setSubscriptionActive(!!active);
      }

      if (progressData.status === 'fulfilled') setLocalProgress(progressData.value);
      if (challengesData.status === 'fulfilled') {
        const d = challengesData.value;
        setActiveChallenges((d.active || []).slice(0, 3));
      }
      if (communityData.status === 'fulfilled') {
        setCommunityPosts((communityData.value.posts || []).slice(0, 3));
      }
      if (cycleLogData.status === 'fulfilled') {
        const log = cycleLogData.value?.[0];
        if (log?.phase) setCyclePhase(log.phase);
        if (log?.energy != null) setEnergyLevel(log.energy);
      }

      aiAffirmations({ user_id: user.id, lang: t('lang_code') })
        .then((res) => setAffirmation(res.affirmation))
        .catch(() => {});
    } catch {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, t]);

  useEffect(() => {
    if (progress) setLocalProgress(progress);
  }, [progress]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const navigateToTab = (tabName: string, screen?: string) => {
    const parent = navigation.getParent?.();
    if (!parent) return;
    const state = parent.getState?.();
    const exists = state?.routes?.some((r: any) => r.name === tabName);
    if (!exists) return;
    if (screen) {
      parent.navigate(tabName, { screen });
    } else {
      parent.navigate(tabName);
    }
  };

  const navigateInStack = (screenName: string) => {
    navigation.navigate(screenName);
  };

  const PREMIUM_FEATURES = ['chat-laura', 'growth-coach', 'wellness-planner'];

  const handleQuickAction = (action: any) => {
    if (PREMIUM_FEATURES.includes(action.key) && !isPremium) {
      setPaywallFeature(action.title);
      setPaywallVisible(true);
      return;
    }
    action.onPress();
  };

  const handleUpgrade = async () => {
    setPaywallVisible(false);
    try {
      const result = await stripeMarketplaceCheckout({
        tier: 'guerrera',
        success_url: 'yayika://',
        cancel_url: 'yayika://',
      });
      if (result?.url) {
        Linking.openURL(result.url);
      }
    } catch (e) {
      console.log('Checkout error:', e);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingTop: spacing.md,
      marginBottom: spacing.lg,
    },
    headerLeft: {
      flex: 1,
    },
    greeting: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    phaseRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    phaseBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      gap: 4,
    },
    phaseText: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      color: colors.white,
      textTransform: 'capitalize',
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    streakText: {
      marginLeft: spacing.xs,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.gold,
    },
    xpCard: {
      marginBottom: spacing.lg,
    },
    xpHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    xpLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    xpValue: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.gold,
    },
    xpLevel: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.subtleText,
    },
    xpBar: {
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 5,
      overflow: 'hidden',
    },
    xpFill: {
      height: '100%',
      backgroundColor: colors.gold,
      borderRadius: 5,
    },
    xpHint: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
      marginTop: spacing.xs,
      textAlign: 'right',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      padding: spacing.sm + 2,
      alignItems: 'center',
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    statValue: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginTop: spacing.xs,
    },
    statLabel: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
      marginTop: 2,
    },
    cycleCard: {
      marginBottom: spacing.lg,
    },
    cycleHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    cycleIconContainer: {
      width: 44,
      height: 44,
      borderRadius: borderRadius.md,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    cycleInfo: {
      flex: 1,
    },
    cycleTitle: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
      fontWeight: typography.weights.medium,
    },
    cyclePhase: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginTop: 2,
    },
    energyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warningBg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
      gap: 4,
    },
    energyText: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      color: colors.gold,
    },
    logButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: spacing.sm + 2,
      borderRadius: borderRadius.md,
      gap: spacing.xs,
    },
    logButtonText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.white,
    },
    sectionTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    gridItem: {
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
    gridItemLocked: {
      opacity: 0.6,
    },
    gridIcon: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.md,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    gridTitle: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      color: colors.text,
      textAlign: 'center',
      lineHeight: 16,
    },
    gridSub: {
      fontSize: 11,
      color: colors.subtleText,
      marginTop: 2,
      textAlign: 'center',
    },
    affirmationCard: {
      backgroundColor: colors.warningBg,
      marginBottom: spacing.lg,
    },
    badgeShowcaseCard: {
      marginBottom: spacing.lg,
    },
    affirmationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    affirmationTitle: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.gold,
    },
    affirmationText: {
      fontSize: typography.sizes.md,
      color: colors.text,
      lineHeight: 22,
      fontStyle: 'italic',
    },
    challengeCard: {
      marginBottom: spacing.sm,
    },
    challengeHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    challengeInfo: {
      flex: 1,
      marginRight: spacing.sm,
    },
    challengeTitle: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.text,
    },
    challengeSub: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
      marginTop: 2,
    },
    challengeXpBadge: {
      backgroundColor: colors.warningBg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: borderRadius.full,
    },
    challengeXpText: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.bold,
      color: colors.gold,
    },
    challengeBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    challengeBarFill: {
      height: '100%',
      backgroundColor: colors.turquoise,
      borderRadius: 3,
    },
    postCard: {
      marginBottom: spacing.sm,
    },
    postHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    postAvatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.sm,
    },
    postAvatarText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      color: colors.primary,
    },
    postMeta: {
      flex: 1,
    },
    postAuthor: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.text,
    },
    postTime: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
    },
    postContent: {
      fontSize: typography.sizes.sm,
      color: colors.text,
      lineHeight: 20,
      marginBottom: spacing.sm,
    },
    postFooter: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    postStat: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    postStatText: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
    },
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    seeAllText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.primary,
    },
    socialSection: {
      marginTop: spacing.sm,
    },
    desireCard: {
      marginBottom: spacing.lg,
      backgroundColor: colors.white,
    },
    desireHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    desireTitle: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      flex: 1,
    },
    desireText: {
      fontSize: typography.sizes.md,
      lineHeight: 22,
      fontStyle: 'italic',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const quickActions = [
    {
      key: 'ciclo-productiva',
      title: t('home_my_cycle'),
      subtitle: t('home_my_cycle_sub'),
      icon: 'book',
      bgColor: colors.primaryLight,
      iconColor: colors.primary,
      onPress: () => navigateToTab('Ciclo', 'ModuleList'),
      flag: 'courses',
    },
    {
      key: 'ciclo-inteligente',
      title: t('cycle_intel_title'),
      subtitle: t('cycle_intel_subtitle'),
      icon: 'moon',
      bgColor: colors.gold,
      iconColor: colors.gold,
      onPress: () => navigateToTab('Ciclo', 'CycleIntelligence'),
      flag: 'courses',
    },
    {
      key: 'retos',
      title: t('nav_retos'),
      subtitle: t('challenges_subtitle'),
      icon: 'trophy',
      bgColor: colors.warningBg,
      iconColor: colors.gold,
      onPress: () => navigateToTab('Retos'),
      flag: 'weekly_challenges',
    },
    {
      key: 'comunidad',
      title: t('nav_comunidad'),
      subtitle: t('community_subtitle'),
      icon: 'people',
      bgColor: colors.primaryLight,
      iconColor: colors.primary,
      onPress: () => navigateToTab('Comunidad'),
      flag: 'community',
    },
    {
      key: 'finanzas',
      title: t('nav_finanzas'),
      subtitle: t('finance_subtitle'),
      icon: 'wallet',
      bgColor: colors.rose,
      iconColor: colors.rose,
      onPress: () => navigateToTab('Finanzas'),
    },
    {
      key: 'badges',
      title: t('badges_title'),
      subtitle: t('badges_subtitle'),
      icon: 'ribbon',
      bgColor: colors.successBg,
      iconColor: colors.turquoise,
      onPress: () => navigateInStack('Badges'),
    },
    {
      key: 'chat-laura',
      title: t('chat_title'),
      subtitle: t('chat_subtitle'),
      icon: 'chatbubble-ellipses',
      bgColor: colors.primaryLight,
      iconColor: colors.primary,
      onPress: () => navigateInStack('Chat'),
      flag: 'chat_ia',
    },
    {
      key: 'growth-coach',
      title: t('growth_title'),
      subtitle: t('growth_loading'),
      icon: 'trending-up',
      bgColor: colors.successBg,
      iconColor: colors.turquoise,
      onPress: () => navigateInStack('GrowthCoach'),
      flag: 'growth_coach',
    },
    {
      key: 'wellness-planner',
      title: t('wellness_title'),
      subtitle: t('home_wellness_sub'),
      icon: 'leaf',
      bgColor: colors.warningBg,
      iconColor: colors.gold,
      onPress: () => navigateInStack('WellnessPlanner'),
      flag: 'wellness_planner',
    },
  ].filter(action => !action.flag || isEnabled(action.flag));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t('home_greeting')} {userName}</Text>
            <View style={styles.phaseRow}>
              {cyclePhase ? (
                <View style={[styles.phaseBadge, { backgroundColor: getCyclePhaseColors(colors)[cyclePhase] || colors.primary }]}>
                  <Ionicons
                    name={(CYCLE_PHASE_ICONS[cyclePhase] as any) || 'ellipse'}
                    size={12}
                    color={colors.white}
                  />
                  <Text style={styles.phaseText}>{t(`cycle_phase_${cyclePhase}`) || cyclePhase}</Text>
                </View>
              ) : (
                <View style={[styles.phaseBadge, { backgroundColor: colors.border }]}>
                  <Ionicons name="ellipse-outline" size={12} color={colors.subtleText} />
                  <Text style={[styles.phaseText, { color: colors.subtleText }]}>{t('common_no_data')}</Text>
                </View>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.streakBadge}
            onPress={() => navigateInStack('Profile')}
          >
            <Ionicons name="flame" size={18} color={colors.gold} />
            <Text style={styles.streakText}>{streakDays}</Text>
          </TouchableOpacity>
        </View>

        {/* First Week Hook */}
        <FirstWeekBanner />

        {/* Emotional Profile */}
        <EmotionalProfileCard />

        {/* Streak Banner */}
        <StreakBanner />

        {/* Daily Action */}
        <DailyActionCard cyclePhase={(cyclePhase as any) || 'unknown'} />

        {/* Daily Surprise */}
        <DailySurprise />

        {/* Emotional Checkin - once per day */}
        <EmotionalCheckin cyclePhase={(cyclePhase as any) || 'unknown'} onOpenChat={() => navigation.navigate('EmpatheticChat')} />

        {/* Daily Desire Card - Empowering Content */}
        <DailyDesireCard cyclePhase={(cyclePhase as any) || 'unknown'} />

        {/* Surprise Insight */}
        <SurpriseInsightCard />

        {/* Growth Reflection */}
        <GrowthReflectionCard />

        {/* Wisdom Exchange */}
        <WisdomExchangeCard cyclePhase={(cyclePhase as any) || 'unknown'} />

        {/* XP Progress Bar */}
        <Card style={styles.xpCard}>
          <View style={styles.xpHeader}>
            <View style={styles.xpLeft}>
              <Ionicons name="star" size={20} color={colors.gold} />
              <Text style={styles.xpValue}>{xpTotal} {t('common_xp_unit')}</Text>
            </View>
            <Text style={styles.xpLevel}>{t('home_level')} {level}</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpInLevel}%` }]} />
          </View>
          <Text style={styles.xpHint}>{100 - xpInLevel} {t('home_xp_for_level')} {level + 1}</Text>
        </Card>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="star" size={20} color={colors.gold} />
            <Text style={styles.statValue}>{xpTotal}</Text>
            <Text style={styles.statLabel}>{t('home_xp_total')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="flame" size={20} color={colors.error} />
            <Text style={styles.statValue}>{streakDays}</Text>
            <Text style={styles.statLabel}>{t('home_streak')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="book" size={20} color={colors.turquoise} />
            <Text style={styles.statValue}>{modulesCompleted}</Text>
            <Text style={styles.statLabel}>{t('home_modules')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="ribbon" size={20} color={colors.primary} />
            <Text style={styles.statValue}>{badgesEarned}</Text>
            <Text style={styles.statLabel}>{t('badges_title')}</Text>
          </View>
        </View>

        {/* Daily Affirmation */}
        {affirmation ? (
          <Card style={styles.affirmationCard}>
            <View style={styles.affirmationHeader}>
              <Ionicons name="sparkles" size={18} color={colors.gold} />
              <Text style={styles.affirmationTitle}>{t('home_affirmation')}</Text>
            </View>
            <Text style={styles.affirmationText}>{affirmation}</Text>
          </Card>
        ) : null}

        {/* Cycle Widget */}
        <Card style={styles.cycleCard}>
          <View style={styles.cycleHeader}>
            <View style={styles.cycleIconContainer}>
              <Ionicons name="moon" size={24} color={colors.primary} />
            </View>
            <View style={styles.cycleInfo}>
              <Text style={styles.cycleTitle}>{t('home_my_cycle')}</Text>
              <Text style={styles.cyclePhase}>
                {cyclePhase ? t(`cycle_phase_${cyclePhase}`) || cyclePhase.charAt(0).toUpperCase() + cyclePhase.slice(1) : t('cycle_phase_unknown')}
              </Text>
            </View>
            {energyLevel !== null && (
              <View style={styles.energyBadge}>
                <Ionicons name="flash" size={14} color={colors.gold} />
                <Text style={styles.energyText}>{energyLevel}/10</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.logButton}
            onPress={() => navigateToTab('Ciclo', 'CycleLog')}
            activeOpacity={0.7}
          >
            <Text style={styles.logButtonText}>{t('home_register_today')}</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.white} />
          </TouchableOpacity>
        </Card>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>{t('home_quick_actions')}</Text>
        <View style={styles.grid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.key}
              style={[styles.gridItem, PREMIUM_FEATURES.includes(action.key) && !isPremium && styles.gridItemLocked]}
              onPress={() => handleQuickAction(action)}
              activeOpacity={0.7}
            >
              <View style={[styles.gridIcon, { backgroundColor: action.bgColor }]}>
                <Ionicons name={action.icon as any} size={22} color={action.iconColor} />
                {PREMIUM_FEATURES.includes(action.key) && !isPremium && (
                  <Ionicons name="lock-closed" size={10} color={colors.gold} style={{ position: 'absolute', bottom: -2, right: -2 }} />
                )}
              </View>
              <Text style={styles.gridTitle}>{action.title}</Text>
              <Text style={styles.gridSub}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Retention: Social Proof */}
        <SocialProofWidget
          onPress={() => navigateToTab('Comunidad')}
        />

        {/* Social Activity Feed */}
        <View style={styles.socialSection}>
          <CircleActivityFeed
            maxItems={5}
            onSeeAll={() => navigateToTab('Comunidad')}
            onActivityPress={() => navigateToTab('Comunidad')}
          />
        </View>

        {/* Retention: Future Self */}
        <FutureSelf />

        {/* Badge Showcase */}
        <Card style={styles.badgeShowcaseCard}>
          <BadgeShowcase editable={true} />
        </Card>

        {/* Completion Anxiety - Tareas pendientes */}
        <CompletionAnxiety onItemPress={(item) => {
          if (item.type === 'course') navigateToTab('Ciclo', 'ModuleList');
          else if (item.type === 'challenge') navigateToTab('Retos');
          else if (item.type === 'cycle_log') navigateToTab('Ciclo', 'CycleLog');
        }} />

        {/* Weekly Challenges */}
        {activeChallenges.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('challenges_active')}</Text>
            {activeChallenges.map((challenge) => (
              <Card key={challenge.id} style={styles.challengeCard}>
                <View style={styles.challengeHeader}>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle} numberOfLines={1}>{challenge.title}</Text>
                    <Text style={styles.challengeSub}>
                      {challenge.checkins_done}/{challenge.checkins_required} {t('common_checkins')}
                    </Text>
                  </View>
                  <View style={styles.challengeXpBadge}>
                    <Text style={styles.challengeXpText}>+{challenge.xp_reward} {t('common_xp_unit')}</Text>
                  </View>
                </View>
                <View style={styles.challengeBar}>
                  <View style={[styles.challengeBarFill, { width: `${challenge.progress_pct}%` }]} />
                </View>
              </Card>
            ))}
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigateToTab('Retos')}
            >
              <Text style={styles.seeAllText}>{t('home_view_all_challenges')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}

        {/* Recent Community */}
        {communityPosts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('home_recent_community')}</Text>
            {communityPosts.map((post) => (
              <Card key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postAvatar}>
                    <Text style={styles.postAvatarText}>
                      {(post.user_name || 'U').charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.postMeta}>
                    <Text style={styles.postAuthor} numberOfLines={1}>{post.user_name}</Text>
                    <Text style={styles.postTime}>{timeAgo(post.created_at, t)}</Text>
                  </View>
                </View>
                <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>
                <View style={styles.postFooter}>
                  <View style={styles.postStat}>
                    <Ionicons name="heart-outline" size={14} color={colors.subtleText} />
                    <Text style={styles.postStatText}>{post.like_count}</Text>
                  </View>
                  <View style={styles.postStat}>
                    <Ionicons name="chatbubble-outline" size={14} color={colors.subtleText} />
                    <Text style={styles.postStatText}>{post.comment_count}</Text>
                  </View>
                </View>
              </Card>
            ))}
            <TouchableOpacity
              style={styles.seeAllButton}
              onPress={() => navigateToTab('Comunidad')}
            >
              <Text style={styles.seeAllText}>{t('home_view_all_community')}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <PaywallModal
        visible={paywallVisible}
        onClose={() => setPaywallVisible(false)}
        onUpgrade={handleUpgrade}
        featureName={paywallFeature}
        requiredPlan="Guerrera"
      />
    </SafeAreaView>
  );
}

