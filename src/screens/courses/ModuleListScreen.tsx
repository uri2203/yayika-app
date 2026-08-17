import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getProductCatalog } from '../../config/api';

interface ModuleData {
  id: string;
  number: number;
  titleKey: string;
  totalLessons: number;
  completedLessons: number;
  xpEarned: number;
  color: string;
}

const MODULE_META: Omit<ModuleData, 'completedLessons' | 'xpEarned'>[] = [
  { id: '1', number: 1, titleKey: 'course_module_1_title', totalLessons: 10, color: colors.primary },
  { id: '2', number: 2, titleKey: 'course_module_2_title', totalLessons: 8, color: colors.turquoise },
  { id: '3', number: 3, titleKey: 'course_module_3_title', totalLessons: 10, color: colors.gold },
  { id: '4', number: 4, titleKey: 'course_module_4_title', totalLessons: 10, color: colors.rose },
  { id: '5', number: 5, titleKey: 'course_module_5_title', totalLessons: 10, color: colors.primary },
];

export default function ModuleListScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadModules = useCallback(async () => {
    try {
      const res = await getProductCatalog('cursos');
      const products = res.products || [];

      const merged = MODULE_META.map((meta) => {
        const apiProduct = products.find(
          (p: any) => p.module_id?.toString() === meta.id || p.id?.toString() === meta.id
        );
        return {
          ...meta,
          completedLessons: apiProduct?.completed_lessons ?? 0,
          xpEarned: apiProduct?.xp_earned ?? 0,
        };
      });

      setModules(merged);
    } catch {
      setModules(
        MODULE_META.map((m) => ({ ...m, completedLessons: 0, xpEarned: 0 }))
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadModules();
  }, [loadModules]);

  const totalLessons = MODULE_META.reduce((s, m) => s + m.totalLessons, 0);
  const totalCompleted = modules.reduce((s, m) => s + m.completedLessons, 0);
  const overallProgress = totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;
  const totalXp = modules.reduce((s, m) => s + m.xpEarned, 0);

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('courses_title')}</Text>
            <Text style={styles.subtitle}>{t('courses_subtitle')}</Text>
          </View>
        </View>

        {/* Overall Progress Card */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Ionicons name="trophy" size={22} color={colors.gold} />
            <Text style={styles.progressTitle}>
              {t('courses_progress')}: {overallProgress}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${overallProgress}%` }]} />
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{MODULE_META.length}</Text>
              <Text style={styles.statLabel}>{t('courses_modules')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalCompleted}/{totalLessons}</Text>
              <Text style={styles.statLabel}>{t('courses_lessons')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalXp}</Text>
              <Text style={styles.statLabel}>{t('courses_xp_earned')}</Text>
            </View>
          </View>
        </View>

        {/* Module List */}
        {modules.map((module) => {
          const progress = module.totalLessons > 0
            ? Math.round((module.completedLessons / module.totalLessons) * 100)
            : 0;
          const hasStarted = module.completedLessons > 0;

          return (
            <TouchableOpacity
              key={module.id}
              style={styles.moduleCard}
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('LessonViewer', {
                  moduleId: module.id,
                  lessonId: '1',
                })
              }
            >
              <View style={styles.moduleTop}>
                <View style={[styles.moduleBadge, { backgroundColor: module.color + '20' }]}>
                  <Text style={[styles.moduleNumber, { color: module.color }]}>
                    {module.number}
                  </Text>
                </View>
                <View style={styles.moduleInfo}>
                  <Text style={styles.moduleTitle}>
                    {t('courses_module')} {module.number}: {t(module.titleKey)}
                  </Text>
                  <View style={styles.moduleMeta}>
                    <Ionicons name="book-outline" size={14} color={colors.subtleText} />
                    <Text style={styles.moduleMetaText}>
                      {module.totalLessons} {t('courses_lessons')}
                    </Text>
                    {module.xpEarned > 0 && (
                      <>
                        <Ionicons
                          name="star-outline"
                          size={14}
                          color={colors.gold}
                          style={{ marginLeft: spacing.md }}
                        />
                        <Text style={[styles.moduleMetaText, { color: colors.gold }]}>
                          {module.xpEarned} XP
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.subtleText} />
              </View>

              {/* Progress Bar */}
              <View style={styles.moduleProgressContainer}>
                <View style={styles.moduleProgressBar}>
                  <View
                    style={[
                      styles.moduleProgressFill,
                      { width: `${progress}%`, backgroundColor: module.color },
                    ]}
                  />
                </View>
                <Text style={styles.moduleProgressText}>
                  {module.completedLessons}/{module.totalLessons}
                </Text>
              </View>

              {/* Action Button */}
              <View
                style={[
                  styles.actionButton,
                  { backgroundColor: hasStarted ? module.color : colors.border },
                ]}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    { color: hasStarted ? colors.white : colors.subtleText },
                  ]}
                >
                  {hasStarted ? t('courses_continue') : t('courses_start')}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={hasStarted ? colors.white : colors.subtleText}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerText: {
    flex: 1,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  actionButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginRight: spacing.xs,
  },
});
