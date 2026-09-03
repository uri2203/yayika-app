import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Stripe Price IDs to plan names
const PRICE_TO_PLAN: Record<string, string> = {
  // Semilla
  "price_semilla_monthly": "semilla",
  // Guerrera
  "price_guerrera_monthly": "guerrera",
  // Diamante
  "price_diamante_monthly": "diamante",
};

// Verify Stripe webhook signature
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

    // Check timestamp (5 min tolerance)
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!webhookSecret || !stripeKey) {
      console.error("Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    // Verify signature
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
        const userId = session.metadata?.user_id;
        const planKey = session.metadata?.plan;

        if (!userId) {
          console.error("No user_id in session metadata");
          break;
        }

        // Determine plan from metadata or price
        let plan = planKey || "guerrera";
        if (session.subscription) {
          // Get subscription details to find price
          const subRes = await fetch(`https://api.stripe.com/v1/subscriptions/${session.subscription}`, {
            headers: { Authorization: `Bearer ${stripeKey}` },
          });
          const sub = await subRes.json();
          const priceId = sub.items?.data?.[0]?.price?.id;
          if (priceId && PRICE_TO_PLAN[priceId]) {
            plan = PRICE_TO_PLAN[priceId];
          }
        }

        // Create or update subscription record
        const { error } = await supabase.from("yayika_subscriptions").upsert(
          {
            user_id: userId,
            plan: plan,
            status: "active",
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

        if (error) {
          console.error("Error creating subscription:", error);
        } else {
          console.log(`Subscription created for user ${userId}: ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const status = subscription.status === "active" ? "active" : 
                       subscription.status === "past_due" ? "past_due" : "cancelled";

        const { error } = await supabase
          .from("yayika_subscriptions")
          .update({ 
            status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;

        const { error } = await supabase
          .from("yayika_subscriptions")
          .update({ status: "cancelled" })
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
        const customerId = invoice.customer;

        // Mark subscription as past_due
        const { error } = await supabase
          .from("yayika_subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error marking subscription past_due:", error);
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
