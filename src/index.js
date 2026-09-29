require("dotenv").config();
const {Client,GatewayIntentBits}=require("discord.js");
const {initDatabase}=require("./database");
const {registerCommands}=require("./core/commands");
const {registerInteractions}=require("./core/interactions");
if(!process.env.DISCORD_TOKEN||!process.env.CLIENT_ID)throw new Error("DISCORD_TOKEN and CLIENT_ID are required.");
const client=new Client({intents:[GatewayIntentBits.Guilds]});
(async()=>{await initDatabase();await registerCommands();registerInteractions(client);
client.on("interactionCreate",async i=>{try{await handleTicket(i);}catch(e){console.error("Ticket error:",e);if(!i.replied&&!i.deferred)await i.reply({content:"⚠️ Ticket system error.",ephemeral:true}).catch(()=>{});}});client.once("ready",()=>console.log(`🏙️ GUARDIA online as ${client.user.tag}`));await client.login(process.env.DISCORD_TOKEN);})().catch(e=>{console.error(e);process.exit(1);});
