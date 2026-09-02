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

      // Check Night Owl badge (check-in after 11 PM)
      const { data: nightCheckin } = await supabase
        .from('retention_checkins')
        .select('logged_at')
        .eq('user_id', user_id)
        .extract('hour')
        .gte(23);

      if (nightCheckin && nightCheckin.length > 0) {
        const { error } = await supabase
          .from('user_badges')
          .upsert({ user_id, badge_id: 'badge_night_owl' }, { onConflict: 'user_id,badge_id' });
        
        if (!error) badges.push('badge_night_owl');
      }

      // Check Early Bird badge (check-in before 6 AM)
      const { data: earlyCheckin } = await supabase
        .from('retention_checkins')
        .select('logged_at')
        .eq('user_id', user_id)
        .extract('hour')
        .lt(6);

      if (earlyCheckin && earlyCheckin.length > 0) {
        const { error } = await supabase
          .from('user_badges')
          .upsert({ user_id, badge_id: 'badge_early_bird' }, { onConflict: 'user_id,badge_id' });
        
        if (!error) badges.push('badge_early_bird');
      }

      // Check Perfectionist badge (7 day streak)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('streak')
        .eq('user_id', user_id)
        .single();

      if (profile && profile.streak >= 7) {
        const { error } = await supabase
          .from('user_badges')
          .upsert({ user_id, badge_id: 'badge_perfectionist' }, { onConflict: 'user_id,badge_id' });
        
        if (!error) badges.push('badge_perfectionist');
      }

      // Check Legend badge (30 day streak)
      if (profile && profile.streak >= 30) {
        const { error } = await supabase
          .from('user_badges')
          .upsert({ user_id, badge_id: 'badge_streak_30' }, { onConflict: 'user_id,badge_id' });
        
        if (!error) badges.push('badge_streak_30');
      }

      // Check Master badge (1000 XP)
      const { data: xpData } = await supabase
        .from('user_profiles')
        .select('xp')
        .eq('user_id', user_id)
        .single();

      if (xpData && xpData.xp >= 1000) {
        const { error } = await supabase
          .from('user_badges')
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
        .from('cycle_entries')
        .select('start_date')
        .eq('user_id', user_id)
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      if (!cycleData) {
        return new Response(
          JSON.stringify({ content: [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const lastPeriod = new Date(cycleData.start_date);
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
