const {ChannelType,PermissionFlagsBits,ActionRowBuilder,ButtonBuilder,ButtonStyle,EmbedBuilder,StringSelectMenuBuilder}=require("discord.js");
const {getSettings}=require("./database");

const activeTickets=new Set();
async function staffAllowed(member,guildId){const s=await getSettings(guildId);const role=s.staffRole||process.env.STAFF_ROLE_ID;return member.permissions.has(PermissionFlagsBits.Administrator)||Boolean(role&&member.roles.cache.has(role));}
function slug(name){return name.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,18)||"user";}

async function sendTicketPanel(channel){
 const embed=new EmbedBuilder().setColor(0x5865f2).setTitle("🎫 SUPPORT CENTER")
  .setDescription("Need help? Click the button below to open a private support ticket.\n\n• 🔒 Private ticket channel\n• 🛡️ Staff can claim it\n• 👥 Only you and staff can see it\n• 🎫 One active ticket per member")
  .setFooter({text:"Support Center"});
 const menu=new StringSelectMenuBuilder().setCustomId("ticket:type").setPlaceholder("Choose a ticket type").addOptions(
  {label:"General Support",value:"support",emoji:"🎫",description:"General questions and help"},
  {label:"Technical Support",value:"technical",emoji:"🔧",description:"Technical issues"},
  {label:"Report",value:"report",emoji:"🚨",description:"Report a member or issue"},
  {label:"Partnership",value:"partnership",emoji:"🤝",description:"Partnership requests"},
  {label:"Billing",value:"billing",emoji:"💳",description:"Payment or billing questions"},
  {label:"Staff Application",value:"staff",emoji:"🛡️",description:"Apply for staff"}
 );
 return channel.send({embeds:[embed],components:[new ActionRowBuilder().addComponents(menu)]});
}
async function ticketCommand(i){
 if(!(await staffAllowed(i.member,i.guildId)))return i.reply({content:"❌ Only staff can post the ticket panel.",ephemeral:true});
 await sendTicketPanel(i.channel);return i.reply({content:"✅ Ticket panel posted in this channel.",ephemeral:true});
}
async function createTicket(i,type="support"){
 const existing=i.guild.channels.cache.find(c=>c.topic==="ticket-owner:"+i.user.id);
 if(existing){activeTickets.add(i.user.id);return i.reply({content:"🎫 You already have an open ticket: <#"+existing.id+">",ephemeral:true});}
 const settings=await getSettings(i.guildId);const staffRole=settings.staffRole||process.env.STAFF_ROLE_ID;
 const overwrites=[
  {id:i.guild.id,deny:[PermissionFlagsBits.ViewChannel]},
  {id:i.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles]}
 ];
 if(staffRole)overwrites.push({id:staffRole,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.AttachFiles,PermissionFlagsBits.ManageMessages]});
 const labels={support:"Support",technical:"Technical",report:"Report",partnership:"Partnership",billing:"Billing",staff:"Staff"};const ticketType=labels[type]||"Support";
 const ch=await i.guild.channels.create({name:"ticket-"+type+"-"+slug(i.user.username),type:ChannelType.GuildText,parent:settings.ticketCategory||process.env.TICKET_CATEGORY_ID||null,topic:"ticket-owner:"+i.user.id,permissionOverwrites:overwrites});
 activeTickets.add(i.user.id);
 const controls=new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("ticket:claim").setLabel("Claim").setEmoji("🛡️").setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId("ticket:close").setLabel("Close").setEmoji("🔒").setStyle(ButtonStyle.Danger)
 );
 const embed=new EmbedBuilder().setColor(0x5865f2).setTitle("🎫 Support Ticket")
  .setDescription("Welcome <@"+i.user.id+">!\n\nType: **"+ticketType+"**\n\nPlease describe your issue and a staff member will help you shortly.")
  .addFields({name:"Opened by",value:"<@"+i.user.id+">",inline:true},{name:"Status",value:"🟡 Open",inline:true}).setFooter({text:"Support"});
 await ch.send({content:"<@"+i.user.id+">"+(staffRole?" <@&"+staffRole+">":""),embeds:[embed],components:[controls]});
 if(settings.ticketLog||process.env.TICKET_LOG_CHANNEL_ID){const log=i.guild.channels.cache.get(settings.ticketLog||process.env.TICKET_LOG_CHANNEL_ID);if(log)await log.send({embeds:[new EmbedBuilder().setTitle("🎫 Ticket Created").setDescription("<@"+i.user.id+"> opened <#"+ch.id+">").setTimestamp()]}).catch(()=>{});}
 return i.reply({content:"✅ Your ticket has been created: <#"+ch.id+">",ephemeral:true});
}
async function claimTicket(i){
 if(!(await staffAllowed(i.member,i.guildId)))return i.reply({content:"❌ Staff permission required.",ephemeral:true});
 await i.channel.send({embeds:[new EmbedBuilder().setColor(0x57f287).setTitle("🛡️ Ticket Claimed").setDescription("<@"+i.user.id+"> is now handling this ticket.")]});
 return i.reply({content:"✅ Ticket claimed.",ephemeral:true});
}
async function closeTicket(i){
 if(!(await staffAllowed(i.member,i.guildId))&&i.channel.topic!=="ticket-owner:"+i.user.id)return i.reply({content:"❌ Only the ticket owner or staff can close this ticket.",ephemeral:true});
 const owner=i.channel.topic?.replace("ticket-owner:","");if(owner)activeTickets.delete(owner);
 const settings=await getSettings(i.guildId);if(settings.ticketLog||process.env.TICKET_LOG_CHANNEL_ID){const log=i.guild.channels.cache.get(settings.ticketLog||process.env.TICKET_LOG_CHANNEL_ID);if(log)await log.send({embeds:[new EmbedBuilder().setTitle("🔒 Ticket Closed").setDescription(i.channel.name+" was closed by <@"+i.user.id+">").setTimestamp()]}).catch(()=>{});}
 await i.reply({content:"🔒 Ticket will be closed in 3 seconds..."});setTimeout(()=>i.channel.delete().catch(()=>{}),3000);return true;
}
async function handleTicket(i){
 if(i.isChatInputCommand()&&i.commandName==="ticket")return ticketCommand(i);
 if(i.isStringSelectMenu()&&i.customId==="ticket:type")return createTicket(i,i.values[0]);
 if(!i.isButton()||!i.customId.startsWith("ticket:"))return false;
 const action=i.customId.split(":")[1];if(action==="create")return createTicket(i);if(action==="claim")return claimTicket(i);if(action==="close")return closeTicket(i);return false;
}
module.exports={handleTicket,sendTicketPanel};