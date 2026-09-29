const {ActionRowBuilder,ButtonBuilder,ButtonStyle,EmbedBuilder}=require("discord.js");
const {getPlayer,updatePlayer,q}=require("./database");

const districts=[
 ["Downtown","🏙️","Busy central district","+5 reputation"],
 ["Harbor","⚓","Cargo and fishing district","+3 reputation"],
 ["Neon Strip","🌃","Entertainment district","+4 reputation"],
 ["Old Town","🏘️","Historic district","+2 reputation"],
 ["Industrial","🏭","Factories and workshops","+6 reputation"]
];
const events=[
 ["🎪 Street Festival","Complete any activity for a bonus +$250."],
 ["🌧️ Rainy Day","Side jobs give +20% XP for this event."],
 ["💎 Lucky Find","The next successful activity has a chance for a bonus."],
 ["🚗 City Rush","Driver activities consume less energy."]
];
const pets={dog:["🐶","Dog"],cat:["🐱","Cat"],fox:["🦊","Fox"],parrot:["🦜","Parrot"]};

async function worldCommand(i){
 const p=await getPlayer(i.user.id,i.guildId);
 if(i.commandName==="map"){
  return i.reply({embeds:[new EmbedBuilder().setTitle("🗺️ GUARDIA CITY MAP").setDescription(districts.map((d,n)=>`${n+1}. ${d[1]} **${d[0]}** — ${d[2]} — ${d[3]}`).join("\n")).addFields({name:"Current District",value:p.district})]});
 }
 if(i.commandName==="events"){
  const day=Math.floor(Date.now()/86400000),event=events[day%events.length];
  return i.reply({embeds:[new EmbedBuilder().setTitle("🎲 CITY EVENT").setDescription(`**${event[0]}**\n${event[1]}\n\nEvents rotate automatically.`)]});
 }
 if(i.commandName==="pet"){
  const current=p.pets?.name;
  if(!current)return i.reply({content:"🐾 Choose a pet:",components:[new ActionRowBuilder().addComponents(...Object.entries(pets).map(([k,v])=>new ButtonBuilder().setCustomId(`pet:adopt:${k}`).setLabel(v[1]).setEmoji(v[0]).setStyle(ButtonStyle.Primary)))]});
  return i.reply({embeds:[new EmbedBuilder().setTitle("🐾 YOUR PET").setDescription(`${p.pets.emoji} **${current}**\nHappiness: ${p.pets.happiness||50}/100\nEnergy: ${p.pets.energy||100}/100`)],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("pet:play").setLabel("Play").setEmoji("🎾").setStyle(ButtonStyle.Success),new ButtonBuilder().setCustomId("pet:feed").setLabel("Feed").setEmoji("🍖").setStyle(ButtonStyle.Secondary))]});
 }
 if(i.commandName==="achievements"){
  const a=p.achievements||{},defs=[["first_shift","First Shift","Complete your first job"],["entrepreneur","Entrepreneur","Open a business"],["wanted","Wanted","Reach 3 wanted"],["pet_friend","Pet Friend","Adopt a pet"],["city_veteran","City Veteran","Reach level 10"]];
  return i.reply({embeds:[new EmbedBuilder().setTitle("🏆 ACHIEVEMENTS").setDescription(defs.map(x=>`${a[x[0]]?"✅":"⬜"} **${x[1]}** — ${x[2]}`).join("\n"))]});
 }
 if(i.commandName==="police"){
  return i.reply({embeds:[new EmbedBuilder().setTitle("👮 POLICE DEPARTMENT").setDescription("Fictional City career system.\n\nInvestigate City cases, earn reputation, and reduce wanted levels through gameplay.")],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("police:patrol").setLabel("Patrol").setEmoji("🚓").setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId("police:investigate").setLabel("Investigate Case").setEmoji("🔎").setStyle(ButtonStyle.Secondary))]});
 }
 if(i.commandName==="trade"){
  return i.reply({embeds:[new EmbedBuilder().setTitle("🤝 CITY TRADING").setDescription("Player-to-player trading is enabled in the City economy.\n\nUse the trade panel to create offers and confirm them before anything changes.")],components:[new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("trade:info").setLabel("Trade Rules").setEmoji("📜").setStyle(ButtonStyle.Secondary))],ephemeral:true});
 }
}

async function handleWorldButton(i){
 if(!i.isButton()||!i.customId.includes(":"))return false;
 const [scope,action,key]=i.customId.split(":");
 const p=await getPlayer(i.user.id,i.guildId);
 if(scope==="pet"){
  if(action==="adopt"){
   if(p.pets?.name)return i.reply({content:"You already have a pet.",ephemeral:true});
   const v=pets[key]; if(!v)return;
   await updatePlayer(i.user.id,i.guildId,{pets:{name:v[1],emoji:v[0],happiness:70,energy:100}});
   const a={...(p.achievements||{}),pet_friend:true};await updatePlayer(i.user.id,i.guildId,{achievements:a});
   return i.update({content:`🐾 You adopted a ${v[0]} **${v[1]}**!`,embeds:[],components:[]});
  }
  if(action==="play"||action==="feed"){
   if(!p.pets?.name)return i.reply({content:"Adopt a pet first.",ephemeral:true});
   const pet={...p.pets,happiness:Math.min(100,(p.pets.happiness||50)+(action==="play"?10:5)),energy:Math.max(0,(p.pets.energy||100)-(action==="play"?8:2))};
   return updatePlayer(i.user.id,i.guildId,{pets:pet}).then(()=>i.reply({content:action==="play"?"🎾 Your pet had fun!":"🍖 Your pet is happy!",ephemeral:true}));
  }
 }
 if(scope==="police"){
  if(action==="patrol"){
   const gain=25;await updatePlayer(i.user.id,i.guildId,{reputation:Number(p.reputation||0)+gain,xp:Number(p.xp)+10});
   return i.reply({content:`🚓 Patrol complete. +${gain} reputation and +10 XP.`,ephemeral:true});
  }
  if(action==="investigate"){
   if(Number(p.wanted)<=0)return i.reply({content:"🔎 No active City cases right now.",ephemeral:true});
   await updatePlayer(i.user.id,i.guildId,{wanted:Math.max(0,Number(p.wanted)-1),reputation:Number(p.reputation||0)+40,xp:Number(p.xp)+20});
   return i.reply({content:"🔎 Case solved. Wanted level reduced by 1.",ephemeral:true});
  }
 }
 if(scope==="trade"&&action==="info")return i.reply({content:"🤝 Trades require both players to confirm. Never share tokens, passwords, or payment details.",ephemeral:true});
 return false;
}
module.exports={worldCommand,handleWorldButton};