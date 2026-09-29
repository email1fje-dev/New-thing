const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL. Add PostgreSQL to Railway and expose DATABASE_URL.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function initDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS players (
      user_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      money BIGINT NOT NULL DEFAULT 1000,
      bank BIGINT NOT NULL DEFAULT 0,
      xp BIGINT NOT NULL DEFAULT 0,
      level INT NOT NULL DEFAULT 1,
      energy INT NOT NULL DEFAULT 100,
      job TEXT,
      job_level INT NOT NULL DEFAULT 1,
      wanted INT NOT NULL DEFAULT 0,
      jailed_until TIMESTAMPTZ,
      inventory JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS players_guild_idx ON players(guild_id);
  `);
}

async function ensurePlayer(userId, guildId) {
  await query(
    `INSERT INTO players (user_id, guild_id)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET guild_id = EXCLUDED.guild_id, updated_at = NOW()`,
    [userId, guildId]
  );
  const { rows } = await query("SELECT * FROM players WHERE user_id = $1", [userId]);
  return rows[0];
}

async function getPlayer(userId, guildId) {
  return ensurePlayer(userId, guildId);
}

async function updatePlayer(userId, patch) {
  const allowed = ["money", "bank", "xp", "level", "energy", "job", "job_level", "wanted", "jailed_until", "inventory"];
  const entries = Object.entries(patch).filter(([key]) => allowed.includes(key));
  if (!entries.length) return;

  const sets = entries.map(([key], i) => `${key} = $${i + 2}`);
  const values = [userId, ...entries.map(([, value]) => value)];
  await query(
    `UPDATE players SET ${sets.join(", ")}, updated_at = NOW() WHERE user_id = $1`,
    values
  );
}

module.exports = { query, initDatabase, ensurePlayer, getPlayer, updatePlayer };
