const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

// Read database URL from env (e.g. for Render persistent volume) or fallback to local dev.db
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  const dbPath = path.join(__dirname, '../dev.db');
  dbUrl = `file:${dbPath}`;
} else if (!dbUrl.startsWith('file:')) {
  dbUrl = `file:${dbUrl}`;
}

const adapter = new PrismaBetterSqlite3({
  url: dbUrl
});

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = prisma;
