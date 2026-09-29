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
 new SlashCommandBuilder().setName("ticket").setDescription("Open the support ticket panel."),
 new SlashCommandBuilder().setName("map").setDescription("Explore City districts."),
 new SlashCommandBuilder().setName("pet").setDescription("Adopt and care for a City pet."),
 new SlashCommandBuilder().setName("events").setDescription("See current City events."),
 new SlashCommandBuilder().setName("achievements").setDescription("View your achievements."),
 new SlashCommandBuilder().setName("trade").setDescription("Manage player trades."),
 new SlashCommandBuilder().setName("police").setDescription("Open the fictional Police career panel."),
 new SlashCommandBuilder().setName("warn").setDescription("Warn a member.").addUserOption(o=>o.setName("user").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(false)),
 new SlashCommandBuilder().setName("kick").setDescription("Kick a member.").addUserOption(o=>o.setName("user").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(false)),
 new SlashCommandBuilder().setName("ban").setDescription("Ban a member.").addUserOption(o=>o.setName("user").setDescription("Member").setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(false)),
 new SlashCommandBuilder().setName("timeout").setDescription("Timeout a member.").addUserOption(o=>o.setName("user").setDescription("Member").setRequired(true)).addIntegerOption(o=>o.setName("minutes").setDescription("Duration in minutes").setMinValue(1).setMaxValue(40320).setRequired(true)).addStringOption(o=>o.setName("reason").setDescription("Reason").setRequired(false)),
 new SlashCommandBuilder().setName("clear").setDescription("Delete recent messages.").addIntegerOption(o=>o.setName("amount").setDescription("1-100").setMinValue(1).setMaxValue(100).setRequired(true)),
 new SlashCommandBuilder().setName("serverinfo").setDescription("View server information."),
 new SlashCommandBuilder().setName("userinfo").setDescription("View member information.").addUserOption(o=>o.setName("user").setDescription("Member").setRequired(false)),
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
