const http=require("http");
const {q}=require("./database");

function page(){
 return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Discord Bot Dashboard</title>
 <style>body{margin:0;background:#0b0d12;color:#eee;font-family:system-ui;padding:28px}h1{margin:0 0 8px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px;margin-top:22px}.card{background:#151922;border:1px solid #252b38;border-radius:16px;padding:20px}.v{font-size:28px;font-weight:800;margin-top:8px}.muted{color:#9299aa}</style></head>
 <body><h1>🏙️ BOT DASHBOARD</h1><div class="muted">All-in-one Discord City & Community Dashboard</div>
 <div class="grid" id="stats"><div class="card">Loading…</div></div>
 <script>
 async function load(){const key=new URLSearchParams(location.search).get("key")||"";const r=await fetch("/api/stats?key="+encodeURIComponent(key));const d=await r.json();document.getElementById("stats").innerHTML=d.error?'<div class="card">'+d.error+'</div>':Object.entries(d).map(([k,v])=>'<div class="card"><div class="muted">'+k+'</div><div class="v">'+v+'</div></div>').join("")}load();
 </script></body></html>`;
}
function startDashboard(client){
 const port=Number(process.env.DASHBOARD_PORT||3000);
 const key=process.env.DASHBOARD_KEY;
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://localhost:${port}`);
  if(url.pathname==="/health"){res.writeHead(200,{"content-type":"text/plain"});return res.end("ok");}
  if(url.pathname==="/"){res.writeHead(200,{"content-type":"text/html; charset=utf-8"});return res.end(page());}
  if(url.pathname==="/api/stats"){
   if(!key||url.searchParams.get("key")!==key){res.writeHead(401,{"content-type":"application/json"});return res.end(JSON.stringify({error:"Dashboard key required"}));}
   const {rows}=await q("SELECT COUNT(*)::int members,COALESCE(SUM(money),0)::bigint cash,COALESCE(SUM(bank),0)::bigint bank,COALESCE(SUM(wanted),0)::int wanted,COUNT(DISTINCT guild_id)::int servers FROM players");
   const row=rows[0];
   res.writeHead(200,{"content-type":"application/json"});return res.end(JSON.stringify({Servers:row.servers,Citizens:row.members,"Wallet_Cash":"$"+Number(row.cash).toLocaleString(),"Bank_Money":"$"+Number(row.bank).toLocaleString(),"Total_Wanted":row.wanted,"Bot":client.user?.tag||"Discord Bot"}));
  }
  res.writeHead(404);res.end("Not found");
 });
 server.listen(port,()=>console.log(`🌐 Dashboard listening on port ${port}`));
}
module.exports={startDashboard};