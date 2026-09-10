const { Client } = require('pg');
const tls = require('tls');
const net = require('net');

async function tryConnect() {
  // The pooler needs SNI - let's force it via ssl.servername
  const configs = [
    // Pooler with SNI hostname
    {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      user: 'postgres',
      password: '1Qawsedrftg#$$$$$',
      database: 'postgres',
      ssl: { rejectUnauthorized: false, servername: 'odbhxiymteppgaqqdsoy' },
      connectionTimeoutMillis: 10000
    },
    // Pooler with SNI using full domain
    {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      user: 'postgres',
      password: '1Qawsedrftg#$$$$$',
      database: 'postgres',
      ssl: { rejectUnauthorized: false, servername: 'odbhxiymteppgaqqdsoy.supabase.co' },
      connectionTimeoutMillis: 10000
    },
    // Try IPv6 directly 
    {
      host: '2600:1f16:1109:3f02:2021:b0f2:6caa:fef6',
      port: 5432,
      user: 'postgres',
      password: '1Qawsedrftg#$$$$$',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      family: 6
    },
  ];

  for (const cfg of configs) {
    try {
      console.log(`Trying: ${cfg.host}:${cfg.port} user=${cfg.user} ssl.servername=${cfg.ssl?.servername || 'none'}`);
      const c = new Client(cfg);
      await c.connect();
      console.log('CONNECTED!');
      const res = await c.query("SELECT current_database(), current_user, version()");
      console.log('DB Info:', res.rows[0]);
      await c.end();
      return c;
    } catch (e) {
      console.log('  FAIL:', e.code || '', e.message.substring(0, 100));
    }
  }
  return null;
}

tryConnect();
