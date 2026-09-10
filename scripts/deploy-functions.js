const https = require('https');
const fs = require('fs');
const PAT = 'sbp_v0_5e4fb6e8f9bdddfa24ac5f84df0ae2fd0d31655f';

async function updateFunction(slug) {
  const file = 'supabase/functions/' + slug + '/index.ts';
  const code = fs.readFileSync(file, 'utf8');
  const body = JSON.stringify({ slug: slug, name: slug, body: code, verify_jwt: false });
  return new Promise((resolve) => {
    const opts = {
      hostname: 'api.supabase.com',
      path: '/v1/projects/odbhxiymteppgaqqdsoy/functions/' + slug,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + PAT,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { console.log(slug + ': [' + res.statusCode + '] ' + d.substring(0, 200)); resolve(); });
    });
    req.on('error', e => { console.log('Error:', e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

async function main() {
  // Update existing stripe-webhook
  await updateFunction('stripe-webhook');

  // Also update retention-check-in and send-push-notifications and seasonal-events
  for (const fn of ['retention-check-in', 'send-push-notifications', 'seasonal-events', 'retention-projection', 'retention-circle', 'ai-onboarding']) {
    const file = 'supabase/functions/' + fn + '/index.ts';
    if (fs.existsSync(file)) {
      await updateFunction(fn);
    }
  }

  // List all deployed functions
  return new Promise((resolve) => {
    const opts = {
      hostname: 'api.supabase.com',
      path: '/v1/projects/odbhxiymteppgaqqdsoy/functions',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + PAT }
    };
    const req = https.request(opts, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const fns = JSON.parse(d);
        console.log('\n=== ALL DEPLOYED FUNCTIONS ===');
        fns.forEach(f => console.log('  ' + f.slug + ' (v' + f.version + ') ' + f.status));
        resolve();
      });
    });
    req.on('error', e => { console.log('Error:', e.message); resolve(); });
    req.end();
  });
}

main();
