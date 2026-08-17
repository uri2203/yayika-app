import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiWeeklyChallenges, enrollChallenge, checkinChallenge } from '../../config/api';

export default function ChallengesScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [challengesData, setChallengesData] = useState<{
    available: any[];
    active: any[];
    completed: any[];
    stats: any;
  } | null>(null);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const fetchChallenges = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await aiWeeklyChallenges();
      setChallengesData({
        available: data.available || [],
        active: data.active || [],
        completed: data.completed || [],
        stats: data.stats,
      });
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChallenges();
  }, [fetchChallenges]);

  const handleEnroll = async (challengeId: string) => {
    try {
      setEnrollingId(challengeId);
      await enrollChallenge(challengeId);
      await fetchChallenges();
    } catch (err) {
      console.error('Failed to enroll:', err);
      Alert.alert(t('common_error'), err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setEnrollingId(null);
    }
  };

  const completedCount = (challengesData?.completed?.length ?? 0);
  const activeCount = (challengesData?.active?.length ?? 0);
  const totalCount = completedCount + activeCount + (challengesData?.available?.length ?? 0);
  const allChallenges = [
    ...(challengesData?.active || []).map((c: any) => ({ ...c, _status: 'active' })),
    ...(challengesData?.completed || []).map((c: any) => ({ ...c, _status: 'completed' })),
    ...(challengesData?.available || []).map((c: any) => ({ ...c, _status: 'available' })),
  ];
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.scrollContent, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="star" size={24} color={colors.gold} />
            <Text style={styles.title}>{t('challenges_title')}</Text>
          </View>
        </View>

        {totalCount > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>{t('challenges_progress_label')}</Text>
              <Text style={styles.progressCount}>
                {completedCount}/{totalCount} {t('challenges_progress')}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }]} />
            </View>
          </View>
        )}

        {allChallenges.length === 0 && (
          <View style={styles.progressCard}>
            <Text style={styles.progressLabel}>{t('challenges_empty')}</Text>
          </View>
        )}

        {allChallenges.map((challenge: any) => {
          const isCompleted = challenge._status === 'completed';
          const isActive = challenge._status === 'active';
          const isAvailable = challenge._status === 'available';
          const isEnrolling = enrollingId === challenge.id;
          const challengeId = challenge.id || challenge.challenge_id;

          return (
            <TouchableOpacity
              key={challengeId}
              style={styles.challengeCard}
              onPress={() => isAvailable && handleEnroll(challengeId)}
              disabled={!isAvailable || isEnrolling}
              activeOpacity={isAvailable ? 0.7 : 1}
            >
              <View style={[styles.challengeIcon, isCompleted ? styles.iconCompleted : styles.iconPending]}>
                <Ionicons
                  name={isCompleted ? 'checkmark-circle' : isActive ? 'rocket' : isAvailable ? 'add-circle' : 'lock-closed'}
                  size={22}
                  color={isCompleted ? colors.success : isActive ? colors.primary : colors.subtleText}
                />
              </View>
              <View style={styles.challengeInfo}>
                <Text style={[styles.challengeTitle, isCompleted && styles.titleCompleted]}>
                  {challenge.title || challenge.name || t('challenges_title')}
                </Text>
                <Text style={styles.challengeXp}>+{challenge.xp_reward || challenge.xp || 0} XP</Text>
              </View>
              {isCompleted && <Ionicons name="checkmark-done" size={20} color={colors.success} />}
              {isAvailable && !isEnrolling && <Ionicons name="add-circle-outline" size={20} color={colors.primary} />}
              {isEnrolling && <ActivityIndicator size="small" color={colors.primary} />}
            </TouchableOpacity>
          );
        })}

        {completedCount > 0 && (
          <View style={styles.bonusCard}>
            <View style={styles.bonusHeader}>
              <Ionicons name="gift" size={22} color={colors.gold} />
              <Text style={styles.bonusTitle}>{t('challenges_bonus')}</Text>
            </View>
            <Text style={styles.bonusText}>{t('challenges_bonus_desc')}</Text>
            <View style={styles.bonusBar}>
              <View style={[styles.bonusFill, { width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.countdown}>
          <Ionicons name="time" size={18} color={colors.subtleText} />
          <Text style={styles.countdownText}>{t('challenges_countdown', { days: 3, hours: 14 })}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: spacing.sm,
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  progressCount: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.turquoise,
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
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  challengeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconCompleted: { backgroundColor: '#D1FAE5' },
  iconPending: { backgroundColor: colors.border },
  challengeInfo: { flex: 1 },
  challengeTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text,
  },
  titleCompleted: { color: colors.subtleText },
  challengeXp: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.gold,
    marginTop: 2,
  },
  bonusCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  bonusHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  bonusTitle: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.gold,
  },
  bonusText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bonusBar: {
    height: 8,
    backgroundColor: '#FDE68A',
    borderRadius: 4,
    overflow: 'hidden',
  },
  bonusFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 4 },
  countdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  countdownText: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginLeft: spacing.sm,
  },
});
