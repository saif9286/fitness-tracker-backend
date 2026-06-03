require('dotenv').config();

const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');
const ws = require('ws');

// Configure Neon to use the ws WebSocket library (required in Node.js environments)
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('   Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('DB') || k.includes('NODE') || k.includes('PORT')).join(', '));
  process.exit(1);
}

console.log('✅ DATABASE_URL is set. Host:', connectionString.split('@')[1]?.split('/')[0] || 'unknown');

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = prisma;