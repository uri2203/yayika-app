import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Surprise types with weighted probabilities
const SURPRISES = [
  { type: "bonus_xp", weight: 35, minXP: 5, maxXP: 25, title: { es: "✨ ¡Bonus XP!", en: "✨ Bonus XP!", pt: "✨ XP Bônus!", fr: "✨ Bonus XP !", de: "✨ Bonus-XP!" }, body: { es: "Ganaste +{value} XP extra por estar activa", en: "You earned +{value} extra XP for being active", pt: "Você ganhou +{value} XP extra por estar ativa", fr: "Vous avez gagné +{value} XP supplémentaires", de: "Du hast +{value} Extra-XP für deine Aktivität" } },
  { type: "streak_boost", weight: 15, value: 1, title: { es: "🔥 ¡Boost de racha!", en: "🔥 Streak Boost!", pt: "🔥 Boost de sequência!", fr: "🔥 Boost de série !", de: "🔥 Serien-Boost!" }, body: { es: "Tu racha se incrementó en +{value} día", en: "Your streak increased by +{value} day", pt: "Sua sequência aumentou em +{value} dia", fr: "Votre série a augmenté de +{value} jour", de: "Deine Serie hat sich um +{value} Tag erhöht" } },
  { type: "secret_badge", weight: 10, title: { es: "🏆 ¡Insignia secreta!", en: "🏆 Secret Badge!", pt: "🏆 Emblema secreto!", fr: "🏆 Badges secret !", de: "🏆 Geheimabzeichen!" }, body: { es: "Desbloqueaste una insignia especial", en: "You unlocked a special badge", pt: "Você desbloqueou um emblema especial", fr: "Vous avez débloqué un badge spécial", de: "Du hast ein spezielles Abzeichen freigeschaltet" } },
  { type: "content_unlock", weight: 10, title: { es: "📚 ¡Contenido desbloqueado!", en: "📚 Content Unlocked!", pt: "📚 Conteúdo desbloqueado!", fr: "📚 Contenu débloqué !", de: "📚 Inhalt freigeschaltet!" }, body: { es: "Acceso temporal a contenido premium", en: "Temporary access to premium content", pt: "Acesso temporário a conteúdo premium", fr: "Accès temporaire au contenu premium", de: "Temporärer Zugang zu Premium-Inhalten" } },
  { type: "XP_jackpot", weight: 5, minXP: 50, maxXP: 100, title: { es: "🎰 ¡JACKPOT XP!", en: "🎰 XP JACKPOT!", pt: "🎰 JACKPOT de XP!", fr: "🎰 JACKPOT XP !", de: "🎰 XP-JACKPOT!" }, body: { es: "¡Ganaste {value} XP! ¡Increíble!", en: "You won {value} XP! Incredible!", pt: "Você ganhou {value} XP! Incrível!", fr: "Vous avez gagné {value} XP ! Incroyable !", de: "Du hast {value} XP gewonnen! Unglaublich!" } },
  { type: "mystery_message", weight: 15, title: { es: "💌 Mensaje de tu yo futuro", en: "💌 Message from your future self", pt: "💌 Mensagem do seu eu futuro", fr: "💌 Message de votre futur moi", de: "💌 Nachricht von deinem zukünftigen Ich" }, body: { es: "\"Sigue adelante. Estás haciendo un trabajo increíble.\"", en: "\"Keep going. You're doing an incredible job.\"", pt: "\"Continue. Você está fazendo um trabalho incrível.\"", fr: "\"Continuez. Vous faites un travail incroyable.\"", de: "\"Mach weiter. Du machst eine unglaubliche Arbeit.\"" } },
];

function weightedRandom(items: typeof SURPRISES) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  return items[items.length - 1];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { user_id, action } = await req.json();

    if (action === "roll_surprise") {
      // Check if user already got a surprise today
      const today = new Date().toISOString().split("T")[0];
      const { data: existing } = await supabase
        .from("yayika_surprise_log")
        .select("id")
        .eq("user_id", user_id)
        .eq("surprise_date", today)
        .maybeSingle();

      if (existing) {
        return new Response(
          JSON.stringify({ surprise: null, message: "Already rolled today" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Roll for surprise
      const surprise = weightedRandom(SURPRISES);
      let value = 0;

      if (surprise.type === "bonus_xp" || surprise.type === "XP_jackpot") {
        value = Math.floor(Math.random() * (surprise.maxXP! - surprise.minXP! + 1)) + surprise.minXP!;
        // Award XP
        await supabase.from("yayika_xp_events").insert({
          user_id,
          event_type: "surprise_" + surprise.type,
          xp_amount: value,
        });
      } else if (surprise.type === "streak_boost") {
        value = 1;
        // Boost streak
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("streak")
          .eq("user_id", user_id)
          .single();
        if (profile) {
          await supabase
            .from("user_profiles")
            .update({ streak: profile.streak + value })
            .eq("user_id", user_id);
        }
      }

      // Log the surprise
      await supabase.from("yayika_surprise_log").insert({
        user_id,
        surprise_type: surprise.type,
        surprise_date: today,
        value,
      });

      // Get user language
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("language")
        .eq("user_id", user_id)
        .single();
      const lang = profileData?.language || "es";

      const title = surprise.title[lang as keyof typeof surprise.title] || surprise.title.es;
      let body = surprise.body[lang as keyof typeof surprise.body] || surprise.body.es;
      body = body.replace("{value}", String(value));

      return new Response(
        JSON.stringify({ surprise: { type: surprise.type, title, body, value } }),
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
