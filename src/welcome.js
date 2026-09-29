const {EmbedBuilder}=require("discord.js");
async function handleMemberJoin(member){
 const chId=process.env.WELCOME_CHANNEL_ID;if(!chId)return;
 const ch=member.guild.channels.cache.get(chId);if(!ch)return;
 const embed=new EmbedBuilder().setColor(0x5865f2).setTitle("👋 Welcome to "+member.guild.name)
  .setDescription("Welcome "+member+"! Enjoy your stay and check the rules.")
  .addFields({name:"Member",value:String(member.guild.memberCount),inline:true}).setThumbnail(member.user.displayAvatarURL()).setTimestamp();
 await ch.send({content:"👋 "+member+" joined the server!",embeds:[embed]}).catch(()=>{});
 if(process.env.AUTO_ROLE_ID)await member.roles.add(process.env.AUTO_ROLE_ID).catch(()=>{});
}
module.exports={handleMemberJoin};