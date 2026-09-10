const { Client } = require('pg');

async function tryAll() {
  const password = encodeURIComponent('1Qawsedrftg#$$$$$');
  
  const urls = [
    // Session pooler with project ref in user
    `postgresql://postgres.odbhxiymteppgaqqdsoy:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
    // Transaction pooler  
    `postgresql://odbhxiymteppgaqqdsoy:${password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require`,
    // Direct connection via session pooler
    `postgresql://postgres:${password}@db.odbhxiymteppgaqqdsoy.supabase.co:5432/postgres?sslmode=require`,
  ];

  for (const url of urls) {
    console.log('Trying:', url.substring(0, 80) + '...');
    try {
      const c = new Client({ connectionString: url, connectionTimeoutMillis: 10000 });
      await c.connect();
      console.log('CONNECTED!');
      const res = await c.query("SELECT current_database(), current_user, version()");
      console.log('DB:', res.rows[0]);
      
      // Run migration
      const fs = require('fs');
      const sql = fs.readFileSync('supabase/migrations/007_surprise_mood_prestige.sql', 'utf8');
      await c.query(sql);
      console.log('MIGRATION 007 EXECUTED SUCCESSFULLY!');
      await c.end();
      return true;
    } catch (e) {
      console.log('  FAIL:', e.message.substring(0, 150));
    }
  }
  return false;
}

tryAll().then(ok => {
  if (!ok) console.log('\nAll attempts failed');
  process.exit();
});
