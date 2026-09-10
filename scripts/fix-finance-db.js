const https = require('https');
const PAT = 'sbp_v0_5e4fb6e8f9bdddfa24ac5f84df0ae2fd0d31655f';

function runSQL(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const opts = {
      hostname: 'api.supabase.com',
      path: '/v1/projects/odbhxiymteppgaqqdsoy/database/query',
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
      res.on('end', () => {
        console.log('[' + res.statusCode + ']', d.substring(0, 300));
        resolve({ status: res.statusCode, data: d });
      });
    });
    req.on('error', e => { console.log('Error:', e.message); reject(e); });
    req.write(body);
    req.end();
  });
}

async function main() {
  const steps = [
    // 1. Create yayika_budget table
    `CREATE TABLE IF NOT EXISTS yayika_budget (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      monthly_income DECIMAL(10,2) DEFAULT 0,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id)
    )`,

    // 2. Add date column to yayika_transactions
    `ALTER TABLE yayika_transactions ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE`,

    // 3. Update existing transactions to use created_at as date
    `UPDATE yayika_transactions SET date = DATE(created_at) WHERE date IS NULL`,

    // 4. RLS for budget
    `ALTER TABLE yayika_budget ENABLE ROW LEVEL SECURITY`,

    // 5. Budget policies
    `DO $$ BEGIN
      CREATE POLICY "Users can view own budget" ON yayika_budget
        FOR SELECT USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Users can insert own budget" ON yayika_budget
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Users can update own budget" ON yayika_budget
        FOR UPDATE USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,

    // 6. Index for budget
    `CREATE INDEX IF NOT EXISTS idx_yayika_budget_user ON yayika_budget(user_id)`,
  ];

  let ok = 0, fail = 0;
  for (let i = 0; i < steps.length; i++) {
    console.log('Step ' + (i + 1) + '/' + steps.length);
    const r = await runSQL(steps[i]);
    if (r.status >= 200 && r.status < 300) ok++;
    else fail++;
  }
  console.log('\n=== DONE: ' + ok + ' OK, ' + fail + ' FAILED ===');
}

main();
