import { supabase } from './supabase';

const SUPABASE_URL = 'https://odbhxiymteppgaqqdsoy.supabase.co';
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function callFunction<T = any>(
  name: string,
  body: Record<string, any>,
  requireAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYmh4aXltdGVwcGdhcXFkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwOTc1NjUsImV4cCI6MjA5NTY3MzU2NX0.-AMG1zoszc05NJjAkXmm7kCZJuN3RA2OIzZRs221gkc',
  };

  const token = await getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  else if (requireAuth) throw new Error('Authentication required');

  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Function ${name} failed`);
  return data as T;
}

// ──── AI Chat ────────────────────────────────────────
export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

export async function aiChat(messages: ChatMessage[], lang = 'es') {
  return callFunction<{ choices: { message: { content: string } }[] }>(
    'ai-chat', { messages, lang }
  );
}

// ──── AI Cycle Coach ─────────────────────────────────
export interface CycleCoachParams {
  user_id: string;
  cycle_phase?: string;
  cycle_day?: number;
  energy_level?: number;
  mood?: string;
  symptoms?: string[];
  recent_logs?: { log_date: string; energy?: number; mood?: string; symptoms?: string[] }[];
  lang?: string;
}

export async function aiCycleCoach(params: CycleCoachParams) {
  return callFunction<{ coaching: string; phase: string; day: number | null; lang: string; source?: string }>(
    'ai-cycle-coach', params
  );
}

// ──── AI Cycle Intelligence ──────────────────────────
export interface CycleDashboard {
  analytics: { total_cycles: number; avg_cycle_length: number; regularity_score: number };
  patterns: { phase: string; avg_energy: number; sample_size: number }[];
  recent_cycles: { cycle_length: number }[];
  predictions: { period_start: string; ovulation: string; days_remaining: number };
  insights: string[];
  translations: Record<string, string>;
}

export async function aiCycleIntelligence(lang = 'es') {
  return callFunction<{ success: boolean; dashboard: CycleDashboard }>(
    'ai-cycle-intelligence', { action: 'getDashboard', lang }, true
  );
}

// ──── AI Financial Coach ─────────────────────────────
export interface FinancialCoachParams {
  user_id: string;
  cycle_phase?: string;
  transactions?: { type: 'expense' | 'income'; amount: number; category?: string; date: string }[];
  monthly_summary?: {
    totalIncome: number;
    totalExpenses: number;
    topCategories?: { name: string; total: number; percentage: number }[];
  };
  lang?: string;
}

export async function aiFinancialCoach(params: FinancialCoachParams) {
  return callFunction<{ advice: string; lang: string }>(
    'ai-financial-coach', params
  );
}

// ──── Weekly Challenges ──────────────────────────────
export async function aiWeeklyChallenges(lang = 'es') {
  return callFunction<{
    success: boolean;
    available: any[];
    active: any[];
    completed: any[];
    stats: any;
    translations: Record<string, string>;
  }>('ai-weekly-challenges', { action: 'getWeeklyChallenges', lang }, true);
}

export async function enrollChallenge(challengeId: string) {
  return callFunction('ai-weekly-challenges', { action: 'enroll', challenge_id: challengeId }, true);
}

export async function checkinChallenge(enrollmentId: string, notes?: string) {
  return callFunction('ai-weekly-challenges', { action: 'checkin', enrollment_id: enrollmentId, notes }, true);
}

// ──── Affirmations ───────────────────────────────────
export interface AffirmationParams {
  user_id: string;
  cycle_phase?: string;
  energy_level?: number;
  mood?: string;
  intention?: string;
  lang?: string;
  recent_affirmations?: string[];
}

export async function aiAffirmations(params: AffirmationParams) {
  return callFunction<{ affirmation: string; type: string; phase?: string; lang: string; cached: boolean }>(
    'ai-affirmations', params
  );
}

// ──── Wellness Planner ───────────────────────────────
export interface WellnessParams {
  cycle_phase?: string;
  energy_level?: number;
  mood?: string;
  symptoms?: string[];
  lang?: string;
}

export async function aiWellnessPlanner(params: WellnessParams) {
  return callFunction<{
    plan: {
      meals: { name: string; description: string; icon: string }[];
      exercise: { name: string; duration: string; why: string }[];
      tip: string;
    };
    lang: string;
  }>('ai-wellness-planner', params);
}

// ──── AI Smart Push ──────────────────────────────────
export interface SmartPushParams {
  user_id: string;
  cycle_phase?: string;
  cycle_day?: number;
  energy_level?: number;
  mood?: string;
  last_checkin?: string;
  streak_days?: number;
  lang?: string;
}

export async function aiSmartPush(params: SmartPushParams) {
  return callFunction<{
    notification: { title: string; body: string; data?: Record<string, any> } | null;
  }>('ai-smart-push', params, true);
}

// ──── Product Catalog ────────────────────────────────
export async function getProductCatalog(category?: string) {
  return callFunction<{
    success: boolean;
    products: any[];
    grouped: Record<string, any[]>;
    translations: Record<string, string>;
  }>('ai-product-catalog', { action: 'getCatalog', category });
}

export async function getMyProducts() {
  return callFunction<{
    success: boolean;
    products: any[];
    translations: Record<string, string>;
  }>('ai-product-catalog', { action: 'getMyProducts' }, true);
}

export async function getProductDetail(productId: string) {
  return callFunction<{
    success: boolean;
    product: any;
    lessons: any[];
    hasAccess: boolean;
    progressPct: number;
    translations: Record<string, string>;
  }>('ai-product-catalog', { action: 'getProductDetail', product_id: productId }, true);
}

// ──── Onboarding ─────────────────────────────────────
export async function getOnboardingState(userId: string) {
  return callFunction<{
    state: {
      current_day: number;
      started_at: string;
      is_completed: boolean;
      total_xp_earned: number;
      completed_days: number;
      total_days: 7;
      days_data: { day: number; task_key: string; completed: boolean; xp_earned: number }[];
      current_task: any;
    } | null;
    showOnboarding: boolean;
  }>('ai-onboarding', { action: 'getState', user_id: userId });
}

export async function completeOnboardingDay(userId: string, dayNumber: number) {
  return callFunction<{
    ok: boolean;
    day: number;
    xp_earned: number;
    badge_key: string;
    completed_days: number;
    total_days: 7;
    is_all_done: boolean;
    next_day: number;
  }>('ai-onboarding', { action: 'completeDay', user_id: userId, day_number: dayNumber });
}

export async function skipOnboarding(userId: string) {
  return callFunction('ai-onboarding', { action: 'skip', user_id: userId });
}

// ──── Community ──────────────────────────────────────
export async function getCommunityFeed(categorySlug?: string, limit = 20, offset = 0) {
  return callFunction<{ posts: any[] }>(
    'ai-community', { action: 'getFeed', category_slug: categorySlug, limit, offset }, true
  );
}

export async function createPost(content: string, categorySlug = 'logros') {
  return callFunction<{ post_id: string }>(
    'ai-community', { action: 'createPost', content, category_slug: categorySlug }, true
  );
}

export async function toggleReaction(postId: string, reactionType = 'like') {
  return callFunction(
    'ai-community', { action: 'toggleReaction', post_id: postId, reaction_type: reactionType }, true
  );
}

export async function addComment(postId: string, content: string) {
  return callFunction<{ comment_id: string }>(
    'ai-community', { action: 'addComment', post_id: postId, content }, true
  );
}

export async function getCommunityNotifications() {
  return callFunction<{ notifications: any[]; unread_count: number }>(
    'ai-community', { action: 'getNotifications' }, true
  );
}

export async function getCommunityCategories() {
  return callFunction<{ categories: any[] }>(
    'ai-community', { action: 'getCategories' }, true
  );
}

// ──── Direct Supabase Queries ────────────────────────
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('yayika_profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getProgress(userId: string) {
  const { data, error } = await supabase
    .from('yayika_progress')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function getCycleLog(userId: string, limit = 28) {
  const { data, error } = await supabase
    .from('yayika_cycle_log')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function upsertCycleLog(userId: string, logDate: string, entry: Record<string, any>) {
  const { data, error } = await supabase
    .from('yayika_cycle_log')
    .upsert({ user_id: userId, log_date: logDate, ...entry }, { onConflict: 'user_id,log_date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTransactions(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('yayika_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function addTransaction(userId: string, tx: { type: string; amount: number; category?: string; date: string }) {
  const { data, error } = await supabase
    .from('yayika_transactions')
    .insert({ user_id: userId, ...tx })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getXpEvents(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('yayika_xp_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function addXpEvent(userId: string, eventType: string, xpAmount: number) {
  const { data, error } = await supabase
    .from('yayika_xp_events')
    .insert({ user_id: userId, event_type: eventType, xp_amount: xpAmount })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getCheckins(userId: string) {
  const { data, error } = await supabase
    .from('yayika_checkins')
    .select('*')
    .eq('user_id', userId)
    .order('checkin_date', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data;
}

export async function addCheckin(userId: string) {
  const { data, error } = await supabase
    .from('yayika_checkins')
    .insert({ user_id: userId, checkin_date: new Date().toISOString().split('T')[0] })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDailyMood(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('yayika_daily_mood')
    .select('*')
    .eq('user_id', userId)
    .eq('check_date', today)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertDailyMood(userId: string, mood: Record<string, any>) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('yayika_daily_mood')
    .upsert({ user_id: userId, check_date: today, ...mood }, { onConflict: 'user_id,check_date' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSubscriptions(userId: string) {
  const { data, error } = await supabase
    .from('yayika_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function getAffiliate(userId: string) {
  const { data, error } = await supabase
    .from('yayika_affiliates')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}
