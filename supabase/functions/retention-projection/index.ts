import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "getProjection":
        return await getProjection(supabase, user.id);
      case "getVersionComparison":
        return await getVersionComparison(supabase, user.id);
      case "getInactivityImpact":
        return await getInactivityImpact(supabase, user.id);
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ============================================================================
// GET PROJECTION: Future Self Portal
// ============================================================================

async function getProjection(supabase: any, userId: string) {
  // Get current state
  const { data: progress } = await supabase
    .from("yayika_progress")
    .select("xp_total, streak_days, level")
    .eq("user_id", userId)
    .single();

  const { data: badges } = await supabase
    .from("yayika_xp_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "badge");

  const { data: challenges } = await supabase
    .from("yayika_user_challenges")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed");

  const currentXp = progress?.xp_total || 0;
  const currentLevel = Math.floor(currentXp / 100) + 1;
  const currentBadges = badges?.count || 0;
  const currentChallenges = challenges?.count || 0;

  // Calculate projection for 30 days (assuming daily check-in)
  const projectedXp = currentXp + (30 * 12); // 12 XP avg per day (10 + bonuses)
  const projectedLevel = Math.floor(projectedXp / 100) + 1;
  const projectedBadges = currentBadges + Math.floor(Math.random() * 3) + 2; // 2-4 new badges

  // Calculate what could be lost
  const potentialXpLoss = 30 * 10; // 30 days * 10 XP = 300 XP
  const potentialLevelLoss = currentLevel - Math.floor((currentXp - potentialXpLoss) / 100 + 1);

  // Get transform history for comparison
  const { data: history } = await supabase
    .from("yayika_transform_history")
    .select("month_date, data_snapshot, level_at_month")
    .eq("user_id", userId)
    .order("month_date", { ascending: false })
    .limit(3);

  // Build projection
  const projection = {
    current: {
      level: currentLevel,
      xp: currentXp,
      badges: currentBadges,
      challenges: currentChallenges,
      streak: progress?.streak_days || 0,
    },
    future_30_days: {
      level: projectedLevel,
      xp: projectedXp,
      badges: projectedBadges,
      challenges: currentChallenges + Math.floor(Math.random() * 5) + 3,
      streak: (progress?.streak_days || 0) + 30,
    },
    if_cancel: {
      level: currentLevel,
      xp: currentXp,
      badges: currentBadges,
      streak: 0,
      message: `Perderías ${(progress?.streak_days || 0)} días de racha y no podrías desbloquear nuevos badges.`,
    },
    history_comparison: history || [],
  };

  // Save projection
  const today = new Date().toISOString().split("T")[0];
  await supabase
    .from("yayika_future_self")
    .upsert(
      {
        user_id: userId,
        projection_date: today,
        current_level: currentLevel,
        projected_level: projectedLevel,
        current_badges: currentBadges,
        projected_badges: projectedBadges,
        current_xp: currentXp,
        projected_xp: projectedXp,
        goals: [
          { id: "level_up", title: `Subir al nivel ${projectedLevel}`, achieved: false },
          { id: "badges", title: `Desbloquear ${projectedBadges - currentBadges} badges nuevos`, achieved: false },
          { id: "streak", title: `Mantener racha de 30 días`, achieved: false },
        ],
        achieved_goals: [],
      },
      { onConflict: "user_id,projection_date" }
    );

  return new Response(JSON.stringify({ projection }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// VERSION COMPARISON: Before vs After
// ============================================================================

async function getVersionComparison(supabase: any, userId: string) {
  // Get oldest transform history
  const { data: oldest } = await supabase
    .from("yayika_transform_history")
    .select("*")
    .eq("user_id", userId)
    .order("month_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Get latest transform history
  const { data: latest } = await supabase
    .from("yayika_transform_history")
    .select("*")
    .eq("user_id", userId)
    .order("month_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!oldest || !latest) {
    return new Response(JSON.stringify({
      comparison: null,
      message: "Necesitas al menos 1 mes de uso para ver tu transformación.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const comparison = {
    oldest_month: oldest.month_date,
    latest_month: latest.month_date,
    before: {
      checkins: oldest.data_snapshot?.checkins || 0,
      badges: oldest.data_snapshot?.badges || 0,
      challenges: oldest.data_snapshot?.challenges || 0,
      xp: oldest.data_snapshot?.xp || 0,
      level: oldest.level_at_month || 1,
    },
    after: {
      checkins: latest.data_snapshot?.checkins || 0,
      badges: latest.data_snapshot?.badges || 0,
      challenges: latest.data_snapshot?.challenges || 0,
      xp: latest.data_snapshot?.xp || 0,
      level: latest.level_at_month || 1,
    },
    deltas: {
      checkins: (latest.data_snapshot?.checkins || 0) - (oldest.data_snapshot?.checkins || 0),
      badges: (latest.data_snapshot?.badges || 0) - (oldest.data_snapshot?.badges || 0),
      challenges: (latest.data_snapshot?.challenges || 0) - (oldest.data_snapshot?.challenges || 0),
      xp: (latest.data_snapshot?.xp || 0) - (oldest.data_snapshot?.xp || 0),
      level: (latest.level_at_month || 1) - (oldest.level_at_month || 1),
    },
  };

  return new Response(JSON.stringify({ comparison }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// INACTIVITY IMPACT: What you're losing
// ============================================================================

async function getInactivityImpact(supabase: any, userId: string) {
  const { data: activity } = await supabase
    .from("yayika_circle_activity")
    .select("last_active_at")
    .eq("user_id", userId)
    .single();

  const { data: progress } = await supabase
    .from("yayika_progress")
    .select("xp_total, streak_days")
    .eq("user_id", userId)
    .single();

  const lastActive = activity ? new Date(activity.last_active_at) : new Date();
  const now = new Date();
  const daysInactive = Math.floor((now.getTime() - lastActive.getTime()) / 86400000);

  const impact = {
    days_inactive: daysInactive,
    potential_xp_loss: daysInactive * 10,
    current_streak: progress?.streak_days || 0,
    streak_will_reset: daysInactive >= 1,
    potential_badge_loss: daysInactive >= 3,
    message: daysInactive >= 3
      ? `Llevas ${daysInactive} días sin actividad. Si continúas así, perderás tu racha de ${progress?.streak_days || 0} días y no podrás desbloquear badges nuevos.`
      : daysInactive >= 1
      ? `Hoy no has hecho check-in. Tu racha de ${progress?.streak_days || 0} días está en riesgo.`
      : "¡Sigue así! Estás activa y construyendo tu mejor versión.",
    severity: daysInactive >= 7 ? "critical" : daysInactive >= 3 ? "high" : daysInactive >= 1 ? "medium" : "low",
  };

  return new Response(JSON.stringify({ impact }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
