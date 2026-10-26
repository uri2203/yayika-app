#!/usr/bin/env node
/**
 * QA LIVE - Yayika (verifica el backend desplegado)
 * Ejecutar: node qa/check-live.js
 * Solo lectura: no crea usuarios ni modifica datos.
 */
const SUPABASE = 'https://odbhxiymteppgaqqdsoy.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYmh4aXltdGVwcGdhcXFkc295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwOTc1NjUsImV4cCI6MjA5NTY3MzU2NX0.-AMG1zoszc05NJjAkXmm7kCZJuN3RA2OIzZRs221gkc';

let fails = 0;
let warns = 0;
const fail = (s, m) => { fails++; console.log(`  FAIL [${s}] ${m}`); };
const warn = (s, m) => { warns++; console.log(`  WARN [${s}] ${m}`); };
const pass = (s, m) => console.log(`  ok   [${s}] ${m}`);

async function fnCall(name, key = ANON) {
  const r = await fetch(`${SUPABASE}/functions/v1/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
    body: '{}',
  });
  return r.status;
}

async function rest(pathname, key = ANON) {
  const r = await fetch(`${SUPABASE}/rest/v1/${pathname}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const txt = await r.text();
  return { status: r.status, body: txt };
}

console.log('QA LIVE: backend desplegado (solo lectura)\n');

/* 1. API viva */
console.log('== 1. API ==');
{
  const { status } = await rest('profiles?select=id&limit=1');
  if (status === 200) pass('api', 'PostgREST responde 200');
  else fail('api', `PostgREST devolvio ${status}`);
}

/* 2. RLS: anon no puede filtrar datos ajenos */
console.log('== 2. RLS ==');
{
  const { status, body } = await rest('yayika_purchases?select=id&limit=5');
  if (status === 200) {
    let rows = [];
    try { rows = JSON.parse(body); } catch (e) { /* noop */ }
    if (rows.length === 0) pass('rls', 'yayika_purchases: anon ve 0 filas');
    else fail('rls', `yayika_purchases: anon vio ${rows.length} filas (posible fuga)`);
  } else if (status === 401 || status === 403) {
    pass('rls', `yayika_purchases: anon bloqueado (${status})`);
  } else {
    fail('rls', `yayika_purchases: status inesperado ${status}`);
  }
  const hb = await rest('yayika_cron_heartbeat?select=job&limit=1');
  if (hb.status === 200 && hb.body.trim() === '[]') pass('rls', 'heartbeats: anon ve 0 filas');
  else if (hb.status === 401 || hb.status === 403) pass('rls', `heartbeats: anon bloqueado (${hb.status})`);
  else fail('rls', `heartbeats: status ${hb.status} body ${hb.body.slice(0, 80)}`);
}

/* 3. Edge functions protegidas rechazan anon */
console.log('== 3. Seguridad de functions ==');
{
  const must401 = ['send-push-notifications', 'mood-notifications', 're-engagement-drip', 'surprise-drops', 'cron-health-check', 'account-deletion', 'ai-weekly-digest'];
  for (const fn of must401) {
    try {
      const status = await fnCall(fn);
      if (status === 401 || status === 403) pass('edge', `${fn}: anon rechazado (${status})`);
      else fail('edge', `${fn}: anon NO fue rechazado (status ${status})`);
    } catch (e) {
      fail('edge', `${fn}: error de red ${e.message}`);
    }
  }
}

/* 4. Web publica */
console.log('== 4. Sitio publico ==');
{
  const pages = ['https://yayika.com/', 'https://yayika.com/tienda.html', 'https://yayika.com/sitemap.xml'];
  for (const url of pages) {
    try {
      const r = await fetch(url);
      if (r.status === 200) pass('web', `${url} -> 200`);
      else fail('web', `${url} -> ${r.status}`);
    } catch (e) {
      fail('web', `${url}: ${e.message}`);
    }
  }
}

console.log(`\n========================================`);
if (fails === 0) {
  console.log(`QA LIVE: PASS (${warns} avisos)`);
  process.exit(0);
} else {
  console.log(`QA LIVE: FAIL - ${fails} errores, ${warns} avisos`);
  process.exit(1);
}
