import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiWeeklyChallenges, enrollChallenge, checkinChallenge } from '../../config/api';

export default function ChallengesScreen({ navigation }: any) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState<any[]>([]);
  const [active, setActive] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [checkinId, setCheckinId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      const data = await aiWeeklyChallenges(lang);
      setAvailable(data.available || []);
      setActive(data.active || []);
      setCompleted(data.completed || []);
      setStats(data.stats);
    } catch (err) {
      console.error('Failed to fetch challenges:', err);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  const handleEnroll = async (challengeId: string) => {
    try {
      setEnrollingId(challengeId);
      await enrollChallenge(challengeId);
      await fetchChallenges();
    } catch (err) {
      Alert.alert(t('common_error') || 'Error', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setEnrollingId(null);
    }
  };

  const handleCheckin = async (enrollmentId: string) => {
    try {
      setCheckinId(enrollmentId);
      await checkinChallenge(enrollmentId);
      await fetchChallenges();
    } catch (err) {
      Alert.alert(t('common_error') || 'Error', err instanceof Error ? err.message : 'Check-in failed');
    } finally {
      setCheckinId(null);
    }
  };

  const totalChallenges = available.length + active.length + completed.length;
  const completedCount = completed.length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          <View style={styles.headerTitle}>
            <Ionicons name="star" size={24} color={colors.gold} />
            <Text style={styles.title}>{t('challenges_title') || 'Retos semanales'}</Text>
          </View>
          <View style={{ width: 32 }} />
        </View>

        {totalChallenges > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>{t('challenges_progress_label') || 'Progreso'}</Text>
              <Text style={styles.progressCount}>
                {completedCount}/{totalChallenges} {t('challenges_progress') || 'completados'}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${totalChallenges > 0 ? (completedCount / totalChallenges) * 100 : 0}%` }]} />
            </View>
          </View>
        )}

        {active.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('challenges_active') || 'Activos'}</Text>
            {active.map((ch) => (
              <View key={ch.id || ch.enrollment_id} style={styles.challengeCard}>
                <View style={[styles.challengeIcon, { backgroundColor: '#EDE7F6' }]}>
                  <Ionicons name="rocket" size={22} color={colors.primary} />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>{ch.title || ch.name || t('challenges_title')}</Text>
                  <Text style={styles.challengeDesc} numberOfLines={2}>{ch.description || ''}</Text>
                  <Text style={styles.challengeXp}>+{ch.xp_reward || ch.xp || 0} XP</Text>
                </View>
                <TouchableOpacity
                  style={styles.checkinBtn}
                  onPress={() => handleCheckin(ch.enrollment_id || ch.id)}
                  disabled={checkinId === (ch.enrollment_id || ch.id)}
                >
                  {checkinId === (ch.enrollment_id || ch.id) ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="checkmark-circle" size={22} color={colors.white} />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {available.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('challenges_available') || 'Disponibles'}</Text>
            {available.map((ch) => {
              const cid = ch.id || ch.challenge_id;
              return (
                <TouchableOpacity
                  key={cid}
                  style={styles.challengeCard}
                  onPress={() => handleEnroll(cid)}
                  disabled={enrollingId === cid}
                  activeOpacity={0.7}
                >
                  <View style={[styles.challengeIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="add-circle" size={22} color={colors.turquoise} />
                  </View>
                  <View style={styles.challengeInfo}>
                    <Text style={styles.challengeTitle}>{ch.title || ch.name}</Text>
                    <Text style={styles.challengeDesc} numberOfLines={2}>{ch.description || ''}</Text>
                    <Text style={styles.challengeXp}>+{ch.xp_reward || ch.xp || 0} XP</Text>
                  </View>
                  {enrollingId === cid ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {completed.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('challenges_completed') || 'Completados'}</Text>
            {completed.map((ch) => (
              <View key={ch.id || ch.enrollment_id} style={styles.challengeCard}>
                <View style={[styles.challengeIcon, { backgroundColor: '#D1FAE5' }]}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={[styles.challengeTitle, { color: colors.subtleText }]}>{ch.title || ch.name}</Text>
                  <Text style={styles.challengeXp}>+{ch.xp_reward || ch.xp || 0} XP</Text>
                </View>
                <Ionicons name="checkmark-done" size={20} color={colors.success} />
              </View>
            ))}
          </>
        )}

        {totalChallenges === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={64} color={colors.border} />
            <Text style={styles.emptyText}>{t('challenges_empty') || 'No hay retos disponibles'}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: spacing.md, marginBottom: spacing.lg,
  },
  backBtn: { padding: spacing.xs },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: typography.sizes.xxl, fontWeight: typography.weights.bold, color: colors.text },
  progressCard: {
    backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md,
    marginBottom: spacing.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  progressLabel: { fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold, color: colors.text },
  progressCount: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, color: colors.turquoise },
  progressBar: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.turquoise, borderRadius: 5 },
  sectionTitle: {
    fontSize: typography.sizes.lg, fontWeight: typography.weights.bold,
    color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm,
  },
  challengeCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white,
    borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.sm,
    shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  challengeIcon: {
    width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  challengeInfo: { flex: 1 },
  challengeTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.medium, color: colors.text },
  challengeDesc: { fontSize: typography.sizes.xs, color: colors.subtleText, marginTop: 2 },
  challengeXp: { fontSize: typography.sizes.xs, fontWeight: typography.weights.bold, color: colors.gold, marginTop: 4 },
  checkinBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.turquoise,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyText: { fontSize: typography.sizes.sm, color: colors.subtleText, marginTop: spacing.sm },
});
