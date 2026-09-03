import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MoodMessage {
  title: string;
  body: string;
}

const MOOD_MESSAGES: Record<string, Record<string, MoodMessage>> = {
  es: {
    angry: { title: "😤 Respira profundo", body: "Está bien sentirte así. ¿Quieres que te mande una respiración guiada?" },
    sad: { title: "💙 Estamos contigo", body: "Los días difíciles pasan. ¿Intentamos un check-in para sentirte mejor?" },
    anxious: { title: "🌊 Calma", body: "Respira: 4 segundos dentro, 4 fuera. ¿Quieres una técnica de relajación?" },
    tired: { title: "😴 Descansa", body: "Tu cuerpo te pide un respiro. Escúchalo." },
    happy: { title: "🎉 ¡Genial!", body: "Aprovecha esta energía para avanzar en tus metas." },
    excited: { title: "🔥 ¡Esa energía!", body: "Canalízala: registra tu ciclo, actualiza tu presupuesto, o avanza en un curso." },
    stressed: { title: "🧘 Relájate", body: "5 minutos de mindful breathing pueden cambiar tu día." },
    overwhelmed: { title: "📋 Paso a paso", body: "Divide en tareas pequeñas. ¿Cuál es UNA cosa que puedas hacer ahora?" },
  },
  en: {
    angry: { title: "😤 Breathe deep", body: "It's okay to feel this way. Want a guided breathing exercise?" },
    sad: { title: "💙 We're here for you", body: "Tough days pass. Want a check-in to feel better?" },
    anxious: { title: "🌊 Calm down", body: "Breathe: 4 seconds in, 4 out. Want a relaxation technique?" },
    tired: { title: "😴 Rest", body: "Your body is asking for a break. Listen to it." },
    happy: { title: "🎉 Great!", body: "Use this energy to advance your goals." },
    excited: { title: "🔥 That energy!", body: "Channel it: log your cycle, update your budget, or advance a course." },
    stressed: { title: "🧘 Relax", body: "5 minutes of mindful breathing can change your day." },
    overwhelmed: { title: "📋 Step by step", body: "Break into small tasks. What's ONE thing you can do now?" },
  },
  pt: {
    angry: { title: "😤 Respire fundo", body: "Está bem se sentir assim. Quer uma respiração guiada?" },
    sad: { title: "💙 Estamos com você", body: "Dias difíceis passam. Quer um check-in para se sentir melhor?" },
    anxious: { title: "🌊 Calma", body: "Respire: 4 segundos dentro, 4 fora. Quer uma técnica de relaxamento?" },
    tired: { title: "😴 Descanse", body: "Seu corpo está pedindo uma pausa. Ouça." },
    happy: { title: "🎉 Ótimo!", body: "Use essa energia para avançar em suas metas." },
    excited: { title: "🔥 Essa energia!", body: "Canalize: registre seu ciclo, atualize seu orçamento ou avance em um curso." },
    stressed: { title: "🧘 Relaxa", body: "5 minutos de respiração consciente podem mudar seu dia." },
    overwhelmed: { title: "📋 Passo a passo", body: "Divida em tarefas pequenas. Qual É UMA coisa que você pode fazer agora?" },
  },
  fr: {
    angry: { title: "😤 Respirez profondément", body: "C'est normal de se sentir ainsi. Vous voulez une respiration guidée ?" },
    sad: { title: "💙 Nous sommes là", body: "Les jours difficiles passent. Vous voulez un check-in pour aller mieux ?" },
    anxious: { title: "🌊 Calmez-vous", body: "Respirez : 4 secondes dedans, 4 dehors. Vous voulez une technique de relaxation ?" },
    tired: { title: "😴 Reposez-vous", body: "Votre corps demande une pause. Écoutez-le." },
    happy: { title: "🎉 Super !", body: "Utilisez cette énergie pour avancer vers vos objectifs." },
    excited: { title: "🔥 Cette énergie !", body: "Canalisez-la : enregistrez votre cycle, mettez à jour votre budget ou avancez dans un cours." },
    stressed: { title: "🧘 Détendez-vous", body: "5 minutes de respiration consciente peuvent changer votre journée." },
    overwhelmed: { title: "📋 Étape par étape", body: "Découpez en petites tâches. Quelle EST UNE chose que vous pouvez faire maintenant ?" },
  },
  de: {
    angry: { title: "😤 Atme tief durch", body: "Es ist okay, sich so zu fühlen. Willst du eine geführte Atemübung?" },
    sad: { title: "💙 Wir sind für dich da", body: "Schwierige Tage gehen vorbei. Willst du ein Check-in, um dich besser zu fühlen?" },
    anxious: { title: "🌊 Beruhige dich", body: "Atme: 4 Sekunden ein, 4 aus. Willst du eine Entspannungstechnik?" },
    tired: { title: "😴 Ruhe dich aus", body: "Dein Körper bittet um eine Pause. Hör auf ihn." },
    happy: { title: "🎉 Toll!", body: "Nutze diese Energie, um deine Ziele voranzutreiben." },
    excited: { title: "🔥 Diese Energie!", body: "Kanalisieren: Trage deinen Zyklus ein, aktualisiere dein Budget oder mach Fortschritte in einem Kurs." },
    stressed: { title: "🧘 Entspanne dich", body: "5 Minuten achtsames Atmen können deinen Tag verändern." },
    overwhelmed: { title: "📋 Schritt für Schritt", body: "Teile in kleine Aufgaben. Was ist EINE Sache, die du jetzt tun kannst?" },
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

    const { user_id, mood, intensity } = await req.json();

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
    const messages = MOOD_MESSAGES[lang] || MOOD_MESSAGES.es;
    const msg = messages[mood] || messages.happy;

    // Store mood entry
    await supabase.from("yayika_mood_entries").insert({
      user_id,
      mood,
      intensity: intensity || 5,
      logged_at: new Date().toISOString(),
    });

    // Send push notification if high intensity negative mood
    if (tokenData?.token && intensity >= 7 && ["angry", "sad", "anxious", "stressed", "overwhelmed"].includes(mood)) {
      await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: tokenData.token,
          title: msg.title,
          body: msg.body,
          data: { type: "mood_support", mood },
          sound: "default",
        }),
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
