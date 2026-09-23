import { supabase } from '../config/supabase';

export interface CycleLog {
  id: string;
  user_id: string;
  logged_at: string;
  energy: number | null;
  mood: string | null;
  symptoms: string[] | null;
  notes: string | null;
}

export interface EnergyTrend {
  data: number[];
  average: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

export interface MoodDistribution {
  mood: string;
  count: number;
  percentage: number;
}

export interface SymptomFrequency {
  symptom: string;
  count: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface CyclePhase {
  date: string;
  phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
}

export interface WeeklyComparison {
  thisWeek: { avgEnergy: number; moodCounts: Record<string, number>; symptomCounts: Record<string, number>; logCount: number };
  lastWeek: { avgEnergy: number; moodCounts: Record<string, number>; symptomCounts: Record<string, number>; logCount: number };
  energyChange: number;
}

export async function getCycleHistory(userId: string, days: number = 30): Promise<CycleLog[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('yayika_cycle_log')
    .select('*')
    .eq('user_id', userId)
    .gte('logged_at', since)
    .order('logged_at', { ascending: true });

  if (error || !data) return [];
  return data as CycleLog[];
}

export function getEnergyTrend(logs: CycleLog[]): EnergyTrend {
  const withEnergy = logs.filter((l) => l.energy != null);
  if (withEnergy.length === 0) {
    return { data: [], average: 0, trend: 'stable', change: 0 };
  }

  const data = withEnergy.map((l) => l.energy!);
  const average = data.reduce((a, b) => a + b, 0) / data.length;

  const half = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, half);
  const secondHalf = data.slice(half);

  const avgFirst = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0;
  const avgSecond = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0;

  const change = avgSecond - avgFirst;
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (change > 0.3) trend = 'up';
  else if (change < -0.3) trend = 'down';

  return { data, average: Math.round(average * 10) / 10, trend, change: Math.round(change * 10) / 10 };
}

export function getMoodDistribution(logs: CycleLog[]): MoodDistribution[] {
  const moodCounts: Record<string, number> = {};
  const withMood = logs.filter((l) => l.mood);

  withMood.forEach((l) => {
    const mood = l.mood!;
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });

  const total = withMood.length || 1;

  return Object.entries(moodCounts)
    .map(([mood, count]) => ({
      mood,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}

export function getSymptomFrequency(logs: CycleLog[]): SymptomFrequency[] {
  const symptomCounts: Record<string, number> = {};
  const recentSymptoms: Record<string, number> = {};
  const olderSymptoms: Record<string, number> = {};

  const cutoff = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

  logs.forEach((l) => {
    if (!l.symptoms || l.symptoms.length === 0) return;
    const isRecent = new Date(l.logged_at) >= cutoff;
    l.symptoms.forEach((s) => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
      if (isRecent) {
        recentSymptoms[s] = (recentSymptoms[s] || 0) + 1;
      } else {
        olderSymptoms[s] = (olderSymptoms[s] || 0) + 1;
      }
    });
  });

  return Object.entries(symptomCounts)
    .map(([symptom, count]) => {
      const recent = recentSymptoms[symptom] || 0;
      const older = olderSymptoms[symptom] || 0;
      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (recent > older + 1) trend = 'increasing';
      else if (older > recent + 1) trend = 'decreasing';
      return { symptom, count, trend };
    })
    .sort((a, b) => b.count - a.count);
}

export function getCyclePhases(logs: CycleLog[]): CyclePhase[] {
  return logs.map((log) => {
    const d = new Date(log.logged_at);
    const dayOfYear = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000)
    );
    const cycleDay = (dayOfYear % 28) + 1;

    let phase: CyclePhase['phase'] = 'unknown';
    if (cycleDay <= 5) phase = 'menstrual';
    else if (cycleDay <= 13) phase = 'follicular';
    else if (cycleDay <= 16) phase = 'ovulatory';
    else phase = 'luteal';

    return { date: log.logged_at.split('T')[0], phase };
  });
}

export function getWeeklyComparison(logs: CycleLog[]): WeeklyComparison {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  const thisWeekLogs = logs.filter((l) => {
    const t = new Date(l.logged_at).getTime();
    return t >= now - weekMs;
  });

  const lastWeekLogs = logs.filter((l) => {
    const t = new Date(l.logged_at).getTime();
    return t >= now - 2 * weekMs && t < now - weekMs;
  });

  const avgEnergy = (weekLogs: CycleLog[]) => {
    const withE = weekLogs.filter((l) => l.energy != null);
    if (withE.length === 0) return 0;
    return withE.reduce((a, l) => a + l.energy!, 0) / withE.length;
  };

  const moodCounts = (weekLogs: CycleLog[]) => {
    const counts: Record<string, number> = {};
    weekLogs.forEach((l) => {
      if (l.mood) counts[l.mood] = (counts[l.mood] || 0) + 1;
    });
    return counts;
  };

  const symptomCounts = (weekLogs: CycleLog[]) => {
    const counts: Record<string, number> = {};
    weekLogs.forEach((l) => {
      if (l.symptoms) {
        l.symptoms.forEach((s) => {
          counts[s] = (counts[s] || 0) + 1;
        });
      }
    });
    return counts;
  };

  const twAvg = avgEnergy(thisWeekLogs);
  const lwAvg = avgEnergy(lastWeekLogs);

  return {
    thisWeek: {
      avgEnergy: Math.round(twAvg * 10) / 10,
      moodCounts: moodCounts(thisWeekLogs),
      symptomCounts: symptomCounts(thisWeekLogs),
      logCount: thisWeekLogs.length,
    },
    lastWeek: {
      avgEnergy: Math.round(lwAvg * 10) / 10,
      moodCounts: moodCounts(lastWeekLogs),
      symptomCounts: symptomCounts(lastWeekLogs),
      logCount: lastWeekLogs.length,
    },
    energyChange: Math.round((twAvg - lwAvg) * 10) / 10,
  };
}
