import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import Card from './Card';
import {
  getDailyAction,
  completeDailyAction,
  getDailyStreak,
  hasCompletedToday,
  getWeeklyActions,
  CyclePhase,
  DailyAction,
} from '../services/dailyActionService';

interface DailyActionCardProps {
  cyclePhase: CyclePhase;
}

export default function DailyActionCard({ cyclePhase }: DailyActionCardProps) {
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const colors = currentColors;

  const [completed, setCompleted] = useState(false);
  const [action, setAction] = useState<DailyAction | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showWeekly, setShowWeekly] = useState(false);
  const [weeklyActions, setWeeklyActions] = useState<DailyAction[]>([]);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const xpAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
  }, [cyclePhase, user?.id]);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const [isCompleted, dailyStreak] = await Promise.all([
        hasCompletedToday(user.id),
        getDailyStreak(user.id),
      ]);
      setCompleted(isCompleted);
      setStreak(dailyStreak);
      setAction(getDailyAction(cyclePhase, isCompleted));
      setWeeklyActions(getWeeklyActions(cyclePhase));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user?.id || !action || completing || completed) return;
    setCompleting(true);

    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const result = await completeDailyAction(user.id, action.id);
      if (!result.alreadyCompleted) {
        setXpEarned(result.xpAwarded);
        setCompleted(true);

        Animated.timing(checkOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();

        Animated.sequence([
          Animated.delay(200),
          Animated.spring(xpAnim, {
            toValue: 1,
            friction: 4,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setTimeout(() => {
            Animated.timing(xpAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }, 1500);
        });

        setStreak((s) => s + 1);
      }
    } catch {
    } finally {
      setCompleting(false);
    }
  };

  if (loading || !action) {
    return (
      <Card style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="sparkles" size={24} color={colors.primaryLight} />
        </View>
      </Card>
    );
  }

  const phaseColors: Record<string, string> = {
    menstrual: colors.phaseMenstrual,
    follicular: colors.phaseFollicular,
    ovulatory: colors.phaseOvulatory,
    luteal: colors.phaseLuteal,
    unknown: colors.primary,
  };

  const phaseColor = phaseColors[cyclePhase] || colors.primary;

  return (
    <>
      <Card style={[styles.card, { backgroundColor: colors.white }]}>
        <View style={styles.header}>
          <View style={[styles.phaseDot, { backgroundColor: phaseColor }]} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {t('daily_action_title')}
          </Text>
          {streak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: colors.warningBg }]}>
              <Ionicons name="flame" size={12} color={colors.gold} />
              <Text style={[styles.streakText, { color: colors.gold }]}>{streak}</Text>
            </View>
          )}
        </View>

        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <View style={styles.actionRow}>
            <View style={[styles.iconContainer, { backgroundColor: phaseColor + '20' }]}>
              <Ionicons name={action.icon as any} size={28} color={phaseColor} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.text }]}>
                {t(action.titleKey)}
              </Text>
              <Text style={[styles.actionDesc, { color: colors.subtleText }]}>
                {t(action.descKey)}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={12} color={colors.subtleText} />
                  <Text style={[styles.metaText, { color: colors.subtleText }]}>
                    {action.duration}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="star-outline" size={12} color={colors.gold} />
                  <Text style={[styles.metaText, { color: colors.gold }]}>
                    +{action.xpReward} XP
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {completed ? (
          <View style={[styles.completedRow, { backgroundColor: colors.successBg }]}>
            <Animated.View style={{ opacity: checkOpacity }}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
            </Animated.View>
            <Text style={[styles.completedText, { color: colors.success }]}>
              {t('daily_action_done')}
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: phaseColor }]}
            onPress={handleComplete}
            disabled={completing}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={18} color={colors.white} />
            <Text style={[styles.completeButtonText, { color: colors.white }]}>
              {completing ? t('common_loading') : t('daily_action_complete')}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.weeklyLink}
          onPress={() => setShowWeekly(true)}
          activeOpacity={0.7}
        >
          <Text style={[styles.weeklyLinkText, { color: colors.primary }]}>
            {t('daily_action_weekly_view')}
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </TouchableOpacity>
      </Card>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.xpPopup,
          {
            opacity: xpAnim,
            transform: [
              {
                translateY: xpAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -30],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.xpPopupText}>
          {t('daily_action_xp', { xp: xpEarned })}
        </Text>
      </Animated.View>

      <Modal
        visible={showWeekly}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWeekly(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t('daily_action_weekly_title')}
              </Text>
              <TouchableOpacity onPress={() => setShowWeekly(false)}>
                <Ionicons name="close" size={24} color={colors.subtleText} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.weeklyScroll}>
              {weeklyActions.map((wa, idx) => {
                const dayDate = new Date();
                dayDate.setDate(dayDate.getDate() + idx);
                const dayLabel = dayDate.toLocaleDateString(undefined, { weekday: 'short' });
                const isToday = idx === 0;
                return (
                  <View
                    key={`${wa.id}-${idx}`}
                    style={[
                      styles.weeklyItem,
                      {
                        backgroundColor: isToday ? phaseColor + '15' : colors.white,
                        borderColor: isToday ? phaseColor : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.weeklyDayCol}>
                      <Text
                        style={[
                          styles.weeklyDayLabel,
                          { color: isToday ? phaseColor : colors.subtleText },
                        ]}
                      >
                        {dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)}
                      </Text>
                      {isToday && (
                        <View style={[styles.todayDot, { backgroundColor: phaseColor }]} />
                      )}
                    </View>
                    <View style={[styles.weeklyIconCol, { backgroundColor: phaseColor + '15' }]}>
                      <Ionicons name={wa.icon as any} size={18} color={phaseColor} />
                    </View>
                    <View style={styles.weeklyInfoCol}>
                      <Text style={[styles.weeklyItemTitle, { color: colors.text }]} numberOfLines={1}>
                        {t(wa.titleKey)}
                      </Text>
                      <Text style={[styles.weeklyItemMeta, { color: colors.subtleText }]}>
                        {wa.duration} · +{wa.xpReward} XP
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
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
  phaseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  headerTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    gap: 3,
  },
  streakText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: typography.sizes.xs,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  completeButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  completedText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  weeklyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  weeklyLinkText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
  },
  xpPopup: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  xpPopupText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  weeklyScroll: {
    paddingHorizontal: spacing.lg,
  },
  weeklyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  weeklyDayCol: {
    alignItems: 'center',
    width: 40,
    marginRight: spacing.sm,
  },
  weeklyDayLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 3,
  },
  weeklyIconCol: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  weeklyInfoCol: {
    flex: 1,
  },
  weeklyItemTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  weeklyItemMeta: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
