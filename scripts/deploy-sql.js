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
        console.log('[' + res.statusCode + ']', d.substring(0, 800));
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
    // 1. Create surprise_log table
    `CREATE TABLE IF NOT EXISTS yayika_surprise_log (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      surprise_type TEXT NOT NULL,
      surprise_date DATE NOT NULL DEFAULT CURRENT_DATE,
      value INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, surprise_date)
    )`,

    // 2. Create mood_entries table
    `CREATE TABLE IF NOT EXISTS yayika_mood_entries (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      mood TEXT NOT NULL,
      intensity INTEGER DEFAULT 5 CHECK (intensity BETWEEN 1 AND 10),
      logged_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 3. Add columns to profiles (uses 'id' not 'user_id', 'xp_total' not 'xp', 'streak_days' not 'streak')
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badge_showcase TEXT[] DEFAULT '{}'`,
    `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS prestige_level INTEGER DEFAULT 1`,

    // 4. Indexes
    `CREATE INDEX IF NOT EXISTS idx_surprise_log_user_date ON yayika_surprise_log(user_id, surprise_date)`,
    `CREATE INDEX IF NOT EXISTS idx_mood_entries_user ON yayika_mood_entries(user_id, logged_at DESC)`,

    // 5. RLS
    `ALTER TABLE yayika_surprise_log ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE yayika_mood_entries ENABLE ROW LEVEL SECURITY`,

    // 6. Policies (safe with DO blocks)
    `DO $$ BEGIN
      CREATE POLICY "Users can view own surprise log" ON yayika_surprise_log
        FOR SELECT USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Users can insert own surprise log" ON yayika_surprise_log
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Users can view own mood entries" ON yayika_mood_entries
        FOR SELECT USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Users can insert own mood entries" ON yayika_mood_entries
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,

    // 7. Leaderboard view (correct column names)
    `CREATE OR REPLACE VIEW public_leaderboard AS
    SELECT id as user_id, display_name, avatar_url, streak_days, xp_total, prestige_level
    FROM profiles
    WHERE streak_days > 0 OR xp_total > 0
    ORDER BY streak_days DESC, xp_total DESC
    LIMIT 100`,
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
