import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Language, t as translate } from '../config/i18n';
import { supabase } from '../config/supabase';

const HISTORY_KEY = '@yayika_notif_history';
const MAX_DAILY_NOTIFICATIONS = 2;
const QUIET_HOUR_START = 22;
const QUIET_HOUR_END = 7;
const CYCLE_LOG_STALE_DAYS = 2;
const CIRCLE_INACTIVE_DAYS = 3;
const STALE_CHECK_INTERVAL_MS = 30 * 60 * 1000;
const DAILY_CHECK_INTERVAL_MS = 60 * 60 * 1000;

interface NotificationHistory {
  dates: string[];
  lastNotificationTime: string;
}

interface CyclePhase {
  phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
  day: number;
}

function getTranslations(lang: Language): Record<string, string> {
  return (translate as any).translations?.[lang] || {};
}

async function getHistory(): Promise<NotificationHistory> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { dates: [], lastNotificationTime: '' };
}

async function saveHistory(history: NotificationHistory): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {}
}

function isQuietHour(): boolean {
  const hour = new Date().getHours();
  return hour >= QUIET_HOUR_START || hour < QUIET_HOUR_END;
}

async function canSendNotification(lang: Language): Promise<boolean> {
  if (isQuietHour()) return false;

  const history = await getHistory();
  const today = new Date().toISOString().split('T')[0];
  const todayCount = history.dates.filter(d => d === today).length;

  if (todayCount >= MAX_DAILY_NOTIFICATIONS) return false;

  if (history.lastNotificationTime) {
    const lastTime = new Date(history.lastNotificationTime).getTime();
    const now = Date.now();
    const oneHourMs = 60 * 60 * 1000;
    if (now - lastTime < oneHourMs) return false;
  }

  const existing = await Notifications.getAllScheduledNotificationsAsync();
  if (existing.length > 10) return false;

  return true;
}

async function recordNotificationSent(lang: Language): Promise<void> {
  const history = await getHistory();
  const today = new Date().toISOString().split('T')[0];
  history.dates.push(today);
  if (history.dates.length > 30) history.dates = history.dates.slice(-30);
  history.lastNotificationTime = new Date().toISOString();
  await saveHistory(history);
}

async function scheduleLocalNotification(
  title: string,
  body: string,
  data: Record<string, any> = {},
  lang: Language
): Promise<boolean> {
  if (!(await canSendNotification(lang))) return false;

  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null,
    });
    await recordNotificationSent(lang);
    return true;
  } catch (err) {
    console.warn('[SmartNotifs] Failed to send notification:', err);
    return false;
  }
}

// ─── Cycle Detection ────────────────────────────────────────────────────────

async function getCurrentCyclePhase(userId: string): Promise<CyclePhase | null> {
  try {
    const { data, error } = await supabase
      .from('yayika_cycle_log')
      .select('cycle_day, logged_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    const day = data.cycle_day ?? 1;
    return { phase: dayToPhase(day), day };
  } catch {
    return null;
  }
}

function dayToPhase(day: number): CyclePhase['phase'] {
  if (day <= 5) return 'menstrual';
  if (day <= 13) return 'follicular';
  if (day <= 16) return 'ovulatory';
  return 'luteal';
}

async function getLastCycleLogDate(userId: string): Promise<Date | null> {
  try {
    const { data, error } = await supabase
      .from('yayika_cycle_log')
      .select('logged_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;
    return new Date(data.logged_at);
  } catch {
    return null;
  }
}

// ─── Streak Helpers ─────────────────────────────────────────────────────────

async function getStreakDays(userId: string): Promise<number> {
  try {
    const { data } = await supabase
      .from('yayika_progress')
      .select('streak_days')
      .eq('user_id', userId)
      .maybeSingle();

    return data?.streak_days ?? 0;
  } catch {
    return 0;
  }
}

async function hasCheckedInToday(userId: string): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('yayika_cycle_log')
      .select('id')
      .eq('user_id', userId)
      .gte('logged_at', `${today}T00:00:00`)
      .lte('logged_at', `${today}T23:59:59`)
      .limit(1)
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}

// ─── Social Helpers ─────────────────────────────────────────────────────────

interface CircleInfo {
  circle_id: string;
  circle_name: string;
}

async function getUserCircles(userId: string): Promise<CircleInfo[]> {
  try {
    const { data, error } = await supabase
      .from('yayika_circle_messages')
      .select('circle_id')
      .eq('user_id', userId);

    if (error || !data) return [];

    const uniqueIds = [...new Set(data.map((r: any) => r.circle_id))];
    const circles: CircleInfo[] = [];
    for (const cid of uniqueIds.slice(0, 3)) {
      circles.push({ circle_id: cid, circle_name: '' });
    }
    return circles;
  } catch {
    return [];
  }
}

async function getRecentCircleActivity(
  circleId: string,
  daysInactive: number
): Promise<{ count: number; daysSince: number }> {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysInactive);

    const { count, error } = await supabase
      .from('yayika_circle_messages')
      .select('id', { count: 'exact', head: true })
      .eq('circle_id', circleId)
      .gte('created_at', cutoff.toISOString());

    if (error) return { count: 0, daysSince: daysInactive };
    return { count: count ?? 0, daysSince: daysInactive };
  } catch {
    return { count: 0, daysSince: daysInactive };
  }
}

// ─── Preferences ────────────────────────────────────────────────────────────

async function getNotificationPrefs(userId: string): Promise<{ pushEnabled: boolean }> {
  try {
    const { data } = await supabase
      .from('yayika_profiles')
      .select('notifications_enabled')
      .eq('id', userId)
      .single();

    return { pushEnabled: data?.notifications_enabled !== false };
  } catch {
    return { pushEnabled: true };
  }
}

// ─── Phase Notification Content ──────────────────────────────────────────────

function getPhaseMessage(lang: Language, phase: CyclePhase['phase']): { title: string; body: string } {
  const tr = (key: string) => translate(lang, key);

  switch (phase) {
    case 'menstrual':
      return { title: tr('smart_notif_cycle_title'), body: tr('smart_notif_menstrual') };
    case 'follicular':
      return { title: tr('smart_notif_cycle_title'), body: tr('smart_notif_follicular') };
    case 'ovulatory':
      return { title: tr('smart_notif_cycle_title'), body: tr('smart_notif_ovulatory') };
    case 'luteal':
      return { title: tr('smart_notif_cycle_title'), body: tr('smart_notif_luteal') };
  }
}

function getStaleLogMessage(lang: Language): { title: string; body: string } {
  const tr = (key: string) => translate(lang, key);
  return { title: tr('smart_notif_stale_title'), body: tr('smart_notif_stale_body') };
}

function getStreakAtRiskMessage(lang: Language, days: number): { title: string; body: string } {
  const tr = (key: string) => translate(lang, key);
  return {
    title: tr('smart_notif_streak_at_risk_title'),
    body: tr('smart_notif_streak_at_risk_body', { days }),
  };
}

function getStreakLostMessage(lang: Language): { title: string; body: string } {
  const tr = (key: string) => translate(lang, key);
  return { title: tr('smart_notif_streak_lost_title'), body: tr('smart_notif_streak_lost_body') };
}

function getStreakMilestoneMessage(lang: Language, days: number): { title: string; body: string } {
  const tr = (key: string) => translate(lang, key);
  return {
    title: tr('smart_notif_streak_milestone_title'),
    body: tr('smart_notif_streak_milestone_body', { days }),
  };
}

function getCircleMissedMessage(lang: Language, circleName: string, postCount: number): { title: string; body: string } {
  const tr = (key: string) => translate(lang, key);
  return {
    title: tr('smart_notif_circle_missed_title'),
    body: tr('smart_notif_circle_missed_body', { name: circleName, count: postCount }),
  };
}

function getDailyActionMessage(lang: Language, phase: CyclePhase['phase']): { title: string; body: string } {
  const tr = (key: string) => translate(lang, key);
  const action = translate(lang, `smart_notif_action_${phase}`);
  return {
    title: tr('smart_notif_daily_action_title'),
    body: tr('smart_notif_daily_action_body', { action }),
  };
}

function getEveningReminderMessage(lang: Language): { title: string; body: string } {
  const tr = (key: string) => translate(lang, key);
  return { title: tr('smart_notif_evening_title'), body: tr('smart_notif_evening_body') };
}

// ─── Exported Functions ─────────────────────────────────────────────────────

export async function initSmartNotifications(userId: string, lang: Language): Promise<void> {
  try {
    const prefs = await getNotificationPrefs(userId);
    if (!prefs.pushEnabled) return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: translate(lang, 'smart_notif_init_title'),
        body: translate(lang, 'smart_notif_init_body'),
        data: { type: 'init' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 120 },
    });

    const scheduleCheckCycle = async () => {
      const now = new Date();
      const next8am = new Date(now);
      next8am.setHours(8, 0, 0, 0);
      if (next8am <= now) next8am.setDate(next8am.getDate() + 1);

      const diffMs = next8am.getTime() - now.getTime();
      const diffSec = Math.floor(diffMs / 1000);

      await Notifications.scheduleNotificationAsync({
        content: { title: 'Yayika', data: { type: 'daily_check' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: diffSec },
      });
    };

    await scheduleCheckCycle();
  } catch (err) {
    console.warn('[SmartNotifs] initSmartNotifications failed:', err);
  }
}

export async function sendCycleNotification(userId: string, lang: Language): Promise<boolean> {
  try {
    const prefs = await getNotificationPrefs(userId);
    if (!prefs.pushEnabled) return false;

    const cycle = await getCurrentCyclePhase(userId);
    if (!cycle) {
      const lastLog = await getLastCycleLogDate(userId);
      if (lastLog) {
        const daysSince = Math.floor(
          (Date.now() - lastLog.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSince >= CYCLE_LOG_STALE_DAYS) {
          const msg = getStaleLogMessage(lang);
          return scheduleLocalNotification(msg.title, msg.body, { type: 'cycle_stale' }, lang);
        }
      }
      return false;
    }

    const msg = getPhaseMessage(lang, cycle.phase);
    return scheduleLocalNotification(msg.title, msg.body, { type: 'cycle', phase: cycle.phase }, lang);
  } catch (err) {
    console.warn('[SmartNotifs] sendCycleNotification failed:', err);
    return false;
  }
}

export async function sendStreakNotification(userId: string, lang: Language): Promise<boolean> {
  try {
    const prefs = await getNotificationPrefs(userId);
    if (!prefs.pushEnabled) return false;

    const streak = await getStreakDays(userId);
    const checkedIn = await hasCheckedInToday(userId);

    const now = new Date();
    const hour = now.getHours();
    const isEvening = hour >= 18;

    if (isEvening && !checkedIn && streak > 0) {
      const msg = getStreakAtRiskMessage(lang, streak);
      return scheduleLocalNotification(msg.title, msg.body, { type: 'streak_risk', streak }, lang);
    }

    if (streak === 0) {
      const msg = getStreakLostMessage(lang);
      return scheduleLocalNotification(msg.title, msg.body, { type: 'streak_lost' }, lang);
    }

    const milestones = [7, 14, 30, 50, 100];
    if (milestones.includes(streak)) {
      const msg = getStreakMilestoneMessage(lang, streak);
      return scheduleLocalNotification(msg.title, msg.body, { type: 'streak_milestone', streak }, lang);
    }

    return false;
  } catch (err) {
    console.warn('[SmartNotifs] sendStreakNotification failed:', err);
    return false;
  }
}

export async function sendSocialNotification(userId: string, lang: Language): Promise<boolean> {
  try {
    const prefs = await getNotificationPrefs(userId);
    if (!prefs.pushEnabled) return false;

    const circles = await getUserCircles(userId);
    if (circles.length === 0) return false;

    for (const circle of circles) {
      const activity = await getRecentCircleActivity(circle.circle_id, CIRCLE_INACTIVE_DAYS);
      if (activity.count > 0) {
        const msg = getCircleMissedMessage(lang, circle.circle_name, activity.count);
        const sent = await scheduleLocalNotification(
          msg.title,
          msg.body,
          { type: 'circle_inactive', circleId: circle.circle_id },
          lang
        );
        if (sent) return true;
      }
    }

    return false;
  } catch (err) {
    console.warn('[SmartNotifs] sendSocialNotification failed:', err);
    return false;
  }
}

export async function sendDailyActionReminder(userId: string, lang: Language): Promise<boolean> {
  try {
    const prefs = await getNotificationPrefs(userId);
    if (!prefs.pushEnabled) return false;

    const checkedIn = await hasCheckedInToday(userId);
    if (checkedIn) return false;

    const msg = getEveningReminderMessage(lang);
    return scheduleLocalNotification(msg.title, msg.body, { type: 'daily_reminder' }, lang);
  } catch (err) {
    console.warn('[SmartNotifs] sendDailyActionReminder failed:', err);
    return false;
  }
}

export function getDailyAction(cyclePhase: CyclePhase['phase']): string {
  switch (cyclePhase) {
    case 'menstrual':
      return 'rest_and_log';
    case 'follicular':
      return 'new_challenge';
    case 'ovulatory':
      return 'connect_circle';
    case 'luteal':
      return 'self_care';
  }
}

export async function runAllSmartChecks(userId: string, lang: Language): Promise<void> {
  try {
    const prefs = await getNotificationPrefs(userId);
    if (!prefs.pushEnabled) return;

    await sendCycleNotification(userId, lang);
    await sendStreakNotification(userId, lang);
    await sendSocialNotification(userId, lang);
  } catch (err) {
    console.warn('[SmartNotifs] runAllSmartChecks failed:', err);
  }
}
