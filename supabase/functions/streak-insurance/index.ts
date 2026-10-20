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

function stripeKeyFromEnv(): string {
  const primary = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  if (primary.startsWith("sk_live_") || primary.startsWith("sk_test_")) return primary;
  return Deno.env.get("SERVICE_ROLE_KEY") ?? "";
}

async function verifyInsurancePayment(
  paymentIntentId: string,
  plan: { priceCents: number; currency: string }
): Promise<string | null> {
  const key = stripeKeyFromEnv();
  if (!key) return "Payment verification unavailable";
  const r = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) return "Payment not found";
  const pi = await r.json();
  if (pi.status !== "succeeded") return "Payment not completed";
  if (pi.amount !== plan.priceCents || pi.currency !== plan.currency) {
    return "Payment amount mismatch";
  }
  if (pi.metadata?.insurance_claimed === "1") return "Payment already used";
  await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ "metadata[insurance_claimed]": "1" }),
  });
  return null;
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

    const { action, plan_id, payment_intent_id } = await req.json();

    if (action === "get_plans") {
      return new Response(
        JSON.stringify({ plans: INSURANCE_PLANS }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Every remaining action acts only on behalf of the caller's own JWT
    // identity; any user_id in the body is ignored (prevents spoofing
    // other users' items/XP).
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const user_id = authData.user.id;

    if (action === "purchase") {
      const plan = INSURANCE_PLANS.find((p) => p.id === plan_id);
      if (!plan) throw new Error("Invalid plan");

      const requirePayment =
        (Deno.env.get("REQUIRE_STRIPE_PAYMENT") ?? "0") === "1";
      if (requirePayment || payment_intent_id) {
        if (!payment_intent_id) {
          return new Response(
            JSON.stringify({ error: "payment_required" }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const payErr = await verifyInsurancePayment(payment_intent_id, plan);
        if (payErr) {
          return new Response(
            JSON.stringify({ error: payErr }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

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

      // Get user language for response (app stores language locally; default es)
      const lang = "es";

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
