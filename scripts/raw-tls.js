const tls = require('tls');
const net = require('net');
const { Client } = require('pg');

// Try raw TLS to see if SNI works
const socket = tls.connect({
  host: 'aws-0-us-east-1.pooler.supabase.com',
  port: 6543,
  servername: 'aws-0-us-east-1.pooler.supabase.com',
  rejectUnauthorized: false,
  timeout: 8000
}, async () => {
  console.log('TLS connected, protocol:', socket.getProtocol());
  console.log('ALPN:', socket.getALPNProtocol());
  
  // Now try pg with the connected socket
  try {
    const c = new Client({
      stream: socket,
      user: 'postgres.odbhxiymteppgaqqdsoy',
      password: 'UAxLqf6yOiBe3qY4',
      database: 'postgres'
    });
    await c.connect();
    console.log('PG CONNECTED via socket!');
    const r = await c.query('SELECT 1 as test');
    console.log('Result:', r.rows);
    await c.end();
  } catch (e) {
    console.log('PG via socket FAIL:', e.message.substring(0, 150));
  }
  process.exit();
});

socket.on('error', (e) => {
  console.log('TLS error:', e.message);
  process.exit(1);
});

socket.on('timeout', () => {
  console.log('TLS timeout');
  socket.destroy();
  process.exit(1);
});
