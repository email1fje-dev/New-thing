const { Pool } = require("pg");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const pool = new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.NODE_ENV==="production"?{rejectUnauthorized:false}:false});
const q=(text,params=[])=>pool.query(text,params);
async function initDatabase(){
 await q(`CREATE TABLE IF NOT EXISTS players(
 user_id TEXT NOT NULL,guild_id TEXT NOT NULL,money BIGINT NOT NULL DEFAULT 1000,bank BIGINT NOT NULL DEFAULT 0,
 xp INT NOT NULL DEFAULT 0,level INT NOT NULL DEFAULT 1,energy INT NOT NULL DEFAULT 100,job TEXT,job_level INT NOT NULL DEFAULT 1,
 wanted INT NOT NULL DEFAULT 0,jailed_until TIMESTAMPTZ,house JSONB NOT NULL DEFAULT '{"type":"Apartment","level":1,"rating":50}'::jsonb,
 vehicle JSONB NOT NULL DEFAULT '{"type":"None","fuel":100,"condition":100}'::jsonb,
 business JSONB NOT NULL DEFAULT '{"name":null,"type":null,"level":0,"balance":0,"rating":0}'::jsonb,
 inventory JSONB NOT NULL DEFAULT '{}'::jsonb,stats JSONB NOT NULL DEFAULT '{"jobs":0,"sidejobs":0,"crimes":0,"arrests":0}'::jsonb,
 cooldowns JSONB NOT NULL DEFAULT '{}'::jsonb,achievements JSONB NOT NULL DEFAULT '{}'::jsonb,pets JSONB NOT NULL DEFAULT '{}'::jsonb,
 district TEXT NOT NULL DEFAULT 'Downtown',reputation INT NOT NULL DEFAULT 0,daily JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(user_id,guild_id))`);
 for(const [n,t] of [["achievements","JSONB NOT NULL DEFAULT '{}'::jsonb"],["pets","JSONB NOT NULL DEFAULT '{}'::jsonb"],["district","TEXT NOT NULL DEFAULT 'Downtown'"],["reputation","INT NOT NULL DEFAULT 0"],["daily","JSONB NOT NULL DEFAULT '{}'::jsonb"]]) await q(`ALTER TABLE players ADD COLUMN IF NOT EXISTS ${n} ${t}`);
 await q(`CREATE TABLE IF NOT EXISTS city_trades(id BIGSERIAL PRIMARY KEY,guild_id TEXT NOT NULL,from_user TEXT NOT NULL,to_user TEXT NOT NULL,offer JSONB NOT NULL DEFAULT '{}'::jsonb,want JSONB NOT NULL DEFAULT '{}'::jsonb,status TEXT NOT NULL DEFAULT 'pending',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
 await q("CREATE INDEX IF NOT EXISTS players_money_idx ON players(guild_id,money DESC)");
 await q("CREATE INDEX IF NOT EXISTS trades_target_idx ON city_trades(guild_id,to_user,status)");
 await q(`CREATE TABLE IF NOT EXISTS server_settings(guild_id TEXT PRIMARY KEY,settings JSONB NOT NULL DEFAULT '{}'::jsonb,updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
 await q(`CREATE TABLE IF NOT EXISTS giveaways(id BIGSERIAL PRIMARY KEY,guild_id TEXT NOT NULL,channel_id TEXT NOT NULL,message_id TEXT,prize TEXT NOT NULL,winners INT NOT NULL DEFAULT 1,ends_at TIMESTAMPTZ NOT NULL,ended BOOLEAN NOT NULL DEFAULT FALSE,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
 await q(`CREATE TABLE IF NOT EXISTS reminders(id BIGSERIAL PRIMARY KEY,guild_id TEXT NOT NULL,user_id TEXT NOT NULL,channel_id TEXT NOT NULL,text TEXT NOT NULL,due_at TIMESTAMPTZ NOT NULL,done BOOLEAN NOT NULL DEFAULT FALSE)`);
 await q("ALTER TABLE giveaways ADD COLUMN IF NOT EXISTS participants JSONB NOT NULL DEFAULT '[]'::jsonb");
}
async function ensurePlayer(userId,guildId){await q("INSERT INTO players(user_id,guild_id) VALUES($1,$2) ON CONFLICT(user_id,guild_id) DO NOTHING",[userId,guildId]);const {rows}=await q("SELECT * FROM players WHERE user_id=$1 AND guild_id=$2",[userId,guildId]);return rows[0];}
async function getPlayer(userId,guildId){return ensurePlayer(userId,guildId);}
async function updatePlayer(userId,guildId,patch){const allowed=["money","bank","xp","level","energy","job","job_level","wanted","jailed_until","house","vehicle","business","inventory","stats","cooldowns","achievements","pets","district","reputation","daily"];const e=Object.entries(patch).filter(([k])=>allowed.includes(k));if(!e.length)return;const sets=e.map(([k],i)=>`${k}=$${i+3}`);await q(`UPDATE players SET ${sets.join(",")},updated_at=NOW() WHERE user_id=$1 AND guild_id=$2`,[userId,guildId,...e.map(([,v])=>v)]);}
async function getSettings(guildId){const {rows}=await q("SELECT settings FROM server_settings WHERE guild_id=$1",[guildId]);return rows[0]?.settings||{};}
async function setSettings(guildId,patch){const old=await getSettings(guildId);const settings={...old,...patch};await q("INSERT INTO server_settings(guild_id,settings) VALUES($1,$2) ON CONFLICT(guild_id) DO UPDATE SET settings=$2,updated_at=NOW()",[guildId,settings]);return settings;}
async function topPlayers(guildId,limit=10){const {rows}=await q("SELECT * FROM players WHERE guild_id=$1 ORDER BY money DESC LIMIT $2",[guildId,limit]);return rows;}
module.exports={q,initDatabase,ensurePlayer,getPlayer,updatePlayer,topPlayers,getSettings,setSettings};