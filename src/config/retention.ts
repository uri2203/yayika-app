import { supabase } from '../config/supabase';

const FUNCTIONS_URL = 'https://odbhxiymteppgaqqdsoy.supabase.co/functions/v1';

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function callRetentionFunction<T = any>(name: string, body: Record<string, any>): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYmh4aXltdGVwcGdhcXFkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwOTc1NjUsImV4cCI6MjA5NTY3MzU2NX0.-AMG1zoszc05NJjAkXmm7kCZJuN3RA2OIzZRs221gkc',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  return await res.json();
}

// ============================================================================
// DAILY CHECK-IN
// ============================================================================

export interface DailyCheckinResult {
  success?: boolean;
  error?: string;
  xp_earned?: number;
  streak?: number;
  spin_result?: SpinResult;
  cycle_reward?: CycleReward;
  level?: number;
}

export async function dailyCheckin(mood?: string, energy?: number, notes?: string): Promise<DailyCheckinResult> {
  return callRetentionFunction('retention-check-in', {
    action: 'dailyCheckin',
    mood,
    energy,
    notes,
  });
}

// ============================================================================
// REWARD WHEEL
// ============================================================================

export interface SpinResult {
  already_spun?: boolean;
  type?: 'xp' | 'badge' | 'streak_boost' | 'content' | 'multiplier';
  value?: number | string;
  is_special?: boolean;
}

export async function getSpinResult(): Promise<SpinResult> {
  return callRetentionFunction('retention-check-in', {
    action: 'getSpinResult',
  });
}

// ============================================================================
// TRANSFORM HISTORY
// ============================================================================

export interface TransformMonth {
  month_date: string;
  data_snapshot: {
    checkins: number;
    badges: number;
    challenges: number;
    xp: number;
    streak: number;
  };
  level_at_month: number;
  comparison?: {
    checkins_delta: number;
    badges_delta: number;
    xp_delta: number;
    level_delta: number;
  };
}

export async function getTransformHistory(): Promise<TransformMonth[]> {
  const result = await callRetentionFunction<{ history: TransformMonth[] }>('retention-check-in', {
    action: 'getTransformHistory',
  });
  return result.history || [];
}

// ============================================================================
// CYCLE REWARDS
// ============================================================================

export interface CycleReward {
  id: string;
  cycle_day: number;
  phase: string;
  reward_type: string;
  reward_title: string;
  reward_xp: number;
  reward_badge?: string;
  already_claimed?: boolean;
}

export async function getCycleReward(cycleDay: number): Promise<CycleReward | null> {
  const result = await callRetentionFunction<{ reward: CycleReward }>('retention-check-in', {
    action: 'getCycleReward',
    cycleDay,
  });
  return result.reward || null;
}

export async function claimCycleReward(rewardId: string, cycleId: string): Promise<boolean> {
  const result = await callRetentionFunction<{ success?: boolean; error?: string }>('retention-check-in', {
    action: 'claimCycleReward',
    rewardId,
    cycleId,
  });
  return result.success || false;
}

// ============================================================================
// CIRCLE ACTIVITY
// ============================================================================

export interface CircleActivity {
  my_activity?: {
    last_active_at: string;
    activity_score: number;
  };
  others_active: {
    user_id: string;
    last_active_at: string;
    activity_score: number;
  }[];
  total_active: number;
}

export async function getCircleActivity(): Promise<CircleActivity> {
  return callRetentionFunction('retention-check-in', {
    action: 'getCircleActivity',
  });
}

// ============================================================================
// LOSS WARNING
// ============================================================================

export interface LossWarning {
  warning: {
    days_inactive: number;
    streak_at_risk: number;
    xp_at_risk: number;
    badges_at_risk: number;
    message: string;
    severity: 'low' | 'medium' | 'high';
  } | null;
}

export async function getLossWarning(): Promise<LossWarning> {
  return callRetentionFunction('retention-check-in', {
    action: 'getLossWarning',
  });
}

// ============================================================================
// PROJECTION (Future Self)
// ============================================================================

export interface FutureProjection {
  current: {
    level: number;
    xp: number;
    badges: number;
    challenges: number;
    streak: number;
  };
  future_30_days: {
    level: number;
    xp: number;
    badges: number;
    challenges: number;
    streak: number;
  };
  if_cancel: {
    level: number;
    xp: number;
    badges: number;
    streak: number;
    message: string;
  };
}

export async function getProjection(): Promise<FutureProjection | null> {
  const result = await callRetentionFunction<{ projection: FutureProjection }>('retention-projection', {
    action: 'getProjection',
  });
  return result.projection || null;
}

export interface VersionComparison {
  oldest_month: string;
  latest_month: string;
  before: {
    checkins: number;
    badges: number;
    xp: number;
    level: number;
  };
  after: {
    checkins: number;
    badges: number;
    xp: number;
    level: number;
  };
  deltas: {
    checkins: number;
    badges: number;
    xp: number;
    level: number;
  };
}

export async function getVersionComparison(): Promise<VersionComparison | null> {
  const result = await callRetentionFunction<{ comparison: VersionComparison }>('retention-projection', {
    action: 'getVersionComparison',
  });
  return result.comparison || null;
}

// ============================================================================
// SOCIAL PROOF
// ============================================================================

export interface SocialProof {
  active_today: number;
  active_this_week: number;
  my_rank: number;
  top_active: {
    user_id: string;
    name: string;
    last_active: string;
    score: number;
  }[];
}

export async function getSocialProof(): Promise<SocialProof> {
  const result = await callRetentionFunction<{ social_proof: SocialProof }>('retention-circle', {
    action: 'getSocialProof',
  });
  return result.social_proof || { active_today: 0, active_this_week: 0, my_rank: 0, top_active: [] };
}

export async function updateActivity(): Promise<void> {
  await callRetentionFunction('retention-circle', {
    action: 'updateActivity',
  });
}

export interface InactivityAlert {
  user_id: string;
  name: string;
  days_inactive: number;
  last_active: string;
  message: string;
}

export async function getInactivityAlerts(): Promise<InactivityAlert[]> {
  const result = await callRetentionFunction<{ inactive_alerts: InactivityAlert[] }>('retention-circle', {
    action: 'getInactivityAlerts',
  });
  return result.inactive_alerts || [];
}

export interface Leaderboard {
  top_20: {
    rank: number;
    user_id: string;
    name: string;
    score: number;
    is_me: boolean;
  }[];
  my_rank: number;
  my_score: number;
}

export async function getLeaderboard(): Promise<Leaderboard> {
  const result = await callRetentionFunction<{ leaderboard: Leaderboard }>('retention-circle', {
    action: 'getLeaderboard',
  });
  return result.leaderboard || { top_20: [], my_rank: 0, my_score: 0 };
}

// ============================================================================
// SEASONAL EVENTS
// ============================================================================

export interface SeasonalEvent {
  id: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  event_name: string;
  description: string;
  start_date: string;
  end_date: string;
  xp_bonus: number;
  badge_id?: string;
}

export async function getActiveSeasonalEvent(): Promise<SeasonalEvent | null> {
  const result = await callRetentionFunction<{ event: SeasonalEvent | null }>('seasonal-events', {
    action: 'get_active',
  });
  return result.event;
}

// ============================================================================
// SECRET BADGES
// ============================================================================

export interface PhaseContent {
  id: string;
  phase: string;
  content_type: string;
  title: string;
  description: string;
  xp_reward: number;
}

export async function checkSecretBadges(): Promise<string[]> {
  const result = await callRetentionFunction<{ badges: string[] }>('seasonal-events', {
    action: 'check_badges',
  });
  return result.badges || [];
}

export async function getPhaseContent(): Promise<{ phase: string; content: PhaseContent[] }> {
  const result = await callRetentionFunction<{ phase: string; content: PhaseContent[] }>('seasonal-events', {
    action: 'get_phase_content',
  });
  return result || { phase: 'unknown', content: [] };
}
