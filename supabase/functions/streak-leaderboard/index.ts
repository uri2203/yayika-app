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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, user_id, limit: queryLimit } = await req.json();
    const limit = queryLimit || 20;

    if (action === "get_streak_leaderboard") {
      const { data: progressRows, error } = await supabase
        .from("yayika_progress")
        .select("user_id, streak_days, xp_total")
        .gt("streak_days", 0)
        .order("streak_days", { ascending: false })
        .order("xp_total", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const userIds = (progressRows || []).map((r) => r.user_id);
      const { data: profiles } = userIds.length
        ? await supabase.from("yayika_profiles").select("id, full_name, avatar_url").in("id", userIds)
        : { data: [] as any[] };
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      const leaderboard = (progressRows || []).map((r) => ({
        user_id: r.user_id,
        display_name: profileMap.get(r.user_id)?.full_name || null,
        streak: r.streak_days,
        xp: r.xp_total,
        avatar_url: profileMap.get(r.user_id)?.avatar_url || null,
      }));

      let myRank = -1;
      if (user_id) {
        const { data: mine } = await supabase
          .from("yayika_progress")
          .select("streak_days, xp_total")
          .eq("user_id", user_id)
          .maybeSingle();
        if (mine && mine.streak_days > 0) {
          const { count } = await supabase
            .from("yayika_progress")
            .select("user_id", { count: "exact", head: true })
            .gt("streak_days", mine.streak_days);
          myRank = (count || 0) + 1;
        }
      }

      return new Response(
        JSON.stringify({ leaderboard, my_rank: myRank }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_xp_leaderboard") {
      const { data: progressRows, error } = await supabase
        .from("yayika_progress")
        .select("user_id, streak_days, xp_total")
        .order("xp_total", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const userIds = (progressRows || []).map((r) => r.user_id);
      const { data: profiles } = userIds.length
        ? await supabase.from("yayika_profiles").select("id, full_name, avatar_url").in("id", userIds)
        : { data: [] as any[] };
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      const leaderboard = (progressRows || []).map((r) => ({
        user_id: r.user_id,
        display_name: profileMap.get(r.user_id)?.full_name || null,
        streak: r.streak_days,
        xp: r.xp_total,
        avatar_url: profileMap.get(r.user_id)?.avatar_url || null,
      }));

      let myRank = -1;
      if (user_id) {
        const { data: mine } = await supabase
          .from("yayika_progress")
          .select("xp_total")
          .eq("user_id", user_id)
          .maybeSingle();
        if (mine) {
          const { count } = await supabase
            .from("yayika_progress")
            .select("user_id", { count: "exact", head: true })
            .gt("xp_total", mine.xp_total || 0);
          myRank = (count || 0) + 1;
        }
      }

      return new Response(
        JSON.stringify({ leaderboard, my_rank: myRank }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_active_now") {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("yayika_circle_activity")
        .select("user_id", { count: "exact", head: true })
        .gte("last_active_at", fiveMinAgo);

      return new Response(
        JSON.stringify({ active_now: count || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
