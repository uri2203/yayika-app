const { Client } = require('pg');

async function tryConnect() {
  const configs = [
    // Direct connection (IPv4 workaround)
    { host: 'db.odbhxiymteppgaqqdsoy.supabase.co', port: 5432, user: 'postgres', password: '1Qawsedrftg#$$$$$' },
    // Pooler session mode
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: 'postgres', password: '1Qawsedrftg#$$$$$', options: '-c search_path=public' },
    // Pooler with project in user
    { host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, user: 'postgres.odbhxiymteppgaqqdsoy', password: '1Qawsedrftg#$$$$$' },
    // IPv4 direct
    { host: '104.18.38.10', port: 5432, user: 'postgres', password: '1Qawsedrftg#$$$$$' },
  ];

  for (const cfg of configs) {
    const c = new Client({ ...cfg, database: 'postgres', ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
    try {
      await c.connect();
      console.log('CONNECTED:', JSON.stringify(cfg));
      const res = await c.query("SELECT current_database(), current_user, version()");
      console.log('DB Info:', res.rows[0]);
      await c.end();
      return c;
    } catch (e) {
      console.log('FAIL:', cfg.host + ':' + cfg.port, e.message.substring(0, 80));
    }
  }
  return null;
}

tryConnect();
