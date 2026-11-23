#!/usr/bin/env node
/**
 * Yayika — campaña nocturna de usuaria real + estrés controlado.
 * 7 noches, 18:00-22:30, una ejecución cada 30 min.
 * Solo la cuenta de prueba. Sin compras, correos ni acciones admin.
 */
import fs from 'fs';
import path from 'path';

const SB = process.env.SUPABASE_URL || 'https://odbhxiymteppgaqqdsoy.supabase.co';
const ANON = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYmh4aXltdGVwcGdhcXFkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwOTc1NjUsImV4cCI6MjA5NTY3MzU2NX0.-AMG1zoszc05NJjAkXmm7kCZJuN3RA2OIzZRs221gkc';
const EMAIL = process.env.YAYIKA_TEST_EMAIL;
const PASSWORD = process.env.YAYIKA_TEST_PASSWORD;
if (!EMAIL || !PASSWORD) {
  console.error('Faltan YAYIKA_TEST_EMAIL / YAYIKA_TEST_PASSWORD en .env');
  process.exit(1);
}

const OUT_DIR = path.resolve('qa/results');
const STATE_FILE = path.join(OUT_DIR, 'live-user-sim-state.json');
const RESULTS_FILE = path.join(OUT_DIR, 'live-user-sim.jsonl');
fs.mkdirSync(OUT_DIR, { recursive: true });

const LANGS = ['es', 'en', 'pt', 'fr', 'de'];
const nowMs = Date.now();
const today = new Date(nowMs).toISOString().slice(0, 10);
let state = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  : { day: 0, lastDate: null, runIndex: 0, lastRunMs: 0, finished: false, checkinDate: null, onboardingDoneDate: null };

if (state.finished) {
  console.log('Campaña terminada. Nada que hacer.');
  process.exit(0);
}
if (state.lastRunMs && nowMs - state.lastRunMs < 10 * 60 * 1000) {
  console.log('Ejecución demasiado cerca de la anterior (<10 min). Se omite.');
  process.exit(0);
}
if (state.lastDate !== today) {
  state.day += 1;
  state.lastDate = today;
  state.runIndex = 0;
}
state.runIndex += 1;

const lr = await fetch(`${SB}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', apikey: ANON },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
if (!lr.ok) {
  console.error(`Login falló: ${lr.status} ${(await lr.text()).slice(0, 200)}`);
  process.exit(1);
}
const { access_token } = await lr.json();

const rows = [];
async function call(fn, body, lang, expected = 'ok', token = access_token, screen = '-') {
  const started = Date.now();
  let status = 0;
  let text = '';
  try {
    const r = await fetch(`${SB}/functions/v1/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    status = r.status;
    text = await r.text();
  } catch (e) {
    text = `NETWORK_ERROR ${e.message}`;
  }
  let sample = text.slice(0, 2000);
  try { sample = JSON.stringify(JSON.parse(text)).slice(0, 2000); } catch {}
  const ok = expected === 'guard' ? [400, 401, 403].includes(status)
    : expected === 'dedupe' ? [200, 400].includes(status)
    : expected === 'upstream' ? [200, 502].includes(status)
    : status === 200;
  const row = { ts: new Date().toISOString(), day: state.day, run: state.runIndex, screen, fn, lang, action: body.action || '-', status, ok, expected, ms: Date.now() - started, sample };
  rows.push(row);
  return { ...row, body: text };
}

// Lectura REST directa tal como la hace la app (useSubscription).
async function rest(table, query, screen) {
  const started = Date.now();
  let status = 0;
  let text = '';
  try {
    const r = await fetch(`${SB}/rest/v1/${table}?${query}`, {
      headers: { apikey: ANON, Authorization: `Bearer ${access_token}` },
    });
    status = r.status;
    text = await r.text();
  } catch (e) {
    text = `NETWORK_ERROR ${e.message}`;
  }
  const sample = text.slice(0, 2000);
  rows.push({ ts: new Date().toISOString(), day: state.day, run: state.runIndex, screen, fn: `REST/${table}`, lang: 'app', action: 'select', status, ok: status === 200, expected: 'ok', ms: Date.now() - started, sample });
  return { status, text };
}

// Idiomas rotativos: 2 por ejecución; en 10 ejecuciones se cubren los 5 dos veces.
const rotated = [];
for (let i = 0; i < 2; i++) rotated.push(LANGS[(state.runIndex * 2 - 2 + i + LANGS.length * 10) % LANGS.length]);
const langs = [...new Set(rotated)];

let productId = null;
{
  const r = await call('ai-product-catalog', { action: 'getCatalog', lang: 'es' }, 'es');
  try { productId = JSON.parse(r.body).products?.[0]?.id || null; } catch {}
}

// Flujo funcional normal en los idiomas de esta ronda.
for (const lang of langs) {
  await call('ai-product-catalog', { action: 'getCatalog', lang }, lang);
  if (productId) await call('ai-product-catalog', { action: 'getProductDetail', product_id: productId, lang }, lang);
  await call('ai-weekly-challenges', { action: 'getWeeklyChallenges', lang }, lang);
  await call('ai-cycle-intelligence', { action: 'getDashboard', lang }, lang);
  await call('ai-gana-con-yayika', { action: 'getRegion', lang }, lang);
  await call('ai-onboarding', { action: 'getState', lang }, lang);
  await call('ai-community', { action: 'getCategories', lang }, lang);
  await call('ai-share-earn', { action: 'getTemplates', lang }, lang);
  await call('retention-check-in', { action: 'getTransformHistory' }, lang);
  await call('retention-circle', { action: 'getSocialProof' }, lang);
  await call('retention-projection', { action: 'getProjection' }, lang);
  await call('seasonal-events', { action: 'get_active' }, lang);
  await call('course-content', { path: 'courses/module1-lessons.json', lang }, lang, 'guard');
}

// Un solo LLM por ronda, rotando idioma, para no agotar la cuota de Groq.
const llmLang = langs[0];
await call('ai-affirmations', { cycle_phase: 'follicular', lang: llmLang }, llmLang, 'upstream');
await call('ai-wellness-planner', { cycle_phase: 'follicular', energy_level: 4, mood: 'motivada', lang: llmLang }, llmLang, 'upstream');
await call('ai-financial-coach', { cycle_phase: 'follicular', lang: llmLang }, llmLang, 'upstream');
await call('ai-cycle-coach', { cycle_phase: 'follicular', lang: llmLang }, llmLang, 'upstream');
await call('ai-chat', { messages: [{ role: 'user', content: 'Hola' }], lang: llmLang }, llmLang, 'upstream');

// ============================================================
// APP — mismas pantallas y contratos que usa la app Expo.
// ============================================================
const subRead = await rest('yayika_subscriptions', 'select=plan,status,current_period_end,grace_period_end&order=created_at.desc&limit=1', 'PortalDashboard');
let hasAccess = false;
try {
  const sub = JSON.parse(subRead.text)?.[0];
  const now = Date.now();
  const periodValid = sub?.current_period_end ? new Date(sub.current_period_end).getTime() > now : false;
  const graceValid = sub?.grace_period_end ? new Date(sub.grace_period_end).getTime() > now : false;
  hasAccess = !!sub && (((sub.status === 'active' || sub.status === 'trialing') && periodValid) || (sub.status === 'past_due' && graceValid));
} catch {}

await call('ai-product-catalog', { action: 'getCatalog', lang: llmLang }, llmLang, 'ok', access_token, 'PortalDashboard');
await call('ai-affirmations', { cycle_phase: 'follicular', lang: llmLang }, llmLang, 'upstream', access_token, 'PortalDashboard');
await call('ai-growth-coach', { lang: llmLang }, llmLang, 'ok', access_token, 'PortalDashboard');
await call('ai-wellness-planner', { cycle_phase: 'follicular', lang: llmLang }, llmLang, 'upstream', access_token, 'PortalDashboard');
await call('ai-smart-push', { cycle_phase: 'follicular', lang: llmLang }, llmLang, 'ok', access_token, 'Notificaciones');
if (productId) await call('ai-product-catalog', { action: 'getProductDetail', product_id: productId, lang: llmLang }, llmLang, 'ok', access_token, 'Cursos');
await call('ai-cycle-coach', { cycle_phase: 'follicular', lang: llmLang }, llmLang, 'upstream', access_token, 'Ciclo');
await call('ai-cycle-intelligence', { action: 'getDashboard', lang: llmLang }, llmLang, 'ok', access_token, 'Ciclo');
await call('ai-weekly-challenges', { action: 'getWeeklyChallenges', lang: llmLang }, llmLang, 'ok', access_token, 'Retos');
await call('ai-community', { action: 'getFeed', lang: llmLang }, llmLang, 'ok', access_token, 'Comunidad');
await call('ai-community', { action: 'getNotifications', lang: llmLang }, llmLang, 'ok', access_token, 'Comunidad');
await call('ai-financial-coach', { cycle_phase: 'follicular', lang: llmLang }, llmLang, 'upstream', access_token, 'Finanzas');
await call('ai-onboarding', { action: 'getState', lang: llmLang }, llmLang, 'ok', access_token, 'Onboarding');

// Pico controlado: 40 lecturas paralelas en lotes de 10, 5 idiomas.
const stressTargets = [
  ['ai-product-catalog', (l) => ({ action: 'getCatalog', lang: l })],
  ['retention-circle', () => ({ action: 'getSocialProof' })],
  ['retention-projection', () => ({ action: 'getProjection' })],
  ['ai-weekly-challenges', (l) => ({ action: 'getWeeklyChallenges', lang: l })],
];
for (let batch = 0; batch < 4; batch++) {
  const jobs = [];
  for (let i = 0; i < 10; i++) {
    const [fn, mk] = stressTargets[(batch + i) % stressTargets.length];
    const lang = LANGS[i % LANGS.length];
    jobs.push(call(fn, mk(lang), lang, 'ok'));
  }
  await Promise.all(jobs);
}

// Engagement real de un día (una sola vez al día).
if (state.checkinDate !== today) {
  await call('retention-check-in', { action: 'dailyCheckin' }, 'es', 'dedupe');
  state.checkinDate = today;
}
await call('retention-check-in', { action: 'getSpinResult' }, 'es');

if (state.onboardingDoneDate !== today) {
  const r = await call('ai-onboarding', { action: 'getState' }, 'es');
  try {
    const j = JSON.parse(r.body);
    const nextDay = j.state?.current_day || 1;
    if (nextDay <= 7) await call('ai-onboarding', { action: 'completeDay', day_number: nextDay }, 'es');
  } catch {}
  state.onboardingDoneDate = today;
}

fs.appendFileSync(RESULTS_FILE, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
state.lastRunMs = nowMs;
state.finished = state.day >= 7;
fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

const okRows = rows.filter((r) => r.ok);
const fails = rows.filter((r) => !r.ok);
const lats = okRows.map((r) => r.ms).sort((a, b) => a - b);
const p50 = lats[Math.floor(lats.length * 0.5)] ?? 0;
const p95 = lats[Math.floor(lats.length * 0.95)] ?? 0;
const spins = rows.filter((r) => r.fn === 'retention-check-in' && r.action === 'getSpinResult');
const checkin = rows.find((r) => r.action === 'dailyCheckin');

console.log(`NOCHE ${state.day}/7 · ronda ${state.runIndex} · ${today}`);
console.log(`Idiomas: ${langs.join(', ')} | llamadas: ${rows.length} | fallos: ${fails.length} | p50=${p50}ms p95=${p95}ms`);
if (fails.length) console.log('Fallos: ' + fails.map((f) => `${f.fn}/${f.lang}/${f.status}`).join(', '));
const screens = [...new Set(rows.map((r) => r.screen).filter((s) => s !== '-'))];
console.log(`Engagement → check-in: ${checkin ? checkin.status : 'ya registrado'} | ruleta: ${spins.map((s) => s.status).join(',') || '-'}`);
console.log(`App → pantallas: ${screens.join(', ')} | paywall hasAccess=${hasAccess}`);
if (state.finished) console.log('CAMPAÑA TERMINADA — ver qa/results/live-user-sim.jsonl');
