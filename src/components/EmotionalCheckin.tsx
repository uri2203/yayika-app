import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { typography, spacing, borderRadius } from '../config/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { getMoodValidation } from '../services/empatheticCoachService';

const MOOD_STORAGE_KEY = '@yayika_emotional_checkin';

interface MoodOption {
  key: string;
  emoji: string;
  labelKey: string;
  color: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { key: 'happy', emoji: '😊', labelKey: 'empathetic_mood_happy', color: '#10B981' },
  { key: 'sad', emoji: '😢', labelKey: 'empathetic_mood_sad', color: '#6366F1' },
  { key: 'stressed', emoji: '😤', labelKey: 'empathetic_mood_stressed', color: '#EF4444' },
  { key: 'tired', emoji: '😴', labelKey: 'empathetic_mood_tired', color: '#F59E0B' },
  { key: 'loved', emoji: '🥰', labelKey: 'empathetic_mood_loved', color: '#EC4899' },
];

const PHASE_LABELS: Record<string, Record<string, string>> = {
  es: { menstrual: 'menstrual', follicular: 'folicular', ovulatory: 'ovulatoria', luteal: 'lútea' },
  en: { menstrual: 'menstrual', follicular: 'follicular', ovulatory: 'ovulatory', luteal: 'luteal' },
  pt: { menstrual: 'menstrual', follicular: 'folicular', ovulatory: 'ovulatória', luteal: 'lútea' },
  fr: { menstrual: 'menstruelle', follicular: 'folliculaire', ovulatory: 'ovulatoire', luteal: 'lutéale' },
  de: { menstrual: 'menstruell', follicular: 'follikulär', ovulatory: 'ovulatorisch', luteal: 'luteal' },
};

interface EmotionalCheckinProps {
  cyclePhase?: string | null;
  onOpenChat?: () => void;
}

export default function EmotionalCheckin({ cyclePhase, onOpenChat }: EmotionalCheckinProps) {
  const { t, lang } = useLanguage();
  const { currentColors } = useTheme();
  const { user } = useAuth();
  const colors = currentColors;

  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [hasCheckedIn, setHasCheckedIn] = useState(false);
  const [animValues] = useState(MOOD_OPTIONS.map(() => new Animated.Value(1)));

  useEffect(() => {
    checkTodayCheckin();
  }, []);

  const checkTodayCheckin = async () => {
    try {
      const saved = await AsyncStorage.getItem(MOOD_STORAGE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        const today = new Date().toISOString().split('T')[0];
        if (data.date === today) {
          setSelectedMood(data.mood);
          setShowValidation(true);
          setHasCheckedIn(true);
        }
      }
    } catch {}
  };

  const handleMoodPress = useCallback((index: number) => {
    Animated.sequence([
      Animated.timing(animValues[index], {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animValues[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleMoodSelect = useCallback(async (mood: MoodOption, index: number) => {
    if (hasCheckedIn) return;

    handleMoodPress(index);
    setSelectedMood(mood.key);
    setShowValidation(true);
    setHasCheckedIn(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      await AsyncStorage.setItem(
        MOOD_STORAGE_KEY,
        JSON.stringify({ mood: mood.key, date: today, cyclePhase })
      );
    } catch {}
  }, [hasCheckedIn, cyclePhase]);

  const getValidationMessage = useCallback(() => {
    if (!selectedMood) return '';
    const base = getMoodValidation(selectedMood, lang);
    if (cyclePhase) {
      const phaseLabel = PHASE_LABELS[lang]?.[cyclePhase] || cyclePhase;
      return `${base} Es normal sentirse así en fase ${phaseLabel}.`;
    }
    return base;
  }, [selectedMood, lang, cyclePhase]);

  if (hasCheckedIn && showValidation) {
    const moodOption = MOOD_OPTIONS.find((m) => m.key === selectedMood);
    return (
      <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.validationHeader}>
          <Text style={styles.validationEmoji}>{moodOption?.emoji}</Text>
          <Text style={[styles.validationTitle, { color: colors.text }]}>
            {t('empathetic_validating')}
          </Text>
        </View>
        <Text style={[styles.validationMessage, { color: colors.subtleText }]}>
          {getValidationMessage()}
        </Text>
        {onOpenChat && (
          <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: colors.primary }]}
            onPress={onOpenChat}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubble-ellipses" size={18} color="#FFFFFF" />
            <Text style={styles.chatButtonText}>{t('empathetic_chat_title')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('empathetic_mood_check')}</Text>
      <Text style={[styles.subtitle, { color: colors.subtleText }]}>{t('empathetic_mood_check_now')}</Text>
      <View style={styles.moodGrid}>
        {MOOD_OPTIONS.map((mood, index) => (
          <TouchableOpacity
            key={mood.key}
            style={[
              styles.moodItem,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
              selectedMood === mood.key && {
                borderColor: mood.color,
                backgroundColor: `${mood.color}15`,
              },
            ]}
            onPress={() => handleMoodSelect(mood, index)}
            activeOpacity={0.7}
            disabled={hasCheckedIn}
          >
            <Animated.Text
              style={[
                styles.moodEmoji,
                { transform: [{ scale: animValues[index] }] },
              ]}
            >
              {mood.emoji}
            </Animated.Text>
            <Text style={[styles.moodLabel, { color: colors.text }]}>{t(mood.labelKey)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  moodItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 80,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    paddingVertical: spacing.sm,
  },
  moodEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  moodLabel: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  validationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  validationEmoji: {
    fontSize: 24,
  },
  validationTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  validationMessage: {
    fontSize: typography.sizes.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  chatButtonText: {
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
