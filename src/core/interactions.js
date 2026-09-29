const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");
const { ensurePlayer, getPlayer, updatePlayer } = require("../database");
const { jobs } = require("../city/jobs");
const { sideJobs } = require("../city/sidejobs");
const { dashboard, cityRow, profileEmbed, startJob, resolveGame } = require("./game");

function registerInteractions(client) {
  client.on("interactionCreate", async interaction => {
    try {
      if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isStringSelectMenu()) return;
      if (!interaction.guildId) return;

      await ensurePlayer(interaction.user.id, interaction.guildId);

      if (interaction.isChatInputCommand()) {
        if (interaction.commandName === "city") {
          const p = await getPlayer(interaction.user.id, interaction.guildId);
          return interaction.reply({ embeds: [dashboard(p)], components: [cityRow()] });
        }

        if (interaction.commandName === "profile") {
          return interaction.reply({ embeds: [await profileEmbed(interaction.user.id, interaction.guildId)] });
        }

        if (interaction.commandName === "job") {
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("select:job")
              .setPlaceholder("Choose a main job")
              .addOptions(Object.entries(jobs).map(([key, j]) => ({
                label: j.name,
                value: key,
                emoji: j.emoji,
                description: j.description.slice(0, 90)
              })))
          );
          return interaction.reply({ content: "💼 Choose your job:", components: [row], ephemeral: true });
        }

        if (interaction.commandName === "sidejob") {
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("select:sidejob")
              .setPlaceholder("Choose a side job")
              .addOptions(Object.entries(sideJobs).map(([key, j]) => ({
                label: j.name,
                value: key,
                emoji: j.emoji
              })))
          );
          return interaction.reply({ content: "💼 Pick a side job:", components: [row], ephemeral: true });
        }

        if (interaction.commandName === "crime") {
          return interaction.reply({
            embeds: [new EmbedBuilder().setTitle("🚨 Criminal District").setDescription("Choose a fictional in-game crime. Risk increases your wanted level.")],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("crime:shop").setLabel("Store Robbery").setEmoji("🏪").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("crime:car").setLabel("Car Theft").setEmoji("🚗").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("crime:heist").setLabel("Bank Heist").setEmoji("🏦").setStyle(ButtonStyle.Danger)
              )
            ]
          });
        }

        if (interaction.commandName === "jail") {
          const p = await getPlayer(interaction.user.id, interaction.guildId);
          if (!p.jailed_until || new Date(p.jailed_until) <= new Date()) {
            return interaction.reply({ content: "🔓 You're not in jail." });
          }
          const remaining = Math.max(0, Math.ceil((new Date(p.jailed_until) - Date.now()) / 1000));
          return interaction.reply({
            embeds: [new EmbedBuilder().setTitle("⛓️ Jail").setDescription(`Time remaining: **${remaining}s**`).addFields({ name: "Activities", value: "Use the buttons below for harmless in-game prison activities." })],
            components: [new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId("jail:exercise").setLabel("Exercise").setEmoji("🏋️").setStyle(ButtonStyle.Secondary),
              new ButtonBuilder().setCustomId("jail:cards").setLabel("Cards").setEmoji("🃏").setStyle(ButtonStyle.Secondary)
            )]
          });
        }

        if (interaction.commandName === "admin") {
          if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: "❌ Administrator permission required.", ephemeral: true });
          }
          return interaction.reply({
            embeds: [new EmbedBuilder().setTitle("🛠️ GUARDIA Admin Panel").setDescription("Administrator-only controls.")],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("admin:stats").setLabel("Stats").setEmoji("📊").setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId("admin:economy").setLabel("Economy").setEmoji("💰").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("admin:events").setLabel("Events").setEmoji("🎲").setStyle(ButtonStyle.Secondary)
              )
            ],
            ephemeral: true
          });
        }
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === "select:job") {
          const key = interaction.values[0];
          await updatePlayer(interaction.user.id, { job: key });
          return startJob(interaction, key, false);
        }
        if (interaction.customId === "select:sidejob") {
          return startJob(interaction, interaction.values[0], true);
        }
      }

      if (interaction.isButton()) {
        const [scope, action, key, answer] = interaction.customId.split(":");

        if (scope === "city") {
          if (action === "profile") return interaction.reply({ embeds: [await profileEmbed(interaction.user.id, interaction.guildId)], ephemeral: true });
          if (action === "job") {
            const row = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder().setCustomId("select:job").setPlaceholder("Choose a main job").addOptions(
                Object.entries(jobs).map(([k, j]) => ({ label: j.name, value: k, emoji: j.emoji }))
              )
            );
            return interaction.reply({ content: "💼 Choose a main job:", components: [row], ephemeral: true });
          }
          if (action === "sidejob") return interaction.reply({ content: "Use /sidejob to pick a side job.", ephemeral: true });
          if (action === "crime") return interaction.reply({ content: "Use /crime to enter the Criminal District.", ephemeral: true });
        }

        if (scope === "game") {
          return resolveGame(interaction, action, key, answer, action === "side" ? sideJobs : jobs);
        }

        if (scope === "crime") {
          const p = await getPlayer(interaction.user.id, interaction.guildId);
          const risks = { shop: { reward: [300, 650], wanted: 1, jail: [60, 180] }, car: { reward: [500, 1000], wanted: 2, jail: [120, 300] }, heist: { reward: [1000, 3000], wanted: 3, jail: [240, 600] } };
          const crime = risks[action];
          if (!crime) return;
          const success = Math.random() > 0.35;
          if (!success) {
            const sentence = Math.floor((crime.jail[0] + crime.jail[1]) / 2);
            await updatePlayer(interaction.user.id, { wanted: Math.min(5, p.wanted + crime.wanted), jailed_until: new Date(Date.now() + sentence * 1000) });
            return interaction.update({ content: `🚔 Caught. Sentence: **${sentence}s**.`, embeds: [], components: [] });
          }
          const reward = Math.floor((crime.reward[0] + crime.reward[1]) / 2);
          await updatePlayer(interaction.user.id, { money: Number(p.money) + reward, wanted: Math.min(5, p.wanted + crime.wanted) });
          return interaction.update({ content: `🚨 Crime succeeded. You gained **$${reward}**. Wanted level: **${Math.min(5, p.wanted + crime.wanted)}**.`, embeds: [], components: [] });
        }

        if (scope === "jail") {
          return interaction.reply({ content: "🃏 Prison activity completed. You gained a little XP.", ephemeral: true });
        }

        if (scope === "admin") {
          if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) return interaction.reply({ content: "❌ Administrator permission required.", ephemeral: true });
          if (action === "stats") return interaction.reply({ content: "📊 Admin analytics module is ready for expansion.", ephemeral: true });
          if (action === "economy") return interaction.reply({ content: "💰 Economy controls are ready for expansion.", ephemeral: true });
          if (action === "events") return interaction.reply({ content: "🎲 Event manager is ready for expansion.", ephemeral: true });
        }
      }
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "⚠️ Something went wrong.", ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content: "⚠️ Something went wrong.", ephemeral: true }).catch(() => {});
      }
    }
  });
}

module.exports = { registerInteractions };
