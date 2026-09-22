import { supabase } from '../config/supabase';
import { CycleLog, getCycleHistory } from './cycleEvolutionService';

export type ArchetypeKey = 'dreamer' | 'warrior' | 'nurturer' | 'explorer' | 'wise';

export interface Archetype {
  key: ArchetypeKey;
  nameKey: string;
  descriptionEs: string;
  descriptionEn: string;
  descriptionPt: string;
  descriptionFr: string;
  descriptionDe: string;
  icon: string;
  color: string;
}

export const ARCHETYPES: Record<ArchetypeKey, Archetype> = {
  dreamer: {
    key: 'dreamer',
    nameKey: 'archetype_dreamer',
    descriptionEs: 'Tu intuitiva naturaleza guía tu ciclo. Sientes profundo y creas desde el alma.',
    descriptionEn: 'Your intuitive nature guides your cycle. You feel deeply and create from the soul.',
    descriptionPt: 'Sua natureza intuitiva guia seu ciclo. Você sente profundamente e cria desde a alma.',
    descriptionFr: 'Ta nature intuitive guide ton cycle. Tu ressens profondément et crées depuis l\'âme.',
    descriptionDe: 'Deine intuitive Natur leitet deinen Zyklus. Du fühlst tief und erschaffst aus der Seele.',
    icon: '🌙',
    color: '#9B72CF',
  },
  warrior: {
    key: 'warrior',
    nameKey: 'archetype_warrior',
    descriptionEs: 'Tu energía es imparable. Enfrentas cada fase con determinación y fuerza.',
    descriptionEn: 'Your energy is unstoppable. You face every phase with determination and strength.',
    descriptionPt: 'Sua energia é imparável. Você enfrenta cada fase com determinação e força.',
    descriptionFr: 'Ton énergie est unstoppable. Tu affrontes chaque phase avec détermination et force.',
    descriptionDe: 'Deine Energie ist unaufhaltsam. Du begegnest jeder Phase mit Entschlossenheit und Stärke.',
    icon: '⚔️',
    color: '#E08898',
  },
  nurturer: {
    key: 'nurturer',
    nameKey: 'archetype_nurturer',
    descriptionEs: 'Cuidas de ti y de los demás con amor. Tu empatía es tu mayor fortaleza.',
    descriptionEn: 'You care for yourself and others with love. Your empathy is your greatest strength.',
    descriptionPt: 'Você cuida de si e dos outros com amor. Sua empatia é sua maior força.',
    descriptionFr: 'Tu prends soin de toi et des autres avec amour. Ton empathie est ta plus grande force.',
    descriptionDe: 'Du kümmerst dich um dich und andere mit Liebe. Deine Empathie ist deine größte Stärke.',
    icon: '💚',
    color: '#5CCF9A',
  },
  explorer: {
    key: 'explorer',
    nameKey: 'archetype_explorer',
    descriptionEs: 'Cada fase es una nueva aventura. Tu curiosidad te lleva a descubrir más de ti.',
    descriptionEn: 'Every phase is a new adventure. Your curiosity leads you to discover more about yourself.',
    descriptionPt: 'Cada fase é uma nova aventura. Sua curiosidade te leva a descobrir mais sobre você.',
    descriptionFr: 'Chaque phase est une nouvelle aventure. Ta curiosité te conduit à te découvrir davantage.',
    descriptionDe: 'Jede Phase ist ein neues Abenteuer. Deine Neugier führt dich dazu, mehr über dich zu entdecken.',
    icon: '🦋',
    color: '#3CC0B0',
  },
  wise: {
    key: 'wise',
    nameKey: 'archetype_wise',
    descriptionEs: 'Tu sabiduría interior guía cada decisión. Reflexionas y aprendes de cada ciclo.',
    descriptionEn: 'Your inner wisdom guides every decision. You reflect and learn from every cycle.',
    descriptionPt: 'Sua sabedoria interior guia cada decisão. Você reflete e aprende de cada ciclo.',
    descriptionFr: 'Ta sagesse intérieure guide chaque décision. Tu réfléchis et apprends de chaque cycle.',
    descriptionDe: 'Deine innere Weisheit leitet jede Entscheidung. Du reflektierst und lernst aus jedem Zyklus.',
    icon: '🔮',
    color: '#D4B05A',
  },
};

export interface EmotionalProfile {
  dominantMood: string | null;
  moodStability: number;
  energyPattern: 'rising' | 'falling' | 'stable' | 'cyclical';
  symptomPatterns: string[];
  archetype: ArchetypeKey;
  cycleIQ: number;
  powerDays: number;
  totalLogs: number;
  moodDistribution: { mood: string; count: number; percentage: number }[];
  weeklySummary: { day: string; mood: string | null; energy: number | null }[];
}

const MOOD_SCORES: Record<string, number> = {
  happy: 5,
  neutral: 3,
  sad: 1,
  irritable: 2,
  tired: 2,
};

function calculateMoodStability(logs: CycleLog[]): number {
  const withMood = logs.filter((l) => l.mood && MOOD_SCORES[l.mood] !== undefined);
  if (withMood.length < 3) return 50;

  const scores = withMood.map((l) => MOOD_SCORES[l.mood!] || 3);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  const stability = Math.max(0, Math.min(100, Math.round(100 - stdDev * 20)));
  return stability;
}

function calculateEnergyPattern(logs: CycleLog[]): 'rising' | 'falling' | 'stable' | 'cyclical' {
  const withEnergy = logs.filter((l) => l.energy_level != null);
  if (withEnergy.length < 5) return 'stable';

  const third = Math.floor(withEnergy.length / 3);
  const firstThird = withEnergy.slice(0, third);
  const lastThird = withEnergy.slice(-third);

  const avgFirst = firstThird.reduce((a, l) => a + l.energy_level!, 0) / (firstThird.length || 1);
  const avgLast = lastThird.reduce((a, l) => a + l.energy_level!, 0) / (lastThird.length || 1);
  const diff = avgLast - avgFirst;

  const energyValues = withEnergy.map((l) => l.energy_level!);
  const allMean = energyValues.reduce((a, b) => a + b, 0) / energyValues.length;
  const crossings = energyValues.filter((v, i) =>
    i > 0 && ((v > allMean && energyValues[i - 1] <= allMean) || (v < allMean && energyValues[i - 1] >= allMean))
  ).length;

  if (crossings >= withEnergy.length * 0.3) return 'cyclical';
  if (diff > 1) return 'rising';
  if (diff < -1) return 'falling';
  return 'stable';
}

function getDominantMood(logs: CycleLog[]): string | null {
  const counts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.mood) counts[l.mood] = (counts[l.mood] || 0) + 1;
  });
  let max = 0;
  let dominant: string | null = null;
  Object.entries(counts).forEach(([mood, count]) => {
    if (count > max) {
      max = count;
      dominant = mood;
    }
  });
  return dominant;
}

function getTopSymptoms(logs: CycleLog[], top: number = 3): string[] {
  const counts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.symptoms) {
      l.symptoms.forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      });
    }
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([s]) => s);
}

function getMoodDistribution(logs: CycleLog[]): { mood: string; count: number; percentage: number }[] {
  const counts: Record<string, number> = {};
  logs.forEach((l) => {
    if (l.mood) counts[l.mood] = (counts[l.mood] || 0) + 1;
  });
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .map(([mood, count]) => ({ mood, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);
}

function determineArchetype(
  dominantMood: string | null,
  moodStability: number,
  energyPattern: string,
  symptomPatterns: string[]
): ArchetypeKey {
  const scores: Record<ArchetypeKey, number> = {
    dreamer: 0,
    warrior: 0,
    nurturer: 0,
    explorer: 0,
    wise: 0,
  };

  if (dominantMood === 'happy') scores.warrior += 2;
  if (dominantMood === 'sad') scores.dreamer += 2;
  if (dominantMood === 'irritable') scores.warrior += 1;
  if (dominantMood === 'tired') scores.nurturer += 1;
  if (dominantMood === 'neutral') scores.wise += 2;

  if (moodStability > 70) scores.wise += 3;
  else if (moodStability > 50) scores.nurturer += 2;
  else scores.dreamer += 1;

  if (energyPattern === 'rising') scores.warrior += 2;
  if (energyPattern === 'falling') scores.nurturer += 1;
  if (energyPattern === 'cyclical') scores.explorer += 3;
  if (energyPattern === 'stable') scores.wise += 2;

  if (symptomPatterns.includes('anxiety')) scores.dreamer += 1;
  if (symptomPatterns.includes('good_mood')) scores.warrior += 1;
  if (symptomPatterns.includes('high_focus')) scores.wise += 2;
  if (symptomPatterns.includes('fatigue')) scores.nurturer += 1;
  if (symptomPatterns.includes('insomnia')) scores.explorer += 1;

  let maxScore = 0;
  let result: ArchetypeKey = 'wise';
  Object.entries(scores).forEach(([key, score]) => {
    if (score > maxScore) {
      maxScore = score;
      result = key as ArchetypeKey;
    }
  });
  return result;
}

function calculateCycleIQ(logs: CycleLog[]): number {
  if (logs.length === 0) return 0;

  let score = 0;

  const withMood = logs.filter((l) => l.mood).length;
  const withEnergy = logs.filter((l) => l.energy_level != null).length;
  const withSymptoms = logs.filter((l) => l.symptoms && l.symptoms.length > 0).length;

  score += Math.min(30, (withMood / Math.max(logs.length, 1)) * 30);
  score += Math.min(30, (withEnergy / Math.max(logs.length, 1)) * 30);
  score += Math.min(20, (withSymptoms / Math.max(logs.length, 1)) * 20);

  const uniqueDays = new Set(logs.map((l) => l.logged_at.split('T')[0])).size;
  score += Math.min(20, (uniqueDays / 30) * 20);

  return Math.round(Math.min(100, score));
}

function countPowerDays(logs: CycleLog[]): number {
  return logs.filter((l) => {
    const moodScore = l.mood ? (MOOD_SCORES[l.mood] || 0) : 0;
    const energyHigh = l.energy_level != null && l.energy_level >= 7;
    return moodScore >= 4 && energyHigh;
  }).length;
}

function getWeeklySummary(logs: CycleLog[]): { day: string; mood: string | null; energy: number | null }[] {
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  return dayNames.map((day, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const dayLogs = logs.filter((l) => l.logged_at.startsWith(dateStr));
    if (dayLogs.length === 0) return { day, mood: null, energy: null };

    const moods = dayLogs.filter((l) => l.mood).map((l) => l.mood!);
    const energies = dayLogs.filter((l) => l.energy_level != null).map((l) => l.energy_level!);

    const moodCounts: Record<string, number> = {};
    moods.forEach((m) => { moodCounts[m] = (moodCounts[m] || 0) + 1; });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const avgEnergy = energies.length > 0
      ? Math.round(energies.reduce((a, b) => a + b, 0) / energies.length)
      : null;

    return { day, mood: dominantMood, energy: avgEnergy };
  });
}

export async function calculateEmotionalProfile(userId: string): Promise<EmotionalProfile> {
  const logs = await getCycleHistory(userId, 30);

  const dominantMood = getDominantMood(logs);
  const moodStability = calculateMoodStability(logs);
  const energyPattern = calculateEnergyPattern(logs);
  const symptomPatterns = getTopSymptoms(logs);
  const archetype = determineArchetype(dominantMood, moodStability, energyPattern, symptomPatterns);
  const cycleIQ = calculateCycleIQ(logs);
  const powerDays = countPowerDays(logs);
  const moodDistribution = getMoodDistribution(logs);
  const weeklySummary = getWeeklySummary(logs);

  return {
    dominantMood,
    moodStability,
    energyPattern,
    symptomPatterns,
    archetype,
    cycleIQ,
    powerDays,
    totalLogs: logs.length,
    moodDistribution,
    weeklySummary,
  };
}

export function getArchetype(profile: EmotionalProfile): { nameKey: string; description: string; icon: string; color: string } {
  const a = ARCHETYPES[profile.archetype];
  return {
    nameKey: a.nameKey,
    description: a.descriptionEs,
    icon: a.icon,
    color: a.color,
  };
}

export function getCycleIQ(profile: EmotionalProfile): { score: number; label: string } {
  return {
    score: profile.cycleIQ,
    label: profile.cycleIQ >= 80
      ? '¡Conoces tu cuerpo como nadie!'
      : profile.cycleIQ >= 50
        ? 'Vas conociendo tu cuerpo cada vez más'
        : 'Registra más para conocerte mejor',
  };
}

export function getPowerDays(profile: EmotionalProfile): number {
  return profile.powerDays;
}

export const SURPRISE_INSIGHTS = [
  { key: 'insight_energy_day', param: 'day' },
  { key: 'insight_symptoms_luteal', param: null },
  { key: 'insight_mood_optimistic', param: null },
  { key: 'insight_stability_change', param: 'percent' },
  { key: 'insight_logging_consistency', param: 'days' },
  { key: 'insight_energy_pattern', param: 'pattern' },
  { key: 'insight_mood_dominant', param: 'mood' },
];

export function getSurpriseInsight(profile: EmotionalProfile): { text: string; type: 'pattern' | 'celebration' | 'curiosity' } {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (24 * 60 * 60 * 1000));
  const insightIndex = dayOfYear % SURPRISE_INSIGHTS.length;
  const insight = SURPRISE_INSIGHTS[insightIndex];

  const days = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
  const today = new Date().getDay();
  const dayName = days[(today + 6) % 7];

  switch (insight.key) {
    case 'insight_energy_day':
      return { text: `Tu energía sube los ${dayName} — ¿lo sabías?`, type: 'curiosity' };
    case 'insight_symptoms_luteal':
      return { text: 'Los síntomas que más reportas aparecen en fase lútea', type: 'pattern' };
    case 'insight_mood_optimistic':
      return { text: `Tu mood más frecuente es ${profile.dominantMood || '😊'} — ¡eres una persona optimista!`, type: 'celebration' };
    case 'insight_stability_change':
      return { text: `Tu estabilidad emocional subió ${Math.max(5, profile.moodStability - 40)}% comparado con el mes pasado`, type: 'celebration' };
    case 'insight_logging_consistency':
      return { text: `Llevas ${profile.totalLogs} días registrando — ¡conoces tu cuerpo cada vez mejor!`, type: 'celebration' };
    case 'insight_energy_pattern':
      return { text: `Tu patrón de energía es ${profile.energyPattern === 'cyclical' ? 'cíclico' : profile.energyPattern === 'rising' ? 'ascendente' : 'estable'} — ¡úselo a tu favor!`, type: 'pattern' };
    case 'insight_mood_dominant':
      return { text: `Tu mood más frecuente es ${profile.dominantMood || 'neutral'} — es parte de lo que te hace única`, type: 'curiosity' };
    default:
      return { text: 'Cada día que registras, aprendes más sobre ti misma', type: 'curiosity' };
  }
}

export function getWeeklyEmotionalSummary(logs: CycleLog[]): { day: string; mood: string | null; energy: number | null }[] {
  return getWeeklySummary(logs);
}
