const {EmbedBuilder,PermissionFlagsBits}=require("discord.js");
const {q,updatePlayer,getSettings}=require("./database");
function modOnly(i){return i.memberPermissions?.has(PermissionFlagsBits.ManageGuild)||i.memberPermissions?.has(PermissionFlagsBits.ModerateMembers)||i.memberPermissions?.has(PermissionFlagsBits.Administrator);}
async function log(guild,action,target,reason,moderator){
 const s=await getSettings(guild.id);const chId=s.logChannel||process.env.MOD_LOG_CHANNEL_ID;if(!chId)return;
 const ch=guild.channels.cache.get(chId);if(!ch)return;
 await ch.send({embeds:[new EmbedBuilder().setTitle("🛡️ "+action).addFields(
 {name:"Target",value:"<@"+target.id+"> ("+target.id+")",inline:true},
 {name:"Moderator",value:"<@"+moderator.id+">",inline:true},
 {name:"Reason",value:reason||"No reason provided",inline:false}).setTimestamp()]}).catch(()=>{});
}
async function handleModeration(i){
 if(!i.isChatInputCommand())return false;
 const name=i.commandName;
 if(!["warn","kick","ban","timeout","clear","serverinfo","userinfo"].includes(name))return false;
 if(["warn","kick","ban","timeout","clear"].includes(name)&&!modOnly(i))return i.reply({content:"❌ You need moderation permissions.",ephemeral:true});
 if(name==="serverinfo"){
  const g=i.guild;return i.reply({embeds:[new EmbedBuilder().setTitle("🏠 "+g.name).addFields(
   {name:"Members",value:String(g.memberCount),inline:true},{name:"Channels",value:String(g.channels.cache.size),inline:true},
   {name:"Roles",value:String(g.roles.cache.size),inline:true},{name:"Owner",value:"<@"+g.ownerId+">",inline:true})]});
 }
 if(name==="userinfo"){
  const u=i.options.getUser("user")||i.user;const m=await i.guild.members.fetch(u.id).catch(()=>null);
  return i.reply({embeds:[new EmbedBuilder().setTitle("👤 "+u.username).setThumbnail(u.displayAvatarURL()).addFields(
   {name:"ID",value:u.id,inline:true},{name:"Joined",value:m?.joinedAt?"<t:"+Math.floor(m.joinedAt.getTime()/1000)+":R>":"Unknown",inline:true},
   {name:"Roles",value:m?.roles.cache.filter(r=>r.id!==i.guild.id).map(r=>r.toString()).join(" ")||"None"})]});
 }
 if(name==="clear"){const n=i.options.getInteger("amount");const deleted=await i.channel.bulkDelete(n,true);await log(i.guild,"Messages Cleared",i.user,deleted.size+" messages",i.user);return i.reply({content:"🧹 Deleted **"+deleted.size+"** messages.",ephemeral:true});}
 const u=i.options.getUser("user"),m=await i.guild.members.fetch(u.id).catch(()=>null);if(!m)return i.reply({content:"❌ Member not found.",ephemeral:true});
 if(u.id===i.user.id)return i.reply({content:"❌ You can't moderate yourself.",ephemeral:true});
 const reason=i.options.getString("reason")||"No reason provided";
 if(name==="warn"){
  const {rows}=await q("SELECT stats FROM players WHERE user_id=$1 AND guild_id=$2",[u.id,i.guildId]);const stats={...(rows[0]?.stats||{}),warnings:Number(rows[0]?.stats?.warnings||0)+1};await updatePlayer(u.id,i.guildId,{stats});
  await log(i.guild,"Warning",u,reason,i.user);return i.reply({content:"⚠️ <@"+u.id+"> warned. **"+reason+"**"});
 }
 if(!m.moderatable&&name!=="ban")return i.reply({content:"❌ I can't moderate that member due to role hierarchy.",ephemeral:true});
 if(name==="kick"){await m.kick(reason);await log(i.guild,"Kick",u,reason,i.user);return i.reply({content:"👢 <@"+u.id+"> kicked."});}
 if(name==="ban"){await m.ban({reason});await log(i.guild,"Ban",u,reason,i.user);return i.reply({content:"🔨 <@"+u.id+"> banned."});}
 if(name==="timeout"){const minutes=i.options.getInteger("minutes");await m.timeout(minutes*60000,reason);await log(i.guild,"Timeout",u,reason,i.user);return i.reply({content:"⏱️ <@"+u.id+"> timed out for **"+minutes+"m**."});}
 return false;
}
module.exports={handleModeration};