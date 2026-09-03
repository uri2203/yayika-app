import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

interface FirstWeekState {
  dayNumber: number;
  isFirstWeek: boolean;
  todayCompleted: boolean;
  xpMultiplier: number;
}

export function useFirstWeek(): FirstWeekState {
  const { user } = useAuth();
  const [state, setState] = useState<FirstWeekState>({
    dayNumber: 0,
    isFirstWeek: false,
    todayCompleted: false,
    xpMultiplier: 1,
  });

  useEffect(() => {
    if (!user) return;
    
    const loadFirstWeek = async () => {
      // Get user creation date
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('created_at')
        .eq('user_id', user.id)
        .single();

      if (!profile?.created_at) return;

      const createdAt = new Date(profile.created_at);
      const now = new Date();
      const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const isFirstWeek = daysSinceSignup <= 7;

      // Check if today's check-in is done
      const today = now.toISOString().split('T')[0];
      const { data: todayCheckin } = await supabase
        .from('yayika_checkins')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', today)
        .maybeSingle();

      setState({
        dayNumber: daysSinceSignup,
        isFirstWeek,
        todayCompleted: !!todayCheckin,
        xpMultiplier: isFirstWeek ? 2 : 1,
      });
    };

    loadFirstWeek();
  }, [user]);

  return state;
}

interface FirstWeekBannerProps {
  onDismiss?: () => void;
}

export function FirstWeekBanner({ onDismiss }: FirstWeekBannerProps) {
  const { t } = useLanguage();
  const { currentColors } = useTheme();
  const { dayNumber, isFirstWeek, todayCompleted } = useFirstWeek();
  const colors = currentColors;

  if (!isFirstWeek) return null;

  const milestones = [
    { day: 1, icon: '🌟', text: 'first_week_day_1' },
    { day: 2, icon: '🔥', text: 'first_week_day_2' },
    { day: 3, icon: '💪', text: 'first_week_day_3' },
    { day: 5, icon: '🎯', text: 'first_week_day_5' },
    { day: 7, icon: '👑', text: 'first_week_day_7' },
  ];

  const nextMilestone = milestones.find(m => m.day > dayNumber) || milestones[milestones.length - 1];
  const progress = Math.min(dayNumber / 7, 1);

  return (
    <View style={[styles.banner, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.bannerHeader}>
        <View style={[styles.dayBadge, { backgroundColor: colors.rosa }]}>
          <Text style={styles.dayBadgeText}>{dayNumber}/7</Text>
        </View>
        <View style={styles.bannerTexts}>
          <Text style={[styles.bannerTitle, { color: colors.text }]}>
            {t('first_week_title') || '🎉 ¡Tu primera semana!'}
          </Text>
          <Text style={[styles.bannerSubtitle, { color: colors.textSecondary }]}>
            {t('first_week_subtitle') || '2x XP en todo. ¡Aprovecha!'}
          </Text>
        </View>
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: colors.rosa }]} />
      </View>

      {/* Milestones */}
      <View style={styles.milestones}>
        {milestones.map((m) => {
          const completed = dayNumber >= m.day;
          const isCurrent = nextMilestone.day === m.day;
          return (
            <View key={m.day} style={styles.milestone}>
              <View style={[
                styles.milestoneDot,
                completed && { backgroundColor: colors.rosa },
                isCurrent && !completed && { borderColor: colors.rosa, borderWidth: 2 },
              ]}>
                <Text style={styles.milestoneIcon}>{completed ? '✓' : m.icon}</Text>
              </View>
              <Text style={[
                styles.milestoneDay,
                { color: completed ? colors.rosa : colors.textSecondary },
              ]}>
                {m.day}
              </Text>
            </View>
          );
        })}
      </View>

      {todayCompleted && (
        <View style={[styles.todayDone, { backgroundColor: colors.rosa + '15' }]}>
          <Ionicons name="checkmark-circle" size={16} color={colors.rosa} />
          <Text style={[styles.todayDoneText, { color: colors.rosa }]}>
            {t('first_week_today_done') || '¡Hoy completado! Vuelve mañana.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  dayBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  dayBadgeText: { color: 'white', fontSize: 13, fontWeight: '700' },
  bannerTexts: { flex: 1 },
  bannerTitle: { fontSize: 15, fontWeight: '600' },
  bannerSubtitle: { fontSize: 12, marginTop: 2 },
  progressBar: { height: 6, borderRadius: 3, marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 3 },
  milestones: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  milestone: { alignItems: 'center', gap: 4 },
  milestoneDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center' },
  milestoneIcon: { fontSize: 12, color: '#666' },
  milestoneDay: { fontSize: 10, fontWeight: '600' },
  todayDone: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, marginTop: 4 },
  todayDoneText: { fontSize: 13, fontWeight: '500' },
});
