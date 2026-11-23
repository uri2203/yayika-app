#!/usr/bin/env node
/**
 * Yayika — simulación diaria de una usuaria real durante 7 noches.
 * Usa SOLO la cuenta de prueba definida en .env. No compra, no envía correos,
 * no ejecuta acciones de admin ni toca datos de otras usuarias.
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
const today = new Date().toISOString().slice(0, 10);
let state = fs.existsSync(STATE_FILE)
  ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))
  : { day: 0, lastDate: null, finished: false };

if (state.lastDate === today) {
  console.log(`Simulación ya ejecutada hoy (${today}). Nada que hacer.`);
  process.exit(0);
}
state.day += 1;
state.lastDate = today;

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
async function call(fn, body, lang, expected = 'ok') {
  const started = Date.now();
  let status = 0;
  let text = '';
  try {
    const r = await fetch(`${SB}/functions/v1/${fn}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: ANON, Authorization: `Bearer ${access_token}` },
      body: JSON.stringify(body),
    });
    status = r.status;
    text = await r.text();
  } catch (e) {
    text = `NETWORK_ERROR ${e.message}`;
  }
  let sample = text.slice(0, 2000);
  try {
    const j = JSON.parse(text);
    sample = JSON.stringify(j).slice(0, 2000);
  } catch {}
  const ok = expected === 'guard' ? (status === 401 || status === 403 || status === 400)
    : expected === 'dedupe' ? (status === 200 || status === 400)
    : expected === 'upstream' ? (status === 200 || status === 502)
    : status === 200;
  rows.push({ ts: new Date().toISOString(), day: state.day, fn, lang, action: body.action || '-', status, ok, expected, ms: Date.now() - started, sample });
  return { status, text };
}

// Producto real para el detalle (sin exponer contenido sin acceso).
let productId = null;
{
  const { text } = await call('ai-product-catalog', { action: 'getCatalog', lang: 'es' }, 'es');
  try { productId = JSON.parse(text).products?.[0]?.id || null; } catch {}
}

for (const lang of LANGS) {
  await call('ai-product-catalog', { action: 'getCatalog', lang }, lang);
  if (productId) await call('ai-product-catalog', { action: 'getProductDetail', product_id: productId, lang }, lang);
  await call('ai-affirmations', { cycle_phase: 'follicular', lang }, lang, 'upstream');
  await call('ai-wellness-planner', { cycle_phase: 'follicular', energy_level: 4, mood: 'motivada', lang }, lang, 'upstream');
  await call('ai-financial-coach', { cycle_phase: 'follicular', lang }, lang, 'upstream');
  await call('ai-cycle-coach', { cycle_phase: 'follicular', lang }, lang, 'upstream');
  await call('ai-chat', { messages: [{ role: 'user', content: 'Hola' }], lang }, lang, 'upstream');
  await call('ai-growth-coach', { lang }, lang);
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

// Flujo real de un día (una sola vez, no por idioma).
await call('retention-check-in', { action: 'dailyCheckin' }, 'es', 'dedupe');
await call('retention-check-in', { action: 'getSpinResult' }, 'es');

// Onboarding: completa el día que corresponda según el estado real.
{
  const { text } = await call('ai-onboarding', { action: 'getState' }, 'es');
  try {
    const j = JSON.parse(text);
    const nextDay = j.state?.current_day || 1;
    if (nextDay <= 7) await call('ai-onboarding', { action: 'completeDay', day_number: nextDay }, 'es');
  } catch {}
}

fs.appendFileSync(RESULTS_FILE, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
state.finished = state.day >= 7;
fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

const fails = rows.filter((r) => !r.ok);
const byFn = {};
for (const r of rows) {
  byFn[r.fn] ||= new Set();
  byFn[r.fn].add(r.sample);
}
const notLocalized = Object.entries(byFn)
  .filter(([fn, set]) => set.size === 1 && ['ai-affirmations','ai-wellness-planner','ai-financial-coach','ai-cycle-coach','ai-growth-coach','ai-chat','ai-weekly-challenges','ai-cycle-intelligence','ai-gana-con-yayika','ai-product-catalog'].includes(fn))
  .map(([fn]) => fn);

console.log(`DÍA ${state.day}/7 — ${today}`);
console.log(`Llamadas: ${rows.length} | fallos: ${fails.length}`);
if (fails.length) console.log('Fallos: ' + fails.map((f) => `${f.fn}/${f.lang}/${f.status}`).join(', '));
if (notLocalized.length) console.log('Sin variar por idioma: ' + notLocalized.join(', '));
if (state.finished) console.log('SIMULACIÓN TERMINADA — ver qa/results/live-user-sim.jsonl');
