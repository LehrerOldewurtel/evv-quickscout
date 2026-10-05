(function(){
"use strict";
const $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
const ROT_NEXT={5:6,6:1,1:2,2:3,3:4,4:5}; // confirmed live-test convention: R5→R6→R1
const roster=[
{id:"johann",name:"Johann",role:"Z"},{id:"michael",name:"Michael",role:"AA1"},{id:"janik",name:"Janik",role:"MB1"},
{id:"jonas",name:"Jonas",role:"D"},{id:"maksym",name:"Maksym",role:"AA2"},{id:"dirk",name:"Dirk",role:"MB2"},
{id:"felix",name:"Felix",role:"AA"},{id:"jens",name:"Jens",role:"D/AA"},{id:"amar",name:"Amar",role:"L"},{id:"alex",name:"Alexandra",role:"L"}];
const byId=id=>roster.find(p=>p.id===id), nm=id=>(byId(id)||{name:id}).name;
let opponent={name:"Gegner",setter:"#",libero:"#",receivers:["#","#","#","#"]};
let tab="rally",view="live",draft={},pendingMark=null;
let st=fresh();
function fresh(){return{started:false,set:1,e:0,o:0,rot:1,serving:true,setEnded:false,matchEnded:false,
lineup:["johann","michael","janik","jonas","maksym","dirk"],receiveIds:[],liberoId:"amar",liberoActive:false,
rallies:[],sets:[],rallyUndo:[],events:[],marks:[],setStart:null}}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function toast(s){$("toast").textContent=s;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),1100)}
function modal(html){$("modalBox").innerHTML=html;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden");$("modalBox").innerHTML=""}
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeModal()});
function target(set=st.set){return set===5?15:25}
function isSetWin(e=st.e,o=st.o,set=st.set){return (e>=target(set)||o>=target(set))&&Math.abs(e-o)>=2}
function setWins(team){let w=st.sets.filter(s=>(team==="EVV"?s.e>s.o:s.o>s.e)).length;if(st.setEnded&&(team==="EVV"?st.e>st.o:st.o>st.e))w++;return w}
function checkEnd(){st.setEnded=isSetWin();if(st.setEnded){const w=st.e>st.o?"EVV":"Gegner";st.matchEnded=st.set===5||setWins(w)>=3}}
function snapshot(){return clone({e:st.e,o:st.o,rot:st.rot,serving:st.serving,setEnded:st.setEnded,matchEnded:st.matchEnded,rallies:st.rallies,marks:st.marks})}
function restore(x){Object.assign(st,clone(x))}
const STORE_KEY="evvQuickScoutV76";
function saveLocal(){try{localStorage.setItem(STORE_KEY,JSON.stringify({st,opponent}))}catch(e){}}
function loadLocal(){try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return false;const d=JSON.parse(raw);if(d&&d.st){st=Object.assign(fresh(),d.st);opponent=Object.assign(opponent,d.opponent||{});return true}}catch(e){}return false}
function rotate(){st.rot=ROT_NEXT[st.rot]||st.rot}
function commit(w,data={},preSnapshot=null){
 if(st.setEnded||st.matchEnded)return toast("Satz ist beendet");
 st.rallyUndo.push(preSnapshot?clone(preSnapshot):snapshot());
 const before=`${st.e}:${st.o}`,rb=st.rot,sb=st.serving;
 if(w==="EVV"){st.e++;if(!st.serving){st.serving=true;rotate()}}
 else{st.o++;if(st.serving)st.serving=false}
 data=Object.assign({},data,{winner:w,before,after:`${st.e}:${st.o}`,rotation:rb,servingBefore:sb,phase:data.phase||(sb?"K2":"K1"),set:st.set});
 st.rallies.push(data);draft={};tab="rally";view="live";checkEnd();render();toast(`${w} ${before} → ${st.e}:${st.o}`)
}
function allRallies(){return st.sets.flatMap(s=>s.rallies).concat(st.rallies)}
function allMarks(){return st.sets.flatMap(s=>s.marks||[]).concat(st.marks)}
function active(){return st.lineup.slice()}
function rotationSteps(from,to){let n=0,r=from;while(r!==to&&n<6){r=ROT_NEXT[r];n++}return n}
function courtPos(id){
 const base=st.lineup.indexOf(id)+1;if(!base)return null;
 const startRot=(st.setStart&&st.setStart.rot)||st.rot,steps=rotationSteps(startRot,st.rot);
 let pos=base;for(let i=0;i<steps;i++)pos=pos===1?6:pos-1;return pos
}
function playerAtPos(pos){return active().find(id=>courtPos(id)===pos)||null}
function front(){return active().filter(id=>[2,3,4].includes(courtPos(id)))}
function receivers(){
 // No hard-coded trio: in a no-libero formation every active court player except the setter can be recorded.
 let ids=active().filter(id=>{const p=byId(id);return p&&p.role!=="Z"&&p.role!=="L"});
 if(st.liberoActive&&st.liberoId&&!ids.includes(st.liberoId))ids.push(st.liberoId);
 return ids
}
function opponentReceivers(){return [...new Set(opponent.receivers.concat(opponent.libero&&opponent.libero!=="#?"?[opponent.libero]:[]).filter(x=>x&&x!=="#"&&x!=="#?"))]}
function attackers(){return active().filter(id=>{const p=byId(id);return p&&p.role!=="Z"&&p.role!=="L"&&id!==st.liberoId})}
function attackOptions(){
 const z={4:"IV",3:"III",2:"II",6:"PIPE",1:"I",5:"V"};
 return attackers().map(id=>({id,zone:z[courtPos(id)]||"HF",pos:courtPos(id)}))
}
function attackCandidates(target){let a=attackOptions();let exact=a.filter(x=>x.zone===target);return exact.length?exact:a}
function setupUI(){
 $("startSix").innerHTML=st.lineup.map((id,i)=>`<label>Pos ${i+1}<select id="ss${i}">${roster.filter(p=>p.role!=="L").map(p=>`<option value="${p.id}" ${p.id===id?"selected":""}>${esc(p.name)} · ${esc(p.role)}</option>`).join("")}</select></label>`).join("")
}
function readSetup(){
 const ids=[0,1,2,3,4,5].map(i=>$("ss"+i).value);
 if(new Set(ids).size!==6){toast("Start-Sechs enthält doppelte Spieler");return false}
 st.lineup=ids;
 st.receiveIds=[];
 st.liberoActive=!!($("evvLiberoActive")&&$("evvLiberoActive").checked);
 opponent.name=$("oppName").value.trim()||"Gegner";opponent.setter="#"+($("oppSetter").value.trim()||"?");opponent.libero="#"+($("oppLibero").value.trim()||"?");
 opponent.receivers=[1,2,3,4].map(i=>"#"+($("oppR"+i).value.trim()||"?"));
 st.rot=parseInt($("startRotation").value.slice(1),10)||1; return true
}
function start(serv){if(!readSetup())return;const keep=clone(st.lineup),keepRec=clone(st.receiveIds),keepLib=st.liberoId,keepLibActive=st.liberoActive;st=fresh();st.lineup=keep;st.receiveIds=keepRec;st.liberoId=keepLib;st.liberoActive=keepLibActive;st.rot=parseInt($("startRotation").value.slice(1),10)||1;st.serving=serv;st.started=true;st.setStart={rot:st.rot,serving:serv};$("setup").classList.add("hidden");render()}
function currentServerId(){return playerAtPos(1)}
function currentServer(){
 if(!st.serving)return opponent.name;
 // Rotation number indexes current service turn; preserve selected six and substitutions.
 return nm(currentServerId()||"");
}
function renderHeader(){
 $("homeScore").textContent=st.e;$("oppScore").textContent=st.o;$("oppNameHead").textContent=opponent.name;$("setBadge").textContent=`S${st.set}${st.set===5?" · TB":""}`;$("rotationBadge").textContent=`R${st.rot}`;
 $("phase").textContent=st.serving?"K2":"K1";$("serveText").textContent=st.serving?"EVV Aufschlag":"Gegner Aufschlag";$("serverText").textContent=st.serving?`Aufschlag: ${currentServer()}`:`Aufschlag: ${opponent.name}`;
 $("lineups").innerHTML=`<div class="lineup"><b>EVV · aktive Sechs</b><div class="chips">${active().map(id=>`<span class="chip">${esc(nm(id))}</span>`).join("")}</div></div><div class="lineup"><b>${esc(opponent.name)}</b><div class="chips"><span class="chip">Z ${esc(opponent.setter)}</span><span class="chip">L ${esc(opponent.libero)}</span>${opponent.receivers.map(x=>`<span class="chip">${esc(x)}</span>`).join("")}</div></div>`
}
function renderNav(){
 const nums=[...st.sets.map(s=>s.set),st.set].filter((v,i,a)=>a.indexOf(v)===i);
 $("setNav").innerHTML=nums.map(n=>`<button data-view="${n}" class="${view===n?"primary":""}">S${n}</button>`).join("")+`<button data-view="live" class="${view==="live"?"primary":""}">LIVE</button><button data-view="match" class="${view==="match"?"primary":""}">MATCH</button>`;
 document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{view=b.dataset.view==="live"||b.dataset.view==="match"?b.dataset.view:+b.dataset.view;render()})
}
function B(label,act,cls=""){return `<button class="${cls}" data-act="${esc(act)}">${label}</button>`}
function bindActs(){document.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>action(b.dataset.act))}
function setLastAttackResult(result){for(let i=(draft.chain||[]).length-1;i>=0;i--){if(draft.chain[i].side==="EVV"&&draft.chain[i].type==="Attack"){draft.chain[i].result=result;break}}}
function action(s){
 const a=s.split("|");
 if(a[0]==="rec"){
   if(a[2]==="A0")commit("Gegner",{event:"Reception",receiver:a[1],reception:a[2],chain:[{side:"EVV",type:"Reception",player:a[1],quality:a[2]}]});
   else{draft={step:"evvSet",phase:"K1",receiver:a[1],reception:a[2],chain:[{side:"EVV",type:"Reception",player:a[1],quality:a[2]}]};render()}
 }
 else if(a[0]==="es"){draft.setterTarget=a[1];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Set",target:a[1]});draft.step="evvAttack";render()}
 else if(a[0]==="att"){if(!attackers().includes(a[1]))return toast("Dieser Spieler ist aktuell kein Angreifer");draft.attacker=a[1];draft.zone=a[2];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Attack",player:a[1],route:a[2]});draft.step="evvAttackResult";render()}
 else if(a[0]==="fin"){
   if(a[1]==="KILL"){setLastAttackResult("KILL");let d=Object.assign({},draft,{event:"Attack",result:"KILL"});pendingMark={w:"EVV",data:d};courtPicker();return}
   if(a[1]==="ERROR"||a[1]==="BLOCKED"){setLastAttackResult(a[1]);return commit("Gegner",Object.assign({},draft,{event:"Attack",result:a[1]}));}
   // CONTINUE means rally continues; never award a point.
   setLastAttackResult("CONTINUE");draft.chain=(draft.chain||[]).concat({side:"EVV",type:"AttackResult",result:"CONTINUE"});draft.step="oppDefense";tab="opponent";render()
 }
 else if(a[0]==="quick")commit(a[1],{event:"Quick"})
 else if(a[0]==="serve"){
   if(a[1]==="ACE")nineZonePicker("ACE",{w:"EVV",data:{event:"Serve",serve:"ACE",server:currentServerId(),phase:"K2",chain:[{side:"EVV",type:"Serve",player:currentServerId(),result:"ACE"}]}});
   else if(a[1]==="ERR")commit("Gegner",{event:"Serve",serve:"ERROR",server:currentServerId(),phase:"K2",chain:[{side:"EVV",type:"Serve",player:currentServerId(),result:"ERROR"}]});
   else{draft={step:"oppReception",event:"Serve",serve:"IN",server:currentServerId(),phase:"K2",chain:[{side:"EVV",type:"Serve",player:currentServerId(),result:"IN"}]};tab="opponent";render()}
 }
 else if(a[0]==="or"){
   draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"Reception",player:a[1],quality:a[2]});
   if(a[2]==="A0")commit("EVV",Object.assign({},draft,{event:"OpponentReception",receiver:a[1],reception:a[2]}));
   else{draft=Object.assign({},draft,{step:"oppSet",event:"OpponentReception",receiver:a[1],reception:a[2]});render()}
 }
 else if(a[0]==="os"){draft.setterTarget=a[1];draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"Set",target:a[1]});draft.step="oppAttack";render()}
 else if(a[0]==="of"){
   if(a[1]==="KILL")return commit("Gegner",Object.assign({},draft,{event:"OpponentAttack",result:"KILL"}));
   if(a[1]==="BLOCK"){draft.step="evvBlock";tab="rally";render();return}
   if(a[1]==="ERROR")return commit("EVV",Object.assign({},draft,{event:"OpponentAttack",result:a[1]}));
   draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"AttackResult",result:"DEFENDED"});draft.step="evvDefense";tab="rally";render()
 }
 else if(a[0]==="ed"){draft.defender=a[1];draft.defense=a[2];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Defense",player:a[1],quality:a[2]});draft.step="evvSet";render()}
 else if(a[0]==="blk"){if(!front().includes(a[1]))return toast("Blocker steht nicht in der Vorderreihe");draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Block",player:a[1],result:"BLOCK"});commit("EVV",Object.assign({},draft,{event:"OpponentAttack",result:"BLOCK",blocker:a[1]}))}
 else if(a[0]==="od"){draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"Defense",quality:a[1]});draft.step="oppSet";render()}
}
function rally(){
 if(!st.started)return $("flow").innerHTML="<h2>Bereit</h2><p>Spiel einrichten und starten.</p>";
 if(view!=="live")return historical();
 if(st.matchEnded)return $("flow").innerHTML=`<div class="banner">MATCH BEENDET</div>${summary(allRallies())}`;
 if(st.setEnded){$("flow").innerHTML=`<div class="banner">SATZ ${st.set} BEENDET · ${st.e}:${st.o}</div>${summary(st.rallies)}<button id="prep" class="primary">Nächsten Satz vorbereiten</button>`;$("prep").onclick=prepareNextSet;return}
 if(draft.step==="evvBlock"){
   $("flow").innerHTML=`<h2>EVV · Blockpunkt durch?</h2><div class="eligibleNote">Nur aktuelle Vorderreihe P2/P3/P4.</div><div class="grid3">${front().map(id=>B(`${esc(nm(id))} · P${courtPos(id)}`,`blk|${id}`,"good")).join("")}</div>`;bindActs();return
 }
 if(draft.step==="evvDefense"){
   let h="<h2>EVV · Abwehrqualität</h2>";active().forEach(id=>h+=`<div class="row"><b>${esc(nm(id))}</b>${["D3","D2","D1","D0"].map(q=>B(q,`ed|${id}|${q}`,q==="D3"?"good":q==="D0"?"bad":"")).join("")}</div>`);$("flow").innerHTML=h;bindActs();return
 }
 if(draft.step==="evvSet"){$("flow").innerHTML=`<h2>EVV · Zuspiel wohin?</h2><div class="grid4">${["IV","III","II","PIPE","I","V"].map(z=>B(z,`es|${z}`)).join("")}</div>`;bindActs();return}
 if(draft.step==="evvAttack"){
   let ao=attackCandidates(draft.setterTarget);$("flow").innerHTML=`<h2>EVV · Angriff ${esc(draft.setterTarget||"")}</h2><div class="eligibleNote">Aus aktueller Feldposition berechnet. P4→IV · P3→III · P2→II · P6→Pipe.</div><div class="grid2">${ao.map(o=>B(`${esc(nm(o.id))} · ${o.zone} · P${o.pos}`,`att|${o.id}|${o.zone}`)).join("")}</div>`;bindActs();return
 }
 if(draft.step==="evvAttackResult"){$("flow").innerHTML=`<h2>EVV · Angriffsergebnis</h2><div class="grid2">${B("KILL","fin|KILL","good")}${B("FEHLER","fin|ERROR","bad")}${B("GEBLOCKT","fin|BLOCKED","bad")}${B("WEITER · Gegner verteidigt","fin|CONTINUE","blue")}</div>`;bindActs();return}
 if(!st.serving){
   let h="<h2>K1 · Annahme</h2><div class='eligibleNote'>Alle tatsächlich aktiven Feldspieler außer Zuspieler; Mittelblocker bleibt ohne Libero auswählbar.</div>";receivers().forEach(id=>{h+=`<div class="row"><b>${esc(nm(id))} · P${courtPos(id)}</b>${["A3","A2","A1","A0"].map(q=>B(q,`rec|${id}|${q}`,q==="A3"?"good":q==="A0"?"bad":"")).join("")}</div>`});$("flow").innerHTML=h+`<div class="grid3">${B("Gegner AF","quick|EVV","good")}${B("Quick EVV","quick|EVV")}${B("Quick Gegner","quick|Gegner")}</div>`
 } else {
   $("flow").innerHTML=`<h2>K2 · Aufschlag</h2><div class="grid2">${B("ASS","serve|ACE","good")}${B("FEHLER","serve|ERR","bad")}${B("IM SPIEL","serve|IN","blue")}${B("Quick EVV","quick|EVV")}${B("Quick Gegner","quick|Gegner")}</div>`
 }
 bindActs()
}
function opponentTab(){
 if(!st.started)return $("flow").innerHTML="<h2>Gegner</h2><p>Gegnerdaten im Setup festlegen.</p>";
 if(view!=="live")return historical();
 if(draft.step==="oppDefense"){$("flow").innerHTML=`<h2>${esc(opponent.name)} · Abwehr</h2><div class="grid4">${["D3","D2","D1","D0"].map(q=>B(q,`od|${q}`,q==="D3"?"good":q==="D0"?"bad":"")).join("")}</div>`}
 else if(draft.step==="oppReception"){$("flow").innerHTML=`<h2>Gegner · Annahme nach EVV-Aufschlag</h2>${opponentReceivers().map(r=>`<div class="row"><b>${esc(r)}${r===opponent.libero?" · L":""}</b>${["A3","A2","A1","A0"].map(q=>B(q,`or|${r}|${q}`,q==="A0"?"bad":"")).join("")}</div>`).join("")}`}
 else if(draft.step==="oppSet")$("flow").innerHTML=`<h2>${esc(opponent.setter)} · Zuspiel wohin?</h2><div class="grid4">${["IV","III","II","PIPE"].map(z=>B(z,`os|${z}`)).join("")}</div>`;
 else if(draft.step==="oppAttack")$("flow").innerHTML=`<h2>Gegnerangriff ${esc(draft.setterTarget||"")}</h2><div class="grid2">${B("KILL Gegner","of|KILL","bad")}${B("EVV Block","of|BLOCK","good")}${B("Fehler Gegner","of|ERROR","good")}${B("EVV ABWEHR · Rallye weiter","of|DEFENSE","blue")}</div>`;
 else $("flow").innerHTML="<h2>Gegner</h2><p>Rallye im Rallye-Tab starten.</p>";
 bindActs()
}
function pct(a,n){return n?Math.round(a/n*100)+"%":"–"}
function summary(r){let rec=r.filter(x=>x.event==="Reception"),pos=rec.filter(x=>["A2","A3"].includes(x.reception)).length,k=r.filter(x=>x.event==="Attack"&&x.result==="KILL").length,ace=r.filter(x=>x.event==="Serve"&&x.serve==="ACE").length,af=r.filter(x=>x.event==="Serve"&&x.serve==="ERROR").length;return `<div class="grid4"><div><b>${r.length}</b><div class="tiny">Rallyes</div></div><div><b>${pct(pos,rec.length)}</b><div class="tiny">Annahme+ ${pos}/${rec.length}</div></div><div><b>${k}</b><div class="tiny">Kills</div></div><div><b>${ace}/${af}</b><div class="tiny">Ace/AF</div></div></div>`}

function ralliesForSet(s){
 if(s===st.set) return st.rallies.filter(r=>r.set===s);
 const a=st.setArchive&&st.setArchive[s]; return a&&a.rallies?a.rallies:[];
}
function statRowsFrom(rr){
 const ids=[...new Set(roster.map(p=>p.id).concat(rr.flatMap(r=>[r.receiver,r.attacker,r.player,r.server,r.blocker]).filter(Boolean)))];
 return ids.map(id=>{
  let rec=[],srv=[],att=[],def=[],bl=0;
  rr.forEach(r=>{
   const ch=r.chain||[];
   ch.forEach(x=>{if(x.side!=="EVV")return;if(x.type==="Reception"&&x.player===id)rec.push(x);if(x.type==="Serve"&&x.player===id)srv.push(x);if(x.type==="Attack"&&x.player===id)att.push(x);if(x.type==="Defense"&&x.player===id)def.push(x);if(x.type==="Block"&&x.player===id&&x.result==="BLOCK")bl++});
   if(!ch.length){if(r.receiver===id&&r.reception)rec.push({quality:r.reception});if(r.event==="Serve"&&r.server===id)srv.push({result:r.serve});if(r.event==="Attack"&&r.attacker===id)att.push({result:r.result});if(r.defender===id&&r.defense)def.push({quality:r.defense});if(r.blocker===id&&r.result==="BLOCK")bl++}
  });
  const q=x=>x.quality||x.reception,a3=rec.filter(x=>q(x)==="A3").length,a2=rec.filter(x=>q(x)==="A2").length,a1=rec.filter(x=>q(x)==="A1").length,a0=rec.filter(x=>q(x)==="A0").length;
  const sr=x=>x.result||x.serve,ac=srv.filter(x=>sr(x)==="ACE").length,se=srv.filter(x=>sr(x)==="ERROR").length;
  const kill=att.filter(x=>x.result==="KILL").length,ae=att.filter(x=>x.result==="ERROR").length,ab=att.filter(x=>x.result==="BLOCKED").length,eff=att.length?Math.round((kill-ae-ab)/att.length*100):0;
  const dq=x=>x.quality,d3=def.filter(x=>dq(x)==="D3").length,d2=def.filter(x=>dq(x)==="D2").length,d1=def.filter(x=>dq(x)==="D1").length,d0=def.filter(x=>dq(x)==="D0").length;
  return{id,rec:rec.length,a3,a2,a1,a0,rq:rec.length?Math.round((a3+a2)/rec.length*100):0,srv:srv.length,ac,se,att:att.length,kill,ae,ab,eff,bl,def:def.length,d3,d2,d1,d0}
 })
}
function rotationStats(rr){
 return [1,2,3,4,5,6].map(rot=>{const x=rr.filter(r=>r.rotation===rot),k1=x.filter(r=>r.phase==="K1"),k2=x.filter(r=>r.phase==="K2"),rate=a=>a.length?Math.round(100*a.filter(r=>r.winner==="EVV").length/a.length):0;return{rot,n:x.length,k1:k1.length,k1p:rate(k1),k2:k2.length,k2p:rate(k2),saldo:x.filter(r=>r.winner==="EVV").length-x.filter(r=>r.winner!=="EVV").length}})
}
function fullStatsFrom(rr,label){
 const rows=statRowsFrom(rr),rots=rotationStats(rr),k1=rr.filter(r=>r.phase==="K1"),k2=rr.filter(r=>r.phase==="K2"),win=x=>x.length?Math.round(x.filter(r=>r.winner==="EVV").length/x.length*100):0;
 const recN=rows.reduce((a,x)=>a+x.rec,0),recPos=rows.reduce((a,x)=>a+x.a3+x.a2,0),aces=rows.reduce((a,x)=>a+x.ac,0),serr=rows.reduce((a,x)=>a+x.se,0);
 return `<div class="statSection"><h2>${label} · Spielerstatistik</h2><div class="statCards"><div class="statCard"><span>K1</span><b>${win(k1)}%</b><small>n=${k1.length}</small></div><div class="statCard"><span>K2</span><b>${win(k2)}%</b><small>n=${k2.length}</small></div><div class="statCard"><span>Annahme +</span><b>${recN?Math.round(recPos/recN*100):0}%</b><small>${recPos}/${recN}</small></div><div class="statCard"><span>Aces / Fehler</span><b>${aces} / ${serr}</b><small>Aufschlag</small></div></div>
 <h3>Annahme je Spieler</h3><div style="overflow-x:auto"><table class="statsTable"><thead><tr><th>Spieler</th><th>n</th><th>A3</th><th>A2</th><th>A1</th><th>A0</th><th>+ Quote</th></tr></thead><tbody>${rows.filter(x=>x.rec).map(x=>`<tr><td>${esc(nm(x.id))}</td><td>${x.rec}</td><td>${x.a3}</td><td>${x.a2}</td><td>${x.a1}</td><td>${x.a0}</td><td>${x.rq}%</td></tr>`).join("")||'<tr><td colspan="7">Noch keine Annahmen</td></tr>'}</tbody></table></div>
 <h3>Angriff / Block</h3><div style="overflow-x:auto"><table class="statsTable"><thead><tr><th>Spieler</th><th>Angr.</th><th>Kill</th><th>Fehler</th><th>geblockt</th><th>Eff.</th><th>Blockpkt.</th></tr></thead><tbody>${rows.filter(x=>x.att||x.bl).map(x=>`<tr><td>${esc(nm(x.id))}</td><td>${x.att}</td><td>${x.kill}</td><td>${x.ae}</td><td>${x.ab}</td><td>${x.eff}%</td><td>${x.bl}</td></tr>`).join("")||'<tr><td colspan="7">Noch keine Angriffe/Blocks</td></tr>'}</tbody></table></div>
 <h3>Aufschlag</h3><div style="overflow-x:auto"><table class="statsTable"><thead><tr><th>Spieler</th><th>Versuche</th><th>Ass</th><th>Fehler</th></tr></thead><tbody>${rows.filter(x=>x.srv).map(x=>`<tr><td>${esc(nm(x.id))}</td><td>${x.srv}</td><td>${x.ac}</td><td>${x.se}</td></tr>`).join("")||'<tr><td colspan="4">Noch keine Aufschläge erfasst</td></tr>'}</tbody></table></div>
 <h3>Abwehr</h3><div style="overflow-x:auto"><table class="statsTable"><thead><tr><th>Spieler</th><th>n</th><th>D3</th><th>D2</th><th>D1</th><th>D0</th></tr></thead><tbody>${rows.filter(x=>x.def).map(x=>`<tr><td>${esc(nm(x.id))}</td><td>${x.def}</td><td>${x.d3}</td><td>${x.d2}</td><td>${x.d1}</td><td>${x.d0}</td></tr>`).join("")||'<tr><td colspan="6">Noch keine Abwehraktionen</td></tr>'}</tbody></table></div>
 <h3>Rotationen · K1/K2</h3><div style="overflow-x:auto"><table class="statsTable"><thead><tr><th>Rotation</th><th>Rallyes</th><th>K1</th><th>K1%</th><th>K2</th><th>K2%</th><th>Saldo</th></tr></thead><tbody>${rots.map(x=>`<tr><td>R${x.rot}</td><td>${x.n}</td><td>${x.k1}</td><td>${x.k1p}%</td><td>${x.k2}</td><td>${x.k2p}%</td><td>${x.saldo>0?"+":""}${x.saldo}</td></tr>`).join("")}</tbody></table></div><h3>Landepunkte</h3><div class="small">${rr.filter(r=>r.targetZone).length} markierte Punktaktionen.</div></div>`
}
function fullStats(s){const rr=ralliesForSet(s);return fullStatsFrom(rr,`SATZ ${s}`)}
function matchStats(){return fullStatsFrom(allRallies(),"MATCH")}
function nextSetPrep(){
 const next=st.set+1;
 const oppInputs=opponent.receivers.map((r,i)=>`<label>Annahme ${i+1}<input id="nOR${i}" value="${esc(r)}"></label>`).join("");
 modal(`<div class="setprep"><h2>Satz ${next} vorbereiten</h2><p class="small"><b>${esc(opponent.name)}</b> bleibt gespeichert. Nur Aufstellungen/Startbedingungen für den neuen Satz prüfen.</p>
 <h3>EVV Start-6</h3><div class="grid2">${[0,1,2,3,4,5].map(i=>`<label>Position ${i+1}<select id="nP${i}">${roster.filter(p=>p.role!=="L").map(p=>`<option value="${p.id}" ${st.lineup[i]===p.id?"selected":""}>${esc(p.name)} · ${p.role}</option>`).join("")}</select></label>`).join("")}</div>
 <h3>${esc(opponent.name)} · aktuelle Aufstellung</h3><div class="grid2"><label>Zuspieler<input id="nOZ" value="${esc(opponent.setter)}"></label><label>Libero<input id="nOL" value="${esc(opponent.libero)}"></label>${oppInputs}</div>
 <label>Startrotation<select id="nRot">${[1,2,3,4,5,6].map(r=>`<option ${r===st.rot?"selected":""}>${r}</option>`).join("")}</select></label>
 <div class="grid2"><button id="nK1">Gegner-Aufschlag · K1</button><button id="nK2" class="primary">EVV-Aufschlag · K2</button></div></div>`);
 const go=serving=>{
   const ids=[0,1,2,3,4,5].map(i=>$("nP"+i).value); if(new Set(ids).size<6)return toast("EVV Start-6: Spieler doppelt");
   st.lineup=ids;st.rot=+$("nRot").value;st.serving=serving;opponent.setter=$("nOZ").value.trim()||opponent.setter;opponent.libero=$("nOL").value.trim()||opponent.libero;opponent.receivers=[0,1,2,3].map(i=>$("nOR"+i).value.trim()||`#${i+1}`);
   st.set=next;st.e=0;st.o=0;st.setEnded=false;st.rallies=[];draft={};view="live";closeModal();render();toast(`Satz ${next} gestartet`)
 };
 $("nK1").onclick=()=>go(false);$("nK2").onclick=()=>go(true);
}
function historical(){let r=view==="match"?allRallies():(st.sets.find(s=>s.set===view)?.rallies||(view===st.set?st.rallies:[]));$("flow").innerHTML=`<div class="banner">${view==="match"?"MATCH":"Satz "+view} · READ ONLY</div>${summary(r)}`}
function coach(){
 const r=allRallies(),last=r.slice(-5),rec=r.filter(x=>x.event==="Reception"),pos=rec.filter(x=>["A2","A3"].includes(x.reception)).length;
 const ors={};r.filter(x=>x.event==="OpponentReception").forEach(x=>{let v=ors[x.receiver]||(ors[x.receiver]={n:0,p:0});v.n++;if(["A2","A3"].includes(x.reception))v.p++});
 let weak=Object.entries(ors).filter(([,v])=>v.n>=3).sort((a,b)=>a[1].p/a[1].n-b[1].p/b[1].n)[0];
 const dist={IV:0,III:0,II:0,PIPE:0};let dn=0;r.forEach(x=>{if(x.setterTarget&&dist[x.setterTarget]!=null){dist[x.setterTarget]++;dn++}});
 $("flow").innerHTML=`<h2>Coach · Auszeit</h2><div class="coachline"><b>Letzte 5:</b> ${last.map(x=>x.winner==="EVV"?"✓":"×").join(" ")} · ${last.filter(x=>x.winner==="EVV").length}:${last.filter(x=>x.winner!=="EVV").length}</div><div class="coachline"><b>EVV Annahme+:</b> ${pct(pos,rec.length)} · ${pos}/${rec.length}</div><div class="coachline"><b>Aufschlagziel:</b> ${weak?`${esc(weak[0])} · ${pct(weak[1].p,weak[1].n)} positiv (${weak[1].p}/${weak[1].n})`:"noch keine belastbare Stichprobe (min. 3)"}</div><div class="coachline"><b>${esc(opponent.setter)} Zuspiel:</b> ${dn?Object.keys(dist).map(k=>`${k} ${Math.round(100*dist[k]/dn)}% (${dist[k]}/${dn})`).join(" · "):"noch keine Daten"}</div>`
}
function stats(){let rr,label,marks;if(view==="match"||view==="live"){rr=allRallies();label=view==="match"?"MATCH":"LIVE / MATCH";marks=allMarks()}else{rr=st.sets.find(s=>s.set===view)?.rallies||(view===st.set?st.rallies:[]);label=`SATZ ${view}`;marks=st.sets.find(s=>s.set===view)?.marks||(view===st.set?st.marks:[])}$("flow").innerHTML=fullStatsFrom(rr,label)+`<h3>EVV Zielkarte</h3><div id="statCourt" class="court"><div class="courtHint">NETZ ↑ · Landepunkte · ↓ GRUNDLINIE</div></div>`;setTimeout(()=>{marks.forEach(m=>{let d=document.createElement("span");d.className="mark";d.style.left=m.x*100+"%";d.style.top=m.y*100+"%";$("statCourt").appendChild(d)})},0)}
function zoneCenter(z){
 const col=(z-1)%3,row=Math.floor((z-1)/3);
 return [(col+.5)/3,(row+.5)/3]
}
function nineZonePicker(kind,payload){
 pendingMark=payload;
 modal(`<h2>${kind==="ACE"?"Aufschlag-Ass":"Angriffspunkt"} · Zielzone</h2><div class="courtOrient"><b>↑ NETZ</b><span>1–3 netznah · 4–6 Mitte · 7–9 grundliniennah</span></div><div class="zone9">
 ${[1,2,3,4,5,6,7,8,9].map(z=>`<button type="button" data-zone="${z}"><b>${z}</b><span>${z<=3?"NETZ":z<=6?"MITTE":"GRUNDLINIE"}</span></button>`).join("")}
 </div><div class="courtOrient bottom"><b>↓ GRUNDLINIE</b></div><button id="skipMark">Überspringen</button>`);
 document.querySelectorAll("[data-zone]").forEach(b=>b.onclick=()=>{
   const z=+b.dataset.zone,[x,y]=zoneCenter(z),p=pendingMark,pre=snapshot(); pendingMark=null;
   p.data.targetZone=z;p.data.court={x,y};st.marks.push({x,y,zone:z,set:st.set,player:p.data.attacker||p.data.server||null,kind});
   closeModal();commit(p.w,p.data,pre)
 });
 $("skipMark").onclick=()=>{let p=pendingMark;pendingMark=null;closeModal();commit(p.w,p.data)}
}
function courtPicker(){nineZonePicker("KILL",pendingMark)}
function substitute(){
 if(!st.started||view!=="live")return toast("Wechsel nur im Live-Satz");
 if(draft.step)return toast("Wechsel nur zwischen Rallyes");
 const bench=roster.filter(p=>!active().includes(p.id)&&p.role!=="L");
 modal(`<h2>Spielerwechsel</h2><label>RAUS<select id="subOut">${active().map(id=>`<option value="${id}">${esc(nm(id))}</option>`).join("")}</select></label><label>REIN<select id="subIn">${bench.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.role)}</option>`).join("")}</select></label><div class="grid2"><button id="cancelSub">Abbrechen</button><button id="doSub" class="primary">Wechsel bestätigen</button></div>`);
 $("cancelSub").onclick=closeModal;$("doSub").onclick=()=>{let out=$("subOut").value,inn=$("subIn").value,i=st.lineup.indexOf(out);if(i<0)return;st.lineup[i]=inn;st.receiveIds=st.receiveIds.map(x=>x===out?inn:x);st.events.push({type:"sub",set:st.set,out,inn,score:`${st.e}:${st.o}`});closeModal();render();toast(`${nm(inn)} ⇧ / ${nm(out)} ⇩`)}
}
function scoreFix(){if(view!=="live")return toast("Nur LIVE korrigierbar");modal(`<h2>Punkt korrigieren</h2><p class="small">Nur Spielstand. Keine Statistik, Rotation oder Aufschlagänderung.</p><div class="grid2"><button data-f="e,1">EVV +1</button><button data-f="e,-1">EVV −1</button><button data-f="o,1">Gegner +1</button><button data-f="o,-1">Gegner −1</button></div>`);document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{let [t,d]=b.dataset.f.split(",");st[t]=Math.max(0,st[t]+(+d));st.setEnded=false;st.matchEnded=false;checkEnd();closeModal();render()})}
function prepareNextSet(){
 if(!st.setEnded)return toast("Satz läuft noch");if(st.matchEnded)return toast("Match ist beendet");
 modal(`<h2>Satz ${st.set+1} starten${st.set+1===5?" · TIE-BREAK bis 15":""}</h2><label>Startrotation<select id="nsRot">${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join("")}</select></label><div class="grid2"><button id="nsRec">Gegner Aufschlag · K1</button><button id="nsSrv" class="primary">EVV Aufschlag · K2</button></div>`);
 const go=serv=>{st.sets.push({set:st.set,e:st.e,o:st.o,rallies:clone(st.rallies),marks:clone(st.marks),start:st.setStart});st.set++;st.e=0;st.o=0;st.rot=+$("nsRot").value;st.serving=serv;st.setEnded=false;st.matchEnded=false;st.rallies=[];st.rallyUndo=[];st.marks=[];st.setStart={rot:st.rot,serving:serv};draft={};view="live";closeModal();render()};$("nsRec").onclick=()=>go(false);$("nsSrv").onclick=()=>go(true)
}
function rallyLabel(x){let a=[];if(x.serve)a.push(`Aufschlag ${x.serve}`);if(x.receiver&&x.reception)a.push(`Annahme ${x.receiver} ${x.reception}`);if(x.setterTarget)a.push(`Zuspiel ${x.setterTarget}`);if(x.attacker)a.push(`Angriff ${nm(x.attacker)} ${x.zone||""} ${x.result||""}`.trim());else if(x.event==="OpponentAttack")a.push(`Gegnerangriff ${x.result||""}`.trim());else if(!a.length)a.push(x.event||"Rally");return a.join(" → ")}
function recent(){let r=allRallies().slice(-3).reverse();$("recent").innerHTML=`<h3>Letzte Rallys</h3><div class="history">${r.length?r.map(x=>`S${x.set} · ${esc(x.after)} · ${esc(rallyLabel(x))} · ${esc(x.winner)}`).join("<br>"):"Noch keine Rally"}</div>`}
function render(){
 saveLocal();
 renderHeader();renderNav();document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 if(tab==="rally")rally();else if(tab==="opponent")opponentTab();else if(tab==="coach")coach();else stats();recent();
 $("nextSet").disabled=!st.setEnded||st.matchEnded;$("substitute").disabled=!st.started||view!=="live"||!!draft.step
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;draft={};render()});
$("startReceive").onclick=()=>start(false);$("startServe").onclick=()=>start(true);
$("undo").onclick=()=>{if(view!=="live")return toast("Undo nur LIVE");let x=st.rallyUndo.pop();if(!x)return toast("Keine Rally zum Undo");restore(x);draft={};render();toast("Letzte Rally vollständig zurückgesetzt")};
$("scoreFix").onclick=scoreFix;$("substitute").onclick=substitute;$("timeout").onclick=()=>{tab="coach";view="live";render()};$("nextSet").onclick=()=>{if(!st.setEnded)return toast("Satz läuft noch");prepareNextSet()};

// ---------- iPad/Safari voice layer ----------
let voiceRec=null,voiceListening=false,voicePending=null;
const SpeechAPI=window.SpeechRecognition||window.webkitSpeechRecognition;
function voiceSupported(){return !!SpeechAPI && window.isSecureContext}
function normVoice(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[.,;:!?]/g," ").replace(/\s+/g," ").trim()}
function playerFromVoice(t){let n=normVoice(t);return roster.find(p=>n.includes(normVoice(p.name)))}
function parseVoice(text){
 let n=normVoice(text),p=playerFromVoice(n),cmd={raw:text,confidence:"normal"};
 if(/\bundo\b|ruckgangig|zuruck/.test(n)) return {type:"undo",raw:text,label:"UNDO"};
 if(/punkt evv|evv punkt|punkt fur evv/.test(n)) return {type:"quick",winner:"EVV",raw:text,label:"EVV Punkt"};
 if(/punkt gegner|gegner punkt/.test(n)) return {type:"quick",winner:"Gegner",raw:text,label:"Gegner Punkt"};
 if(/aufschlag/.test(n)&&(/fehler/.test(n))) return {type:"serve",result:"ERR",raw:text,label:"Aufschlagfehler"};
 if(/aufschlag/.test(n)&&(/\bace\b|\bass\b/.test(n))) return {type:"serve",result:"ACE",raw:text,label:"Ace"};
 if(/annahme/.test(n)&&p){
   let q=(n.match(/\ba\s*([0-3])\b/)||n.match(/\b([0-3])\b/)); if(q) return {type:"reception",player:p.id,q:"A"+q[1],raw:text,label:`${p.name} Annahme A${q[1]}`}
 }
 if(/angriff|kill/.test(n)&&p&&/kill/.test(n)){
   let z=/\bvier\b|\b4\b/.test(n)?"IV":/\bdrei\b|\b3\b|mitte/.test(n)?"III":/\bzwei\b|\b2\b/.test(n)?"II":/pipe|hinterfeld/.test(n)?"HF":null;
   return {type:"kill",player:p.id,zone:z||"IV",raw:text,label:`${p.name} ${z||"IV"} KILL`}
 }
 if(/block/.test(n)&&p) return {type:"block",player:p.id,raw:text,label:`${p.name} Blockpunkt`};
 if(/wechsel/.test(n)){
   let names=roster.filter(x=>n.includes(normVoice(x.name))); if(names.length>=2)return {type:"sub",inn:names[0].id,out:names[1].id,raw:text,label:`Wechsel ${names[0].name} für ${names[1].name}`}
 }
 return {type:"unknown",raw:text,label:"Nicht sicher erkannt"}
}
function voiceConfirm(cmd){
 voicePending=cmd;
 modal(`<h2>🎙 Sprachbefehl</h2><div class="voiceheard">${esc(cmd.raw)}</div><p><b>Erkannt:</b> ${esc(cmd.label)}</p><div class="grid2"><button id="voiceNo">Verwerfen</button><button id="voiceYes" class="primary">✓ Übernehmen</button></div>`);
 $("voiceNo").onclick=()=>{voicePending=null;closeModal();if(voiceListening)setTimeout(startVoiceRecognition,120)};
 $("voiceYes").onclick=()=>{closeModal();executeVoice(cmd);voicePending=null;if(voiceListening)setTimeout(startVoiceRecognition,180)};
}
function executeVoice(c){
 if(c.type==="undo"){let x=st.rallyUndo.pop();if(x){restore(x);draft={};render();toast("Sprach-UNDO")}else toast("Kein Undo verfügbar");return}
 if(c.type==="quick"){commit(c.winner,{event:"VoiceQuick",voice:c.raw});return}
 if(c.type==="serve"){if(c.result==="ACE"){nineZonePicker("ACE",{w:"EVV",data:{event:"Serve",serve:"ACE",voice:c.raw}})}else commit("Gegner",{event:"Serve",serve:"ERROR",voice:c.raw});return}
 if(c.type==="reception"){if(!receivers().includes(c.player))return toast(`${nm(c.player)} ist nicht in der aktuellen Annahme`); if(c.q==="A0")commit("Gegner",{event:"Reception",receiver:c.player,reception:c.q,voice:c.raw});else{draft={step:2,receiver:c.player,reception:c.q,voice:c.raw};tab="rally";render();toast("Annahme gespeichert · Angriff weiter per Tap/Sprache")};return}
 if(c.type==="kill"){if(!attackers().includes(c.player))return toast(`${nm(c.player)} ist aktuell kein Angreifer`);pendingMark={w:"EVV",data:{event:"Attack",attacker:c.player,zone:c.zone,result:"KILL",voice:c.raw}};courtPicker();return}
 if(c.type==="block"){if(!front().includes(c.player))return toast(`${nm(c.player)} ist aktuell nicht Vorderreihe`);commit("EVV",{event:"Block",player:c.player,result:"BLOCK",voice:c.raw});return}
 if(c.type==="sub"){
   let oi=st.lineup.indexOf(c.out);if(oi<0||st.lineup.includes(c.inn))return toast("Wechsel passt nicht zur aktiven Sechs");
   st.lineup[oi]=c.inn;st.receiveIds=st.receiveIds.map(x=>x===c.out?c.inn:x);st.events.push({type:"sub",set:st.set,out:c.out,inn:c.inn,score:`${st.e}:${st.o}`,voice:c.raw});render();toast(`${nm(c.inn)} ⇧ / ${nm(c.out)} ⇩`);return
 }
 toast("Befehl nicht übernommen")
}
function startVoiceRecognition(){
 if(!voiceListening||!SpeechAPI)return;
 try{
  voiceRec=new SpeechAPI();voiceRec.lang="de-DE";voiceRec.interimResults=false;voiceRec.continuous=false;voiceRec.maxAlternatives=3;
  voiceRec.onresult=e=>{let best=e.results[e.results.length-1][0].transcript;let cmd=parseVoice(best);if(cmd.type==="unknown"){toast(`Nicht sicher: „${best}“`);setTimeout(startVoiceRecognition,300)}else voiceConfirm(cmd)};
  voiceRec.onerror=e=>{if(e.error!=="aborted")toast("Sprache: "+e.error);if(voiceListening)setTimeout(startVoiceRecognition,700)};
  voiceRec.onend=()=>{if(voiceListening&&!voicePending)setTimeout(startVoiceRecognition,250)};
  voiceRec.start();
 }catch(e){if(voiceListening)setTimeout(startVoiceRecognition,700)}
}
function toggleVoice(){
 if(!SpeechAPI){modal('<h2>🎙 Sprache nicht verfügbar</h2><p>Dieser Browser stellt die Web-Spracherkennung nicht bereit. Bitte Safari auf dem iPad verwenden.</p><button id="voiceClose">OK</button>');$("voiceClose").onclick=closeModal;return}
 if(!window.isSecureContext){modal('<h2>🎙 Für Sprache HTTPS nötig</h2><p>Die lokale ZIP-Version funktioniert zum Tippen. Für Mikrofon-Spracherkennung muss QuickScout in Safari über eine sichere HTTPS-Adresse geöffnet werden.</p><button id="voiceClose">OK</button>');$("voiceClose").onclick=closeModal;return}
 voiceListening=!voiceListening;if($("voiceState")){$("voiceState").textContent=voiceListening?"🎙 hört zu":"🎙 Sprache aus";$("voiceState").classList.toggle("listening",voiceListening);}
 if(voiceListening){toast("Sprachmodus an · kurze Volleyball-Kommandos");startVoiceRecognition()}else{try{voiceRec&&voiceRec.abort()}catch(e){};voiceRec=null;toast("Sprachmodus aus")}
}
$("voiceBtn").onclick=toggleVoice;

const restored=loadLocal();setupUI();if(restored&&st.started){$("setup").classList.add("hidden")}render();
window.EVV_QS_TEST={target,isSetWin,rotNext:r=>ROT_NEXT[r],fresh,state:()=>clone(st),courtPos,front,receivers,attackOptions};
})();