const https = require('https');
const fs = require('fs');
const PAT = 'sbp_v0_5e4fb6e8f9bdddfa24ac5f84df0ae2fd0d31655f';

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
  const body = JSON.stringify({ slug: slug, name: slug, body: code, verify_jwt: false });
  
  return new Promise((resolve) => {
    const opts = {
      hostname: 'api.supabase.com',
      path: '/v1/projects/odbhxiymteppgaqqdsoy/functions',
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
