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
import { aiWellnessPlanner, WellnessParams } from '../../config/api';
import { getCycleLog } from '../../config/api';

interface WellnessPlan {
  meals: { name: string; description: string; icon: string }[];
  exercise: { name: string; duration: string; why: string }[];
  tip: string;
}

export default function WellnessPlannerScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const { user } = useAuth();
  const colors = currentColors;

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<WellnessPlan | null>(null);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(false);

      let cyclePhase: string | undefined;
      try {
        const logs = await getCycleLog(user.id, 1);
        if (logs?.[0]) {
          cyclePhase = logs[0].phase;
        }
      } catch {}

      const params: WellnessParams = {
        cycle_phase: cyclePhase,
        lang: t('lang_code') || 'es',
      };

      const res = await aiWellnessPlanner(params);
      setPlan(res.plan);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const renderMeals = () => {
    if (!plan?.meals?.length) return null;
    return (
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('wellness_meals')}</Text>
        </View>
        {plan.meals.map((meal, i) => (
          <View key={i} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
            <Text style={styles.itemIcon}>{meal.icon}</Text>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{meal.name}</Text>
              <Text style={[styles.itemDesc, { color: colors.subtleText }]}>{meal.description}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderExercise = () => {
    if (!plan?.exercise?.length) return null;
    return (
      <View style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="fitness-outline" size={22} color={colors.turquoise} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('wellness_exercise')}</Text>
        </View>
        {plan.exercise.map((ex, i) => (
          <View key={i} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.exerciseBadge, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="time-outline" size={14} color={colors.primary} />
              <Text style={[styles.exerciseDuration, { color: colors.primary }]}>{ex.duration}</Text>
            </View>
            <View style={styles.itemContent}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{ex.name}</Text>
              <Text style={[styles.itemDesc, { color: colors.subtleText }]}>{ex.why}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderTip = () => {
    if (!plan?.tip) return null;
    return (
      <View style={[styles.tipCard, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name="bulb-outline" size={20} color={colors.primary} />
        <Text style={[styles.tipText, { color: colors.primary }]}>{plan.tip}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('wellness_title')}</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.subtleText }]}>{t('wellness_loading')}</Text>
        </View>
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
          {renderTip()}
          {renderMeals()}
          {renderExercise()}
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
  loadingText: { fontSize: typography.sizes.md },
  errorText: { fontSize: typography.sizes.md },
  retryBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  retryText: { color: '#FFF', fontWeight: typography.weights.semibold },
  card: { borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  cardTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.bold },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.md,
  },
  itemIcon: { fontSize: 24 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },
  itemDesc: { fontSize: typography.sizes.sm, marginTop: 2 },
  exerciseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  exerciseDuration: { fontSize: typography.sizes.xs, fontWeight: typography.weights.semibold },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tipText: { fontSize: typography.sizes.sm, flex: 1, lineHeight: 20 },
});
