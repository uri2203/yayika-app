import { supabase } from '../config/supabase';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalDaysLogged: number;
}

interface StreakRisk {
  atRisk: boolean;
  hoursLeft: number;
  streak: number;
}

interface StreakRewards {
  xpBonus: number;
  badge: string | null;
  messageKey: string;
}

const MILESTONES = [
  { days: 3, xpBonus: 10, badge: null, messageKey: '' },
  { days: 7, xpBonus: 25, badge: 'Semana Perfecta', messageKey: 'streak_milestone_7' },
  { days: 14, xpBonus: 50, badge: null, messageKey: '' },
  { days: 21, xpBonus: 100, badge: 'Inquebrantable', messageKey: '' },
  { days: 30, xpBonus: 200, badge: 'Leyenda', messageKey: 'streak_milestone_30' },
];

function toLocalDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getLocalToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function calculateStreak(userId: string): Promise<StreakData> {
  try {
    const { data: logs, error } = await supabase
      .from('yayika_cycle_log')
      .select('logged_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(1000);

    if (error || !logs || logs.length === 0) {
      return { currentStreak: 0, longestStreak: 0, totalDaysLogged: 0 };
    }

    const uniqueDates = [...new Set(logs.map((l) => toLocalDate(l.logged_at)))].sort().reverse();
    const totalDaysLogged = uniqueDates.length;

    if (totalDaysLogged === 0) {
      return { currentStreak: 0, longestStreak: 0, totalDaysLogged: 0 };
    }

    const today = getLocalToday();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // Build a set for O(1) lookups
    const dateSet = new Set(uniqueDates);

    // Calculate current streak: count consecutive days ending at today or yesterday
    if (dateSet.has(today) || dateSet.has(getYesterday())) {
      let checkDate = dateSet.has(today) ? new Date() : new Date(Date.now() - 86400000);
      while (true) {
        const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
        if (dateSet.has(dateStr)) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    const sortedAsc = [...uniqueDates].sort();
    tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < sortedAsc.length; i++) {
      const prev = new Date(sortedAsc[i - 1]);
      const curr = new Date(sortedAsc[i]);
      const diffMs = curr.getTime() - prev.getTime();
      if (diffMs <= 86400000 + 3600000) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    return { currentStreak, longestStreak, totalDaysLogged };
  } catch {
    return { currentStreak: 0, longestStreak: 0, totalDaysLogged: 0 };
  }
}

function getYesterday(): string {
  const d = new Date(Date.now() - 86400000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function checkStreakRisk(userId: string): Promise<StreakRisk> {
  try {
    const { data: logs, error } = await supabase
      .from('yayika_cycle_log')
      .select('logged_at')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(10);

    if (error || !logs || logs.length === 0) {
      return { atRisk: false, hoursLeft: 0, streak: 0 };
    }

    const today = getLocalToday();
    const hasLoggedToday = logs.some((l) => toLocalDate(l.logged_at) === today);

    // Calculate current streak
    const { currentStreak } = await calculateStreak(userId);

    if (hasLoggedToday || currentStreak === 0) {
      return { atRisk: false, hoursLeft: 24, streak: currentStreak };
    }

    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const hoursLeft = Math.max(0, (endOfDay.getTime() - now.getTime()) / 3600000);

    const atRisk = hoursLeft <= 18; // at risk if after 6pm (6 hours left means after 18:00)
    // Actually: atRisk = has NOT logged today AND it's after 6pm
    // hoursLeft = 18 means 6pm, hoursLeft = 12 means 10pm, etc.
    const isAfter6pm = now.getHours() >= 18;

    return {
      atRisk: isAfter6pm && !hasLoggedToday,
      hoursLeft: Math.round(hoursLeft),
      streak: currentStreak,
    };
  } catch {
    return { atRisk: false, hoursLeft: 0, streak: 0 };
  }
}

export async function updateStreakOnLog(userId: string): Promise<void> {
  try {
    const { currentStreak, longestStreak, totalDaysLogged } = await calculateStreak(userId);
    const rewards = getStreakRewards(currentStreak);
    const xpBonus = rewards.xpBonus;

    const { data: current } = await supabase
      .from('yayika_progress')
      .select('xp_total, streak_days')
      .eq('user_id', userId)
      .maybeSingle();

    const currentXp = current?.xp_total ?? 0;
    const newXp = currentXp + 10 + xpBonus;

    const { error } = await supabase
      .from('yayika_progress')
      .upsert(
        { user_id: userId, streak_days: currentStreak, xp_total: newXp },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
  } catch (e) {
    console.warn('[streakService] Failed to update streak:', e);
  }
}

export function getStreakRewards(streak: number): StreakRewards {
  let xpBonus = 0;
  let badge: string | null = null;
  let messageKey = '';

  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (streak >= MILESTONES[i].days) {
      if (MILESTONES[i].days === 3) xpBonus = MILESTONES[i].xpBonus;
      break;
    }
  }

  // Only award milestone rewards at exact milestones
  for (const milestone of MILESTONES) {
    if (streak === milestone.days) {
      xpBonus = milestone.xpBonus;
      badge = milestone.badge;
      messageKey = milestone.messageKey;
      break;
    }
  }

  return { xpBonus, badge, messageKey };
}

export function getNextMilestone(streak: number): { days: number; nameKey: string } | null {
  for (const milestone of MILESTONES) {
    if (streak < milestone.days) {
      return { days: milestone.days - streak, nameKey: milestone.messageKey || 'streak_next_milestone' };
    }
  }
  return null;
}

export function getMilestoneNameKey(days: number): string {
  switch (days) {
    case 7: return 'streak_milestone_7';
    case 30: return 'streak_milestone_30';
    default: return '';
  }
}
