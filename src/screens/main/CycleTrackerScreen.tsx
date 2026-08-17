import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, borderRadius } from '../../config/theme';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiCycleIntelligence, upsertCycleLog, upsertDailyMood, getDailyMood, type CycleDashboard } from '../../config/api';

const CYCLE_LENGTH = 28;

interface Phase {
  name: string;
  range: number[];
  icon: string;
  color: string;
  bgColor: string;
  description: string;
  tip: string;
}

function getCurrentPhase(day: number, phases: Phase[]) {
  return phases.find((p) => day >= p.range[0] && day <= p.range[1]) || phases[0];
}

export default function CycleTrackerScreen({ navigation }: any) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSymptoms, setSavingSymptoms] = useState(false);
  const [savingMood, setSavingMood] = useState(false);
  const [dashboard, setDashboard] = useState<CycleDashboard | null>(null);
  const [currentDay, setCurrentDay] = useState(10);
  const [todayMood, setTodayMood] = useState<any>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const result = await aiCycleIntelligence();
      if (result.success && result.dashboard) {
        setDashboard(result.dashboard);
        const daysRemaining = result.dashboard.predictions?.days_remaining ?? 0;
        const cycleLen = result.dashboard.analytics?.avg_cycle_length ?? 28;
        const computedDay = cycleLen - daysRemaining;
        setCurrentDay(computedDay > 0 ? computedDay : 1);
      }
      const mood = await getDailyMood(user.id);
      setTodayMood(mood);
    } catch (e) {
      console.log('Cycle intelligence error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSaveSymptoms = async () => {
    if (!user || selectedSymptoms.length === 0) {
      setModalVisible(false);
      return;
    }
    try {
      setSavingSymptoms(true);
      const today = new Date().toISOString().split('T')[0];
      await upsertCycleLog(user.id, today, { symptoms: selectedSymptoms });
      setModalVisible(false);
      Alert.alert(t('cycle_saved_title') || 'Guardado', t('cycle_saved_msg') || 'Síntomas registrados');
      fetchData();
    } catch (e) {
      console.log('Save symptoms error:', e);
    } finally {
      setSavingSymptoms(false);
    }
  };

  const handleMoodPress = async (mood: string) => {
    if (!user) return;
    try {
      setSavingMood(true);
      await upsertDailyMood(user.id, { mood });
      setTodayMood((prev: any) => ({ ...prev, mood }));
      Alert.alert(t('cycle_saved_title') || 'Guardado', t('cycle_mood_saved_msg') || 'Ánimo registrado');
    } catch (e) {
      console.log('Save mood error:', e);
    } finally {
      setSavingMood(false);
    }
  };

  const PHASES = [
    {
      name: t('cycle_menstrual'),
      range: [1, 5],
      icon: '🌙',
      color: colors.primary,
      bgColor: '#EDE7F6',
      description: t('cycle_rest'),
      tip: t('cycle_menstrual_tip'),
    },
    {
      name: t('cycle_follicular'),
      range: [6, 13],
      icon: '🌸',
      color: colors.rose,
      bgColor: '#FCE4EC',
      description: t('cycle_creativity'),
      tip: t('cycle_follicular_tip'),
    },
    {
      name: t('cycle_ovulatory'),
      range: [14, 17],
      icon: '☀️',
      color: colors.gold,
      bgColor: '#FFF9C4',
      description: t('cycle_energy'),
      tip: t('cycle_ovulatory_tip'),
    },
    {
      name: t('cycle_luteal'),
      range: [18, 28],
      icon: '🍂',
      color: '#F57C00',
      bgColor: '#FFF3E0',
      description: t('cycle_focus'),
      tip: t('cycle_luteal_tip'),
    },
  ];

  const SYMPTOMS = [
    t('cycle_symptom_pain'),
    t('cycle_symptom_low_energy'),
    t('cycle_symptom_good_mood'),
    t('cycle_symptom_insomnia'),
    t('cycle_symptom_bloating'),
    t('cycle_symptom_anxiety'),
    t('cycle_symptom_high_focus'),
    t('cycle_symptom_fatigue'),
  ];

  const phase = getCurrentPhase(currentDay, PHASES);
  const progress = currentDay / CYCLE_LENGTH;

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('cycle_title')}</Text>
          <Text style={styles.subtitle}>{t('cycle_subtitle')}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
        ) : (
        <>
        {/* Day Counter */}
        <View style={styles.dayCard}>
          <Text style={styles.dayLabel}>{t('cycle_day')}</Text>
          <Text style={styles.dayNumber}>{currentDay}</Text>
          <Text style={styles.dayTotal}>{t('cycle_days_total')}</Text>
        </View>

        {/* Predictions */}
        {dashboard?.predictions && (
          <View style={styles.predictionsCard}>
            <Text style={styles.predictionsTitle}>{t('cycle_predictions') || 'Predicciones'}</Text>
            <View style={styles.predictionRow}>
              <Ionicons name="water" size={18} color={colors.primary} />
              <Text style={styles.predictionText}>
                {t('cycle_next_period') || 'Próxima regla'}: {dashboard.predictions.period_start}
              </Text>
            </View>
            <View style={styles.predictionRow}>
              <Ionicons name="sunny" size={18} color={colors.gold} />
              <Text style={styles.predictionText}>
                {t('cycle_ovulation') || 'Ovulación'}: {dashboard.predictions.ovulation}
              </Text>
            </View>
            <View style={styles.predictionRow}>
              <Ionicons name="time" size={18} color={colors.turquoise} />
              <Text style={styles.predictionText}>
                {t('cycle_days_remaining') || 'Días restantes'}: {dashboard.predictions.days_remaining}
              </Text>
            </View>
          </View>
        )}

        {/* Phase Badge */}
        <View style={[styles.phaseBadge, { backgroundColor: phase.bgColor }]}>
          <Text style={styles.phaseIcon}>{phase.icon}</Text>
          <View style={styles.phaseInfo}>
            <Text style={[styles.phaseName, { color: phase.color }]}>{phase.name}</Text>
            <Text style={styles.phaseDescription}>{phase.description}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: phase.color }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressStart}>{t('cycle_day_start')}</Text>
            <Text style={styles.progressEnd}>{t('cycle_day_end')}</Text>
          </View>
        </View>

        {/* Phase Cards */}
        <Text style={styles.sectionTitle}>{t('cycle_phase')}</Text>
        {PHASES.map((p) => {
          const isActive = p.name === phase.name;
          return (
            <View
              key={p.name}
              style={[
                styles.phaseCard,
                isActive && { borderColor: p.color, borderWidth: 2 },
              ]}
            >
              <View style={[styles.phaseCardIcon, { backgroundColor: p.bgColor }]}>
                <Text style={styles.phaseCardEmoji}>{p.icon}</Text>
              </View>
              <View style={styles.phaseCardContent}>
                <Text style={[styles.phaseCardName, { color: p.color }]}>
                  {p.name} ({t('cycle_phase_days')} {p.range[0]}-{p.range[1]})
                </Text>
                <Text style={styles.phaseCardDesc}>{p.description}</Text>
              </View>
              {isActive && (
                <View style={[styles.activeDot, { backgroundColor: p.color }]} />
              )}
            </View>
          );
        })}

        {/* Current Phase Tip */}
        <View style={[styles.tipCard, { borderLeftColor: phase.color }]}>
          <Text style={styles.tipTitle}>{t('cycle_tips')}</Text>
          <Text style={styles.tipText}>{phase.tip}</Text>
        </View>

        {/* AI Insights */}
        {dashboard?.insights && dashboard.insights.length > 0 && (
          <View style={styles.insightsCard}>
            <Text style={styles.insightsTitle}>{t('cycle_insights') || 'Insights de tu ciclo'}</Text>
            {dashboard.insights.map((insight, i) => (
              <View key={i} style={styles.insightRow}>
                <Ionicons name="bulb" size={16} color={colors.gold} />
                <Text style={styles.insightText}>{insight}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Today's Mood */}
        <Text style={styles.sectionTitle}>{t('cycle_how_feeling') || '¿Cómo te sientes hoy?'}</Text>
        <View style={styles.moodRow}>
          {['😊', '😐', '😔', '😤', '😴'].map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={[styles.moodEmoji, todayMood?.mood === emoji && styles.moodEmojiSelected]}
              onPress={() => handleMoodPress(emoji)}
              disabled={savingMood}
            >
              <Text style={styles.moodEmojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Register Symptoms Button */}
        <TouchableOpacity
          style={styles.symptomsButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="medical" size={20} color={colors.white} />
          <Text style={styles.symptomsButtonText}>{t('cycle_register')}</Text>
        </TouchableOpacity>
        </>
        )}
      </ScrollView>

      {/* Symptoms Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('cycle_modal_title')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>{t('cycle_modal_subtitle')}</Text>
            <View style={styles.symptomsGrid}>
              {SYMPTOMS.map((s) => {
                const selected = selectedSymptoms.includes(s);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.symptomChip, selected && styles.symptomChipSelected]}
                    onPress={() => toggleSymptom(s)}
                  >
                    <Text style={[styles.symptomText, selected && styles.symptomTextSelected]}>
                      {selected ? '✓ ' : ''}{s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={handleSaveSymptoms}
              disabled={savingSymptoms}
            >
              {savingSymptoms ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.modalSaveText}>{t('cycle_modal_save')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  dayCard: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayLabel: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.xs,
  },
  dayNumber: {
    fontSize: 64,
    fontWeight: typography.weights.bold,
    color: colors.white,
    lineHeight: 72,
  },
  dayTotal: {
    fontSize: typography.sizes.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.xs,
  },
  phaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  phaseIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  phaseInfo: {
    flex: 1,
  },
  phaseName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  phaseDescription: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginTop: 2,
  },
  progressContainer: {
    marginBottom: spacing.xl,
  },
  progressBar: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressStart: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
  },
  progressEnd: {
    fontSize: typography.sizes.xs,
    color: colors.subtleText,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  phaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  phaseCardIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  phaseCardEmoji: {
    fontSize: 24,
  },
  phaseCardContent: {
    flex: 1,
  },
  phaseCardName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  phaseCardDesc: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginTop: 2,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: spacing.sm,
  },
  tipCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  tipTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    lineHeight: 20,
  },
  symptomsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  symptomsButtonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  modalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: typography.sizes.sm,
    color: colors.subtleText,
    marginBottom: spacing.lg,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.lg,
  },
  symptomChip: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  symptomChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  symptomText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
  },
  symptomTextSelected: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
  },
  modalSaveButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalSaveText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  predictionsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  predictionsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  predictionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  predictionText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  insightsCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.gold,
  },
  insightsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  insightText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  moodEmoji: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  moodEmojiSelected: {
    borderColor: colors.primary,
    backgroundColor: '#EDE7F6',
  },
  moodEmojiText: {
    fontSize: 24,
  },
});
