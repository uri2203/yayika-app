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
        console.log('[' + res.statusCode + ']', d.substring(0, 200));
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
    // 1. yayika_circles - main circles table
    `CREATE TABLE IF NOT EXISTS yayika_circles (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      emoji TEXT DEFAULT '💜',
      category TEXT DEFAULT 'general',
      creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      max_members INTEGER DEFAULT 20,
      is_private BOOLEAN DEFAULT false,
      cover_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 2. yayika_circle_members - membership
    `CREATE TABLE IF NOT EXISTS yayika_circle_members (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      circle_id UUID NOT NULL REFERENCES yayika_circles(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT DEFAULT 'member',
      status TEXT DEFAULT 'active',
      joined_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(circle_id, user_id)
    )`,

    // 3. yayika_circle_messages - real-time chat
    `CREATE TABLE IF NOT EXISTS yayika_circle_messages (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      circle_id UUID NOT NULL REFERENCES yayika_circles(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      reply_to UUID REFERENCES yayika_circle_messages(id),
      edited BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,

    // 4. yayika_circle_invites - invitations
    `CREATE TABLE IF NOT EXISTS yayika_circle_invites (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      circle_id UUID NOT NULL REFERENCES yayika_circles(id) ON DELETE CASCADE,
      invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
    )`,

    // 5. Indexes
    `CREATE INDEX IF NOT EXISTS idx_circles_creator ON yayika_circles(creator_id)`,
    `CREATE INDEX IF NOT EXISTS idx_circles_category ON yayika_circles(category)`,
    `CREATE INDEX IF NOT EXISTS idx_circle_members_circle ON yayika_circle_members(circle_id)`,
    `CREATE INDEX IF NOT EXISTS idx_circle_members_user ON yayika_circle_members(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_circle_messages_circle ON yayika_circle_messages(circle_id, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_circle_messages_user ON yayika_circle_messages(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_circle_invites_circle ON yayika_circle_invites(circle_id)`,
    `CREATE INDEX IF NOT EXISTS idx_circle_invites_user ON yayika_circle_invites(invited_user_id)`,

    // 6. RLS
    `ALTER TABLE yayika_circles ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE yayika_circle_members ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE yayika_circle_messages ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE yayika_circle_invites ENABLE ROW LEVEL SECURITY`,

    // 7. RLS policies - circles
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
    `DO $$ BEGIN
      CREATE POLICY "Creators can delete their circles" ON yayika_circles
        FOR DELETE USING (auth.uid() = creator_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,

    // 8. RLS policies - members
    `DO $$ BEGIN
      CREATE POLICY "Members can view circle members" ON yayika_circle_members
        FOR SELECT USING (
          circle_id IN (SELECT circle_id FROM yayika_circle_members WHERE user_id = auth.uid())
        );
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Users can join circles" ON yayika_circle_members
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Users can leave circles" ON yayika_circle_members
        FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,

    // 9. RLS policies - messages
    `DO $$ BEGIN
      CREATE POLICY "Members can view messages" ON yayika_circle_messages
        FOR SELECT USING (
          circle_id IN (SELECT circle_id FROM yayika_circle_members WHERE user_id = auth.uid())
        );
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Members can send messages" ON yayika_circle_messages
        FOR INSERT WITH CHECK (
          auth.uid() = user_id AND
          circle_id IN (SELECT circle_id FROM yayika_circle_members WHERE user_id = auth.uid() AND status = 'active')
        );
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Users can edit own messages" ON yayika_circle_messages
        FOR UPDATE USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Users can delete own messages" ON yayika_circle_messages
        FOR DELETE USING (auth.uid() = user_id);
    EXCEPTION WHEN duplicate_object THEN null; END $$`,

    // 10. RLS policies - invites
    `DO $$ BEGIN
      CREATE POLICY "Circle members can view invites" ON yayika_circle_invites
        FOR SELECT USING (
          circle_id IN (SELECT circle_id FROM yayika_circle_members WHERE user_id = auth.uid())
        );
    EXCEPTION WHEN duplicate_object THEN null; END $$`,
    `DO $$ BEGIN
      CREATE POLICY "Members can create invites" ON yayika_circle_invites
        FOR INSERT WITH CHECK (
          auth.uid() = invited_by AND
          circle_id IN (SELECT circle_id FROM yayika_circle_members WHERE user_id = auth.uid() AND role = 'admin')
        );
    EXCEPTION WHEN duplicate_object THEN null; END $$`,

    // 11. Enable realtime for messages
    `ALTER PUBLICATION supabase_realtime ADD TABLE yayika_circle_messages`,

    // 12. Seed default circles
    `INSERT INTO yayika_circles (name, description, emoji, category, creator_id, max_members, is_private) VALUES
      ('Mujeres Emprendedoras', 'Espacio para compartir ideas de negocio y apoyo mutuo', '🚀', 'emprendimiento', (SELECT id FROM auth.users LIMIT 1), 50, false),
      ('Salud y Bienestar', 'Hablemos de salud, ejercicio y bienestar femenino', '💪', 'bienestar', (SELECT id FROM auth.users LIMIT 1), 50, false),
      ('Finanzas Sin Pena', 'Aprende a manejar tu dinero con otras mujeres', '💰', 'finanzas', (SELECT id FROM auth.users LIMIT 1), 50, false),
      ('Mamás Emprendedoras', 'Para mamás que construyen su negocio mientras crían', '👶', 'general', (SELECT id FROM auth.users LIMIT 1), 30, false),
      ('Recipes & Self-care', 'Recetas, rutinas de skincare y tiempo para ti', '✨', 'bienestar', (SELECT id FROM auth.users LIMIT 1), 40, false)
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
