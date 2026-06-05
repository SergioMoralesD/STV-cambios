import pg from 'pg';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
  }
  return pool;
}

export async function query(text, params) {
  const p = getPool();
  if (!p) return null;
  return p.query(text, params);
}

export async function isDbReady() {
  try {
    const p = getPool();
    if (!p) return false;
    await p.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
