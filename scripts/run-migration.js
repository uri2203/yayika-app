const https = require('https');
const fs = require('fs');
const { requireEnv, requireFlag } = require('./_env');

// The Management API expects a Personal Access Token, not the service_role JWT.
const ACCESS_TOKEN = requireEnv('SUPABASE_ACCESS_TOKEN');
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'odbhxiymteppgaqqdsoy';

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        console.log(`[${res.statusCode}] ${data.substring(0, 200)}`);
        resolve({ status: res.statusCode, data });
      });
    });
    req.on('error', (e) => { console.log('Error:', e.message); reject(e); });
    req.write(body);
    req.end();
  });
}

async function main() {
  requireFlag('SUPABASE_ALLOW_DB_WRITES', 'This script applies migrations against the database.');
  const sql = fs.readFileSync('supabase/migrations/007_surprise_mood_prestige.sql', 'utf8');
  console.log('=== Running migration 007 ===');
  const result = await runSQL(sql);
  
  if (result.status !== 200) {
    console.log('\nManagement API needs Personal Access Token. Trying alternative...');
    // Try creating exec_sql via Supabase dashboard SQL endpoint
    const createFunc = `CREATE OR REPLACE FUNCTION exec_sql(sql_query text) RETURNS void AS $$ BEGIN EXECUTE sql_query; END; $$ LANGUAGE plpgsql SECURITY DEFINER;`;
    const result2 = await runSQL(createFunc);
  }
}

main().catch(console.error);
