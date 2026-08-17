import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CoursesScreen({ navigation }: any) {
  const { t } = useLanguage();

  const MODULES = [
    {
      id: '1',
      number: 1,
      title: t('course_module_1_title'),
      lessons: 8,
      duration: '2h 30min',
      progress: 65,
      color: colors.primary,
    },
    {
      id: '2',
      number: 2,
      title: t('course_module_2_title'),
      lessons: 6,
      duration: '1h 45min',
      progress: 30,
      color: colors.turquoise,
    },
    {
      id: '3',
      number: 3,
      title: t('course_module_3_title'),
      lessons: 5,
      duration: '1h 20min',
      progress: 0,
      color: colors.gold,
    },
    {
      id: '4',
      number: 4,
      title: t('course_module_4_title'),
      lessons: 7,
      duration: '2h',
      progress: 0,
      color: colors.rose,
    },
    {
      id: '5',
      number: 5,
      title: t('course_module_5_title'),
      lessons: 4,
      duration: '1h 10min',
      progress: 0,
      color: colors.primary,
    },
  ];

  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons, 0);
  const totalDuration = '8h 45min';
  const overallProgress = 45;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('courses_title')}</Text>
          <Text style={styles.subtitle}>{t('courses_subtitle')}</Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="trophy" size={22} color={colors.gold} />
            <Text style={styles.progressTitle}>{t('courses_progress')}: {overallProgress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{MODULES.length}</Text>
              <Text style={styles.statLabel}>{t('courses_modules')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalLessons}</Text>
              <Text style={styles.statLabel}>{t('courses_lessons')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalDuration}</Text>
              <Text style={styles.statLabel}>{t('courses_duration')}</Text>
            </View>
          </View>
        </View>

        {MODULES.map((module) => (
          <View key={module.id} style={styles.moduleCard}>
            <View style={styles.moduleTop}>
              <View
                style={[
                  styles.moduleBadge,
                  { backgroundColor: module.color + '20' },
                ]}
              >
                <Text style={[styles.moduleNumber, { color: module.color }]}>
                  {module.number}
                </Text>
              </View>
              <View style={styles.moduleInfo}>
                <Text style={styles.moduleTitle}>
                  Módulo {module.number}: {module.title}
                </Text>
                <View style={styles.moduleMeta}>
                  <Ionicons
                    name="book-outline"
                    size={14}
                    color={colors.subtleText}
                  />
                  <Text style={styles.moduleMetaText}>
                    {module.lessons} {t('courses_lessons')}
                  </Text>
                  <Ionicons
                    name="time-outline"
                    size={14}
                    color={colors.subtleText}
                    style={{ marginLeft: spacing.md }}
                  />
                  <Text style={styles.moduleMetaText}>{module.duration}</Text>
                </View>
              </View>
            </View>

            <View style={styles.moduleProgressContainer}>
              <View style={styles.moduleProgressBar}>
                <View
                  style={[
                    styles.moduleProgressFill,
                    {
                      width: `${module.progress}%`,
                      backgroundColor: module.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.moduleProgressText}>{module.progress}%</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.continueButton,
                { backgroundColor: module.progress > 0 ? module.color : colors.border },
              ]}
              onPress={() => navigation.navigate('CourseDetail', { module })}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  { color: module.progress > 0 ? colors.white : colors.subtleText },
                ]}
              >
                {module.progress > 0 ? t('courses_continue') : t('courses_start')}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={module.progress > 0 ? colors.white : colors.subtleText}
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
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
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    marginLeft: spacing.sm,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 5,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  moduleCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  moduleTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  moduleBadge: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  moduleNumber: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  moduleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moduleMetaText: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    marginLeft: spacing.xs,
  },
  moduleProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  moduleProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: spacing.sm,
  },
  moduleProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  moduleProgressText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    color: colors.subtleText,
    minWidth: 36,
    textAlign: 'right',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  continueButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginRight: spacing.xs,
  },
});
