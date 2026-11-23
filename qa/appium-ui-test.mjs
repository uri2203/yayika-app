#!/usr/bin/env node
/**
 * Prueba REAL de UI de la app Yayika en Android (Appium + UiAutomator2).
 * Para cada idioma: instala el APK, hace login con la cuenta de prueba,
 * verifica que carga el dashboard y guarda screenshot + jerarquía.
 */
import fs from 'fs';
import path from 'path';

const BASE = process.env.APPIUM_URL || 'http://127.0.0.1:4723';
const APK = process.env.YAYIKA_APK || path.resolve('android/app/build/outputs/apk/release/app-release.apk');
const OUT = path.resolve('qa/results/ui');
fs.mkdirSync(OUT, { recursive: true });

const EMAIL = process.env.YAYIKA_TEST_EMAIL || 'test@yayika.com';
const PASSWORD = process.env.YAYIKA_TEST_PASSWORD || 'Yayika2026';

const CASES = [
  { lang: 'es', locale: 'es_ES', login: 'Iniciar sesión' },
  { lang: 'en', locale: 'en_US', login: 'Sign in' },
  { lang: 'pt', locale: 'pt_BR', login: 'Entrar' },
  { lang: 'fr', locale: 'fr_FR', login: 'Se connecter' },
  { lang: 'de', locale: 'de_DE', login: 'Anmelden' },
];

async function req(method, urlPath, body) {
  const r = await fetch(BASE + urlPath, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let j = {};
  try { j = JSON.parse(text); } catch {}
  if (!r.ok) throw new Error(`${method} ${urlPath} -> ${r.status} ${text.slice(0, 300)}`);
  return j.value !== undefined ? j.value : j;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const elId = (el) => (typeof el === 'string' ? el : el?.['element-6066-11e4-a52e-4f735466cecf'] || el?.ELEMENT);

async function find(session, using, value, timeoutMs = 20000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) {
    try {
      const el = await req('POST', `/session/${session}/element`, { using, value });
      if (elId(el)) return elId(el);
    } catch {}
    await sleep(500);
  }
  return null;
}

async function runCase(test) {
  let session;
  const result = { lang: test.lang, locale: test.locale, ok: false, steps: [] };
  try {
    const created = await req('POST', '/session', {
      capabilities: {
        alwaysMatch: {
          platformName: 'Android',
          'appium:automationName': 'UiAutomator2',
          'appium:deviceName': 'Android Emulator',
          'appium:app': APK,
          'appium:locale': test.locale,
          'appium:noReset': false,
          'appium:fullReset': true,
          'appium:newCommandTimeout': 180,
        },
      },
    });
    session = created.sessionId || created.session?.sessionId || created.sessionId_;
    if (!session) throw new Error('No sessionId: ' + JSON.stringify(created).slice(0, 300));
    result.steps.push('session');

    await sleep(4000);
    const emailEl = await find(session, 'xpath', '//android.widget.EditText[1]', 30000);
    if (!emailEl) throw new Error('No apareció el campo email');
    await req('POST', `/session/${session}/element/${emailEl}/value`, { text: EMAIL });
    const passEl = await find(session, 'xpath', '//android.widget.EditText[2]', 10000);
    if (!passEl) throw new Error('No apareció el campo password');
    await req('POST', `/session/${session}/element/${passEl}/value`, { text: PASSWORD });
    result.steps.push('credentials');

    const btn = await find(session, 'xpath', `//*[@text='${test.login}']`, 10000)
      || await find(session, 'xpath', '//android.widget.Button', 10000);
    if (!btn) throw new Error('No apareció el botón de login');
    await req('POST', `/session/${session}/element/${btn}/click`, {});
    result.steps.push('login-click');

    await sleep(6000);
    const source = await req('GET', `/session/${session}/source`);
    const xml = typeof source === 'string' ? source : JSON.stringify(source);
    fs.writeFileSync(path.join(OUT, `${test.lang}-source.xml`), xml);
    const shot = await req('GET', `/session/${session}/screenshot`);
    fs.writeFileSync(path.join(OUT, `${test.lang}.png`), Buffer.from(String(shot), 'base64'));
    result.ok = /Yayika|Inicio|Home|Portal/i.test(xml);
    result.steps.push(result.ok ? 'dashboard-ok' : 'dashboard-unknown');
  } catch (e) {
    result.error = e.message;
  } finally {
    if (session) { try { await req('DELETE', `/session/${session}`); } catch {} }
  }
  return result;
}

const results = [];
for (const t of CASES) {
  const r = await runCase(t);
  results.push(r);
  console.log(`${t.lang}: ${r.ok ? 'PASS' : 'FAIL'} ${r.steps.join(' > ')}${r.error ? ' | ' + r.error : ''}`);
}
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
console.log(`UI real: ${results.filter((r) => r.ok).length}/${results.length} idiomas OK`);
