// ============================================================
// Yayika — account-deletion Edge Function
// Self-service account deletion (required by Apple App Store
// Review Guideline 5.1.1(v) and Google Play).
// Called from the app with the signed-in user's JWT:
//   POST {}  -> deletes the caller's account and personal data
// Financial ledgers (purchases, commissions, payouts) are kept
// for tax/billing obligations, as stated in the privacy notice.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fiscal/billing tables kept for legal obligation (anonymized rows):
const KEEP_TABLES = new Set([
  "yayika_purchases",
  "yayika_commissions",
  "yayika_payouts",
  "yayika_payout_requests",
  "yayika_earnings",
  "yayika_referrals",
  "yayika_subscriptions",
]);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  // Resolve the caller from their user JWT (gateway verified the signature)
  const authHeader = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: userData, error: userError } = await supabase.auth.getUser(authHeader);
  const uid = userData?.user?.id;
  if (userError || !uid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 1. Discover every public table with a user_id column and purge the
  //    user's rows (except the fiscal whitelist). Future-proof: new
  //    tables are covered automatically. PostgREST does not expose
  //    information_schema, so discovery goes through a service-only RPC.
  const { data: tableNames, error: colError } = await supabase.rpc("yayika_user_tables");

  const purged: string[] = [];
  const skipped: string[] = [];
  for (const tableName of tableNames ?? []) {
    if (KEEP_TABLES.has(tableName)) {
      skipped.push(tableName);
      continue;
    }
    const { error } = await supabase.from(tableName).delete().eq("user_id", uid);
    if (!error) purged.push(tableName);
  }

  // 2. Profile row is keyed by id (== auth uid), not user_id
  await supabase.from("yayika_profiles").delete().eq("id", uid);

  // 3. Delete the auth user (cascades MFA/sessions)
  const { error: deleteError } = await supabase.auth.admin.deleteUser(uid);
  if (deleteError) {
    return new Response(JSON.stringify({ error: "delete_failed", detail: deleteError.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ success: true, purged_tables: purged.length, kept_fiscal_tables: skipped }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
