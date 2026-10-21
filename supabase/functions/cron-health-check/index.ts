// ============================================================
// Yayika — cron-health-check Edge Function
// Daily guard for the automated jobs: verifies that
// send-push-notifications (daily 20-21 UTC) and ai-weekly-digest
// (weekly Mondays 09:00 UTC) have recorded a recent heartbeat;
// alerts admin@yayika.com via Resend when one is stale.
// Scheduled by pg_cron with the service-role key.
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CHECKS = [
  { job: "send-push-notifications", maxAgeHours: 26, schedule: "diario 20-21 UTC" },
  { job: "ai-weekly-digest", maxAgeHours: 192, schedule: "semanal lunes 09:00 UTC" },
];

const ADMIN_EMAIL = "admin@yayika.com";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Internal cron-only function: only the service-role caller is allowed.
  // The gateway (verify_jwt=true) already validated the JWT signature,
  // so checking the role claim is safe.
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  let isService = false;
  if (bearer && bearer.split(".").length === 3) {
    try {
      const payload = JSON.parse(atob(bearer.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      isService = payload.role === "service_role" && String(payload.iss || "").includes("supabase");
    } catch { isService = false; }
  }
  if (!isService) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: rows, error } = await supabase
    .from("yayika_cron_heartbeat")
    .select("job, ran_at, ok, detail")
    .in("job", CHECKS.map((c) => c.job));

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stale: { job: string; reason: string }[] = [];
  for (const check of CHECKS) {
    const row = (rows || []).find((r) => r.job === check.job);
    if (!row) {
      stale.push({ job: check.job, reason: "sin registro de ejecución (heartbeat nunca escrito)" });
      continue;
    }
    const ageHours = (Date.now() - new Date(row.ran_at).getTime()) / 36e5;
    if (ageHours > check.maxAgeHours) {
      const lastOk = row.ok === false ? " (última ejecución con errores)" : "";
      stale.push({
        job: check.job,
        reason: `última ejecución hace ${ageHours.toFixed(1)}h, esperado cada ${check.maxAgeHours}h${lastOk}`,
      });
    }
  }

  let alerted = false;
  if (stale.length > 0) {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const rowsHtml = stale
        .map(
          (s) =>
            `<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600">${s.job}</td><td style="padding:8px 12px;border-bottom:1px solid #eee">${s.reason}</td></tr>`,
        )
        .join("");
      const html = `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f8f5ff;padding:24px;color:#2C2240">
  <div style="max-width:520px;margin:0 auto;background:white;border-radius:12px;padding:24px">
    <h2 style="margin-top:0">🚨 Tareas automáticas de Yayika caídas</h2>
    <p>Los siguientes jobs de cron no se ejecutaron en su horario:</p>
    <table width="100%" style="border-collapse:collapse;font-size:14px">${rowsHtml}</table>
    <p style="font-size:12px;color:#999;margin-top:20px">Alerta automática de cron-health-check · yayika.com</p>
  </div>
</body></html>`;
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Yayika <hola@yayika.com>",
          to: ADMIN_EMAIL,
          subject: `🚨 [Yayika] ${stale.length} job(s) de cron sin ejecutar`,
          html,
        }),
      });
      alerted = resp.ok;
    }
  }

  await supabase.from("yayika_cron_heartbeat").upsert({
    job: "cron-health-check",
    ran_at: new Date().toISOString(),
    ok: true,
    detail: stale.length ? `stale: ${stale.map((s) => s.job).join(", ")}` : "all ok",
  }, { onConflict: "job" });

  return new Response(
    JSON.stringify({ success: true, checked: CHECKS.length, stale, alerted }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
