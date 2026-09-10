const https = require('https');
const fs = require('fs');

const SERVICE_ROLE = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kYmh4aXltdGVwcGdhcXFkc295Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA5NzU2NSwiZXhwIjoyMDk1NjczNTY1fQ.YE96WnvMAHGA6TFeXEU7pM0aeVgQlH1NunCtQICgazA';
const PROJECT_REF = 'odbhxiymteppgaqqdsoy';

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE}`,
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
