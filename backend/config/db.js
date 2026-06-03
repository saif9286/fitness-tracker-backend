const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

// Ensure database URL is available
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required to instantiate PrismaClient.');
}

// Enforce SSL for all remote databases (like Neon/Supabase), disable only for localhost
const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
const pool = new Pool({
  connectionString,
  ssl: isLocalhost ? undefined : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = prisma;
