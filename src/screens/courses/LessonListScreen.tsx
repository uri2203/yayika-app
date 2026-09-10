import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getProductDetail } from '../../config/api';

const MODULE_COLORS: Record<string, string> = {};
const MODULES_DATA: Record<string, { titleKey: string; totalLessons: number }> = {
  '1': { titleKey: 'course_module_1_title', totalLessons: 10 },
  '2': { titleKey: 'course_module_2_title', totalLessons: 8 },
  '3': { titleKey: 'course_module_3_title', totalLessons: 10 },
  '4': { titleKey: 'course_module_4_title', totalLessons: 10 },
  '5': { titleKey: 'course_module_5_title', totalLessons: 10 },
};

const LESSON_KEYS_BY_MODULE: Record<string, string[]> = {
  '1': ['course_m1_l1','course_m1_l2','course_m1_l3','course_m1_l4','course_m1_l5','course_m1_l6','course_m1_l7','course_m1_l8','course_m1_l9','course_m1_l10'],
  '2': ['course_m2_l1','course_m2_l2','course_m2_l3','course_m2_l4','course_m2_l5','course_m2_l6','course_m2_l7','course_m2_l8'],
  '3': ['course_m3_l1','course_m3_l2','course_m3_l3','course_m3_l4','course_m3_l5','course_m3_l6','course_m3_l7','course_m3_l8','course_m3_l9','course_m3_l10'],
  '4': ['course_m4_l1','course_m4_l2','course_m4_l3','course_m4_l4','course_m4_l5','course_m4_l6','course_m4_l7','course_m4_l8','course_m4_l9','course_m4_l10'],
  '5': ['course_m5_l1','course_m5_l2','course_m5_l3','course_m5_l4','course_m5_l5','course_m5_l6','course_m5_l7','course_m5_l8','course_m5_l9','course_m5_l10'],
};

const DURATION_OPTIONS = ['8 min', '12 min', '10 min', '15 min', '7 min'];

export default function LessonListScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentColors } = useTheme();
  const colors = currentColors;

  const moduleId: string = route?.params?.moduleId || '1';
  const moduleColor = colors.primary;
  const moduleMeta = MODULES_DATA[moduleId] || MODULES_DATA['1'];
  const lessonKeys = LESSON_KEYS_BY_MODULE[moduleId] || LESSON_KEYS_BY_MODULE['1'];

  const [completedSet, setCompletedSet] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProgress = useCallback(async () => {
    try {
      const res = await getProductDetail(moduleId);
      if (res.lessons) {
        const completed = new Set<number>();
        res.lessons.forEach((l: any, i: number) => {
          if (l.completed) completed.add(i);
        });
        setCompletedSet(completed);
      }
    } catch {
      setCompletedSet(new Set());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [moduleId]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const completedCount = completedSet.size;
  const totalCount = lessonKeys.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getLessonStatus = (index: number): 'completed' | 'current' | 'locked' => {
    if (completedSet.has(index)) return 'completed';
    const firstIncomplete = Array.from({ length: totalCount }, (_, i) => i).find(i => !completedSet.has(i));
    if (index === firstIncomplete) return 'current';
    if (index === 0 && completedCount === 0) return 'current';
    if (completedSet.has(index - 1) || (index === 0 && completedCount === 0)) return 'current';
    return 'locked';
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    header: { flexDirection: 'row', alignItems: 'center', paddingTop: spacing.md, marginBottom: spacing.lg },
    backButton: { marginRight: spacing.md, padding: spacing.xs },
    headerText: { flex: 1 },
    title: { fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, color: colors.text },
    subtitle: { fontSize: typography.sizes.sm, color: colors.subtleText, marginTop: spacing.xs },
    progressCard: { backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.lg, marginBottom: spacing.lg, shadowColor: colors.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: spacing.sm },
    progressFill: { height: '100%', borderRadius: 4 },
    progressText: { fontSize: typography.sizes.xs, color: colors.subtleText, textAlign: 'right' },
    lessonCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, shadowColor: colors.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
    lessonCardLocked: { opacity: 0.5 },
    lessonIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
    lessonInfo: { flex: 1 },
    lessonTitle: { fontSize: typography.sizes.md, fontWeight: typography.weights.semibold, color: colors.text, marginBottom: 2 },
    lessonDuration: { fontSize: typography.sizes.xs, color: colors.subtleText },
    lessonStatus: { marginLeft: spacing.sm },
    lessonNumber: { fontSize: typography.sizes.sm, fontWeight: typography.weights.bold },
  }), [colors]);

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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProgress(); }} tintColor={colors.primary} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t('courses_module')} {moduleId}: {t(moduleMeta.titleKey)}</Text>
            <Text style={styles.subtitle}>{completedCount}/{totalCount} {t('courses_lessons')}</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: moduleColor }]} />
          </View>
          <Text style={styles.progressText}>{progressPct}%</Text>
        </View>

        {lessonKeys.map((key, index) => {
          const status = getLessonStatus(index);
          const isCompleted = status === 'completed';
          const isLocked = status === 'locked';
          const duration = DURATION_OPTIONS[index % DURATION_OPTIONS.length];

          return (
            <TouchableOpacity
              key={key}
              style={[styles.lessonCard, isLocked && styles.lessonCardLocked]}
              activeOpacity={isLocked ? 1 : 0.7}
              onPress={() => {
                if (!isLocked) {
                  navigation.navigate('LessonViewer', { moduleId, lessonId: String(index + 1) });
                }
              }}
            >
              <View style={[styles.lessonIcon, { backgroundColor: isCompleted ? '#10B981' + '20' : isLocked ? colors.border : moduleColor + '20' }]}>
                {isCompleted ? (
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                ) : isLocked ? (
                  <Ionicons name="lock-closed" size={18} color={colors.subtleText} />
                ) : (
                  <Text style={[styles.lessonNumber, { color: moduleColor }]}>{index + 1}</Text>
                )}
              </View>
              <View style={styles.lessonInfo}>
                <Text style={[styles.lessonTitle, isLocked && { color: colors.subtleText }]} numberOfLines={1}>
                  {t(key)}
                </Text>
                <Text style={styles.lessonDuration}>{duration}</Text>
              </View>
              <View style={styles.lessonStatus}>
                {isCompleted ? (
                  <Ionicons name="checkmark-done" size={18} color="#10B981" />
                ) : isLocked ? null : (
                  <Ionicons name="chevron-forward" size={18} color={colors.subtleText} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}
