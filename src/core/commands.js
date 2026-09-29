const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const commands = [
  new SlashCommandBuilder().setName("city").setDescription("Open your Server City dashboard."),
  new SlashCommandBuilder().setName("profile").setDescription("View your City profile."),
  new SlashCommandBuilder().setName("job").setDescription("Start or manage your main job."),
  new SlashCommandBuilder().setName("sidejob").setDescription("Take a short side job."),
  new SlashCommandBuilder().setName("crime").setDescription("Enter the criminal side of the City."),
  new SlashCommandBuilder().setName("jail").setDescription("View your jail status and activities."),
  new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Open the GUARDIA administrator panel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator.bitfield)
];

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);

  await rest.put(route, { body: commands.map(command => command.toJSON()) });
  console.log(`⚙️ Registered ${commands.length} slash commands.`);
}

module.exports = { registerCommands };
