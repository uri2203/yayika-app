import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCycleLog,
  upsertCycleLog,
  upsertDailyMood,
  getDailyMood,
} from '../../config/api';

interface CycleLogEntry {
  log_date: string;
  cycle_day?: number;
  phase?: string;
  energy?: number;
  symptoms?: string[];
}

export default function CycleLogScreen({ navigation }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { currentColors } = useTheme();
  const colors = currentColors;

  const PHASES = [
    { key: 'menstrual', label: t('cycle_phase_menstrual') || 'Menstrual', color: '#C96B7A', icon: '🌙' },
    { key: 'follicular', label: t('cycle_phase_follicular') || 'Follicular', color: '#3BAF7A', icon: '🌸' },
    { key: 'ovulatory', label: t('cycle_phase_ovulatory') || 'Ovulatory', color: '#1A9E8F', icon: '☀️' },
    { key: 'luteal', label: t('cycle_phase_luteal') || 'Luteal', color: '#B8943A', icon: '🍂' },
  ];

  const MOODS = [
    { emoji: '😊', label: t('cycle_mood_happy') || 'Happy' },
    { emoji: '😐', label: t('cycle_mood_neutral') || 'Neutral' },
    { emoji: '😔', label: t('cycle_mood_sad') || 'Sad' },
    { emoji: '😤', label: t('cycle_mood_irritable') || 'Irritable' },
    { emoji: '😴', label: t('cycle_mood_tired') || 'Tired' },
  ];

  const SYMPTOMS = [
    t('cycle_symptom_pain') || 'Dolor', t('cycle_symptom_low_energy') || 'Energía baja',
    t('cycle_symptom_good_mood') || 'Buen ánimo', t('cycle_symptom_insomnia') || 'Insomnio',
    t('cycle_symptom_bloating') || 'Hinchazón', t('cycle_symptom_anxiety') || 'Ansiedad',
    t('cycle_symptom_high_focus') || 'Concentración alta', t('cycle_symptom_fatigue') || 'Cansancio',
  ];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recentLogs, setRecentLogs] = useState<CycleLogEntry[]>([]);

  const [cycleDay, setCycleDay] = useState(1);
  const [selectedPhase, setSelectedPhase] = useState('menstrual');
  const [energy, setEnergy] = useState(3);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const logs = await getCycleLog(user.id, 7);
      setRecentLogs(logs || []);

      const today = new Date().toISOString().split('T')[0];
      const todayLog = logs?.find((l: any) => l.log_date === today);
      if (todayLog) {
        setCycleDay(todayLog.cycle_day || 1);
        setSelectedPhase(todayLog.phase || 'menstrual');
        setEnergy(todayLog.energy || 3);
        setSelectedSymptoms(todayLog.symptoms || []);
      }

      const mood = await getDailyMood(user.id);
      if (mood?.mood) setSelectedMood(mood.mood);
    } catch (e) {
      console.log('Cycle log fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const today = new Date().toISOString().split('T')[0];
      await upsertCycleLog(user.id, today, {
        cycle_day: cycleDay,
        phase: selectedPhase,
        energy,
        symptoms: selectedSymptoms,
      });
      if (selectedMood) {
        await upsertDailyMood(user.id, { mood: selectedMood });
      }
      Alert.alert(
        t('cycle_saved_title') || 'Guardado',
        t('cycle_saved_msg') || 'Registro guardado exitosamente'
      );
      fetchData();
    } catch (e) {
      console.log('Save error:', e);
      Alert.alert(t('common_error') || 'Error', t('cycle_save_error') || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const renderDayPicker = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('cycle_day') || 'Día del ciclo'}</Text>
      <View style={styles.dayPickerRow}>
        <TouchableOpacity
          style={styles.dayPickerBtn}
          onPress={() => setCycleDay((d) => Math.max(1, d - 1))}
        >
          <Ionicons name="remove" size={22} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.dayPickerValue}>
          <Text style={styles.dayPickerNumber}>{cycleDay}</Text>
          <Text style={styles.dayPickerLabel}>{t('cycle_days_total') || '/ 28'}</Text>
        </View>
        <TouchableOpacity
          style={styles.dayPickerBtn}
          onPress={() => setCycleDay((d) => Math.min(28, d + 1))}
        >
          <Ionicons name="add" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPhaseSelector = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('cycle_phase') || 'Fase'}</Text>
      <View style={styles.phaseGrid}>
        {PHASES.map((p) => {
          const isActive = selectedPhase === p.key;
          return (
            <TouchableOpacity
              key={p.key}
              style={[styles.phaseChip, isActive && { backgroundColor: p.color, borderColor: p.color }]}
              onPress={() => setSelectedPhase(p.key)}
            >
              <Text style={styles.phaseChipIcon}>{p.icon}</Text>
              <Text style={[styles.phaseChipText, isActive && { color: colors.white }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderEnergyPicker = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('cycle_energy_level') || 'Nivel de energía'}</Text>
      <View style={styles.energyRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setEnergy(star)}
            style={styles.starBtn}
          >
            <Ionicons
              name={star <= energy ? 'star' : 'star-outline'}
              size={36}
              color={star <= energy ? '#D4A843' : colors.border}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMoodSelector = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('cycle_how_feeling') || '¿Cómo te sientes?'}</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => {
          const isActive = selectedMood === m.emoji;
          return (
            <TouchableOpacity
              key={m.emoji}
              style={[styles.moodEmoji, isActive && styles.moodEmojiSelected]}
              onPress={() => setSelectedMood(isActive ? null : m.emoji)}
            >
              <Text style={styles.moodEmojiText}>{m.emoji}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderSymptoms = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('cycle_register') || 'Síntomas'}</Text>
      <View style={styles.symptomsGrid}>
        {SYMPTOMS.map((s) => {
          const isActive = selectedSymptoms.includes(s);
          return (
            <TouchableOpacity
              key={s}
              style={[styles.symptomChip, isActive && styles.symptomChipSelected]}
              onPress={() => toggleSymptom(s)}
            >
              <Text style={[styles.symptomText, isActive && styles.symptomTextSelected]}>
                {isActive ? '✓ ' : ''}{s}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderRecentLogs = () => (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{t('cycle_recent_logs') || 'Últimos 7 días'}</Text>
      {recentLogs.length === 0 ? (
        <Text style={styles.noLogsText}>{t('cycle_no_logs') || 'Sin registros recientes'}</Text>
      ) : (
        recentLogs.map((log, i) => {
          const phaseData = PHASES.find((p) => p.key === log.phase);
          return (
            <View key={i} style={styles.logRow}>
              <View style={[styles.logDot, { backgroundColor: phaseData?.color || colors.border }]} />
              <View style={styles.logInfo}>
                <Text style={styles.logDate}>{log.log_date}</Text>
                <Text style={styles.logPhase}>
                  {phaseData?.icon} {phaseData?.label || log.phase} · {t('cycle_day') || 'Día'} {log.cycle_day}
                </Text>
              </View>
              <View style={styles.logEnergy}>
                {Array.from({ length: log.energy || 0 }).map((_, j) => (
                  <Ionicons key={j} name="star" size={12} color="#D4A843" />
                ))}
              </View>
            </View>
          );
        })
      )}
    </View>
  );

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    header: { paddingTop: spacing.md, marginBottom: spacing.lg },
    backBtn: { marginBottom: spacing.sm },
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
    sectionCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 1,
    },
    sectionTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    dayPickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xl,
    },
    dayPickerBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    dayPickerValue: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    dayPickerNumber: {
      fontSize: 48,
      fontWeight: typography.weights.bold,
      color: colors.primary,
    },
    dayPickerLabel: {
      fontSize: typography.sizes.lg,
      color: colors.subtleText,
      marginLeft: spacing.xs,
    },
    phaseGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    phaseChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.background,
    },
    phaseChipIcon: {
      fontSize: 16,
      marginRight: spacing.xs,
    },
    phaseChipText: {
      fontSize: typography.sizes.sm,
      color: colors.text,
      fontWeight: typography.weights.medium,
    },
    energyRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
    },
    starBtn: {
      padding: spacing.xs,
    },
    moodRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    moodEmoji: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.background,
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
    symptomsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    symptomChip: {
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: borderRadius.full,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
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
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.lg,
      gap: spacing.sm,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    saveBtnText: {
      color: colors.white,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
    },
    noLogsText: {
      fontSize: typography.sizes.sm,
      color: colors.subtleText,
      textAlign: 'center',
      paddingVertical: spacing.md,
    },
    logRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    logDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: spacing.sm,
    },
    logInfo: {
      flex: 1,
    },
    logDate: {
      fontSize: typography.sizes.sm,
      fontWeight: typography.weights.semibold,
      color: colors.text,
    },
    logPhase: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
      marginTop: 2,
    },
    logEnergy: {
      flexDirection: 'row',
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('cycle_log_title') || 'Registrar mi día'}</Text>
          <Text style={styles.subtitle}>{t('cycle_log_subtitle') || 'How are you feeling today?'}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          <>
            {renderDayPicker()}
            {renderPhaseSelector()}
            {renderEnergyPicker()}
            {renderMoodSelector()}
            {renderSymptoms()}

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={colors.white} />
                  <Text style={styles.saveBtnText}>{t('cycle_modal_save') || 'Guardar registro'}</Text>
                </>
              )}
            </TouchableOpacity>

            {renderRecentLogs()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
