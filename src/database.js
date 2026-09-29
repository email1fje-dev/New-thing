const { Pool } = require("pg");

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized:false } : false
});

const q=(text,params=[])=>pool.query(text,params);

async function initDatabase(){
  await q(`
    CREATE TABLE IF NOT EXISTS players(
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      money BIGINT NOT NULL DEFAULT 1000,
      bank BIGINT NOT NULL DEFAULT 0,
      xp INT NOT NULL DEFAULT 0,
      level INT NOT NULL DEFAULT 1,
      energy INT NOT NULL DEFAULT 100,
      job TEXT,
      job_level INT NOT NULL DEFAULT 1,
      wanted INT NOT NULL DEFAULT 0,
      jailed_until TIMESTAMPTZ,
      house JSONB NOT NULL DEFAULT '{"type":"Apartment","level":1,"rating":50}'::jsonb,
      vehicle JSONB NOT NULL DEFAULT '{"type":"None","fuel":100,"condition":100}'::jsonb,
      business JSONB NOT NULL DEFAULT '{"name":null,"type":null,"level":0,"balance":0,"rating":0}'::jsonb,
      inventory JSONB NOT NULL DEFAULT '{}'::jsonb,
      stats JSONB NOT NULL DEFAULT '{"jobs":0,"sidejobs":0,"crimes":0,"arrests":0,"trades":0}'::jsonb,
      cooldowns JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY(user_id,guild_id)
    );
  `);
  await q("CREATE INDEX IF NOT EXISTS players_money_idx ON players(guild_id,money DESC)");
}

async function ensurePlayer(userId,guildId){
  await q(`INSERT INTO players(user_id,guild_id) VALUES($1,$2) ON CONFLICT(user_id,guild_id) DO NOTHING`,[userId,guildId]);
  const {rows}=await q("SELECT * FROM players WHERE user_id=$1 AND guild_id=$2",[userId,guildId]);
  return rows[0];
}
async function getPlayer(userId,guildId){return ensurePlayer(userId,guildId);}
async function updatePlayer(userId,guildId,patch){
  const allowed=["money","bank","xp","level","energy","job","job_level","wanted","jailed_until","house","vehicle","business","inventory","stats","cooldowns"];
  const e=Object.entries(patch).filter(([k])=>allowed.includes(k));
  if(!e.length)return;
  const sets=e.map(([k],i)=>`${k}=$${i+3}`);
  await q(`UPDATE players SET ${sets.join(",")},updated_at=NOW() WHERE user_id=$1 AND guild_id=$2`,[userId,guildId,...e.map(([,v])=>v)]);
}
async function topPlayers(guildId,limit=10){
  const {rows}=await q("SELECT * FROM players WHERE guild_id=$1 ORDER BY money DESC LIMIT $2",[guildId,limit]); return rows;
}
module.exports={q,initDatabase,ensurePlayer,getPlayer,updatePlayer,topPlayers};
