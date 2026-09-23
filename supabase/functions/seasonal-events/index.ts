import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, user_id } = await req.json();

    if (action === 'get_active') {
      // Get current active seasonal event
      const now = new Date().toISOString();
      const { data: event, error } = await supabase
        .from('seasonal_events')
        .select('*')
        .lte('start_date', now)
        .gte('end_date', now)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ event }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_badges') {
      // Check and award secret badges based on conditions
      const badges = [];
      const now = new Date();
      const todayIso = now.toISOString();
      const todayDate = todayIso.split('T')[0];

      // Check Night Owl badge (check-in after 11 PM)
      const { data: nightCheckin } = await supabase
        .from('yayika_cycle_logs')
        .select('logged_at')
        .eq('user_id', user_id)
        .gte('logged_at', `${todayDate}T23:00:00`);

      if (nightCheckin && nightCheckin.length > 0) {
        const { error } = await supabase
          .from('yayika_user_badges')
          .upsert({ user_id, badge_id: 'badge_night_owl' }, { onConflict: 'user_id,badge_id' });
        
        if (!error) badges.push('badge_night_owl');
      }

      // Check Early Bird badge (check-in before 6 AM)
      const { data: earlyCheckin } = await supabase
        .from('yayika_cycle_logs')
        .select('logged_at')
        .eq('user_id', user_id)
        .lt('logged_at', `${todayDate}T06:00:00`);

      if (earlyCheckin && earlyCheckin.length > 0) {
        const { error } = await supabase
          .from('yayika_user_badges')
          .upsert({ user_id, badge_id: 'badge_early_bird' }, { onConflict: 'user_id,badge_id' });
        
        if (!error) badges.push('badge_early_bird');
      }

      // Check Perfectionist badge (7 day streak)
      const { data: progress } = await supabase
        .from('yayika_progress')
        .select('streak_days, xp_total')
        .eq('user_id', user_id)
        .maybeSingle();

      if (progress && (progress.streak_days || 0) >= 7) {
        const { error } = await supabase
          .from('yayika_user_badges')
          .upsert({ user_id, badge_id: 'badge_perfectionist' }, { onConflict: 'user_id,badge_id' });
        
        if (!error) badges.push('badge_perfectionist');
      }

      // Check Legend badge (30 day streak)
      if (progress && (progress.streak_days || 0) >= 30) {
        const { error } = await supabase
          .from('yayika_user_badges')
          .upsert({ user_id, badge_id: 'badge_streak_30' }, { onConflict: 'user_id,badge_id' });
        
        if (!error) badges.push('badge_streak_30');
      }

      // Check Master badge (1000 XP)
      if (progress && (progress.xp_total || 0) >= 1000) {
        const { error } = await supabase
          .from('yayika_user_badges')
          .upsert({ user_id, badge_id: 'badge_xp_1000' }, { onConflict: 'user_id,badge_id' });
        
        if (!error) badges.push('badge_xp_1000');
      }

      return new Response(
        JSON.stringify({ badges }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'get_phase_content') {
      // Get content for current cycle phase
      const { data: cycleData } = await supabase
        .from('yayika_cycle_logs')
        .select('logged_at')
        .eq('user_id', user_id)
        .order('logged_at', { ascending: false })
        .limit(1)
        .single();

      if (!cycleData) {
        return new Response(
          JSON.stringify({ content: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const lastPeriod = new Date(cycleData.logged_at);
      const now = new Date();
      const daysSincePeriod = Math.floor((now.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
      const cycleDay = (daysSincePeriod % 28) + 1;

      let phase = '';
      if (cycleDay <= 5) phase = 'menstrual';
      else if (cycleDay <= 13) phase = 'follicular';
      else if (cycleDay <= 16) phase = 'ovulatory';
      else phase = 'luteal';

      const { data: content, error } = await supabase
        .from('phase_content')
        .select('*')
        .eq('phase', phase)
        .eq('is_active', true);

      if (error) throw error;

      return new Response(
        JSON.stringify({ phase, content }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
