const net = require('net');

// Check if port 6543 is plaintext or TLS
const socket = net.connect({ host: 'aws-0-us-east-1.pooler.supabase.com', port: 6543, timeout: 5000 }, () => {
  console.log('Connected! Sending PostgreSQL startup...');
  
  // Send a PostgreSQL startup message to see the response
  const user = 'postgres.odbhxiymteppgaqqdsoy';
  const db = 'postgres';
  
  // Build startup packet
  const userBuf = Buffer.from('user\0' + user + '\0');
  const dbBuf = Buffer.from('database\0' + db + '\0');
  const extra = Buffer.from('\0');
  
  const bodyLen = 4 + 4 + userBuf.length + dbBuf.length + extra.length;
  const buf = Buffer.alloc(4 + bodyLen);
  buf.writeInt32BE(bodyLen + 4, 0);
  buf.writeInt32BE(196608, 4); // version 3.0
  userBuf.copy(buf, 8);
  dbBuf.copy(buf, 8 + userBuf.length);
  extra.copy(buf, 8 + userBuf.length + dbBuf.length);
  
  socket.write(buf);
});

let data = Buffer.alloc(0);
socket.on('data', (chunk) => {
  data = Buffer.concat([data, chunk]);
  if (data.length > 0) {
    console.log('Response length:', data.length);
    console.log('First bytes:', data.slice(0, 20).toString('hex'));
    // Check if it's an SSL request response ('S' = 0x53)
    if (data.length >= 1 && data[0] === 0x53) {
      console.log('Server supports SSL! Sending SSLRequest...');
      // Send SSLRequest
      const sslBuf = Buffer.alloc(8);
      sslBuf.writeInt32BE(8, 0);
      sslBuf.writeInt32BE(80877103, 4);
      socket.write(sslBuf);
    } else if (data.length >= 1 && data[0] === 0x4e) {
      console.log('Got 'N' (No SSL), data:', data.toString('utf8'));
    } else {
      console.log('Response:', data.toString('utf8').substring(0, 200));
    }
  }
});

socket.on('error', (e) => console.log('Error:', e.message));
socket.on('timeout', () => { console.log('Timeout'); socket.destroy(); });
setTimeout(() => { console.log('Timeout reached'); socket.destroy(); process.exit(); }, 10000);
