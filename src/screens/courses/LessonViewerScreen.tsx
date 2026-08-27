import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getProductDetail, addXpEvent } from '../../config/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Lesson {
  id: string;
  title: string;
  content: string;
  video_url?: string;
  duration?: string;
  completed?: boolean;
}

interface ModuleInfo {
  id: string;
  number: number;
  title: string;
  totalLessons: number;
  color: string;
}

export default function LessonViewerScreen({ navigation, route }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentColors } = useTheme();
  const colors = currentColors;

  const MODULE_COLORS: Record<string, string> = {
    '1': colors.primary,
    '2': colors.turquoise,
    '3': colors.gold,
    '4': colors.rose,
    '5': colors.primary,
  };

  const MODULES_DATA: Record<string, { titleKey: string; totalLessons: number }> = {
    '1': { titleKey: 'course_module_1_title', totalLessons: 10 },
    '2': { titleKey: 'course_module_2_title', totalLessons: 8 },
    '3': { titleKey: 'course_module_3_title', totalLessons: 10 },
    '4': { titleKey: 'course_module_4_title', totalLessons: 10 },
    '5': { titleKey: 'course_module_5_title', totalLessons: 10 },
  };

  const LESSON_KEYS_BY_MODULE: Record<string, string[]> = {
    '1': [
      'course_m1_l1', 'course_m1_l2', 'course_m1_l3', 'course_m1_l4', 'course_m1_l5',
      'course_m1_l6', 'course_m1_l7', 'course_m1_l8', 'course_m1_l9', 'course_m1_l10',
    ],
    '2': [
      'course_m2_l1', 'course_m2_l2', 'course_m2_l3', 'course_m2_l4',
      'course_m2_l5', 'course_m2_l6', 'course_m2_l7', 'course_m2_l8',
    ],
    '3': [
      'course_m3_l1', 'course_m3_l2', 'course_m3_l3', 'course_m3_l4', 'course_m3_l5',
      'course_m3_l6', 'course_m3_l7', 'course_m3_l8', 'course_m3_l9', 'course_m3_l10',
    ],
    '4': [
      'course_m4_l1', 'course_m4_l2', 'course_m4_l3', 'course_m4_l4', 'course_m4_l5',
      'course_m4_l6', 'course_m4_l7', 'course_m4_l8', 'course_m4_l9', 'course_m4_l10',
    ],
    '5': [
      'course_m5_l1', 'course_m5_l2', 'course_m5_l3', 'course_m5_l4', 'course_m5_l5',
      'course_m5_l6', 'course_m5_l7', 'course_m5_l8', 'course_m5_l9', 'course_m5_l10',
    ],
  };

  const XP_PER_LESSON = 15;

  const moduleId: string = route?.params?.moduleId || '1';
  const initialLessonId: string = route?.params?.lessonId || '1';

  const moduleColor = MODULE_COLORS[moduleId] || colors.primary;
  const moduleMeta = MODULES_DATA[moduleId] || MODULES_DATA['1'];
  const lessonKeys = LESSON_KEYS_BY_MODULE[moduleId] || LESSON_KEYS_BY_MODULE['1'];

  const [currentLessonIndex, setCurrentLessonIndex] = useState(
    Math.max(0, Math.min(parseInt(initialLessonId, 10) - 1, lessonKeys.length - 1))
  );
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [apiLessons, setApiLessons] = useState<Lesson[]>([]);

  const totalLessons = lessonKeys.length;
  const currentLessonId = (currentLessonIndex + 1).toString();
  const isCompleted = completedLessons.has(currentLessonId);
  const isLastLesson = currentLessonIndex === totalLessons - 1;
  const isFirstLesson = currentLessonIndex === 0;

  const currentLessonTitle = t(lessonKeys[currentLessonIndex] || lessonKeys[0]);

  const loadLessonData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getProductDetail(moduleId);
      if (res.lessons?.length) {
        setApiLessons(res.lessons);
        const completed = new Set<string>();
        res.lessons.forEach((l: Lesson) => {
          if (l.completed) completed.add(l.id);
        });
        setCompletedLessons(completed);
      }
    } catch {
      // Fallback: use static data
    } finally {
      setLoading(false);
    }
  }, [moduleId]);

  useEffect(() => {
    loadLessonData();
  }, [loadLessonData]);

  const handleMarkComplete = useCallback(async () => {
    if (isCompleted || markingComplete) return;

    try {
      setMarkingComplete(true);
      if (user?.id) {
        await addXpEvent(user.id, `lesson_complete_m${moduleId}_l${currentLessonId}`, XP_PER_LESSON);
      }
      setCompletedLessons((prev) => new Set(prev).add(currentLessonId));
      Alert.alert(t('courses_congrats'), t('courses_xp_awarded', { xp: XP_PER_LESSON }));
    } catch (err) {
      Alert.alert(t('common_error'), err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setMarkingComplete(false);
    }
  }, [isCompleted, markingComplete, user?.id, moduleId, currentLessonId, t]);

  const goToLesson = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalLessons) {
        setCurrentLessonIndex(index);
      }
    },
    [totalLessons]
  );

  const lessonContent = useMemo(() => {
    const apiLesson = apiLessons.find(
      (l) => l.id === currentLessonId || l.id === (currentLessonIndex + 1).toString()
    );
    return apiLesson?.content || '';
  }, [apiLessons, currentLessonId, currentLessonIndex]);

  const videoUrl = useMemo(() => {
    const apiLesson = apiLessons.find(
      (l) => l.id === currentLessonId || l.id === (currentLessonIndex + 1).toString()
    );
    return apiLesson?.video_url;
  }, [apiLessons, currentLessonId, currentLessonIndex]);

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.white,
      borderBottomWidth: 1,
    },
    backButton: {
      padding: spacing.xs,
      width: 40,
    },
    topBarCenter: {
      alignItems: 'center',
    },
    moduleLabel: {
      fontSize: typography.sizes.xs,
      fontWeight: typography.weights.semibold,
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    progressLabel: {
      fontSize: typography.sizes.sm,
      color: colors.subtleText,
      marginTop: 2,
    },
    dotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: 6,
      backgroundColor: colors.white,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    dotCurrent: {
      width: 28,
      borderRadius: 5,
    },
    dotCompleted: {
      opacity: 0.5,
    },
    dotInactive: {
      backgroundColor: colors.border,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: 120,
    },
    lessonTitle: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.lg,
      lineHeight: 28,
    },
    videoContainer: {
      width: '100%',
      aspectRatio: 16 / 9,
      borderRadius: borderRadius.md,
      borderWidth: 1,
      overflow: 'hidden',
      marginBottom: spacing.lg,
      backgroundColor: colors.white,
    },
    videoPlaceholder: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    videoText: {
      marginTop: spacing.sm,
      fontSize: typography.sizes.sm,
      color: colors.subtleText,
    },
    videoPlaceholderText: {
      marginTop: spacing.sm,
      fontSize: typography.sizes.sm,
      color: colors.subtleText,
    },
    contentCard: {
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
    contentText: {
      fontSize: typography.sizes.md,
      lineHeight: 26,
      color: colors.text,
    },
    contentPlaceholder: {
      fontSize: typography.sizes.md,
      lineHeight: 26,
      color: colors.subtleText,
      fontStyle: 'italic',
    },
    completedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.sm,
      marginBottom: spacing.lg,
    },
    completedText: {
      marginLeft: spacing.sm,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
    },
    bottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.white,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      paddingBottom: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 8,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    navButtonDisabled: {
      opacity: 0.4,
    },
    navButtonText: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.medium,
      color: colors.text,
    },
    navTextDisabled: {
      color: colors.border,
    },
    completeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: borderRadius.md,
      minWidth: 140,
    },
    completeButtonLoading: {
      opacity: 0.7,
    },
    completeButtonText: {
      marginLeft: spacing.xs,
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.bold,
      color: colors.white,
    },
  }), [colors]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={moduleColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={[styles.topBar, { borderBottomColor: moduleColor + '30' }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.moduleLabel}>
            {t('courses_module')} {moduleId}
          </Text>
          <Text style={styles.progressLabel}>
            {t('courses_lesson_of', { current: currentLessonIndex + 1, total: totalLessons })}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Dots */}
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalLessons }).map((_, i) => {
          const lessonNum = (i + 1).toString();
          const dotCompleted = completedLessons.has(lessonNum);
          const isCurrent = i === currentLessonIndex;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => goToLesson(i)}
              style={[
                styles.dot,
                isCurrent && [styles.dotCurrent, { backgroundColor: moduleColor }],
                dotCompleted && [styles.dotCompleted, { backgroundColor: moduleColor }],
                !isCurrent && !dotCompleted && styles.dotInactive,
              ]}
            />
          );
        })}
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Lesson Title */}
        <Text style={styles.lessonTitle}>{currentLessonTitle}</Text>

        {/* Video Placeholder */}
        <View style={[styles.videoContainer, { borderColor: moduleColor + '40' }]}>
          {videoUrl ? (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="play-circle" size={64} color={moduleColor} />
              <Text style={styles.videoText}>{t('courses_video_available')}</Text>
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-outline" size={48} color={colors.subtleText} />
              <Text style={styles.videoPlaceholderText}>{t('courses_no_content')}</Text>
            </View>
          )}
        </View>

        {/* Lesson Content */}
        {lessonContent ? (
          <View style={styles.contentCard}>
            <Text style={styles.contentText}>{lessonContent}</Text>
          </View>
        ) : (
          <View style={styles.contentCard}>
            <Text style={styles.contentPlaceholder}>
              {t('courses_lesson_placeholder', { title: currentLessonTitle })}
            </Text>
          </View>
        )}

        {/* Completion Status */}
        {isCompleted && (
          <View style={[styles.completedBanner, { backgroundColor: moduleColor + '15' }]}>
            <Ionicons name="checkmark-circle" size={22} color={moduleColor} />
            <Text style={[styles.completedText, { color: moduleColor }]}>
              {t('cdetail_completed')}  ·  +{XP_PER_LESSON} XP
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomBar}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[styles.navButton, isFirstLesson && styles.navButtonDisabled]}
          onPress={() => goToLesson(currentLessonIndex - 1)}
          disabled={isFirstLesson}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={isFirstLesson ? colors.border : colors.text}
          />
          <Text style={[styles.navButtonText, isFirstLesson && styles.navTextDisabled]}>
            {t('courses_prev')}
          </Text>
        </TouchableOpacity>

        {/* Mark Complete Button */}
        <TouchableOpacity
          style={[
            styles.completeButton,
            { backgroundColor: isCompleted ? colors.border : moduleColor },
            markingComplete && styles.completeButtonLoading,
          ]}
          onPress={handleMarkComplete}
          disabled={isCompleted || markingComplete}
        >
          {markingComplete ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons
                name={isCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'}
                size={20}
                color={isCompleted ? colors.subtleText : colors.white}
              />
              <Text
                style={[
                  styles.completeButtonText,
                  isCompleted && { color: colors.subtleText },
                ]}
              >
                {isCompleted ? t('cdetail_completed') : t('courses_mark_complete')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.navButton, isLastLesson && styles.navButtonDisabled]}
          onPress={() => goToLesson(currentLessonIndex + 1)}
          disabled={isLastLesson}
        >
          <Text style={[styles.navButtonText, isLastLesson && styles.navTextDisabled]}>
            {t('courses_next')}
          </Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isLastLesson ? colors.border : colors.text}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
