const dns = require('dns');
const net = require('net');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Force IPv4 resolution programmatically to prevent Node from resolving to IPv6 on Render
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const connectionString = process.env.DATABASE_URL;

console.log('🔍 [DB DIAGNOSTIC] Initiating connection checks...');
console.log('🔍 [DB DIAGNOSTIC] DATABASE_URL is defined:', !!connectionString);

if (connectionString) {
  if (connectionString.startsWith('file:')) {
    console.warn('⚠️ Warning: DATABASE_URL is set to a file URL (SQLite), but the Prisma schema is configured for PostgreSQL. Please update your DATABASE_URL to a PostgreSQL connection string.');
  } else {
    try {
      // Parse database URL (URL class needs http protocol to parse correctly)
      const parsedUrl = new URL(connectionString.replace('postgres://', 'http://').replace('postgresql://', 'http://'));
      const host = parsedUrl.hostname;
      const port = parsedUrl.port || 5432;
      console.log(`🔍 [DB DIAGNOSTIC] Parsed database host: ${host}, port: ${port}`);

      dns.lookup(host, { all: true }, (dnsErr, addresses) => {
        if (dnsErr) {
          console.error('🔍 [DB DIAGNOSTIC] DNS Lookup failed:', dnsErr);
        } else {
          console.log('🔍 [DB DIAGNOSTIC] DNS resolved addresses:', addresses);
          
          if (addresses && addresses.length > 0) {
            const targetIp = addresses[0].address;
            console.log(`🔍 [DB DIAGNOSTIC] Attempting raw TCP connection to ${targetIp}:${port}...`);
            const socket = net.connect({ host: targetIp, port: Number(port), timeout: 5000 }, () => {
              console.log(`🔍 [DB DIAGNOSTIC] Raw TCP connection to ${targetIp}:${port} SUCCESSFUL!`);
              socket.end();
            });
            socket.on('error', (socketErr) => {
              console.error(`🔍 [DB DIAGNOSTIC] Raw TCP connection to ${targetIp}:${port} FAILED:`, socketErr);
            });
            socket.on('timeout', () => {
              console.error(`🔍 [DB DIAGNOSTIC] Raw TCP connection to ${targetIp}:${port} TIMEOUT!`);
              socket.destroy();
            });
          }
        }
      });
    } catch (parseErr) {
      console.error('🔍 [DB DIAGNOSTIC] Failed to parse connection string:', parseErr.message);
    }
  }
}

const isLocal = !connectionString || connectionString.includes('localhost') || connectionString.includes('127.0.0.1');

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = prisma;