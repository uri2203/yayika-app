import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function stripeKeyFromEnv(): string {
  const primary = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
  if (primary.startsWith("sk_live_") || primary.startsWith("sk_test_")) return primary;
  // Legacy secret holds a working sk_live_ key; the STRIPE_SECRET_KEY
  // secret currently stores an expired rk_live_ restricted key.
  return Deno.env.get("SERVICE_ROLE_KEY") ?? "";
}

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = signature.split(",").reduce((acc: Record<string, string>, part) => {
      const [key, value] = part.split("=");
      acc[key] = value;
      return acc;
    }, {});

    const timestamp = parts["t"];
    const expectedSig = parts["v1"];

    if (!timestamp || !expectedSig) return false;

    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(signedPayload)
    );
    const computedSig = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return computedSig === expectedSig;
  } catch {
    return false;
  }
}

async function resolvePlanFromPrice(priceId: string | null, stripeKey: string): Promise<string | null> {
  if (!priceId) return null;
  try {
    const r = await fetch(
      `https://api.stripe.com/v1/prices/${priceId}?expand[]=product`,
      { headers: { Authorization: `Bearer ${stripeKey}` } }
    );
    if (!r.ok) return null;
    const price = await r.json();
    const product = price.product;
    const plans = ["semilla", "guerrera", "diamante"];
    const metaPlan = product?.metadata?.plan;
    if (metaPlan && plans.includes(metaPlan)) return metaPlan;
    const name = String(product?.name ?? "").toLowerCase();
    for (const p of plans) {
      if (name.includes(p)) return p;
    }
    return null;
  } catch {
    return null;
  }
}

function subscriptionInvoiceId(invoice: Record<string, unknown>): string | null {
  const direct = invoice.subscription;
  if (typeof direct === "string") return direct;
  const parent = invoice.parent as Record<string, unknown> | undefined;
  const details = parent?.subscription_details as Record<string, unknown> | undefined;
  const nested = details?.subscription;
  if (typeof nested === "string") return nested;
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeKey = stripeKeyFromEnv();

    if (!webhookSecret || !stripeKey) {
      console.error("Missing STRIPE_WEBHOOK_SECRET or Stripe secret key");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    const isValid = await verifyStripeSignature(body, signature, webhookSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        let userId: string | null = session.metadata?.user_id ?? null;
        const email: string | null =
          session.customer_details?.email ?? session.customer_email ?? null;

        if (!userId && email) {
          const { data: profile } = await supabase
            .from("yayika_profiles")
            .select("id")
            .eq("email", email)
            .limit(1)
            .maybeSingle();
          userId = profile?.id ?? null;
        }

        if (session.mode === "subscription" || session.subscription) {
          if (!userId) {
            console.error("checkout.session.completed: cannot resolve user for subscription");
            break;
          }

          let plan = session.metadata?.plan ?? "guerrera";
          if (session.subscription) {
            const subRes = await fetch(
              `https://api.stripe.com/v1/subscriptions/${session.subscription}`,
              { headers: { Authorization: `Bearer ${stripeKey}` } }
            );
            if (subRes.ok) {
              const sub = await subRes.json();
              const priceId = sub.items?.data?.[0]?.price?.id ?? null;
              const mapped = await resolvePlanFromPrice(priceId, stripeKey);
              if (mapped) plan = mapped;
            }
          }

          const { data: existing } = await supabase
            .from("yayika_subscriptions")
            .select("id")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          const row = {
            user_id: userId,
            plan,
            status: "active",
            stripe_subscription_id: session.subscription ?? null,
            current_period_end: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          };

          if (existing) {
            const { error } = await supabase
              .from("yayika_subscriptions")
              .update(row)
              .eq("id", existing.id);
            if (error) console.error("Error updating subscription:", error);
          } else {
            const { error } = await supabase
              .from("yayika_subscriptions")
              .insert({ ...row, created_at: new Date().toISOString() });
            if (error) console.error("Error creating subscription:", error);
          }
        } else {
          const { error } = await supabase.from("yayika_purchases").insert({
            user_id: userId,
            user_email: email,
            product:
              session.metadata?.product ??
              session.line_items?.data?.[0]?.description ??
              "unknown",
            amount_total: session.amount_total ?? 0,
            currency: session.currency ?? "usd",
            stripe_session_id: session.id,
            stripe_customer_id:
              typeof session.customer === "string" ? session.customer : null,
            payment_intent_id:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
            insurance_plan_id: session.metadata?.insurance_plan_id ?? null,
          });
          if (error) console.error("Error logging purchase:", error);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const status =
          subscription.status === "active"
            ? "active"
            : subscription.status === "past_due"
              ? "past_due"
              : "cancelled";

        const { error } = await supabase
          .from("yayika_subscriptions")
          .update({
            status,
            current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);
        if (error) console.error("Error updating subscription:", error);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const { error } = await supabase
          .from("yayika_subscriptions")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscription.id);
        if (error) {
          console.error("Error cancelling subscription:", error);
        } else {
          console.log(`Subscription cancelled: ${subscription.id}`);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subId = subscriptionInvoiceId(invoice);
        if (subId) {
          const { error } = await supabase
            .from("yayika_subscriptions")
            .update({ status: "past_due", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subId);
          if (error) console.error("Error marking subscription past_due:", error);
        } else {
          console.error("invoice.payment_failed: no subscription id on invoice");
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subId = subscriptionInvoiceId(invoice);
        if (subId) {
          const { error } = await supabase
            .from("yayika_subscriptions")
            .update({ status: "active", updated_at: new Date().toISOString() })
            .eq("stripe_subscription_id", subId);
          if (error) console.error("Error reactivating subscription:", error);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
