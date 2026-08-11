import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';

const CHALLENGES = [
  { id: '1', title: 'Completar lecci\u00f3n del M\u00f3dulo 2', xp: 50, completed: true },
  { id: '2', title: 'Registrar 3 d\u00edas de ciclo', xp: 30, completed: true },
  { id: '3', title: 'Crear presupuesto mensual', xp: 40, completed: true },
  { id: '4', title: 'Compartir producto con amiga', xp: 25, completed: false },
  { id: '5', title: 'Escribir en el diario 5 d\u00edas', xp: 60, completed: false },
];

const completedCount = CHALLENGES.filter((c) => c.completed).length;
const totalCount = CHALLENGES.length;

export default function ChallengesScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="star" size={24} color={colors.gold} />
            <Text style={styles.title}>Retos de la semana</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progreso</Text>
            <Text style={styles.progressCount}>
              {completedCount}/{totalCount} completados
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(completedCount / totalCount) * 100}%` }]} />
          </View>
        </View>

        {CHALLENGES.map((challenge) => (
          <View key={challenge.id} style={styles.challengeCard}>
            <View style={[styles.challengeIcon, challenge.completed ? styles.iconCompleted : styles.iconPending]}>
              <Ionicons
                name={challenge.completed ? 'checkmark-circle' : 'lock-closed'}
                size={22}
                color={challenge.completed ? colors.success : colors.subtleText}
              />
            </View>
            <View style={styles.challengeInfo}>
              <Text style={[styles.challengeTitle, challenge.completed && styles.titleCompleted]}>
                {challenge.title}
              </Text>
              <Text style={styles.challengeXp}>+{challenge.xp} XP</Text>
            </View>
            {challenge.completed && <Ionicons name="checkmark-done" size={20} color={colors.success} />}
          </View>
        ))}

        <View style={styles.bonusCard}>
          <View style={styles.bonusHeader}>
            <Ionicons name="gift" size={22} color={colors.gold} />
            <Text style={styles.bonusTitle}>Reto bonus</Text>
          </View>
          <Text style={styles.bonusText}>Completar todos = +200 XP extra</Text>
          <View style={styles.bonusBar}>
            <View style={[styles.bonusFill, { width: `${(completedCount / totalCount) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.countdown}>
          <Ionicons name="time" size={18} color={colors.subtleText} />
          <Text style={styles.countdownText}>Se reinicia en: 3 d\u00edas, 14 horas</Text>
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
