const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { getPlayer, updatePlayer } = require("../database");

const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

function dashboard(player) {
  return new EmbedBuilder()
    .setTitle("🏙️ GUARDIA — Server City")
    .setDescription("Your life in the City starts here.")
    .addFields(
      { name: "💰 Cash", value: `$${Number(player.money).toLocaleString()}`, inline: true },
      { name: "🏦 Bank", value: `$${Number(player.bank).toLocaleString()}`, inline: true },
      { name: "⭐ Level", value: String(player.level), inline: true },
      { name: "⚡ Energy", value: `${player.energy}/100`, inline: true },
      { name: "💼 Job", value: player.job ? `${player.job} Lv.${player.job_level}` : "Unemployed", inline: true },
      { name: "🚨 Wanted", value: "⭐".repeat(player.wanted || 0) || "None", inline: true }
    )
    .setFooter({ text: "More City systems are unlocked through gameplay." });
}

function cityRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("city:profile").setLabel("Profile").setEmoji("👤").setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId("city:job").setLabel("Jobs").setEmoji("💼").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("city:sidejob").setLabel("Side Jobs").setEmoji("📦").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("city:crime").setLabel("Crime").setEmoji("🚨").setStyle(ButtonStyle.Danger)
  );
}

async function profileEmbed(userId, guildId) {
  const p = await getPlayer(userId, guildId);
  return new EmbedBuilder()
    .setTitle(`👤 ${userId}'s City Profile`)
    .addFields(
      { name: "💰 Cash", value: `$${Number(p.money).toLocaleString()}`, inline: true },
      { name: "🏦 Bank", value: `$${Number(p.bank).toLocaleString()}`, inline: true },
      { name: "⭐ XP", value: String(p.xp), inline: true },
      { name: "📈 Level", value: String(p.level), inline: true },
      { name: "💼 Job", value: p.job || "Unemployed", inline: true },
      { name: "🚨 Wanted", value: String(p.wanted), inline: true }
    );
}

async function startJob(interaction, jobKey, side = false) {
  const p = await getPlayer(interaction.user.id, interaction.guildId);
  if (p.jailed_until && new Date(p.jailed_until) > new Date()) {
    return interaction.reply({ content: "⛓️ You're in jail. Finish your sentence first.", ephemeral: true });
  }
  if (p.energy < 10) {
    return interaction.reply({ content: "⚡ You're too exhausted. Rest before working again.", ephemeral: true });
  }

  const challenge = side
    ? { title: "📦 SIDE JOB", prompt: "Pick the correct delivery route.", options: ["Downtown", "Harbor", "Suburbs"], answer: "Downtown" }
    : { title: "💼 JOB SHIFT", prompt: "A task appeared. Choose the correct action.", options: ["Do it", "Skip it", "Break it"], answer: "Do it" };

  const row = new ActionRowBuilder().addComponents(
    ...challenge.options.map((label, i) =>
      new ButtonBuilder()
        .setCustomId(`game:${side ? "side" : "job"}:${jobKey}:${label}`)
        .setLabel(label)
        .setStyle(i === 0 ? ButtonStyle.Primary : ButtonStyle.Secondary)
    )
  );

  return interaction.reply({
    embeds: [new EmbedBuilder().setTitle(challenge.title).setDescription(challenge.prompt)],
    components: [row]
  });
}

async function resolveGame(interaction, type, key, answer, catalog) {
  const p = await getPlayer(interaction.user.id, interaction.guildId);
  const item = catalog[key];
  if (!item) return interaction.reply({ content: "That activity no longer exists.", ephemeral: true });

  const correct = answer === (type === "side" ? "Downtown" : "Do it");
  const reward = correct ? random(...item.reward) : 0;
  const xp = correct ? item.xp : Math.max(2, Math.floor(item.xp / 4));

  const newEnergy = Math.max(0, p.energy - 10);
  const totalXp = Number(p.xp) + xp;
  const newLevel = Math.floor(totalXp / 100) + 1;
  await updatePlayer(p.user_id, {
    money: Number(p.money) + reward,
    xp: totalXp,
    level: newLevel,
    energy: newEnergy
  });

  return interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle(correct ? "✅ Shift Complete" : "❌ Shift Failed")
        .setDescription(correct ? `You earned **$${reward}** and **+${xp} XP**.` : `You earned **+${xp} XP**, but no cash reward.`)
        .addFields({ name: "⚡ Energy", value: `${newEnergy}/100` })
    ],
    components: []
  });
}

module.exports = { dashboard, cityRow, profileEmbed, startJob, resolveGame };
