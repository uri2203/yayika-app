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
      case "getSocialProof":
        return await getSocialProof(supabase, user.id);
      case "updateActivity":
        return await updateActivity(supabase, user.id);
      case "getInactivityAlerts":
        return await getInactivityAlerts(supabase, user.id);
      case "getLeaderboard":
        return await getLeaderboard(supabase, user.id);
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
// SOCIAL PROOF: How many women are active
// ============================================================================

async function getSocialProof(supabase: any, userId: string) {
  // Count total active users (last 24h)
  const oneDayAgo = new Date(Date.now() - 86400000).toISOString();
  const { count: activeToday } = await supabase
    .from("yayika_circle_activity")
    .select("id", { count: "exact", head: true })
    .gte("last_active_at", oneDayAgo);

  // Count active this week
  const oneWeekAgo = new Date(Date.now() - 604800000).toISOString();
  const { count: activeWeek } = await supabase
    .from("yayika_circle_activity")
    .select("id", { count: "exact", head: true })
    .gte("last_active_at", oneWeekAgo);

  // Get user's activity
  const { data: myActivity } = await supabase
    .from("yayika_circle_activity")
    .select("last_active_at, activity_score")
    .eq("user_id", userId)
    .single();

  // Get user's rank by activity score
  const { data: myRank } = await supabase
    .from("yayika_circle_activity")
    .select("user_id")
    .gt("activity_score", myActivity?.activity_score || 0)
    .eq("is_visible", true);

  const rank = (myRank?.length || 0) + 1;

  // Get top 5 active users (for social comparison)
  const { data: topActive } = await supabase
    .from("yayika_circle_activity")
    .select("user_id, last_active_at, activity_score")
    .eq("is_visible", true)
    .order("activity_score", { ascending: false })
    .limit(5);

  // Get profiles for top users
  const topUserIds = topActive?.map((u: any) => u.user_id) || [];
  const { data: topProfiles } = await supabase
    .from("yayika_profiles")
    .select("id, full_name")
    .in("id", topUserIds);

  const profileMap = new Map(topProfiles?.map((p: any) => [p.id, p.full_name]) || []);

  const socialProof = {
    active_today: activeToday || 0,
    active_this_week: activeWeek || 0,
    my_rank: rank,
    my_last_active: myActivity?.last_active_at,
    top_active: topActive?.map((u: any) => ({
      user_id: u.user_id,
      name: profileMap.get(u.user_id) || "Guerrera",
      last_active: u.last_active_at,
      score: u.activity_score,
    })) || [],
    message: `${activeToday || 0} mujeres están activas ahora mismo.`,
  };

  return new Response(JSON.stringify({ social_proof: socialProof }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// UPDATE ACTIVITY: Track when user is active
// ============================================================================

async function updateActivity(supabase: any, userId: string) {
  const { data: progress } = await supabase
    .from("yayika_progress")
    .select("xp_total")
    .eq("user_id", userId)
    .single();

  await supabase
    .from("yayika_circle_activity")
    .upsert(
      {
        user_id: userId,
        last_active_at: new Date().toISOString(),
        activity_score: progress?.xp_total || 0,
        is_visible: true,
      },
      { onConflict: "user_id" }
    );

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// INACTIVITY ALERTS: Who in your circle is inactive
// ============================================================================

async function getInactivityAlerts(supabase: any, userId: string) {
  // Get users who were active but are now inactive (2-7 days)
  const twoDaysAgo = new Date(Date.now() - 172800000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 604800000).toISOString();

  const { data: inactiveUsers } = await supabase
    .from("yayika_circle_activity")
    .select("user_id, last_active_at, activity_score")
    .neq("user_id", userId)
    .eq("is_visible", true)
    .gte("last_active_at", sevenDaysAgo)
    .lt("last_active_at", twoDaysAgo)
    .order("last_active_at", { ascending: false })
    .limit(10);

  // Get profiles
  const userIds = inactiveUsers?.map((u: any) => u.user_id) || [];
  const { data: profiles } = await supabase
    .from("yayika_profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p.full_name]) || []);

  const alerts = inactiveUsers?.map((u: any) => {
    const lastActive = new Date(u.last_active_at);
    const daysInactive = Math.floor((Date.now() - lastActive.getTime()) / 86400000);
    return {
      user_id: u.user_id,
      name: profileMap.get(u.user_id) || "Guerrera",
      days_inactive: daysInactive,
      last_active: u.last_active_at,
      message: daysInactive >= 3
        ? `${profileMap.get(u.user_id) || "Una guerrera"} lleva ${daysInactive} días sin actividad.`
        : `${profileMap.get(u.user_id) || "Una guerrera"} no ha participado hoy.`,
    };
  }) || [];

  return new Response(JSON.stringify({ inactive_alerts: alerts }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// LEADERBOARD: Rankings with social comparison
// ============================================================================

async function getLeaderboard(supabase: any, userId: string) {
  // Get top 20 by activity score
  const { data: topUsers } = await supabase
    .from("yayika_circle_activity")
    .select("user_id, activity_score, last_active_at")
    .eq("is_visible", true)
    .order("activity_score", { ascending: false })
    .limit(20);

  const userIds = topUsers?.map((u: any) => u.user_id) || [];
  const { data: profiles } = await supabase
    .from("yayika_profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(profiles?.map((p: any) => [p.id, p.full_name]) || []);

  // Get user's position
  const { data: myActivity } = await supabase
    .from("yayika_circle_activity")
    .select("activity_score")
    .eq("user_id", userId)
    .single();

  const { data: betterUsers } = await supabase
    .from("yayika_circle_activity")
    .select("user_id")
    .gt("activity_score", myActivity?.activity_score || 0)
    .eq("is_visible", true);

  const myRank = (betterUsers?.length || 0) + 1;

  const leaderboard = {
    top_20: topUsers?.map((u: any, i: number) => ({
      rank: i + 1,
      user_id: u.user_id,
      name: profileMap.get(u.user_id) || "Guerrera",
      score: u.activity_score,
      last_active: u.last_active_at,
      is_me: u.user_id === userId,
    })) || [],
    my_rank: myRank,
    my_score: myActivity?.activity_score || 0,
  };

  return new Response(JSON.stringify({ leaderboard }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
