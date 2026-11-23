const https = require('https');
const fs = require('fs');
const { requireEnv } = require('./_env');
const PAT = requireEnv('SUPABASE_ACCESS_TOKEN');
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'odbhxiymteppgaqqdsoy';

// These functions are called from the app with a session token or from pg_cron
// with the service_role token, so the gateway can verify the JWT.
const VERIFY_JWT = {
  'stripe-webhook': false,
};

function shouldVerifyJwt(slug) {
  return VERIFY_JWT[slug] !== false;
}

const functionsToCreate = [
  'retention-check-in',
  'send-push-notifications',
  'seasonal-events',
  'retention-projection',
  'retention-circle',
];

async function createFunction(slug) {
  const file = 'supabase/functions/' + slug + '/index.ts';
  if (!fs.existsSync(file)) { console.log(slug + ': NOT FOUND - skipping'); return; }
  
  const code = fs.readFileSync(file, 'utf8');
  const body = JSON.stringify({ slug: slug, name: slug, body: code, verify_jwt: shouldVerifyJwt(slug) });
  
  return new Promise((resolve) => {
    const opts = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/functions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + PAT,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { console.log(slug + ': [' + res.statusCode + '] ' + (res.statusCode === 201 ? 'DEPLOYED OK' : d.substring(0, 200))); resolve(); });
    });
    req.on('error', e => { console.log(slug + ': ERROR ' + e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

async function main() {
  for (const fn of functionsToCreate) {
    await createFunction(fn);
  }
  console.log('\nDone!');
}

main();
