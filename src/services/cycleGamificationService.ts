import { supabase } from '../config/supabase';

export interface CycleAchievement {
  id: string;
  nameKey: string;
  descKey: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

interface CycleLogRow {
  id: string;
  user_id: string;
  logged_at: string;
  energy: number | null;
  mood: string | null;
  symptoms: string[] | null;
  phase: string | null;
}

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function dateKey(iso: string): string {
  return new Date(iso).toISOString().split('T')[0];
}

export async function logCycleEntry(
  userId: string,
  data: {
    energy?: number;
    mood?: string;
    symptoms?: string[];
    cycle_day?: number;
    phase?: string;
  }
): Promise<{ xpAwarded: number; totalXp: number }> {
  const hasAllFields = !!(data.energy && data.mood && data.symptoms?.length);
  let xp = hasAllFields ? 15 : 5;

  const todayKey = getTodayKey();
  const todayStart = new Date(todayKey + 'T00:00:00Z').toISOString();
  const todayEnd = new Date(todayKey + 'T23:59:59Z').toISOString();

  const { data: recentLogs } = await supabase
    .from('yayika_cycle_log')
    .select('logged_at')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false })
    .limit(2);

  const isOnTime = !recentLogs || recentLogs.length === 0 ||
    (new Date(todayStart).getTime() - new Date(recentLogs[0].logged_at).getTime()) < 48 * 60 * 60 * 1000;

  if (isOnTime && recentLogs && recentLogs.length > 0) {
    xp += 10;
  }

  const { data: recentWeek } = await supabase
    .from('yayika_cycle_log')
    .select('logged_at')
    .eq('user_id', userId)
    .gte('logged_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('logged_at', { ascending: false });

  if (recentWeek && recentWeek.length >= 7) {
    const streakDays = new Set(recentWeek.map((r) => dateKey(r.logged_at))).size;
    if (streakDays >= 7) {
      xp += 25;
    }
  }

  const { data: progress } = await supabase
    .from('yayika_progress')
    .select('xp_total')
    .eq('user_id', userId)
    .maybeSingle();

  const newTotal = (progress?.xp_total ?? 0) + xp;

  const { error: xpError } = await supabase
    .from('yayika_progress')
    .upsert({ user_id: userId, xp_total: newTotal }, { onConflict: 'user_id' });
  if (xpError) throw xpError;

  return { xpAwarded: xp, totalXp: newTotal };
}

export async function getCycleAchievements(userId: string): Promise<CycleAchievement[]> {
  const achievements: CycleAchievement[] = [];

  const { data: allLogs } = await supabase
    .from('yayika_cycle_log')
    .select('logged_at, mood, symptoms, phase')
    .eq('user_id', userId)
    .order('logged_at', { ascending: true });

  const logs: CycleLogRow[] = (allLogs as CycleLogRow[]) ?? [];

  const firstLog = logs.length > 0;
  achievements.push({
    id: 'first_log',
    nameKey: 'cycle_achievement_first_name',
    descKey: 'cycle_achievement_first_desc',
    icon: 'checkmark-circle',
    unlocked: firstLog,
    unlockedAt: logs[0]?.logged_at,
  });

  const uniqueDays = [...new Set(logs.map((l) => dateKey(l.logged_at)))];
  const has7Days = uniqueDays.length >= 7;
  const last7 = logs.filter(
    (l) => new Date(l.logged_at).getTime() >= Date.now() - 7 * 24 * 60 * 60 * 1000
  );
  const streak7 = new Set(last7.map((l) => dateKey(l.logged_at))).size >= 7;
  achievements.push({
    id: 'full_week',
    nameKey: 'cycle_achievement_week_name',
    descKey: 'cycle_achievement_week_desc',
    icon: 'flame',
    unlocked: has7Days || streak7,
  });

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthLogs = logs.filter((l) => {
    const d = new Date(l.logged_at);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });
  const monthDays = new Set(monthLogs.map((l) => dateKey(l.logged_at))).size;
  achievements.push({
    id: 'perfect_month',
    nameKey: 'cycle_achievement_month_name',
    descKey: 'cycle_achievement_month_desc',
    icon: 'trophy',
    unlocked: monthDays >= 28,
  });

  const phases = new Set(logs.map((l) => l.phase).filter(Boolean));
  achievements.push({
    id: 'know_body',
    nameKey: 'cycle_achievement_body_name',
    descKey: 'cycle_achievement_body_desc',
    icon: 'body',
    unlocked: phases.size >= 3,
  });

  const monthlyPhases: Record<string, Set<string>> = {};
  logs.forEach((l) => {
    if (!l.phase) return;
    const d = new Date(l.logged_at);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!monthlyPhases[key]) monthlyPhases[key] = new Set();
    monthlyPhases[key].add(l.phase);
  });
  const phaseKeys = Object.keys(monthlyPhases).sort();
  let consecutiveSamePhase = 0;
  let maxConsecutive = 0;
  for (let i = 0; i < phaseKeys.length; i++) {
    const phasesArr = [...(monthlyPhases[phaseKeys[i]] ?? [])];
    if (phasesArr.length === 1) {
      if (i > 0) {
        const prevPhases = [...(monthlyPhases[phaseKeys[i - 1]] ?? [])];
        if (prevPhases.length === 1 && prevPhases[0] === phasesArr[0]) {
          consecutiveSamePhase++;
        } else {
          consecutiveSamePhase = 1;
        }
      } else {
        consecutiveSamePhase = 1;
      }
      maxConsecutive = Math.max(maxConsecutive, consecutiveSamePhase);
    } else {
      consecutiveSamePhase = 0;
    }
  }
  achievements.push({
    id: 'consistent_cycle',
    nameKey: 'cycle_achievement_consistent_name',
    descKey: 'cycle_achievement_consistent_desc',
    icon: 'repeat',
    unlocked: maxConsecutive >= 3,
  });

  return achievements;
}
