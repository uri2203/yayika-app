import { supabase } from '../config/supabase';

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
export type ActionCategory = 'wellness' | 'cycle' | 'social' | 'growth';

export interface DailyAction {
  id: string;
  titleKey: string;
  descKey: string;
  icon: string;
  xpReward: number;
  duration: string;
  category: ActionCategory;
}

interface ActionDBRow {
  id: string;
  user_id: string;
  action_id: string;
  completed_at: string;
  xp_awarded: number;
}

const MENSTRUAL_ACTIONS: DailyAction[] = [
  {
    id: 'menstrual_meditation',
    titleKey: 'da_menstrual_meditation_title',
    descKey: 'da_menstrual_meditation_desc',
    icon: 'body',
    xpReward: 15,
    duration: '10 min',
    category: 'wellness',
  },
  {
    id: 'menstrual_tea',
    titleKey: 'da_menstrual_tea_title',
    descKey: 'da_menstrual_tea_desc',
    icon: 'cafe',
    xpReward: 10,
    duration: '5 min',
    category: 'wellness',
  },
  {
    id: 'menstrual_journal',
    titleKey: 'da_menstrual_journal_title',
    descKey: 'da_menstrual_journal_desc',
    icon: 'book-outline',
    xpReward: 15,
    duration: '10 min',
    category: 'wellness',
  },
  {
    id: 'menstrual_rest',
    titleKey: 'da_menstrual_rest_title',
    descKey: 'da_menstrual_rest_desc',
    icon: 'moon',
    xpReward: 10,
    duration: '5 min',
    category: 'wellness',
  },
  {
    id: 'menstrual_bath',
    titleKey: 'da_menstrual_bath_title',
    descKey: 'da_menstrual_bath_desc',
    icon: 'water',
    xpReward: 10,
    duration: '15 min',
    category: 'wellness',
  },
];

const FOLLICULAR_ACTIONS: DailyAction[] = [
  {
    id: 'follicular_new_thing',
    titleKey: 'da_follicular_new_title',
    descKey: 'da_follicular_new_desc',
    icon: 'rocket',
    xpReward: 20,
    duration: '15 min',
    category: 'growth',
  },
  {
    id: 'follicular_goals',
    titleKey: 'da_follicular_goals_title',
    descKey: 'da_follicular_goals_desc',
    icon: 'flag',
    xpReward: 15,
    duration: '10 min',
    category: 'growth',
  },
  {
    id: 'follicular_learn',
    titleKey: 'da_follicular_learn_title',
    descKey: 'da_follicular_learn_desc',
    icon: 'school',
    xpReward: 20,
    duration: '20 min',
    category: 'growth',
  },
  {
    id: 'follicular_exercise',
    titleKey: 'da_follicular_exercise_title',
    descKey: 'da_follicular_exercise_desc',
    icon: 'barbell',
    xpReward: 15,
    duration: '15 min',
    category: 'wellness',
  },
  {
    id: 'follicular_plan',
    titleKey: 'da_follicular_plan_title',
    descKey: 'da_follicular_plan_desc',
    icon: 'calendar',
    xpReward: 15,
    duration: '10 min',
    category: 'growth',
  },
];

const OVULATORY_ACTIONS: DailyAction[] = [
  {
    id: 'ovulatory_connect',
    titleKey: 'da_ovulatory_connect_title',
    descKey: 'da_ovulatory_connect_desc',
    icon: 'people',
    xpReward: 20,
    duration: '15 min',
    category: 'social',
  },
  {
    id: 'ovulatory_share',
    titleKey: 'da_ovulatory_share_title',
    descKey: 'da_ovulatory_share_desc',
    icon: 'chatbubbles',
    xpReward: 15,
    duration: '10 min',
    category: 'social',
  },
  {
    id: 'ovulatory_mentor',
    titleKey: 'da_ovulatory_mentor_title',
    descKey: 'da_ovulatory_mentor_desc',
    icon: 'heart',
    xpReward: 25,
    duration: '20 min',
    category: 'social',
  },
  {
    id: 'ovulatory_negotiate',
    titleKey: 'da_ovulatory_negotiate_title',
    descKey: 'da_ovulatory_negotiate_desc',
    icon: 'hand-left',
    xpReward: 20,
    duration: '15 min',
    category: 'social',
  },
  {
    id: 'ovulatory_network',
    titleKey: 'da_ovulatory_network_title',
    descKey: 'da_ovulatory_network_desc',
    icon: 'globe',
    xpReward: 15,
    duration: '10 min',
    category: 'social',
  },
];

const LUTEAL_ACTIONS: DailyAction[] = [
  {
    id: 'luteal_review',
    titleKey: 'da_luteal_review_title',
    descKey: 'da_luteal_review_desc',
    icon: 'clipboard',
    xpReward: 15,
    duration: '10 min',
    category: 'growth',
  },
  {
    id: 'luteal_plan',
    titleKey: 'da_luteal_plan_title',
    descKey: 'da_luteal_plan_desc',
    icon: 'list',
    xpReward: 15,
    duration: '10 min',
    category: 'growth',
  },
  {
    id: 'luteal_gratitude',
    titleKey: 'da_luteal_gratitude_title',
    descKey: 'da_luteal_gratitude_desc',
    icon: 'heart-circle',
    xpReward: 10,
    duration: '5 min',
    category: 'wellness',
  },
  {
    id: 'luteal_organize',
    titleKey: 'da_luteal_organize_title',
    descKey: 'da_luteal_organize_desc',
    icon: 'apps',
    xpReward: 15,
    duration: '15 min',
    category: 'growth',
  },
  {
    id: 'luteal_reflect',
    titleKey: 'da_luteal_reflect_title',
    descKey: 'da_luteal_reflect_desc',
    icon: 'bulb',
    xpReward: 10,
    duration: '5 min',
    category: 'wellness',
  },
];

const GENERIC_ACTIONS: DailyAction[] = [
  {
    id: 'generic_hydrate',
    titleKey: 'da_generic_hydrate_title',
    descKey: 'da_generic_hydrate_desc',
    icon: 'water',
    xpReward: 10,
    duration: '5 min',
    category: 'wellness',
  },
  {
    id: 'generic_move',
    titleKey: 'da_generic_move_title',
    descKey: 'da_generic_move_desc',
    icon: 'walk',
    xpReward: 10,
    duration: '10 min',
    category: 'wellness',
  },
  {
    id: 'generic_breathe',
    titleKey: 'da_generic_breathe_title',
    descKey: 'da_generic_breathe_desc',
    icon: 'leaf',
    xpReward: 10,
    duration: '5 min',
    category: 'wellness',
  },
  {
    id: 'generic_log_cycle',
    titleKey: 'da_generic_log_title',
    descKey: 'da_generic_log_desc',
    icon: 'create',
    xpReward: 15,
    duration: '5 min',
    category: 'cycle',
  },
  {
    id: 'generic_affirmation',
    titleKey: 'da_generic_affirmation_title',
    descKey: 'da_generic_affirmation_desc',
    icon: 'sparkles',
    xpReward: 10,
    duration: '5 min',
    category: 'wellness',
  },
];

const PHASE_ACTIONS: Record<CyclePhase, DailyAction[]> = {
  menstrual: MENSTRUAL_ACTIONS,
  follicular: FOLLICULAR_ACTIONS,
  ovulatory: OVULATORY_ACTIONS,
  luteal: LUTEAL_ACTIONS,
  unknown: GENERIC_ACTIONS,
};

function getTodayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function hashAction(actionId: string, date: string): number {
  let hash = 0;
  const str = `${actionId}-${date}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getDailyAction(
  cyclePhase: CyclePhase,
  completedToday: boolean
): DailyAction | null {
  if (completedToday) return null;
  const actions = PHASE_ACTIONS[cyclePhase] || GENERIC_ACTIONS;
  const todayKey = getTodayKey();
  const idx = hashAction('daily', todayKey) % actions.length;
  return actions[idx];
}

export async function completeDailyAction(
  userId: string,
  actionId: string
): Promise<{ xpAwarded: number; alreadyCompleted: boolean }> {
  const todayKey = getTodayKey();
  const todayStart = new Date(todayKey + 'T00:00:00Z').toISOString();
  const todayEnd = new Date(todayKey + 'T23:59:59Z').toISOString();

  const { data: existing } = await supabase
    .from('daily_action_completions')
    .select('id')
    .eq('user_id', userId)
    .eq('action_id', actionId)
    .gte('completed_at', todayStart)
    .lte('completed_at', todayEnd)
    .maybeSingle();

  if (existing) {
    return { xpAwarded: 0, alreadyCompleted: true };
  }

  const actions = [
    ...MENSTRUAL_ACTIONS,
    ...FOLLICULAR_ACTIONS,
    ...OVULATORY_ACTIONS,
    ...LUTEAL_ACTIONS,
    ...GENERIC_ACTIONS,
  ];
  const action = actions.find((a) => a.id === actionId);
  const xpReward = action?.xpReward ?? 10;

  await supabase.from('daily_action_completions').insert({
    user_id: userId,
    action_id: actionId,
    completed_at: new Date().toISOString(),
    xp_awarded: xpReward,
  });

  const { data: progress } = await supabase
    .from('yayika_profiles')
    .select('xp_total')
    .eq('id', userId)
    .single();

  if (progress) {
    await supabase
      .from('yayika_profiles')
      .update({ xp_total: (progress.xp_total ?? 0) + xpReward })
      .eq('id', userId);
  }

  return { xpAwarded: xpReward, alreadyCompleted: false };
}

export async function getDailyStreak(userId: string): Promise<number> {
  const { data } = await supabase
    .from('daily_action_completions')
    .select('completed_at')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(100);

  if (!data || data.length === 0) return 0;

  const uniqueDays = [...new Set(
    data.map((r) => new Date(r.completed_at).toISOString().split('T')[0])
  )];

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedKey = expected.toISOString().split('T')[0];

    if (uniqueDays[i] === expectedKey) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function hasCompletedToday(userId: string): Promise<boolean> {
  const todayKey = getTodayKey();
  const todayStart = new Date(todayKey + 'T00:00:00Z').toISOString();
  const todayEnd = new Date(todayKey + 'T23:59:59Z').toISOString();

  const { data } = await supabase
    .from('daily_action_completions')
    .select('id')
    .eq('user_id', userId)
    .gte('completed_at', todayStart)
    .lte('completed_at', todayEnd)
    .limit(1)
    .maybeSingle();

  return !!data;
}

export function getWeeklyActions(cyclePhase: CyclePhase): DailyAction[] {
  const actions = PHASE_ACTIONS[cyclePhase] || GENERIC_ACTIONS;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const week: DailyAction[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateKey = d.toISOString().split('T')[0];
    const idx = hashAction('weekly', dateKey) % actions.length;
    week.push(actions[idx]);
  }
  return week;
}
