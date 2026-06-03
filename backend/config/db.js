require('dotenv').config();

const { neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const { PrismaClient } = require('@prisma/client');
const ws = require('ws');

// Configure Neon to use the ws WebSocket library (required in Node.js environments)
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// PrismaNeon is a factory that accepts a Pool config object (NOT a Pool instance).
// It creates its own Pool internally via new neon.Pool(config).
const adapter = new PrismaNeon({ connectionString });

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = prisma;