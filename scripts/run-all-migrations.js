const { Client } = require('pg');

async function tryAll() {
  const password = encodeURIComponent('1Qawsedrftg#$$$$$');
  
  const configs = [
    {
      connectionString: `postgresql://postgres.odbhxiymteppgaqqdsoy:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      ssl: { rejectUnauthorized: false }
    },
    {
      connectionString: `postgresql://odbhxiymteppgaqqdsoy:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
      ssl: { rejectUnauthorized: false }
    }
  ];

  for (const cfg of configs) {
    console.log('Trying:', cfg.connectionString.substring(0, 80) + '...');
    try {
      const c = new Client({ ...cfg, connectionTimeoutMillis: 10000 });
      await c.connect();
      console.log('CONNECTED!');
      const res = await c.query("SELECT current_database(), current_user, version()");
      console.log('DB:', res.rows[0]);
      
      // Run migration
      const fs = require('fs');
      const sql = fs.readFileSync('supabase/migrations/007_surprise_mood_prestige.sql', 'utf8');
      await c.query(sql);
      console.log('MIGRATION 007 EXECUTED SUCCESSFULLY!');
      
      // Also run earlier migrations that might not exist
      const migrations = ['003_add_push_tokens.sql', '004_retention_system.sql', '005_push_notifications_cron.sql', '006_secret_badges_seasons.sql'];
      for (const m of migrations) {
        try {
          const msql = fs.readFileSync('supabase/migrations/' + m, 'utf8');
          await c.query(msql);
          console.log('Migration', m, 'executed');
        } catch (e) {
          console.log('Migration', m, ':', e.message.substring(0, 80));
        }
      }
      
      await c.end();
      return true;
    } catch (e) {
      console.log('  FAIL:', e.message.substring(0, 200));
    }
  }
  return false;
}

tryAll().then(ok => {
  if (!ok) console.log('\nAll attempts failed');
  process.exit();
});
