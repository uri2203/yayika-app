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
      case "dailyCheckin":
        return await dailyCheckin(supabase, user.id, body);
      case "getSpinResult":
        return await getSpinResult(supabase, user.id);
      case "getTransformHistory":
        return await getTransformHistory(supabase, user.id);
      case "getCircleActivity":
        return await getCircleActivity(supabase, user.id);
      case "getCycleReward":
        return await getCycleReward(supabase, user.id, body.cycleDay);
      case "claimCycleReward":
        return await claimCycleReward(supabase, user.id, body.rewardId, body.cycleId);
      case "getLossWarning":
        return await getLossWarning(supabase, user.id);
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
// DAILY CHECK-IN: Streak + XP + Rueda + Transformación
// ============================================================================

async function dailyCheckin(supabase: any, userId: string, body: any) {
  const today = new Date().toISOString().split("T")[0];
  const { mood, energy, notes } = body;

  // 1. Check if already checked in today
  const { data: existing } = await supabase
    .from("yayika_checkins")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", `${today}T00:00:00`)
    .lt("created_at", `${today}T23:59:59`)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ error: "Already checked in today" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 2. Insert check-in
  const { error: checkinError } = await supabase
    .from("yayika_checkins")
    .insert({
      user_id: userId,
      checkin_type: "daily",
      mood: mood || null,
      energy: energy || null,
      notes: notes || null,
    });

  if (checkinError) throw checkinError;

  // 3. Update streak
  const { data: progress } = await supabase
    .from("yayika_progress")
    .select("streak_days, xp_total")
    .eq("user_id", userId)
    .single();

  const { data: lastCheckin } = await supabase
    .from("yayika_checkins")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(2)
    .maybeSingle();

  let newStreak = 1;
  if (lastCheckin) {
    const lastDate = new Date(lastCheckin.created_at).toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (lastDate === yesterday) {
      newStreak = (progress?.streak_days || 0) + 1;
    }
  }

  // 4. Add XP (10 base + streak bonus)
  const streakBonus = Math.min(Math.floor(newStreak / 7) * 2, 10); // +2 per week, max +10
  const xpEarned = 10 + streakBonus;

  await supabase.from("yayika_xp_events").insert({
    user_id: userId,
    event_type: "daily_checkin",
    xp_amount: xpEarned,
    metadata: { streak: newStreak, mood, energy },
  });

  // 5. Update progress
  await supabase
    .from("yayika_progress")
    .update({
      streak_days: newStreak,
      xp_total: (progress?.xp_total || 0) + xpEarned,
    })
    .eq("user_id", userId);

  // 6. Update circle activity
  await supabase
    .from("yayika_circle_activity")
    .upsert(
      {
        user_id: userId,
        last_active_at: new Date().toISOString(),
        activity_score: (progress?.xp_total || 0) + xpEarned,
      },
      { onConflict: "user_id" }
    );

  // 7. Spin the reward wheel
  const spinResult = await generateSpinResult(supabase, userId);

  // 8. Update transform history for current month
  await updateTransformHistory(supabase, userId);

  // 9. Check cycle reward
  const cycleDay = await getCurrentCycleDay(supabase, userId);
  const cycleReward = cycleDay ? await checkCycleReward(supabase, userId, cycleDay) : null;

  return new Response(JSON.stringify({
    success: true,
    xp_earned: xpEarned,
    streak: newStreak,
    spin_result: spinResult,
    cycle_reward: cycleReward,
    level: Math.floor(((progress?.xp_total || 0) + xpEarned) / 100) + 1,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// REWARD WHEEL: Variable Ratio Reinforcement
// ============================================================================

async function generateSpinResult(supabase: any, userId: string) {
  const today = new Date().toISOString().split("T")[0];

  // Check if already spun today
  const { data: existing } = await supabase
    .from("yayika_reward_spins")
    .select("id")
    .eq("user_id", userId)
    .eq("spin_date", today)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { already_spun: true };
  }

  // Weighted random selection
  const rand = Math.random() * 100;
  let result: any;

  if (rand < 35) {
    // 35% - Low XP (5-10)
    result = { type: "xp", value: Math.floor(Math.random() * 6) + 5, is_special: false };
  } else if (rand < 60) {
    // 25% - Medium XP (15-20)
    result = { type: "xp", value: Math.floor(Math.random() * 6) + 15, is_special: false };
  } else if (rand < 75) {
    // 15% - High XP (25-35)
    result = { type: "xp", value: Math.floor(Math.random() * 11) + 25, is_special: true };
  } else if (rand < 85) {
    // 10% - Streak boost (+3 days)
    result = { type: "streak_boost", value: 3, is_special: true };
  } else if (rand < 92) {
    // 7% - Secret badge
    const secretBadges = ["early_bird", "night_owl", "lucky_star", "moon_child", "sun_warrior"];
    result = { type: "badge", value: secretBadges[Math.floor(Math.random() * secretBadges.length)], is_special: true };
  } else if (rand < 97) {
    // 5% - Content unlock (1 day premium)
    result = { type: "content", value: "1_day_premium", is_special: true };
  } else {
    // 3% - Jackpot (XP x3 multiplier for next check-in)
    result = { type: "multiplier", value: 3, is_special: true };
  }

  // Insert spin result
  await supabase.from("yayika_reward_spins").insert({
    user_id: userId,
    result_type: result.type,
    result_value: typeof result.value === "number" ? result.value : 0,
    result_data: result,
    xp_awarded: result.type === "xp" ? result.value : 0,
    badge_key: result.type === "badge" ? result.value : null,
    content_unlocked: result.type === "content" ? result.value : null,
    is_special: result.is_special,
  });

  // Apply XP if applicable
  if (result.type === "xp") {
    const { data: progress } = await supabase
      .from("yayika_progress")
      .select("xp_total")
      .eq("user_id", userId)
      .single();

    await supabase
      .from("yayika_progress")
      .update({ xp_total: (progress?.xp_total || 0) + result.value })
      .eq("user_id", userId);

    await supabase.from("yayika_xp_events").insert({
      user_id: userId,
      event_type: "reward_wheel_xp",
      xp_amount: result.value,
      metadata: { source: "reward_wheel" },
    });
  }

  // Apply streak boost if applicable
  if (result.type === "streak_boost") {
    const { data: progress } = await supabase
      .from("yayika_progress")
      .select("streak_days")
      .eq("user_id", userId)
      .single();

    await supabase
      .from("yayika_progress")
      .update({ streak_days: (progress?.streak_days || 0) + result.value })
      .eq("user_id", userId);
  }

  return { already_spun: false, ...result };
}

// ============================================================================
// CYCLE REWARDS: Urgency of the Exact Day
// ============================================================================

async function getCurrentCycleDay(supabase: any, userId: string) {
  const { data: logs } = await supabase
    .from("yayika_cycle_log")
    .select("cycle_day, logged_at")
    .eq("user_id", userId)
    .order("logged_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!logs?.cycle_day) return null;
  return logs.cycle_day;
}

async function checkCycleReward(supabase: any, userId: string, cycleDay: number) {
  const { data: reward } = await supabase
    .from("yayika_cycle_rewards")
    .select("*")
    .eq("cycle_day", cycleDay)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  if (!reward) return null;

  // Check if already claimed
  const { data: claimed } = await supabase
    .from("yayika_user_cycle_rewards")
    .select("id")
    .eq("user_id", userId)
    .eq("reward_id", reward.id)
    .limit(1)
    .maybeSingle();

  return {
    ...reward,
    already_claimed: !!claimed,
  };
}

async function claimCycleReward(supabase: any, userId: string, rewardId: string, cycleId: string) {
  // Check if already claimed
  const { data: existing } = await supabase
    .from("yayika_user_cycle_rewards")
    .select("id")
    .eq("user_id", userId)
    .eq("reward_id", rewardId)
    .eq("cycle_id", cycleId)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return new Response(JSON.stringify({ error: "Already claimed" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get reward details
  const { data: reward } = await supabase
    .from("yayika_cycle_rewards")
    .select("*")
    .eq("id", rewardId)
    .single();

  if (!reward) {
    return new Response(JSON.stringify({ error: "Reward not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Insert claim
  await supabase.from("yayika_user_cycle_rewards").insert({
    user_id: userId,
    reward_id: rewardId,
    cycle_id: cycleId,
  });

  // Award XP if applicable
  if (reward.reward_xp > 0) {
    const { data: progress } = await supabase
      .from("yayika_progress")
      .select("xp_total")
      .eq("user_id", userId)
      .single();

    await supabase
      .from("yayika_progress")
      .update({ xp_total: (progress?.xp_total || 0) + reward.reward_xp })
      .eq("user_id", userId);

    await supabase.from("yayika_xp_events").insert({
      user_id: userId,
      event_type: "cycle_reward",
      xp_amount: reward.reward_xp,
      metadata: { reward_title: reward.reward_title, cycle_day: reward.cycle_day },
    });
  }

  return new Response(JSON.stringify({ success: true, reward }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getCycleReward(supabase: any, userId: string, cycleDay: number) {
  const reward = await checkCycleReward(supabase, userId, cycleDay);
  return new Response(JSON.stringify({ reward }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// TRANSFORM HISTORY: The Time Mirror
// ============================================================================

async function updateTransformHistory(supabase: any, userId: string) {
  const now = new Date();
  const monthDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  // Count current month data
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

  const [checkins, badges, challenges, cycles, transactions] = await Promise.all([
    supabase.from("yayika_checkins").select("id", { count: "exact", head: true })
      .eq("user_id", userId).gte("created_at", monthStart).lte("created_at", monthEnd),
    supabase.from("yayika_xp_events").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("event_type", "badge").gte("created_at", monthStart),
    supabase.from("yayika_user_challenges").select("id", { count: "exact", head: true })
      .eq("user_id", userId).eq("status", "completed").gte("completed_at", monthStart),
    supabase.from("yayika_cycle_log").select("id", { count: "exact", head: true })
      .eq("user_id", userId).gte("logged_at", monthStart),
    supabase.from("yayika_transactions").select("id", { count: "exact", head: true })
      .eq("user_id", userId).gte("created_at", monthStart),
  ]);

  const { data: progress } = await supabase
    .from("yayika_progress")
    .select("xp_total, streak_days")
    .eq("user_id", userId)
    .single();

  const level = Math.floor((progress?.xp_total || 0) / 100) + 1;

  // Get previous month for comparison
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const { data: prevHistory } = await supabase
    .from("yayika_transform_history")
    .select("*")
    .eq("user_id", userId)
    .gte("month_date", prevMonth)
    .lt("month_date", monthStart)
    .limit(1)
    .maybeSingle();

  const currentData = {
    checkins: checkins.count || 0,
    badges: badges.count || 0,
    challenges: challenges.count || 0,
    cycles: cycles.count || 0,
    transactions: transactions.count || 0,
    xp: progress?.xp_total || 0,
    streak: progress?.streak_days || 0,
    level,
  };

  const comparison = prevHistory ? {
    checkins_delta: currentData.checkins - (prevHistory.data_snapshot?.checkins || 0),
    badges_delta: currentData.badges - (prevHistory.data_snapshot?.badges || 0),
    challenges_delta: currentData.challenges - (prevHistory.data_snapshot?.challenges || 0),
    xp_delta: currentData.xp - (prevHistory.data_snapshot?.xp || 0),
    level_delta: currentData.level - (prevHistory.level_at_month || 1),
  } : {};

  await supabase
    .from("yayika_transform_history")
    .upsert(
      {
        user_id: userId,
        month_date: monthDate,
        xp_earned: currentData.xp,
        checkins_count: currentData.checkins,
        badges_earned: currentData.badges,
        challenges_completed: currentData.challenges,
        cycle_logs_count: currentData.cycles,
        transactions_count: currentData.transactions,
        streak_days: currentData.streak,
        level_at_month: level,
        data_snapshot: currentData,
        comparison,
      },
      { onConflict: "user_id,month_date" }
    );
}

async function getTransformHistory(supabase: any, userId: string) {
  const { data: history } = await supabase
    .from("yayika_transform_history")
    .select("*")
    .eq("user_id", userId)
    .order("month_date", { ascending: false })
    .limit(6);

  return new Response(JSON.stringify({ history: history || [] }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// CIRCLE ACTIVITY: Social Pressure
// ============================================================================

async function getCircleActivity(supabase: any, userId: string) {
  const { data: activity } = await supabase
    .from("yayika_circle_activity")
    .select("*")
    .eq("user_id", userId)
    .single();

  // Get other active users (for social proof)
  const { data: otherActive } = await supabase
    .from("yayika_circle_activity")
    .select("user_id, last_active_at, activity_score")
    .neq("user_id", userId)
    .eq("is_visible", true)
    .order("last_active_at", { ascending: false })
    .limit(10);

  return new Response(JSON.stringify({
    my_activity: activity,
    others_active: otherActive || [],
    total_active: otherActive?.length || 0,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// LOSS WARNING: The Pain Seed
// ============================================================================

async function getLossWarning(supabase: any, userId: string) {
  const { data: activity } = await supabase
    .from("yayika_circle_activity")
    .select("last_active_at")
    .eq("user_id", userId)
    .single();

  if (!activity) {
    return new Response(JSON.stringify({ warning: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const lastActive = new Date(activity.last_active_at);
  const now = new Date();
  const daysInactive = Math.floor((now.getTime() - lastActive.getTime()) / 86400000);

  if (daysInactive < 2) {
    return new Response(JSON.stringify({ warning: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: progress } = await supabase
    .from("yayika_progress")
    .select("streak_days, xp_total")
    .eq("user_id", userId)
    .single();

  const { data: badges } = await supabase
    .from("yayika_xp_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "badge");

  const warning = {
    days_inactive: daysInactive,
    streak_at_risk: progress?.streak_days || 0,
    xp_at_risk: daysInactive * 10, // Potential XP lost
    badges_at_risk: badges?.count || 0,
    message: daysInactive >= 7
      ? `Llevas ${daysInactive} días sin actividad. Tu racha de ${progress?.streak_days || 0} días está en peligro.`
      : `Llevas ${daysInactive} días sin actividad. Tus ${progress?.streak_days || 0} días de racha podrían perderse.`,
    severity: daysInactive >= 7 ? "high" : daysInactive >= 3 ? "medium" : "low",
  };

  // Log the warning
  await supabase.from("yayika_loss_warnings").insert({
    user_id: userId,
    warning_type: "inactivity",
    days_inactive: daysInactive,
    streak_at_risk: progress?.streak_days || 0,
    data_at_risk: { xp: progress?.xp_total || 0, badges: badges?.count || 0 },
  });

  return new Response(JSON.stringify({ warning }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
