const { Client } = require('pg');
const dns = require('dns');

async function tryConnect() {
  // Force IPv4 resolution
  return new Promise(async (resolve) => {
    // Try the pooler with proper session mode setup
    const sessionPooler = {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      user: 'postgres',
      password: '1Qawsedrftg#$$$$$',
      database: 'postgres',
      ssl: { 
        rejectUnauthorized: false,
        servername: 'odbhxiymteppgaqqdsoy.supabase.co'
      },
      connectionTimeoutMillis: 15000
    };

    console.log('1. Trying pooler with project supabase.co SNI...');
    try {
      const c = new Client(sessionPooler);
      await c.connect();
      console.log('CONNECTED via pooler!');
      const res = await c.query("SELECT current_database(), current_user");
      console.log('DB:', res.rows[0]);
      await c.end();
      resolve(c);
      return;
    } catch (e) {
      console.log('  FAIL:', e.message.substring(0, 100));
    }

    // Try with external_id parameter in options
    console.log('2. Trying pooler with external_id...');
    const extIdConfig = {
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      user: 'postgres.odbhxiymteppgaqqdsoy',
      password: '1Qawsedrftg#$$$$$',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 15000,
      options: '-c external_id=odbhxiymteppgaqqdsoy'
    };
    try {
      const c = new Client(extIdConfig);
      await c.connect();
      console.log('CONNECTED via external_id!');
      const res = await c.query("SELECT current_database(), current_user");
      console.log('DB:', res.rows[0]);
      await c.end();
      resolve(c);
      return;
    } catch (e) {
      console.log('  FAIL:', e.message.substring(0, 100));
    }

    // Try raw TCP with manual TLS SNI
    console.log('3. Trying raw TLS connection...');
    const tls = require('tls');
    const net = require('net');
    
    const socket = tls.connect({
      host: 'aws-0-us-east-1.pooler.supabase.com',
      port: 6543,
      servername: 'odbhxiymteppgaqqdsoy',
      rejectUnauthorized: false,
      timeout: 10000
    }, () => {
      console.log('  TLS connected! SNI sent.');
      socket.destroy();
      resolve(null);
    });
    socket.on('error', (e) => {
      console.log('  FAIL:', e.message.substring(0, 100));
      resolve(null);
    });
    socket.on('timeout', () => {
      console.log('  FAIL: timeout');
      socket.destroy();
      resolve(null);
    });
  });
}

tryConnect().then(() => process.exit());
