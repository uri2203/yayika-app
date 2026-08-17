import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import Card from '../../components/Card';
import { getProgress, aiAffirmations, getCheckins, addCheckin, addXpEvent } from '../../config/api';

export default function HomeScreen({ navigation }: any) {
  const { user, profile, progress } = useAuth();
  const { t } = useLanguage();
  const userName = profile?.full_name || user?.user_metadata?.name || t('home_guerrera');

  const [todayAffirmation, setTodayAffirmation] = useState<string>('');
  const [localProgress, setLocalProgress] = useState(progress);
  const [checkedInToday, setCheckedInToday] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const xpTotal = localProgress?.xp_total ?? progress?.xp_total ?? 0;
  const streakDays = localProgress?.streak_days ?? progress?.streak_days ?? 0;
  const level = Math.floor(xpTotal / 100) + 1;
  const xpInLevel = xpTotal % 100;

  useEffect(() => {
    if (progress) setLocalProgress(progress);
  }, [progress]);

  useEffect(() => {
    if (!user?.id) return;
    const today = new Date().toISOString().split('T')[0];

    aiAffirmations({ user_id: user.id, lang: 'es' })
      .then((res) => setTodayAffirmation(res.affirmation))
      .catch(() => {});

    getProgress(user.id)
      .then((p) => setLocalProgress(p))
      .catch(() => {});

    getCheckins(user.id)
      .then((checkins) => {
        const todayCheckin = checkins.find((c) => c.checkin_date === today);
        if (todayCheckin) setCheckedInToday(true);
      })
      .catch(() => {});
  }, [user?.id]);

  const handleCheckin = async () => {
    if (!user?.id || checkedInToday || checkinLoading) return;
    try {
      setCheckinLoading(true);
      await addCheckin(user.id);
      await addXpEvent(user.id, 'daily_checkin', 10);
      setCheckedInToday(true);
      setLocalProgress((prev: any) => ({ ...prev, xp_total: (prev?.xp_total ?? 0) + 10 }));
      Alert.alert(t('home_checkin_success_title'), t('home_checkin_success'));
    } catch (err) {
      Alert.alert(t('common_error'), err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setCheckinLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('home_greeting')} {userName} 👋</Text>
            <Text style={styles.subtitle}>{t('home_subtitle')}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Ionicons name="flame" size={18} color={colors.gold} />
            <Text style={styles.streakText}>{streakDays}</Text>
          </View>
        </View>

        {/* XP Bar */}
        <Card style={styles.xpContainer}>
          <View style={styles.xpRow}>
            <Ionicons name="star" size={18} color={colors.gold} />
            <Text style={styles.xpText}>{xpTotal} XP</Text>
            <Text style={styles.xpLevel}>{t('home_level')} {level}</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${xpInLevel}%` }]} />
          </View>
        </Card>

        {/* Daily Check-in */}
        <TouchableOpacity
          style={[styles.checkinCard, checkedInToday && styles.checkinCardDone]}
          onPress={handleCheckin}
          disabled={checkedInToday || checkinLoading}
          activeOpacity={checkedInToday ? 1 : 0.7}
        >
          <View style={[styles.checkinIcon, checkedInToday && styles.checkinIconDone]}>
            <Ionicons name={checkedInToday ? 'checkmark-circle' : 'checkbox-outline'} size={28} color={checkedInToday ? colors.success : colors.primary} />
          </View>
          <View style={styles.checkinInfo}>
            <Text style={[styles.checkinTitle, checkedInToday && styles.checkinTitleDone]}>{t('home_checkin')}</Text>
            <Text style={styles.checkinSub}>{checkedInToday ? t('home_checkin_done') : t('home_checkin_sub')}</Text>
          </View>
          {!checkedInToday && <Text style={styles.checkinXp}>+10 XP</Text>}
          {checkinLoading && <ActivityIndicator size="small" color={colors.primary} />}
        </TouchableOpacity>

        {/* Quick Actions Grid */}
        <Text style={styles.sectionTitle}>{t('home_quick_actions')}</Text>
        <View style={styles.grid}>
          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Explore')}
          >
            <View style={[styles.gridIcon, { backgroundColor: colors.primaryLight || '#E8D5F5' }]}>
              <Ionicons name="compass" size={22} color={colors.primary} />
            </View>
            <Text style={styles.gridTitle}>{t('home_explore')}</Text>
            <Text style={styles.gridSub}>{t('home_explore_sub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Progress')}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="trending-up" size={22} color={colors.turquoise} />
            </View>
            <Text style={styles.gridTitle}>{t('home_progress')}</Text>
            <Text style={styles.gridSub}>{t('home_progress_sub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Home', { screen: 'CycleTracker' })}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FDE68A' }]}>
              <Ionicons name="moon" size={22} color={colors.gold} />
            </View>
            <Text style={styles.gridTitle}>{t('home_my_cycle')}</Text>
            <Text style={styles.gridSub}>{t('home_my_cycle_sub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Home', { screen: 'FinancialTracker' })}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="wallet" size={22} color={colors.rose} />
            </View>
            <Text style={styles.gridTitle}>{t('home_finance')}</Text>
            <Text style={styles.gridSub}>{t('home_finance_sub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Home', { screen: 'WellnessPlanner' })}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="leaf" size={22} color={colors.turquoise} />
            </View>
            <Text style={styles.gridTitle}>{t('home_wellness')}</Text>
            <Text style={styles.gridSub}>{t('home_wellness_sub')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridItem}
            onPress={() => navigation.navigate('Home', { screen: 'Community' })}
          >
            <View style={[styles.gridIcon, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="people" size={22} color={colors.primary} />
            </View>
            <Text style={styles.gridTitle}>{t('home_community')}</Text>
            <Text style={styles.gridSub}>{t('home_community_sub')}</Text>
          </TouchableOpacity>
        </View>

        {/* Feature Cards */}
        <Text style={styles.sectionTitle}>{t('home_tools')}</Text>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Home', { screen: 'Challenges' })}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="trophy" size={24} color={colors.gold} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>{t('home_weekly_challenges')}</Text>
            <Text style={styles.featureSub}>3/5 {t('home_completed')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Home', { screen: 'Badges' })}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#E0E7FF' }]}>
            <Ionicons name="ribbon" size={24} color={colors.primary} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>{t('home_my_badges')}</Text>
            <Text style={styles.featureSub}>12/30 {t('home_unlocked')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Home', { screen: 'Rankings' })}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="flame" size={24} color="#EF4444" />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>{t('home_rankings')}</Text>
            <Text style={styles.featureSub}>{t('home_position')} #15</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.featureCard}
          onPress={() => navigation.navigate('Home', { screen: 'Wallet' })}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="card" size={24} color={colors.turquoise} />
          </View>
          <View style={styles.featureInfo}>
            <Text style={styles.featureTitle}>{t('home_wallet')}</Text>
            <Text style={styles.featureSub}>{profile?.currency_code || 'MXN'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
        </TouchableOpacity>

        {/* Daily Affirmation */}
        <Card style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Ionicons name="bulb" size={20} color={colors.gold} />
            <Text style={styles.tipTitle}>{t('home_daily_tip')}</Text>
          </View>
          <Text style={styles.tipText}>{todayAffirmation || t('home_tip_1')}</Text>
        </Card>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.subtleText,
    marginTop: spacing.xs,
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
  xpContainer: {
    marginBottom: spacing.lg,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  xpText: {
    marginLeft: spacing.xs,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
  xpLevel: {
    marginLeft: 'auto',
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
  },
  xpBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 4,
  },
  checkinCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4FF',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  checkinCardDone: {
    backgroundColor: '#D1FAE5',
    borderColor: colors.success,
  },
  checkinIcon: {
    marginRight: spacing.md,
  },
  checkinIconDone: {},
  checkinInfo: {
    flex: 1,
  },
  checkinTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  checkinTitleDone: {
    color: colors.success,
  },
  checkinSub: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  checkinXp: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.gold,
    marginRight: spacing.sm,
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
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  gridIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gridTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  gridSub: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  featureSub: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  tipCard: {
    backgroundColor: '#FFF9E6',
    marginTop: spacing.md,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tipTitle: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.gold,
  },
  tipText: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 22,
  },
});
