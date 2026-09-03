import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getOnboardingState, completeOnboardingDay } from '../../config/api';

interface DayTask {
  day: number;
  task_key: string;
  completed: boolean;
  xp_earned: number;
}

interface OnboardingState {
  current_day: number;
  started_at: string;
  is_completed: boolean;
  total_xp_earned: number;
  completed_days: number;
  total_days: 7;
  days_data: DayTask[];
}

const DAY_EMOJIS: Record<number, string> = {
  1: '👋',
  2: '🌙',
  3: '💰',
  4: '📚',
  5: '🎯',
  6: '👥',
  7: '🏆',
};

const TASK_XP = 10;

export default function OnboardingFlowScreen({ navigation }: any) {
  const { currentColors } = useTheme();
  const colors = currentColors;
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [state, setState] = useState<OnboardingState | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);

  const fetchState = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await getOnboardingState(user.id);
      if (data.state) {
        setState(data.state);
        setSelectedDay(data.state.current_day);
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleCompleteDay = async (day: number) => {
    if (!user || completing) return;
    try {
      setCompleting(true);
      const result = await completeOnboardingDay(user.id, day);
      setState((prev) => {
        if (!prev) return prev;
        const updatedDays = prev.days_data.map((d) =>
          d.day === day ? { ...d, completed: true, xp_earned: TASK_XP } : d
        );
        return {
          ...prev,
          days_data: updatedDays,
          completed_days: result.completed_days,
          total_xp_earned: prev.total_xp_earned + TASK_XP,
          is_completed: result.is_all_done,
          current_day: result.next_day,
        };
      });
      Alert.alert(t('onboard_flow_great'), t('onboard_flow_xp_earned', { xp: TASK_XP }));
    } catch (err) {
      Alert.alert(t('common_error'), t('onboard_error'));
    } finally {
      setCompleting(false);
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontSize: typography.sizes.md, color: colors.subtleText },
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
    progressBar: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },
    progressLabel: {
      fontSize: typography.sizes.sm,
      color: colors.subtleText,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    xpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      gap: 4,
    },
    xpText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.gold },
    daySelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    dayDot: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.white,
      borderWidth: 2,
      borderColor: colors.border,
    },
    dayDotSelected: { borderColor: colors.primary, borderWidth: 2.5 },
    dayDotCompleted: { backgroundColor: colors.success, borderColor: colors.success },
    dayDotCurrent: { borderColor: colors.gold, borderWidth: 2.5 },
    dayDotText: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.subtleText },
    dayDotTextSelected: { color: colors.primary },
    dayCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      alignItems: 'center',
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    dayEmoji: { fontSize: 48, marginBottom: spacing.md },
    dayTitle: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    daySubtitle: {
      fontSize: typography.sizes.md,
      color: colors.subtleText,
      marginBottom: spacing.lg,
    },
    taskList: { width: '100%', marginBottom: spacing.lg },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: borderRadius.sm,
      padding: spacing.md,
    },
    taskItemCompleted: { backgroundColor: '#E8F5E9' },
    checkbox: {
      width: 28,
      height: 28,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    checkboxChecked: { backgroundColor: colors.success, borderColor: colors.success },
    taskInfo: { flex: 1 },
    taskTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text },
    taskTitleCompleted: { color: colors.success },
    taskXp: { fontSize: typography.sizes.xs, color: colors.gold, fontWeight: typography.weights.bold, marginTop: 2 },
    completeBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
      width: '100%',
    },
    completeBtnDisabled: { opacity: 0.5 },
    completeBtnText: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.white },
    lockedDay: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
      gap: spacing.sm,
    },
    lockedDayText: { fontSize: typography.sizes.sm, color: colors.subtleText },
    completedCard: {
      backgroundColor: '#FFF9E6',
      borderRadius: borderRadius.md,
      padding: spacing.xl,
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    completedTitle: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: colors.gold,
      marginTop: spacing.md,
    },
    completedSubtitle: {
      fontSize: typography.sizes.md,
      color: colors.text,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
  }), [colors]);

  const progressPct = state ? (state.completed_days / state.total_days) * 100 : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!state) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text style={styles.emptyText}>{t('onboard_flow_no_data')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentDayData = state.days_data.find((d) => d.day === selectedDay);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('onboard_step')} {state.completed_days}/{state.total_days}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {t('onboard_flow_progress', { completed: state.completed_days, total: state.total_days })}
          </Text>
          <View style={styles.xpBadge}>
            <Ionicons name="star" size={16} color={colors.gold} />
            <Text style={styles.xpText}>{t('onboard_flow_xp_total', { xp: state.total_xp_earned })}</Text>
          </View>
        </View>

        <View style={styles.daySelector}>
          {Array.from({ length: state.total_days }, (_, i) => i + 1).map((day) => {
            const dayData = state.days_data.find((d) => d.day === day);
            const isCompleted = dayData?.completed ?? false;
            const isCurrent = day === state.current_day;
            const isSelected = day === selectedDay;
            return (
              <TouchableOpacity
                key={day}
                style={[
                  styles.dayDot,
                  isSelected && styles.dayDotSelected,
                  isCompleted && styles.dayDotCompleted,
                  isCurrent && !isCompleted && styles.dayDotCurrent,
                ]}
                onPress={() => setSelectedDay(day)}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                ) : (
                  <Text style={[styles.dayDotText, isSelected && styles.dayDotTextSelected]}>
                    {day}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.dayCard}>
          <Text style={styles.dayEmoji}>{DAY_EMOJIS[selectedDay] || '📋'}</Text>
          <Text style={styles.dayTitle}>{t('onboard_flow_day', { day: selectedDay })}</Text>
          <Text style={styles.daySubtitle}>{t('onboard_flow_tasks')}</Text>

          {currentDayData && (
            <View style={styles.taskList}>
              <View style={[styles.taskItem, currentDayData.completed && styles.taskItemCompleted]}>
                <TouchableOpacity
                  style={[styles.checkbox, currentDayData.completed && styles.checkboxChecked]}
                  onPress={() => !currentDayData.completed && handleCompleteDay(selectedDay)}
                  disabled={currentDayData.completed || completing || selectedDay > state.current_day}
                >
                  {currentDayData.completed && (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  )}
                </TouchableOpacity>
                <View style={styles.taskInfo}>
                  <Text style={[styles.taskTitle, currentDayData.completed && styles.taskTitleCompleted]}>
                    {t('onboard_flow_complete_day')} {selectedDay}
                  </Text>
                  <Text style={styles.taskXp}>+{TASK_XP} {t('common_xp_unit')}</Text>
                </View>
                {currentDayData.completed && (
                  <Ionicons name="trophy" size={18} color={colors.gold} />
                )}
              </View>
            </View>
          )}

          {!currentDayData?.completed && selectedDay <= state.current_day && (
            <TouchableOpacity
              style={[styles.completeBtn, completing && styles.completeBtnDisabled]}
              onPress={() => handleCompleteDay(selectedDay)}
              disabled={completing}
            >
              {completing ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                  <Text style={styles.completeBtnText}>{t('onboard_flow_complete_day', { day: selectedDay })}</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {selectedDay > state.current_day && !currentDayData?.completed && (
            <View style={styles.lockedDay}>
              <Ionicons name="lock-closed" size={20} color={colors.subtleText} />
              <Text style={styles.lockedDayText}>{t('onboard_flow_locked')}</Text>
            </View>
          )}
        </View>

        {state.is_completed && (
          <View style={styles.completedCard}>
            <Ionicons name="trophy" size={48} color={colors.gold} />
            <Text style={styles.completedTitle}>{t('onboard_flow_congrats')}</Text>
            <Text style={styles.completedSubtitle}>
              {t('onboard_flow_completion_msg', { xp: state.total_xp_earned })}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
