import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const INSURANCE_PLANS = [
  { id: "freeze_1", days: 1, priceCents: 99, currency: "usd", title: { es: "1 Día de Pausa", en: "1 Day Freeze", pt: "1 Dia de Pausa", fr: "1 Jour de Pause", de: "1 Tag Pause" } },
  { id: "freeze_3", days: 3, priceCents: 249, currency: "usd", title: { es: "3 Días de Pausa", en: "3 Day Freeze", pt: "3 Dias de Pausa", fr: "3 Jours de Pause", de: "3 Tage Pause" } },
  { id: "freeze_7", days: 7, priceCents: 499, currency: "usd", title: { es: "1 Semana de Pausa", en: "1 Week Freeze", pt: "1 Semana de Pausa", fr: "1 Semaine de Pause", de: "1 Woche Pause" } },
  { id: "shield", days: 1, priceCents: 199, currency: "usd", title: { es: "Escudo de Racha", en: "Streak Shield", pt: "Escudo de Sequência", fr: "Bouclier de Série", de: "Serien-Schild" }, isShield: true },
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

    const { action, user_id, plan_id } = await req.json();

    if (action === "get_plans") {
      return new Response(
        JSON.stringify({ plans: INSURANCE_PLANS }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "purchase") {
      const plan = INSURANCE_PLANS.find((p) => p.id === plan_id);
      if (!plan) throw new Error("Invalid plan");

      // Check if user already has active insurance
      const { data: existing } = await supabase
        .from("yayika_user_items")
        .select("id, quantity")
        .eq("user_id", user_id)
        .eq("item_type", plan.isShield ? "streak_shield" : "streak_freeze")
        .gt("quantity", 0)
        .maybeSingle();

      if (existing) {
        // Increment quantity
        await supabase
          .from("yayika_user_items")
          .update({ quantity: existing.quantity + plan.days })
          .eq("id", existing.id);
      } else {
        // Insert new
        await supabase.from("yayika_user_items").insert({
          user_id,
          item_type: plan.isShield ? "streak_shield" : "streak_freeze",
          quantity: plan.days,
        });
      }

      // Log XP event for purchase
      await supabase.from("yayika_xp_events").insert({
        user_id,
        event_type: "insurance_purchase",
        xp_amount: 0,
        metadata: { plan_id: plan.id, days: plan.days },
      });

      // Get user language for response
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("language")
        .eq("user_id", user_id)
        .single();
      const lang = profileData?.language || "es";

      return new Response(
        JSON.stringify({
          success: true,
          plan: {
            id: plan.id,
            title: plan.title[lang as keyof typeof plan.title] || plan.title.es,
            days: plan.days,
          },
          message: {
            es: `Compraste ${plan.days} día(s) de pausa para tu racha`,
            en: `You purchased ${plan.days} freeze day(s) for your streak`,
            pt: `Você comprou ${plan.days} dia(s) de pausa para sua sequência`,
            fr: `Vous avez acheté ${plan.days} jour(s) de pause pour votre série`,
            de: `Du hast ${plan.days} Pausentag(e) für deine Serie gekauft`,
          }[lang as keyof typeof plan.title] || "",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "use_freeze") {
      // Use a freeze day to save streak
      const { data: freeze } = await supabase
        .from("yayika_user_items")
        .select("id, quantity")
        .eq("user_id", user_id)
        .eq("item_type", "streak_freeze")
        .gt("quantity", 0)
        .maybeSingle();

      if (!freeze) {
        return new Response(
          JSON.stringify({ error: "No freeze available" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Decrement freeze quantity
      await supabase
        .from("yayika_user_items")
        .update({ quantity: freeze.quantity - 1 })
        .eq("id", freeze.id);

      // Log freeze usage
      await supabase.from("yayika_xp_events").insert({
        user_id,
        event_type: "freeze_used",
        xp_amount: 0,
      });

      return new Response(
        JSON.stringify({ success: true, remaining: freeze.quantity - 1 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "get_inventory") {
      const { data: items } = await supabase
        .from("yayika_user_items")
        .select("item_type, quantity")
        .eq("user_id", user_id)
        .in("item_type", ["streak_freeze", "streak_shield"]);

      const inventory = {
        freeze_days: items?.find((i) => i.item_type === "streak_freeze")?.quantity || 0,
        shields: items?.find((i) => i.item_type === "streak_shield")?.quantity || 0,
      };

      return new Response(
        JSON.stringify({ inventory }),
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
