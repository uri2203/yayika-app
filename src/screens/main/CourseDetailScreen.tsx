import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CourseDetailScreen({ navigation, route }: any) {
  const { t } = useLanguage();

  const MODULE_LESSONS: Record<string, { id: string; title: string; duration: string; status: string }[]> = {
    '1': [
      { id: '1', title: t('course_m1_l1'), duration: '12 min', status: 'completed' },
      { id: '2', title: t('course_m1_l2'), duration: '18 min', status: 'completed' },
      { id: '3', title: t('course_m1_l3'), duration: '15 min', status: 'completed' },
      { id: '4', title: t('course_m1_l4'), duration: '25 min', status: 'current' },
      { id: '5', title: t('course_m1_l5'), duration: '20 min', status: 'locked' },
      { id: '6', title: t('course_m1_l6'), duration: '22 min', status: 'locked' },
      { id: '7', title: t('course_m1_l7'), duration: '18 min', status: 'locked' },
      { id: '8', title: t('course_m1_l8'), duration: '15 min', status: 'locked' },
    ],
    '2': [
      { id: '1', title: t('course_m2_l1'), duration: '15 min', status: 'current' },
      { id: '2', title: t('course_m2_l2'), duration: '20 min', status: 'locked' },
      { id: '3', title: t('course_m2_l3'), duration: '18 min', status: 'locked' },
      { id: '4', title: t('course_m2_l4'), duration: '22 min', status: 'locked' },
      { id: '5', title: t('course_m2_l5'), duration: '25 min', status: 'locked' },
    ],
    '3': [
      { id: '1', title: t('course_m3_l1'), duration: '18 min', status: 'current' },
      { id: '2', title: t('course_m3_l2'), duration: '15 min', status: 'locked' },
      { id: '3', title: t('course_m3_l3'), duration: '22 min', status: 'locked' },
      { id: '4', title: t('course_m3_l4'), duration: '20 min', status: 'locked' },
      { id: '5', title: t('course_m3_l5'), duration: '18 min', status: 'locked' },
    ],
    '4': [
      { id: '1', title: t('course_m4_l1'), duration: '15 min', status: 'current' },
      { id: '2', title: t('course_m4_l2'), duration: '20 min', status: 'locked' },
      { id: '3', title: t('course_m4_l3'), duration: '18 min', status: 'locked' },
      { id: '4', title: t('course_m4_l4'), duration: '15 min', status: 'locked' },
    ],
    '5': [
      { id: '1', title: t('course_m5_l1'), duration: '20 min', status: 'current' },
      { id: '2', title: t('course_m5_l2'), duration: '18 min', status: 'locked' },
      { id: '3', title: t('course_m5_l3'), duration: '15 min', status: 'locked' },
      { id: '4', title: t('course_m5_l4'), duration: '22 min', status: 'locked' },
      { id: '5', title: t('course_m5_l5'), duration: '25 min', status: 'locked' },
    ],
  };

  const module = route?.params?.module;
  const moduleId = module?.id?.toString() || '1';
  const moduleTitle = module?.title || t('course_default_title');
  const lessons = MODULE_LESSONS[moduleId] || MODULE_LESSONS['1'];

  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const progress = completedCount / lessons.length;

  const getLessonIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <Ionicons name="checkmark-circle" size={24} color={colors.success} />;
      case 'current':
        return <Ionicons name="play-circle" size={24} color={colors.primary} />;
      case 'locked':
        return <Ionicons name="lock-closed" size={24} color={colors.subtleText} />;
      default:
        return null;
    }
  };

  const handleContinue = () => {
    const currentLesson = lessons.find(l => l.status === 'current');
    if (currentLesson) {
      Alert.alert(
        t('cdetail_continue'),
        `${currentLesson.title} (${currentLesson.duration})`,
        [{ text: t('common_close') }]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Module Header */}
        <View style={styles.header}>
          <Text style={styles.moduleLabel}>{t('courses_module')} {moduleId}</Text>
          <Text style={styles.moduleTitle}>{moduleTitle}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>{completedCount}/{lessons.length} {t('cdetail_lessons')}</Text>
          </View>
        </View>

        {/* Lessons List */}
        <View style={styles.lessonsList}>
          {lessons.map((lesson) => (
            <View
              key={lesson.id}
              style={[
                styles.lessonCard,
                lesson.status === 'current' && styles.currentLesson,
                lesson.status === 'locked' && styles.lockedLesson,
              ]}
            >
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonNumber}>{t('cdetail_lessons')} {lesson.id}</Text>
                <Text
                  style={[
                    styles.lessonTitle,
                    lesson.status === 'locked' && styles.lockedText,
                  ]}
                >
                  {lesson.title}
                </Text>
                <Text style={styles.lessonDuration}>{lesson.duration}</Text>
              </View>
              {getLessonIcon(lesson.status)}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Ionicons name="play" size={20} color="white" />
          <Text style={styles.continueButtonText}>{t('cdetail_continue')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  moduleLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  moduleTitle: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginTop: spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
  },
  lessonsList: {
    padding: spacing.lg,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  currentLesson: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  lockedLesson: {
    opacity: 0.6,
  },
  lessonInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  lessonNumber: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  lessonTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  lockedText: {
    color: colors.subtleText,
  },
  lessonDuration: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  continueButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  continueButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
});
