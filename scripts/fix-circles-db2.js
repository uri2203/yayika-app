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
    // First check what columns exist
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'yayika_circles' ORDER BY ordinal_position`,

    // Add missing columns to yayika_circles
    `ALTER TABLE yayika_circles ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE`,
    `ALTER TABLE yayika_circles ADD COLUMN IF NOT EXISTS emoji TEXT DEFAULT '💜'`,
    `ALTER TABLE yayika_circles ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'`,
    `ALTER TABLE yayika_circles ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 20`,
    `ALTER TABLE yayika_circles ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false`,
    `ALTER TABLE yayika_circles ADD COLUMN IF NOT EXISTS cover_url TEXT`,
    `ALTER TABLE yayika_circles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`,

    // Add status column to circle_members if missing
    `ALTER TABLE yayika_circle_members ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`,

    // Add message_type, reply_to, edited to circle_messages if missing
    `ALTER TABLE yayika_circle_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text'`,
    `ALTER TABLE yayika_circle_messages ADD COLUMN IF NOT EXISTS reply_to UUID`,
    `ALTER TABLE yayika_circle_messages ADD COLUMN IF NOT EXISTS edited BOOLEAN DEFAULT false`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_circles_creator ON yayika_circles(creator_id)`,
    `CREATE INDEX IF NOT EXISTS idx_circles_category ON yayika_circles(category)`,
    `CREATE INDEX IF NOT EXISTS idx_circle_messages_circle ON yayika_circle_messages(circle_id, created_at)`,

    // RLS policies for circles
    `DO $$ BEGIN
      CREATE POLICY "Public circles visible to all" ON yayika_circles
        FOR SELECT USING (is_private = false);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Private circles visible to members" ON yayika_circles
        FOR SELECT USING (
          is_private = true AND id IN (
            SELECT circle_id FROM yayika_circle_members WHERE user_id = auth.uid() AND status = 'active'
          )
        );
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Users can create circles" ON yayika_circles
        FOR INSERT WITH CHECK (auth.uid() = creator_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Creators can update their circles" ON yayika_circles
        FOR UPDATE USING (auth.uid() = creator_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,

    // RLS policies for messages
    `DO $$ BEGIN
      CREATE POLICY "Members can send messages" ON yayika_circle_messages
        FOR INSERT WITH CHECK (
          auth.uid() = user_id AND
          circle_id IN (SELECT circle_id FROM yayika_circle_members WHERE user_id = auth.uid() AND status = 'active')
        );
    EXCEPTION WHEN duplicate_object THEN null; END $$`,

    // Enable realtime
    `ALTER PUBLICATION supabase_realtime ADD TABLE yayika_circle_messages`,

    // Seed circles - use a subquery for creator_id
    `INSERT INTO yayika_circles (name, description, emoji, category, creator_id, max_members, is_private)
      SELECT 'Mujeres Emprendedoras', 'Espacio para compartir ideas de negocio y apoyo mutuo', '🚀', 'emprendimiento', id, 50, false
      FROM auth.users WHERE email LIKE '%@%' LIMIT 1
      ON CONFLICT DO NOTHING`,
    `INSERT INTO yayika_circles (name, description, emoji, category, creator_id, max_members, is_private)
      SELECT 'Salud y Bienestar', 'Hablemos de salud, ejercicio y bienestar femenino', '💪', 'bienestar', id, 50, false
      FROM auth.users WHERE email LIKE '%@%' LIMIT 1
      ON CONFLICT DO NOTHING`,
    `INSERT INTO yayika_circles (name, description, emoji, category, creator_id, max_members, is_private)
      SELECT 'Finanzas Sin Pena', 'Aprende a manejar tu dinero con otras mujeres', '💰', 'finanzas', id, 50, false
      FROM auth.users WHERE email LIKE '%@%' LIMIT 1
      ON CONFLICT DO NOTHING`,
    `INSERT INTO yayika_circles (name, description, emoji, category, creator_id, max_members, is_private)
      SELECT 'Mamás Emprendedoras', 'Para mamás que construyen su negocio mientras crían', '👶', 'general', id, 30, false
      FROM auth.users WHERE email LIKE '%@%' LIMIT 1
      ON CONFLICT DO NOTHING`,
    `INSERT INTO yayika_circles (name, description, emoji, category, creator_id, max_members, is_private)
      SELECT 'Recipes & Self-care', 'Recetas, rutinas de skincare y tiempo para ti', '✨', 'bienestar', id, 40, false
      FROM auth.users WHERE email LIKE '%@%' LIMIT 1
      ON CONFLICT DO NOTHING`,
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
