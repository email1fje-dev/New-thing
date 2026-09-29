require("dotenv").config();

const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const { initDatabase } = require("./database");
const { registerCommands } = require("./core/commands");
const { registerInteractions } = require("./core/interactions");
const { jobs } = require("./city/jobs");
const { sideJobs } = require("./city/sidejobs");

if (!process.env.DISCORD_TOKEN) throw new Error("Missing DISCORD_TOKEN");
if (!process.env.CLIENT_ID) throw new Error("Missing CLIENT_ID");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel]
});

client.commands = new Collection();
client.city = { jobs, sideJobs };

(async () => {
  await initDatabase();
  await registerCommands();
  registerInteractions(client);

  client.once("ready", () => {
    console.log(`🏙️ GUARDIA online as ${client.user.tag}`);
  });

  await client.login(process.env.DISCORD_TOKEN);
})();
