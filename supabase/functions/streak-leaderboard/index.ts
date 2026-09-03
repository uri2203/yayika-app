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
      // Get top users by current streak
      const { data: leaderboard, error } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, streak, xp, avatar_url")
        .gt("streak", 0)
        .order("streak", { ascending: false })
        .order("xp", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get current user's rank
      let myRank = -1;
      if (user_id) {
        const { count } = await supabase
          .from("user_profiles")
          .select("user_id", { count: "exact", head: true })
          .gt("streak", 0)
          .gt("streak", leaderboard?.[leaderboard.length - 1]?.streak || 0);
        myRank = (count || 0) + 1;
      }

      return new Response(
        JSON.stringify({ leaderboard: leaderboard || [], my_rank: myRank }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_xp_leaderboard") {
      // Get top users by total XP
      const { data: leaderboard, error } = await supabase
        .from("user_profiles")
        .select("user_id, display_name, streak, xp, avatar_url")
        .order("xp", { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get current user's rank
      let myRank = -1;
      if (user_id) {
        const { count } = await supabase
          .from("user_profiles")
          .select("user_id", { count: "exact", head: true })
          .gt("xp", leaderboard?.[leaderboard.length - 1]?.xp || 0);
        myRank = (count || 0) + 1;
      }

      return new Response(
        JSON.stringify({ leaderboard: leaderboard || [], my_rank: myRank }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_active_now") {
      // Get count of users active in last 5 minutes
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
