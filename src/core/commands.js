const {REST,Routes,SlashCommandBuilder,PermissionFlagsBits}=require("discord.js");
const commands=[
 new SlashCommandBuilder().setName("city").setDescription("Open your City dashboard."),
 new SlashCommandBuilder().setName("profile").setDescription("View your City profile."),
 new SlashCommandBuilder().setName("job").setDescription("Choose and play a main job."),
 new SlashCommandBuilder().setName("sidejob").setDescription("Play a short side job."),
 new SlashCommandBuilder().setName("crime").setDescription("Take a fictional in-game criminal job."),
 new SlashCommandBuilder().setName("jail").setDescription("View your jail status."),
 new SlashCommandBuilder().setName("bank").setDescription("Open your bank."),
 new SlashCommandBuilder().setName("market").setDescription("Open the City market."),
 new SlashCommandBuilder().setName("inventory").setDescription("View your inventory."),
 new SlashCommandBuilder().setName("house").setDescription("View your property."),
 new SlashCommandBuilder().setName("vehicle").setDescription("View your vehicle."),
 new SlashCommandBuilder().setName("business").setDescription("Manage your business."),
 new SlashCommandBuilder().setName("quest").setDescription("View today's quest."),
 new SlashCommandBuilder().setName("leaderboard").setDescription("View the City leaderboard."),
 new SlashCommandBuilder().setName("admin").setDescription("Open the administrator panel.").setDefaultMemberPermissions(PermissionFlagsBits.Administrator.bitfield)
];
async function registerCommands(){
 const rest=new REST({version:"10"}).setToken(process.env.DISCORD_TOKEN);
 const route=process.env.GUILD_ID?Routes.applicationGuildCommands(process.env.CLIENT_ID,process.env.GUILD_ID):Routes.applicationCommands(process.env.CLIENT_ID);
 await rest.put(route,{body:commands.map(x=>x.toJSON())});
 console.log("⚙️ Registered",commands.length,"commands.");
}
module.exports={registerCommands};
