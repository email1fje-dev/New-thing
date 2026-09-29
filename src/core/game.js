const {EmbedBuilder,ActionRowBuilder,ButtonBuilder,ButtonStyle,StringSelectMenuBuilder}=require("discord.js");
const {getPlayer,updatePlayer}=require("../database");
const {jobs}=require("../city/jobs");
const {sideJobs}=require("../city/sidejobs");

const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const money=n=>`$${Number(n).toLocaleString()}`;
const addXp=(p,amount)=>({xp:Number(p.xp)+amount,level:Math.floor((Number(p.xp)+amount)/100)+1});
function bar(v,max=100){const n=Math.round((v/max)*10);return "█".repeat(Math.max(0,n))+"░".repeat(Math.max(0,10-n));}

function dashboard(p){
 return new EmbedBuilder().setColor(0x5865f2).setTitle("🏙️ SERVER CITY")
 .setDescription("Your persistent life inside the City.")
 .addFields(
  {name:"💰 Cash",value:money(p.money),inline:true},{name:"🏦 Bank",value:money(p.bank),inline:true},
  {name:"⭐ Level",value:String(p.level),inline:true},{name:"⚡ Energy",value:`${p.energy}/100`,inline:true},
  {name:"💼 Job",value:p.job? `${jobs[p.job]?.emoji||"💼"} ${jobs[p.job]?.name||p.job} Lv.${p.job_level}`:"Unemployed",inline:true},
  {name:"🚨 Wanted",value:p.wanted? "⭐".repeat(p.wanted):"None",inline:true}
 ).setFooter({text:"Choose an activity below — the City is meant to be played, not just clicked."});
}
function mainRow(){return new ActionRowBuilder().addComponents(
 new ButtonBuilder().setCustomId("dash:profile").setLabel("Profile").setEmoji("👤").setStyle(ButtonStyle.Primary),
 new ButtonBuilder().setCustomId("dash:jobs").setLabel("Jobs").setEmoji("💼").setStyle(ButtonStyle.Secondary),
 new ButtonBuilder().setCustomId("dash:sidejobs").setLabel("Side Jobs").setEmoji("📦").setStyle(ButtonStyle.Secondary),
 new ButtonBuilder().setCustomId("dash:market").setLabel("Market").setEmoji("🏪").setStyle(ButtonStyle.Secondary),
 new ButtonBuilder().setCustomId("dash:crime").setLabel("Crime").setEmoji("🚨").setStyle(ButtonStyle.Danger)
);}
function jobSelect(id,source){
 const catalog=source==="side"?sideJobs:jobs;
 return new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`pick:${source}`).setPlaceholder("Choose an activity").addOptions(
  Object.entries(catalog).map(([k,v])=>({label:v.name,value:k,emoji:v.emoji,description:source==="side"?"Short side activity":`${v.skill} — play to earn`}))
 ));
}
async function startActivity(interaction,key,source){
 const p=await getPlayer(interaction.user.id,interaction.guildId);
 if(p.jailed_until && new Date(p.jailed_until)>new Date()) return interaction.reply({content:"⛓️ You're in jail. Use /jail to see your sentence.",ephemeral:true});
 if(Number(p.energy)<10)return interaction.reply({content:"⚡ You're exhausted. Come back after your energy recovers.",ephemeral:true});
 const item=(source==="side"?sideJobs:jobs)[key];
 const challenges=[
  {q:"Choose the correct route:",opts:["Downtown","Harbor","Suburbs"],a:"Downtown"},
  {q:"The task is ready. What's the best move?",opts:["Start","Ignore","Break"],a:"Start"},
  {q:"Pick the safe timing:",opts:["Perfect","Too Early","Too Late"],a:"Perfect"}
 ];
 const c=challenges[rnd(0,challenges.length-1)];
 const row=new ActionRowBuilder().addComponents(c.opts.map((x,i)=>new ButtonBuilder().setCustomId(`play:${source}:${key}:${encodeURIComponent(x)}:${encodeURIComponent(c.a)}`).setLabel(x).setStyle(i===0?ButtonStyle.Primary:ButtonStyle.Secondary)));
 return interaction.reply({embeds:[new EmbedBuilder().setTitle(`${item.emoji} ${item.name}`).setDescription(`${item.description||"Complete the mini-game."}\n\n🎮 **${c.q}**`)],components:[row]});
}
async function finishActivity(interaction,source,key,answer,correctAnswer){
 const p=await getPlayer(interaction.user.id,interaction.guildId), item=(source==="side"?sideJobs:jobs)[key];
 const correct=answer===correctAnswer, reward=correct?rnd(...item.reward):0, xp=correct?item.xp:Math.max(2,Math.floor(item.xp/3));
 const patch=addXp(p,xp); patch.money=Number(p.money)+reward; patch.energy=Math.max(0,Number(p.energy)-10);
 const stats={...(p.stats||{})}; stats[source==="side"?"sidejobs":"jobs"]=Number(stats[source==="side"?"sidejobs":"jobs"]||0)+1; patch.stats=stats;
 if(source==="job") patch.job_level=Math.min(100,Number(p.job_level)+(correct?1:0));
 await updatePlayer(p.user_id,p.guild_id,patch);
 return interaction.update({embeds:[new EmbedBuilder().setTitle(correct?"✅ SHIFT COMPLETE":"❌ SHIFT FAILED").setDescription(correct?`You earned **${money(reward)}** and **+${xp} XP**.`:`No cash reward. You still gained **+${xp} XP**.`).addFields({name:"⚡ Energy",value:`${patch.energy}/100`} )],components:[]});
}
function profile(p,user){
 const inv=p.inventory||{}; const invCount=Object.values(inv).reduce((a,b)=>a+Number(b),0);
 return new EmbedBuilder().setTitle(`👤 ${user.username} — City Profile`).setThumbnail(user.displayAvatarURL())
 .addFields(
 {name:"💰 Wallet",value:money(p.money),inline:true},{name:"🏦 Bank",value:money(p.bank),inline:true},
 {name:"⭐ Level",value:String(p.level),inline:true},{name:"📈 XP",value:String(p.xp),inline:true},
 {name:"⚡ Energy",value:`${bar(p.energy)} ${p.energy}/100`,inline:false},
 {name:"🏠 Home",value:`${p.house?.type||"Apartment"} Lv.${p.house?.level||1}`,inline:true},
 {name:"🚗 Vehicle",value:p.vehicle?.type||"None",inline:true},{name:"🎒 Items",value:String(invCount),inline:true}
 );}
module.exports={rnd,money,dashboard,mainRow,jobSelect,startActivity,finishActivity,profile};
