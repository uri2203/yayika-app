import React, { useState, useEffect, useCallback } from 'react';
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
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiGrowthCoach, GrowthPlan } from '../../config/api';

export default function GrowthCoachScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const { user } = useAuth();
  const colors = currentColors;

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<GrowthPlan | null>(null);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(false);
      const res = await aiGrowthCoach({ user_id: user.id, lang: t('lang_code')  });
      setPlan(res.plan);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const renderGoal = () => {
    if (!plan?.monthlyGoal) return null;
    const g = plan.monthlyGoal;
    const pct = g.totalDays > 0 ? Math.round((g.daysCompleted / g.totalDays) * 100) : 0;
    return (
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('growth_monthly_goal')}</Text>
        <Text style={[styles.goalTitle, { color: colors.primary }]}>{g.title}</Text>
        <Text style={[styles.goalDesc, { color: colors.subtleText }]}>{g.description}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: colors.primary }]} />
        </View>
        <Text style={[styles.progressText, { color: colors.subtleText }]}>
          {g.daysCompleted}/{g.totalDays} {t('common_days_label')} ({pct}%)
        </Text>
      </View>
    );
  };

  const renderMilestones = () => {
    if (!plan?.milestones?.length) return null;
    return (
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('growth_milestones')}</Text>
        {plan.milestones.map((m, i) => (
          <View key={m.id || i} style={[styles.listItem, { borderBottomColor: colors.border }]}>
            <Ionicons
              name={m.completed ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={m.completed ? '#10B981' : colors.subtleText}
            />
            <Text style={[styles.listItemText, { color: m.completed ? colors.subtleText : colors.text }]}>
              {m.title}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderDailyActions = () => {
    if (!plan?.dailyActions?.length) return null;
    return (
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('growth_daily_actions')}</Text>
        {plan.dailyActions.map((a, i) => (
          <View key={a.id || i} style={[styles.listItem, { borderBottomColor: colors.border }]}>
            <Ionicons
              name={a.completed ? 'checkbox' : 'square-outline'}
              size={22}
              color={a.completed ? colors.primary : colors.subtleText}
            />
            <Text style={[styles.listItemText, { color: a.completed ? colors.subtleText : colors.text }]}>
              {a.title}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderWeekChart = () => {
    if (!plan?.weekData?.length) return null;
    const max = Math.max(...plan.weekData, 1);
    const days = [t('common_day_mon_short'), t('common_day_tue_short'), t('common_day_wed_short'), t('common_day_thu_short'), t('common_day_fri_short'), t('common_day_sat_short'), t('common_day_sun_short')];
    return (
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>{t('growth_weekly_progress')}</Text>
        <View style={styles.weekChart}>
          {plan.weekData.map((val, i) => (
            <View key={i} style={styles.chartCol}>
              <View style={styles.chartBarBg}>
                <View style={[styles.chartBarFill, { height: `${(val / max) * 100}%`, backgroundColor: colors.primary }]} />
              </View>
              <Text style={[styles.chartDay, { color: colors.subtleText }]}>{days[i] || ''}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('growth_title')}</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 60 }} />
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.subtleText} />
          <Text style={[styles.errorText, { color: colors.subtleText }]}>{t('common_error')}</Text>
          <TouchableOpacity onPress={fetchData} style={[styles.retryBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.retryText}>{t('common_retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {plan?.quote && (
            <View style={[styles.quoteCard, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="sparkles" size={20} color={colors.primary} />
              <Text style={[styles.quoteText, { color: colors.primary }]}>{plan.quote}</Text>
            </View>
          )}
          {renderGoal()}
          {renderWeekChart()}
          {renderMilestones()}
          {renderDailyActions()}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  errorText: { fontSize: typography.sizes.md },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  retryText: { color: '#FFF', fontWeight: typography.weights.semibold },
  card: { borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold, marginBottom: spacing.md },
  goalTitle: { fontSize: typography.sizes.lg, fontWeight: typography.weights.bold, marginBottom: spacing.xs },
  goalDesc: { fontSize: typography.sizes.sm, marginBottom: spacing.md },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: spacing.xs },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: typography.sizes.xs, textAlign: 'right' },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  listItemText: { fontSize: typography.sizes.md, flex: 1 },
  weekChart: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 120 },
  chartCol: { alignItems: 'center', flex: 1 },
  chartBarBg: { width: 20, height: 80, backgroundColor: '#E5E7EB', borderRadius: 10, overflow: 'hidden', justifyContent: 'flex-end' },
  chartBarFill: { width: '100%', borderRadius: 10 },
  chartDay: { fontSize: typography.sizes.xs, marginTop: spacing.xs },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  quoteText: { fontSize: typography.sizes.sm, fontStyle: 'italic', flex: 1 },
});
