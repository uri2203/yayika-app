#!/usr/bin/env node
/**
 * QA GATE - Yayika app (offline)
 * Ejecutar: node qa/check-app.js   (o: npm run qa)
 * Sale con código 1 si algún check falla.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'qa', '.expo', 'dist', 'android', 'ios']);

// Edge functions que DEBEN rechazar anon (guard de rol service)
// (account-deletion autentica al usuario con su propio JWT: el rechazo a anon se verifica en check-live)
const PROTECTED_FNS = [
  'send-push-notifications',
  'mood-notifications',
  're-engagement-drip',
  'surprise-drops',
  'cron-health-check',
];

let fails = 0;
let warns = 0;
const fail = (s, m) => { fails++; console.log(`  FAIL [${s}] ${m}`); };
const warn = (s, m) => { warns++; console.log(`  WARN [${s}] ${m}`); };
const pass = (s, m) => console.log(`  ok   [${s}] ${m}`);

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    if (SKIP_DIRS.has(f)) continue;
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(ROOT);
const tsFiles = allFiles.filter((f) => /\.(ts|tsx)$/.test(f));

console.log(`QA APP: ${tsFiles.length} archivos TS/TSX\n`);

/* ---------- 1. TypeScript ---------- */
console.log('== 1. TypeScript (tsc --noEmit) ==');
{
  try {
    execFileSync('npx', ['tsc', '--noEmit'], { cwd: ROOT, stdio: 'pipe', shell: true });
    pass('tsc', '0 errores de tipos');
  } catch (e) {
    const out = ((e.stdout || '') + '' + (e.stderr || '')).split('\n').filter((l) => l.includes('error TS'));
    const real = out.filter((l) => !l.includes('test-pg-protocol.js'));
    if (real.length === 0) {
      pass('tsc', `0 errores reales (${out.length} de scripts/test-pg-protocol.js, ruido conocido)`);
    } else {
      for (const l of real.slice(0, 20)) fail('tsc', l.trim());
      if (real.length > 20) fail('tsc', `... y ${real.length - 20} mas`);
    }
  }
}

/* ---------- 2. i18n: keys usadas vs 5 idiomas ---------- */
console.log('== 2. i18n (5 idiomas) ==');
{
  const i18nPath = path.join(ROOT, 'src', 'config', 'i18n.ts');
  const lines = fs.readFileSync(i18nPath, 'utf8').split(/\r?\n/);
  const starts = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^  (es|en|pt|fr|de): \{/);
    if (m && starts[m[1]] === undefined) starts[m[1]] = i;
  }
  const langs = Object.keys(starts).sort((a, b) => starts[a] - starts[b]);
  if (langs.length !== 5) fail('i18n', `i18n.ts tiene ${langs.length} bloques (esperados 5)`);
  const dict = {};
  for (let li = 0; li < langs.length; li++) {
    const lang = langs[li];
    const a = starts[lang];
    // el ultimo bloque termina en su primer '^  }' (el resto del archivo son funciones)
    let b;
    if (li + 1 < langs.length) b = starts[langs[li + 1]];
    else {
      b = lines.length;
      for (let i = a + 1; i < lines.length; i++) {
        if (/^ {2}\}$/.test(lines[i]) || /^ {2}\},$/.test(lines[i])) {
          b = i;
          break;
        }
      }
    }
    const set = new Set();
    for (let i = a; i < b; i++) {
      const m = lines[i].match(/^ {4}([A-Za-z0-9_]+): /);
      if (m) set.add(m[1]);
    }
    dict[lang] = set;
  }
  const base = dict.es ? dict.es.size : 0;
  for (const l of langs) {
    if (dict[l].size !== base) warn('i18n', `${l}: ${dict[l].size} keys vs es: ${base} (deriva entre idiomas)`);
  }
  const prefixes = new Set();
  const used = new Set();
  const preRe = /\bt\(\s*['"]([A-Za-z0-9_]+_)['"]\s*\+/g;
  for (const f of tsFiles) {
    const src = fs.readFileSync(f, 'utf8');
    let m;
    while ((m = preRe.exec(src))) prefixes.add(m[1]);
    for (const mm of src.matchAll(/\bt\(\s*['"]([A-Za-z0-9_]+)['"]/g)) used.add(mm[1]);
  }
  let bad = 0;
  for (const key of [...used].sort()) {
    if ([...prefixes].some((p) => key.startsWith(p))) continue;
    const missing = langs.filter((l) => !dict[l].has(key));
    if (missing.length) {
      fail('i18n', `key "${key}" falta en: ${missing.join(',')}`);
      bad++;
    }
  }
  if (bad === 0) pass('i18n', `${used.size} keys usadas existen en los 5 idiomas`);
}

/* ---------- 3. Codificacion ---------- */
console.log('== 3. Codificacion ==');
{
  let bad = 0;
  for (const f of tsFiles) {
    if (fs.readFileSync(f, 'utf8').includes('�')) {
      fail('codificacion', `${path.relative(ROOT, f)}: U+FFFD`);
      bad++;
    }
  }
  if (bad === 0) pass('codificacion', '0 caracteres U+FFFD en src');
}

/* ---------- 4. Edge functions ---------- */
console.log('== 4. Edge functions ==');
{
  const fnsDir = path.join(ROOT, 'supabase', 'functions');
  const dirs = fs.existsSync(fnsDir) ? fs.readdirSync(fnsDir).filter((d) => fs.statSync(path.join(fnsDir, d)).isDirectory()) : [];
  let bad = 0;
  for (const d of dirs) {
    const idx = path.join(fnsDir, d, 'index.ts');
    if (!fs.existsSync(idx)) {
      fail('edge', `${d}: falta index.ts`);
      bad++;
      continue;
    }
    const src = fs.readFileSync(idx, 'utf8');
    if (PROTECTED_FNS.includes(d)) {
      const hasGuard = /service_role/.test(src) && (/jwt\.decode|payload\.role|"role"|'role'/.test(src));
      if (!hasGuard) {
        fail('edge', `${d}: falta guard de rol service (anon podria invocarla)`);
        bad++;
      }
    }
  }
  if (bad === 0) pass('edge', `${dirs.length} functions con index.ts; ${PROTECTED_FNS.length} protegidas verificadas`);
}

/* ---------- Resultado ---------- */
console.log(`\n========================================`);
if (fails === 0) {
  console.log(`QA APP: PASS (${warns} avisos)`);
  process.exit(0);
} else {
  console.log(`QA APP: FAIL - ${fails} errores, ${warns} avisos`);
  process.exit(1);
}
