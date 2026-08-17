import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { aiGrowthCoach, GrowthPlan } from '../../config/api';

export default function GrowthCoachScreen({ navigation }: any) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<GrowthPlan | null>(null);
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    aiGrowthCoach({ user_id: user?.id, lang })
      .then((res) => {
        setPlan(res.plan);
        const initial: Record<string, boolean> = {};
        res.plan.dailyActions.forEach((a) => { initial[a.id] = a.completed; });
        setCheckedActions(initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user, lang]);

  const toggleAction = (id: string) => {
    setCheckedActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedMilestones = plan?.milestones.filter((m) => m.completed).length ?? 0;
  const totalMilestones = plan?.milestones.length ?? 0;
  const completedActions = plan?.dailyActions.filter((a) => checkedActions[a.id]).length ?? 0;
  const totalActions = plan?.dailyActions.length ?? 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.scrollContent, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('growth_loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('growth_title')}</Text>
        </View>

        {/* Monthly Goal */}
        {plan?.monthlyGoal && (
          <View style={styles.goalCard}>
            <Text style={styles.goalLabel}>{t('growth_monthly_goal')}</Text>
            <Text style={styles.goalTitle}>{plan.monthlyGoal.title}</Text>
            <Text style={styles.goalDesc}>{plan.monthlyGoal.description}</Text>
            <View style={styles.progressRow}>
              <Text style={styles.progressPct}>{plan.monthlyGoal.progress}%</Text>
              <Text style={styles.progressMeta}>
                {plan.monthlyGoal.daysCompleted}/{plan.monthlyGoal.totalDays} {t('growth_days')}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(plan.monthlyGoal.progress, 100)}%` },
                ]}
              />
            </View>
          </View>
        )}

        {/* Progress Chart */}
        {plan?.weekData && plan.weekData.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>{t('growth_weekly_progress')}</Text>
            <View style={styles.barChart}>
              {plan.weekData.map((val, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${val}%` }]} />
                  </View>
                  <Text style={styles.barLabel}>{['L', 'M', 'X', 'J', 'V', 'S', 'D'][i]}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Milestones */}
        {plan?.milestones && plan.milestones.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('growth_milestones')}</Text>
              <Text style={styles.sectionCount}>
                {completedMilestones}/{totalMilestones}
              </Text>
            </View>
            {plan.milestones.map((m) => (
              <View key={m.id} style={styles.listItem}>
                <Ionicons
                  name={m.completed ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={m.completed ? colors.success : colors.border}
                />
                <Text style={[styles.listText, m.completed && styles.listTextDone]}>
                  {m.title}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Daily Actions */}
        {plan?.dailyActions && plan.dailyActions.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('growth_daily_actions')}</Text>
              <Text style={styles.sectionCount}>
                {completedActions}/{totalActions}
              </Text>
            </View>
            {plan.dailyActions.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.listItem}
                onPress={() => toggleAction(a.id)}
              >
                <Ionicons
                  name={checkedActions[a.id] ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={checkedActions[a.id] ? colors.primary : colors.border}
                />
                <Text
                  style={[styles.listText, checkedActions[a.id] && styles.listTextDone]}
                >
                  {a.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Motivational Quote */}
        {plan?.quote && (
          <View style={styles.quoteCard}>
            <Ionicons name="heart" size={18} color={colors.rose} />
            <Text style={styles.quoteText}>{plan.quote}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.subtleText,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backBtn: { marginRight: spacing.sm },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  goalCard: {
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
  goalLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  goalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  goalDesc: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginBottom: spacing.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressPct: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.turquoise,
  },
  progressMeta: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.turquoise,
    borderRadius: 5,
  },
  chartCard: {
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
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: spacing.sm,
  },
  barCol: { alignItems: 'center', flex: 1 },
  barTrack: {
    width: 20,
    height: 80,
    backgroundColor: colors.border,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  barLabel: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: spacing.xs,
  },
  sectionCard: {
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  sectionCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.turquoise,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listText: {
    flex: 1,
    fontSize: typography.sizes.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  listTextDone: {
    textDecorationLine: 'line-through',
    color: colors.subtleText,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF1F5',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  quoteText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    color: colors.text,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
});
