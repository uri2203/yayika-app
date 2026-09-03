import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRESTIGE_LEVELS = [
  { level: 1, title: { es: "Principiante", en: "Beginner", pt: "Iniciante", fr: "Débutante", de: "Anfängerin" }, requiredXP: 0 },
  { level: 2, title: { es: "Aprendiz", en: "Apprentice", pt: "Aprendiz", fr: "Apprentie", de: "Lernende" }, requiredXP: 500 },
  { level: 3, title: { es: "Guerrera", en: "Warrior", pt: "Guerreira", fr: "Guerrière", de: "Kriegerin" }, requiredXP: 1500 },
  { level: 4, title: { es: "Veterana", en: "Veteran", pt: "Veterana", fr: "Vétérane", de: "Veteranin" }, requiredXP: 3000 },
  { level: 5, title: { es: "Élite", en: "Elite", pt: "Élite", fr: "Élite", de: "Elite" }, requiredXP: 5000 },
  { level: 6, title: { es: "Maestra", en: "Master", pt: "Mestra", fr: "Maîtresse", de: "Meisterin" }, requiredXP: 8000 },
  { level: 7, title: { es: "Leyenda", en: "Legend", pt: "Lenda", fr: "Légende", de: "Legende" }, requiredXP: 12000 },
  { level: 8, title: { es: "Mítica", en: "Mythic", pt: "Mítica", fr: "Mythique", de: "Mythisch" }, requiredXP: 18000 },
  { level: 9, title: { es: "Transcendental", en: "Transcendent", pt: "Transcendental", fr: "Transcendante", de: "Transzendente" }, requiredXP: 25000 },
  { level: 10, title: { es: "Divina", en: "Divine", pt: "Divina", fr: "Divine", de: "Göttliche" }, requiredXP: 35000 },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { action, user_id } = await req.json();

    if (action === "get_prestige") {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("xp, prestige_level")
        .eq("user_id", user_id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const currentPrestige = PRESTIGE_LEVELS.find(
        (p) => p.level === profile.prestige_level
      ) || PRESTIGE_LEVELS[0];

      const nextPrestige = PRESTIGE_LEVELS.find(
        (p) => p.level === profile.prestige_level + 1
      );

      const progressToNext = nextPrestige
        ? ((profile.xp - currentPrestige.requiredXP) /
            (nextPrestige.requiredXP - currentPrestige.requiredXP)) *
          100
        : 100;

      return new Response(
        JSON.stringify({
          level: profile.prestige_level,
          title: currentPrestige.title,
          xp: profile.xp,
          progress_to_next: Math.min(progressToNext, 100),
          next_level: nextPrestige
            ? { level: nextPrestige.level, title: nextPrestige.title, required_xp: nextPrestige.requiredXP }
            : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "prestige_up") {
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("xp, prestige_level")
        .eq("user_id", user_id)
        .single();

      if (!profile) throw new Error("Profile not found");

      const nextPrestige = PRESTIGE_LEVELS.find(
        (p) => p.level === profile.prestige_level + 1
      );

      if (!nextPrestige || profile.xp < nextPrestige.requiredXP) {
        return new Response(
          JSON.stringify({ error: "Not enough XP" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update prestige level
      await supabase
        .from("user_profiles")
        .update({ prestige_level: nextPrestige.level })
        .eq("user_id", user_id);

      // Log prestige event
      await supabase.from("yayika_xp_events").insert({
        user_id,
        event_type: "prestige_level_up",
        xp_amount: 0,
        metadata: { new_level: nextPrestige.level },
      });

      return new Response(
        JSON.stringify({
          success: true,
          new_level: nextPrestige.level,
          title: nextPrestige.title,
        }),
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
