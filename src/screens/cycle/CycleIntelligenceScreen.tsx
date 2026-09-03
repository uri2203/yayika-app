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
import { aiCycleIntelligence, type CycleDashboard } from '../../config/api';

const PHASE_COLORS: Record<string, string> = {
  Menstrual: '#C96B7A',
  Follicular: '#3BAF7A',
  Ovulatory: '#1A9E8F',
  Luteal: '#B8943A',
};

function EnergyBar({ label, value, maxVal, color }: { label: string; value: number; maxVal: number; color: string }) {
  const { currentColors } = useTheme();
  const colors = currentColors;
  const pct = maxVal > 0 ? (value / maxVal) * 100 : 0;
  const localStyles = StyleSheet.create({
    energyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    energyLabel: { width: 80, fontSize: typography.sizes.sm, color: colors.text },
    energyBarBg: { flex: 1, height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden', marginHorizontal: spacing.sm },
    energyBarFill: { height: '100%', borderRadius: 5 },
    energyValue: { width: 30, fontSize: typography.sizes.sm, color: colors.subtleText, textAlign: 'right' },
  });
  return (
    <View style={localStyles.energyRow}>
      <Text style={localStyles.energyLabel}>{label}</Text>
      <View style={localStyles.energyBarBg}>
        <View style={[localStyles.energyBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={localStyles.energyValue}>{value.toFixed(1)}</Text>
    </View>
  );
}

export default function CycleIntelligenceScreen({ navigation }: any) {
  const { lang, t } = useLanguage();
  const { currentColors } = useTheme();
  const colors = currentColors;

  const getPhaseColor = (phase: string): string => {
    const key = phase?.toLowerCase() || '';
    if (key.includes('menstru')) return '#C96B7A';
    if (key.includes('follicu')) return '#3BAF7A';
    if (key.includes('ovul')) return '#1A9E8F';
    if (key.includes('lute')) return '#B8943A';
    return colors.primary;
  };

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<CycleDashboard | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await aiCycleIntelligence(lang);
      if (result.success && result.dashboard) {
        setDashboard(result.dashboard);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const analytics = dashboard?.analytics;
  const patterns = dashboard?.patterns || [];
  const predictions = dashboard?.predictions;
  const insights = dashboard?.insights || [];

  const maxEnergy = Math.max(...patterns.map((p) => p.avg_energy), 1);

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    header: { paddingTop: spacing.md, marginBottom: spacing.lg },
    backBtn: { marginBottom: spacing.sm },
    title: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    subtitle: {
      fontSize: typography.sizes.md,
      color: colors.subtleText,
      marginTop: spacing.xs,
    },
    emptyCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.xl,
      alignItems: 'center',
      marginTop: spacing.xl,
    },
    emptyText: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
      color: colors.text,
      marginTop: spacing.md,
    },
    emptySubtext: {
      fontSize: typography.sizes.sm,
      color: colors.subtleText,
      marginTop: spacing.xs,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderLeftWidth: 3,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    statValue: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    statLabel: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
      marginTop: spacing.xs,
    },
    phaseCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    phaseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    phaseTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    phaseDays: {
      fontSize: typography.sizes.md,
      color: colors.primary,
      fontWeight: typography.weights.semibold,
      marginBottom: spacing.md,
    },
    predictionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    predictionText: {
      fontSize: typography.sizes.sm,
      color: colors.text,
      marginLeft: spacing.sm,
    },
    sectionCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    energyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    energyLabel: {
      width: 80,
      fontSize: typography.sizes.sm,
      color: colors.text,
    },
    energyBarBg: {
      flex: 1,
      height: 10,
      backgroundColor: colors.border,
      borderRadius: 5,
      overflow: 'hidden',
      marginHorizontal: spacing.sm,
    },
    energyBarFill: {
      height: '100%',
      borderRadius: 5,
    },
    energyValue: {
      width: 30,
      fontSize: typography.sizes.sm,
      color: colors.subtleText,
      textAlign: 'right',
    },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    insightText: {
      flex: 1,
      fontSize: typography.sizes.sm,
      color: colors.text,
      marginLeft: spacing.sm,
      lineHeight: 20,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      gap: spacing.xs,
    },
    actionBtnText: {
      color: colors.white,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('cycle_intel_title') }</Text>
          <Text style={styles.subtitle}>{t('cycle_intel_subtitle') }</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
        ) : !dashboard ? (
          <View style={styles.emptyCard}>
            <Ionicons name="analytics-outline" size={48} color={colors.subtleText} />
            <Text style={styles.emptyText}>{t('cycle_intel_empty') }</Text>
            <Text style={styles.emptySubtext}>{t('cycle_intel_empty_sub') }</Text>
          </View>
        ) : (
          <>
            {/* Analytics Cards */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { borderLeftColor: '#C96B7A' }]}>
                <Text style={styles.statValue}>{analytics?.avg_cycle_length ?? 'â€”'}</Text>
                <Text style={styles.statLabel}>{t('cycle_intel_avg_length') }</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#3BAF7A' }]}>
                <Text style={styles.statValue}>{analytics?.total_cycles ?? 'â€”'}</Text>
                <Text style={styles.statLabel}>{t('cycle_intel_total') }</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#1A9E8F' }]}>
                <Text style={styles.statValue}>{analytics?.regularity_score != null ? `${analytics.regularity_score}%` : 'â€”'}</Text>
                <Text style={styles.statLabel}>{t('cycle_intel_regularity') }</Text>
              </View>
            </View>

            {/* Current Phase */}
            {predictions && (
              <View style={styles.phaseCard}>
                <View style={styles.phaseHeader}>
                  <Ionicons name="moon" size={20} color={colors.primary} />
                  <Text style={styles.phaseTitle}>{t('cycle_intel_current_phase') }</Text>
                </View>
                <Text style={styles.phaseDays}>
                  {t('cycle_intel_days_remaining') }: {predictions.days_remaining}
                </Text>
                <View style={styles.predictionRow}>
                  <Ionicons name="water" size={16} color="#C96B7A" />
                  <Text style={styles.predictionText}>
                    {t('cycle_next_period') }: {predictions.period_start}
                  </Text>
                </View>
                <View style={styles.predictionRow}>
                  <Ionicons name="sunny" size={16} color="#1A9E8F" />
                  <Text style={styles.predictionText}>
                    {t('cycle_ovulation') }: {predictions.ovulation}
                  </Text>
                </View>
              </View>
            )}

            {/* Energy Patterns */}
            {patterns.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{t('cycle_intel_energy') }</Text>
                {patterns.map((p) => (
                  <EnergyBar
                    key={p.phase}
                    label={p.phase}
                    value={p.avg_energy}
                    maxVal={maxEnergy}
                    color={getPhaseColor(p.phase)}
                  />
                ))}
              </View>
            )}

            {/* Insights */}
            {insights.length > 0 && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{t('cycle_intel_insights') }</Text>
                {insights.map((insight, i) => (
                  <View key={i} style={styles.insightRow}>
                    <Ionicons name="bulb" size={16} color={colors.gold} />
                    <Text style={styles.insightText}>{insight}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => navigation.navigate('CycleLog')}
              >
                <Ionicons name="create-outline" size={22} color={colors.white} />
                <Text style={styles.actionBtnText}>{t('cycle_intel_log') }</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#1A9E8F' }]}
                onPress={() => navigation.navigate('CycleCoach')}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.white} />
                <Text style={styles.actionBtnText}>{t('cycle_intel_coach') }</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
