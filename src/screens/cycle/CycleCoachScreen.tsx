import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing, borderRadius } from '../../config/theme';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { aiCycleCoach, getDailyMood, getCycleLog } from '../../config/api';

function getPhaseColor(phase: string, colors: any): string {
  const key = phase?.toLowerCase() || '';
  if (key.includes('menstru')) return '#C96B7A';
  if (key.includes('follicu')) return '#3BAF7A';
  if (key.includes('ovul')) return '#1A9E8F';
  if (key.includes('lute')) return '#B8943A';
  return colors.primary;
}

function getPhaseIcon(phase: string): string {
  const key = phase?.toLowerCase() || '';
  if (key.includes('menstru')) return '🌙';
  if (key.includes('follicu')) return '🌸';
  if (key.includes('ovul')) return '☀️';
  if (key.includes('lute')) return '🍂';
  return '🫧';
}

function EnergyForecastBar({ day, energy, maxEnergy }: { day: string; energy: number; maxEnergy: number }) {
  const { currentColors } = useTheme();
  const colors = currentColors;
  const pct = maxEnergy > 0 ? (energy / maxEnergy) * 100 : 0;
  let barColor = colors.primary;
  if (energy <= 2) barColor = '#C96B7A';
  else if (energy <= 3) barColor = '#B8943A';
  else barColor = '#3BAF7A';
  const localStyles = StyleSheet.create({
    forecastCol: { alignItems: 'center', flex: 1 },
    forecastEnergy: { fontSize: typography.sizes.xs, color: colors.subtleText, marginBottom: spacing.xs },
    forecastBarBg: { width: 24, height: 80, backgroundColor: colors.border, borderRadius: 12, overflow: 'hidden', justifyContent: 'flex-end' },
    forecastBarFill: { width: '100%', borderRadius: 12 },
    forecastDay: { fontSize: typography.sizes.xs, color: colors.subtleText, marginTop: spacing.xs },
  });

  return (
    <View style={localStyles.forecastCol}>
      <Text style={localStyles.forecastEnergy}>{energy}</Text>
      <View style={localStyles.forecastBarBg}>
        <View style={[localStyles.forecastBarFill, { height: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={localStyles.forecastDay}>{day}</Text>
    </View>
  );
}

export default function CycleCoachScreen({ navigation }: any) {
  const { lang, t } = useLanguage();
  const { user } = useAuth();
  const { currentColors } = useTheme();
  const colors = currentColors;
  const [loading, setLoading] = useState(true);
  const [coaching, setCoaching] = useState<string>('');
  const [phase, setPhase] = useState<string>('');
  const [day, setDay] = useState<number | null>(null);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const [energyForecast] = useState([
    { day: 'L', energy: 4 },
    { day: 'M', energy: 4 },
    { day: 'X', energy: 3 },
    { day: 'J', energy: 3 },
    { day: 'V', energy: 2 },
    { day: 'S', energy: 2 },
    { day: 'D', energy: 3 },
  ]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      const moodData = await getDailyMood(user.id);
      const today = new Date().toISOString().split('T')[0];
      const logs = await getCycleLog(user.id, 1);
      const todayLog = logs?.find((l: any) => l.log_date === today);
      setHasLoggedToday(!!todayLog || !!moodData);

      const recentLogs = (logs || []).map((l: any) => ({
        log_date: l.log_date,
        energy: l.energy,
        mood: l.mood,
        symptoms: l.symptoms,
      }));

      const result = await aiCycleCoach({
        user_id: user.id,
        cycle_phase: todayLog?.phase,
        cycle_day: todayLog?.cycle_day,
        energy_level: todayLog?.energy,
        mood: moodData?.mood,
        symptoms: todayLog?.symptoms,
        recent_logs: recentLogs,
        lang,
      });

      setCoaching(result.coaching);
      setPhase(result.phase || todayLog?.phase || '');
      setDay(result.day || todayLog?.cycle_day || null);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }, [user, lang]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxEnergy = Math.max(...energyForecast.map((e) => e.energy), 1);

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
    phaseCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    phaseRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    phaseIcon: {
      fontSize: 36,
      marginRight: spacing.md,
    },
    phaseInfo: {
      flex: 1,
    },
    phaseName: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
    },
    phaseDay: {
      fontSize: typography.sizes.sm,
      color: colors.subtleText,
      marginTop: spacing.xs,
    },
    coachCard: {
      backgroundColor: '#F3EEFF',
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    coachHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    coachTitle: {
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.bold,
      color: colors.primary,
      marginLeft: spacing.sm,
    },
    coachText: {
      fontSize: typography.sizes.md,
      color: colors.text,
      lineHeight: 24,
    },
    sectionCard: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
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
    forecastRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 120,
    },
    forecastCol: {
      alignItems: 'center',
      flex: 1,
    },
    forecastEnergy: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
      marginBottom: spacing.xs,
    },
    forecastBarBg: {
      width: 24,
      height: 80,
      backgroundColor: colors.border,
      borderRadius: 12,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    forecastBarFill: {
      width: '100%',
      borderRadius: 12,
    },
    forecastDay: {
      fontSize: typography.sizes.xs,
      color: colors.subtleText,
      marginTop: spacing.xs,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: spacing.sm,
    },
    tipText: {
      flex: 1,
      fontSize: typography.sizes.sm,
      color: colors.text,
      marginLeft: spacing.sm,
      lineHeight: 20,
    },
    logBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
      gap: spacing.sm,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    logBtnText: {
      color: colors.white,
      fontSize: typography.sizes.md,
      fontWeight: typography.weights.semibold,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('cycle_coach_title') || 'Coach de Ciclo'}</Text>
          <Text style={styles.subtitle}>{t('cycle_coach_subtitle') || 'Coaching personalizado con IA'}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 40 }} />
        ) : (
          <>
            {/* Current Phase Card */}
            {phase ? (
              <View style={[styles.phaseCard, { borderLeftColor: getPhaseColor(phase, colors) }]}>
                <View style={styles.phaseRow}>
                  <Text style={styles.phaseIcon}>{getPhaseIcon(phase)}</Text>
                  <View style={styles.phaseInfo}>
                    <Text style={[styles.phaseName, { color: getPhaseColor(phase, colors) }]}>{phase}</Text>
                    {day && <Text style={styles.phaseDay}>Día {day}</Text>}
                  </View>
                </View>
              </View>
            ) : null}

            {/* Coaching Message */}
            {coaching ? (
              <View style={styles.coachCard}>
                <View style={styles.coachHeader}>
                  <Ionicons name="sparkles" size={20} color={colors.primary} />
                  <Text style={styles.coachTitle}>{t('cycle_coach_today') || 'Coaching de hoy'}</Text>
                </View>
                <Text style={styles.coachText}>{coaching}</Text>
              </View>
            ) : null}

            {/* Energy Forecast */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{t('cycle_coach_forecast') || 'Pronóstico de energía (7 días)'}</Text>
              <View style={styles.forecastRow}>
                {energyForecast.map((item) => (
                  <EnergyForecastBar
                    key={item.day}
                    day={item.day}
                    energy={item.energy}
                    maxEnergy={maxEnergy}
                  />
                ))}
              </View>
            </View>

            {/* Phase Tips */}
            {phase ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{t('cycle_tips') || 'Consejos para tu fase'}</Text>
                {phase.toLowerCase().includes('menstru') && (
                  <View style={styles.tipItem}>
                    <Ionicons name="moon" size={16} color="#C96B7A" />
                    <Text style={styles.tipText}>{t('cycle_menstrual_tip')}</Text>
                  </View>
                )}
                {phase.toLowerCase().includes('follicu') && (
                  <View style={styles.tipItem}>
                    <Ionicons name="flower" size={16} color="#3BAF7A" />
                    <Text style={styles.tipText}>{t('cycle_follicular_tip')}</Text>
                  </View>
                )}
                {phase.toLowerCase().includes('ovul') && (
                  <View style={styles.tipItem}>
                    <Ionicons name="sunny" size={16} color="#1A9E8F" />
                    <Text style={styles.tipText}>{t('cycle_ovulatory_tip')}</Text>
                  </View>
                )}
                {phase.toLowerCase().includes('lute') && (
                  <View style={styles.tipItem}>
                    <Ionicons name="leaf" size={16} color="#B8943A" />
                    <Text style={styles.tipText}>{t('cycle_luteal_tip')}</Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Log Today Button */}
            {!hasLoggedToday && (
              <TouchableOpacity
                style={styles.logBtn}
                onPress={() => navigation.navigate('CycleLog')}
              >
                <Ionicons name="create-outline" size={22} color={colors.white} />
                <Text style={styles.logBtnText}>{t('cycle_intel_log') || 'Registrar hoy'}</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
