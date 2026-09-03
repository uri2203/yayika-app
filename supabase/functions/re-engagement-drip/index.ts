import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReEngagementMessage {
  title: string;
  body: string;
  type: string;
}

const MESSAGES: Record<string, Record<number, ReEngagementMessage>> = {
  es: {
    1: { title: "💌 ¡Te extrañamos!", body: "Hace 1 día que no nos vemos. Tu racha te espera.", type: "reengagement_day1" },
    3: { title: "⚠️ Tu progreso se está enfriando", body: "Llevas 3 días sin actividad. ¡Vuelve antes de que pierdas tu racha!", type: "reengagement_day3" },
    7: { title: "🚨 Última oportunidad", body: "Una semana sin actividad. Tu racha de {streak} días está en peligro.", type: "reengagement_day7" },
    14: { title: "🌿 Un nuevo comienzo", body: "Tu cuerpo cambia cada día. Regístralo y recupera tu progreso.", type: "reengagement_day14" },
  },
  en: {
    1: { title: "💌 We miss you!", body: "It's been 1 day. Your streak is waiting for you.", type: "reengagement_day1" },
    3: { title: "⚠️ Your progress is cooling down", body: "3 days inactive. Come back before you lose your streak!", type: "reengagement_day3" },
    7: { title: "🚨 Last chance", body: "One week inactive. Your {streak}-day streak is in danger.", type: "reengagement_day7" },
    14: { title: "🌿 A fresh start", body: "Your body changes every day. Log it and recover your progress.", type: "reengagement_day14" },
  },
  pt: {
    1: { title: "💌 Sentimos sua falta!", body: "Faz 1 dia que não nos vimos. Sua sequência te espera.", type: "reengagement_day1" },
    3: { title: "⚠️ Seu progresso está esfriando", body: "3 dias sem atividade. Volte antes de perder sua sequência!", type: "reengagement_day3" },
    7: { title: "🚨 Última chance", body: "Uma semana sem atividade. Sua sequência de {streak} dias está em perigo.", type: "reengagement_day7" },
    14: { title: "🌿 Um novo começo", body: "Seu corpo muda todos os dias. Registre e recupere seu progresso.", type: "reengagement_day14" },
  },
  fr: {
    1: { title: "💌 On vous manque !", body: "Cela fait 1 jour. Votre série vous attend.", type: "reengagement_day1" },
    3: { title: "⚠️ Votre progresse refroidit", body: "3 jours d'inactivité. Revenez avant de perdre votre série !", type: "reengagement_day3" },
    7: { title: "🚨 Dernière chance", body: "Une semaine d'inactivité. Votre série de {streak} jours est en danger.", type: "reengagement_day7" },
    14: { title: "🌿 Un nouveau départ", body: "Votre corps change chaque jour. Enregistrez et récupérez vos progrès.", type: "reengagement_day14" },
  },
  de: {
    1: { title: "💌 Wir vermissen dich!", body: "Es ist 1 Tag her. Deine Serie wartet auf dich.", type: "reengagement_day1" },
    3: { title: "⚠️ Dein Fortschritt kühlt ab", body: "3 Tage inaktiv. Komm zurück, bevor du deine Serie verlierst!", type: "reengagement_day3" },
    7: { title: "🚨 Letzte Chance", body: "Eine Woche inaktiv. Deine {streak}-Tage-Serie ist in Gefahr.", type: "reengagement_day7" },
    14: { title: "🌿 Ein Neuanfang", body: "Dein Körper ändert sich jeden Tag. Trage es ein und hole deinen Fortschritt ab.", type: "reengagement_day14" },
  },
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

    // Find users inactive for 1, 3, 7, or 14 days
    const now = new Date();
    const thresholds = [1, 3, 7, 14];
    const results = [];

    for (const days of thresholds) {
      const cutoff = new Date(now.getTime() - days * 86400000).toISOString();
      const prevCutoff = new Date(now.getTime() - (days + 1) * 86400000).toISOString();

      // Get users whose last activity was exactly `days` days ago
      const { data: inactiveUsers } = await supabase
        .from("yayika_circle_activity")
        .select("user_id")
        .lt("last_active_at", cutoff)
        .gte("last_active_at", prevCutoff);

      if (!inactiveUsers?.length) continue;

      for (const { user_id } of inactiveUsers) {
        // Get user's push token and language
        const { data: tokenData } = await supabase
          .from("push_tokens")
          .select("token, platform")
          .eq("user_id", user_id)
          .limit(1)
          .single();

        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("language, streak")
          .eq("user_id", user_id)
          .single();

        const lang = profileData?.language || "es";
        const streak = profileData?.streak || 0;
        const msg = MESSAGES[lang]?.[days] || MESSAGES.es[days];

        if (msg && tokenData?.token) {
          const body = msg.body.replace("{streak}", String(streak));

          await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: tokenData.token,
              title: msg.title,
              body,
              data: { type: msg.type },
              sound: "default",
            }),
          });

          results.push({ user_id, days, type: msg.type });
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent: results.length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
