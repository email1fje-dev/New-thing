const {ChannelType,PermissionFlagsBits,ActionRowBuilder,ButtonBuilder,ButtonStyle,EmbedBuilder}=require("discord.js");

const activeTickets=new Set();

function staffAllowed(member){
  const role=process.env.STAFF_ROLE_ID;
  return member.permissions.has(PermissionFlagsBits.Administrator)||Boolean(role&&member.roles.cache.has(role));
}

async function ticketPanel(i){
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket:create").setLabel("Create Ticket").setEmoji("🎫").setStyle(ButtonStyle.Primary)
  );
  return i.reply({embeds:[new EmbedBuilder().setTitle("🎫 GUARDIA SUPPORT").setDescription("Need help? Open a private support ticket.\n\n**One ticket per member** is allowed. Staff can claim and close tickets.")],components:[row]});
}

async function createTicket(i){
  if(activeTickets.has(i.user.id)) return i.reply({content:"🎫 You already have an active ticket.",ephemeral:true});
  const existing=i.guild.channels.cache.find(c=>c.topic===`ticket-owner:${i.user.id}`);
  if(existing){activeTickets.add(i.user.id);return i.reply({content:`🎫 You already have a ticket: <#${existing.id}>`,ephemeral:true});}
  const staffRole=process.env.STAFF_ROLE_ID;
  const overwrites=[
    {id:i.guild.id,deny:[PermissionFlagsBits.ViewChannel]},
    {id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]}
  ];
  if(staffRole) overwrites.push({id:staffRole,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageMessages]});
  const ch=await i.guild.channels.create({name:`ticket-${i.user.username.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,18)||"user"}`,type:ChannelType.GuildText,parent:process.env.TICKET_CATEGORY_ID||null,topic:`ticket-owner:${i.user.id}`,permissionOverwrites:overwrites});
  activeTickets.add(i.user.id);
  const row=new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("ticket:claim").setLabel("Claim").setEmoji("🛡️").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("ticket:close").setLabel("Close").setEmoji("🔒").setStyle(ButtonStyle.Danger)
  );
  await ch.send({content:`Welcome <@${i.user.id}>! Staff will be with you shortly.`,embeds:[new EmbedBuilder().setTitle("🎫 Support Ticket").setDescription("Explain your issue clearly. Please do not share passwords or tokens.")],components:[row]});
  return i.reply({content:`✅ Ticket created: <#${ch.id}>`,ephemeral:true});
}

async function handleTicket(i){
  if(i.isChatInputCommand()&&i.commandName==="ticket") return ticketPanel(i);
  if(!i.isButton()||!i.customId.startsWith("ticket:")) return false;
  const action=i.customId.split(":")[1];
  if(action==="create") return createTicket(i);
  if(action==="claim"){
    if(!staffAllowed(i.member)) return i.reply({content:"❌ Staff permission required.",ephemeral:true});
    await i.channel.send(`🛡️ <@${i.user.id}> claimed this ticket.`);
    return i.reply({content:"Ticket claimed.",ephemeral:true});
  }
  if(action==="close"){
    if(!staffAllowed(i.member)&&i.channel.topic!==`ticket-owner:${i.user.id}`) return i.reply({content:"❌ Only the ticket owner or staff can close this ticket.",ephemeral:true});
    const owner=i.channel.topic?.replace("ticket-owner:","");
    if(owner) activeTickets.delete(owner);
    await i.reply({content:"🔒 Closing ticket in 3 seconds..."});
    setTimeout(()=>i.channel.delete().catch(()=>{}),3000);
    return true;
  }
  return false;
}

module.exports={handleTicket};