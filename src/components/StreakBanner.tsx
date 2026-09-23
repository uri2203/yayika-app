import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { typography, spacing, borderRadius } from '../config/theme';
import { calculateStreak, checkStreakRisk, getNextMilestone } from '../services/streakService';

interface StreakBannerProps {
  onPress?: () => void;
}

export default function StreakBanner({ onPress }: StreakBannerProps) {
  const { user } = useAuth();
  const { currentColors } = useTheme();
  const { t } = useLanguage();
  const colors = currentColors;

  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalDays, setTotalDays] = useState(0);
  const [atRisk, setAtRisk] = useState(false);
  const [hoursLeft, setHoursLeft] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const riskPulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        const [streakData, riskData] = await Promise.all([
          calculateStreak(user.id),
          checkStreakRisk(user.id),
        ]);

        setStreak(streakData.currentStreak);
        setLongestStreak(streakData.longestStreak);
        setTotalDays(streakData.totalDaysLogged);
        setAtRisk(riskData.atRisk);
        setHoursLeft(riskData.hoursLeft);
        setLoaded(true);
      } catch {}
    };

    fetchData();
  }, [user?.id]);

  // Flame pulse animation for streak >= 7
  useEffect(() => {
    if (streak >= 7) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [streak, pulseAnim]);

  // Risk pulse animation
  useEffect(() => {
    if (atRisk) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(riskPulseAnim, {
            toValue: 1.08,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(riskPulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [atRisk, riskPulseAnim]);

  if (!loaded) return null;

  const nextMilestone = getNextMilestone(streak);
  const nextMilestoneName = nextMilestone
    ? t(nextMilestone.nameKey, { days: String(nextMilestone.days) })
    : '';

  const styles = StyleSheet.create({
    banner: {
      backgroundColor: atRisk ? colors.errorBg : colors.white,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    content: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flameContainer: {
      marginRight: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: borderRadius.md,
      backgroundColor: atRisk ? colors.errorBg : colors.warningBg,
    },
    streakNumber: {
      fontSize: typography.sizes.xxl,
      fontWeight: typography.weights.bold,
      color: atRisk ? colors.error : colors.gold,
    },
    streakDaysLabel: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.medium,
      color: atRisk ? colors.error : colors.subtleText,
    },
    info: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    title: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      color: atRisk ? colors.error : colors.text,
    },
    riskText: {
      fontSize: typography.sizes.xs,
      color: colors.error,
      marginTop: 2,
    },
    encouragementText: {
      fontSize: typography.sizes.sm,
      color: colors.turquoise,
      fontWeight: typography.weights.semibold,
      marginTop: 2,
    },
    nextMilestone: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
      marginTop: 4,
    },
    progressBar: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      marginTop: spacing.sm,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    chevron: {
      marginLeft: spacing.sm,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      width: '85%',
      maxWidth: 360,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    modalFlame: {
      fontSize: 32,
      marginBottom: spacing.sm,
      textAlign: 'center',
    },
    modalStreak: {
      fontSize: typography.sizes.xxxl,
      fontWeight: typography.weights.bold,
      color: colors.gold,
      textAlign: 'center',
    },
    modalLabel: {
      fontSize: typography.sizes.sm,
      color: colors.subtleText,
      textAlign: 'center',
      marginBottom: spacing.md,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: spacing.md,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
    },
    statLabel: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
    },
    closeButton: {
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm + 2,
      alignItems: 'center',
    },
    closeButtonText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.white,
    },
  });

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      setModalVisible(true);
    }
  };

  if (streak === 0 && !atRisk) {
    return (
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: colors.warningBg }]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.content}>
          <View style={styles.flameContainer}>
            <Text style={styles.streakDaysLabel}>🔥</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.encouragementText}>{t('streak_start')}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.subtleText}
            style={styles.chevron}
          />
        </View>
      </TouchableOpacity>
    );
  }

  const fillColor = atRisk
    ? colors.error
    : streak >= 30
    ? colors.gold
    : streak >= 7
    ? colors.turquoise
    : colors.primary;

  const progressPercent = nextMilestone
    ? ((streak - (streak - (nextMilestone.days - nextMilestone.days))) / nextMilestone.days) * 100
    : 100;

  // Calculate progress bar fill more accurately
  const milestoneThresholds = [3, 7, 14, 21, 30];
  let prevThreshold = 0;
  let nextThreshold = 30;
  for (const th of milestoneThresholds) {
    if (streak < th) {
      nextThreshold = th;
      break;
    }
    prevThreshold = th;
    nextThreshold = 30;
  }
  const barProgress = prevThreshold === nextThreshold
    ? 100
    : ((streak - prevThreshold) / (nextThreshold - prevThreshold)) * 100;

  return (
    <>
      <Animated.View
        style={[
          styles.banner,
          atRisk && { borderColor: colors.error, borderWidth: 1 },
        ]}
      >
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.flameContainer,
                streak >= 7 && { transform: [{ scale: pulseAnim }] },
                atRisk && { transform: [{ scale: riskPulseAnim }] },
              ]}
            >
              <Text style={{ fontSize: 28 }}>🔥</Text>
            </Animated.View>

            <View style={styles.info}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{t('streak_title')}</Text>
              </View>

              <Text style={[styles.streakNumber, { color: atRisk ? colors.error : colors.text }]}>
                {streak} {t('streak_days')}
              </Text>

              {atRisk && (
                <Text style={styles.riskText}>
                  ⚠️ {t('streak_at_risk')} ({hoursLeft}h)
                </Text>
              )}

              {nextMilestone && !atRisk && (
                <Text style={styles.nextMilestone}>
                  {nextMilestone.days} {t('streak_next_milestone', {
                    days: String(nextMilestone.days),
                    milestone: t(nextMilestone.nameKey || 'streak_next_milestone'),
                  })}
                </Text>
              )}
            </View>

            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.subtleText}
              style={styles.chevron}
            />
          </View>

          {!atRisk && (
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(barProgress, 100)}%`, backgroundColor: fillColor },
                ]}
              />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Streak History Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('streak_title')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.subtleText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalFlame}>🔥</Text>
            <Text style={styles.modalStreak}>{streak}</Text>
            <Text style={styles.modalLabel}>{t('streak_days')}</Text>

            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{longestStreak}</Text>
                <Text style={styles.statLabel}>
                  {t('retention_transform_streak', { days: String(longestStreak) }).replace('Racha máxima: ', '').replace('Max streak: ', '')}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalDays}</Text>
                <Text style={styles.statLabel}>{t('common_days_label')}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('common_close')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
