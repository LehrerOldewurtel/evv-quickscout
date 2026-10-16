(function(){
"use strict";
const $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
const APP_VERSION=globalThis.EVV_VERSION||"7.9.1";
const ROT_NEXT={5:6,6:1,1:2,2:3,3:4,4:5}; // confirmed live-test convention: R5→R6→R1
const roster=[
{id:"johann",name:"Johann",role:"Z"},{id:"michael",name:"Michael",role:"AA1"},{id:"janik",name:"Janik",role:"MB1"},
{id:"jonas",name:"Jonas",role:"D"},{id:"maksym",name:"Maxim",role:"AA2"},{id:"dirk",name:"Dirk",role:"MB2"},
{id:"arthur",name:"Arthur",role:"AA"},{id:"lion",name:"Lion",role:"AA"},{id:"david",name:"David",role:"AA"},{id:"reinhold",name:"Reinhold",role:"Z"},{id:"felix",name:"Felix",role:"AA"},{id:"jens",name:"Jens",role:"D/AA"},{id:"amar",name:"Amar",role:"L"},{id:"alex",name:"Alexandra",role:"L"}];
const ROLES=["Z","D","AA1","AA2","MB1","MB2"];
const defaultRoles=()=>({johann:"Z",jens:"D",michael:"AA1",arthur:"AA2",janik:"MB1",dirk:"MB2"});
function roleOf(id){return (st.roles||{})[id]||(byId(id)||{}).role||""}
function roleOptions(selected){return ROLES.map(r=>`<option value="${r}" ${selected===r?"selected":""}>${r}</option>`).join("")}
function lineupEditor(prefix,ids){return ids.map((id,i)=>`<label>Startplatz P${i+1}<select id="${prefix}P${i}">${roster.filter(p=>p.role!=="L").map(p=>`<option value="${p.id}" ${p.id===id?"selected":""}>${esc(p.name)}</option>`).join("")}</select><select aria-label="Rolle für Startplatz ${i+1}" id="${prefix}R${i}">${roleOptions(roleOf(id))}</select></label>`).join("")}
function readLineupEditor(prefix){const ids=[0,1,2,3,4,5].map(i=>$(prefix+"P"+i).value),roles=[0,1,2,3,4,5].map(i=>$(prefix+"R"+i).value);if(new Set(ids).size!==6||new Set(roles).size!==6||!ROLES.every(r=>roles.includes(r))){toast("Sechs verschiedene Spieler und jede Rolle genau einmal wählen");return null}return {ids,roles:Object.fromEntries(ids.map((id,i)=>[id,roles[i]]))}}
function roleForPosition(pos){const id=st.lineup[pos-1];return id?roleOf(id):""}
const byId=id=>roster.find(p=>p.id===id), nm=id=>(byId(id)||{name:id}).name;
let opponent={name:"Gegner",setter:"#",liberos:["#","#"],receivers:["#","#","#","#"]};
let tab="rally",view="live",draft={},draftHistory=[],pendingMark=null;
let st=fresh();
function fresh(){return{started:false,set:1,e:0,o:0,rot:1,serving:true,setEnded:false,matchEnded:false,
lineup:["johann","michael","janik","jens","arthur","dirk"],roles:defaultRoles(),receiveIds:[],receivePlans:{},tacticPositions:{},liberoIds:["amar","alex"],liberoOnCourt:"",liberoReplacedId:"",liberoActive:false,
rallies:[],sets:[],rallyUndo:[],events:[],marks:[],setStart:null,subPairs:{},subCount:0,subUsed:[]}}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function toast(s){$("toast").textContent=s;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),1100)}
function modal(html){$("modalBox").innerHTML=html;$("modal").classList.remove("hidden")}
function closeModal(){$("modal").classList.add("hidden");$("modalBox").innerHTML=""}
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeModal()});
function target(set=st.set){return set===5?15:25}
function isSetWin(e=st.e,o=st.o,set=st.set){return (e>=target(set)||o>=target(set))&&Math.abs(e-o)>=2}
function setWins(team){let w=st.sets.filter(s=>(team==="EVV"?s.e>s.o:s.o>s.e)).length;if(st.setEnded&&(team==="EVV"?st.e>st.o:st.o>st.e))w++;return w}
function checkEnd(){st.setEnded=isSetWin();st.matchEnded=false;if(st.setEnded){const w=st.e>st.o?"EVV":"Gegner";st.matchEnded=setWins(w)>=3}}
function snapshot(){return clone({e:st.e,o:st.o,rot:st.rot,serving:st.serving,setEnded:st.setEnded,matchEnded:st.matchEnded,rallies:st.rallies,marks:st.marks,events:st.events,subPairs:st.subPairs,subCount:st.subCount,subUsed:st.subUsed,lineup:st.lineup,roles:st.roles,receiveIds:st.receiveIds,receivePlans:st.receivePlans,tacticPositions:st.tacticPositions,liberoOnCourt:st.liberoOnCourt,liberoReplacedId:st.liberoReplacedId,liberoActive:st.liberoActive})}
function restore(x){Object.assign(st,clone(x))}
const STORE_KEY="evvQuickScoutV77";
function saveLocal(){try{localStorage.setItem(STORE_KEY,JSON.stringify({st,opponent}))}catch(e){toast("Speicher voll: Bitte Backup exportieren")}}
function loadLocal(){try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return false;const d=JSON.parse(raw);if(d&&d.st){st=Object.assign(fresh(),d.st);opponent=Object.assign(opponent,d.opponent||{});if(!opponent.liberos)opponent.liberos=[opponent.libero||"#","#"];if(!st.roles)st.roles=Object.fromEntries(st.lineup.map(id=>[id,(byId(id)||{}).role]).filter(x=>ROLES.includes(x[1])));if(!st.liberoIds)st.liberoIds=[st.liberoId||"amar","alex"];st.receivePlans=st.receivePlans||{};st.tacticPositions=st.tacticPositions||{};st.liberoIds=Array.isArray(st.liberoIds)?st.liberoIds:[];return true}}catch(e){}return false}
function rotate(){st.rot=ROT_NEXT[st.rot]||st.rot}
function commit(w,data={},preSnapshot=null){
 if(w!=="EVV"&&w!=="Gegner")throw new Error("Ungültiger Rallye-Sieger");
 if(st.setEnded||st.matchEnded)return toast("Satz ist beendet");
 st.rallyUndo.push(preSnapshot?clone(preSnapshot):snapshot());
 const before=`${st.e}:${st.o}`,rb=st.rot,sb=st.serving;
 if(w==="EVV"){st.e++;if(!st.serving){st.serving=true;rotate()}}
 else{st.o++;if(st.serving)st.serving=false}
 data=Object.assign({},data,{winner:w,before,after:`${st.e}:${st.o}`,rotation:rb,servingBefore:sb,phase:data.phase||(sb?"K2":"K1"),set:st.set});
 st.rallies.push(data);draft={};clearDraftHistory();tab="rally";view="live";checkEnd();render();toast(`${w} ${before} → ${st.e}:${st.o}`)
}
function allRallies(){return st.sets.flatMap(s=>s.rallies).concat(st.rallies)}
function allMarks(){return st.sets.flatMap(s=>s.marks||[]).concat(st.marks)}
function active(){let ids=st.lineup.slice();if(st.liberoActive&&st.liberoOnCourt&&st.liberoReplacedId){ids=ids.filter(id=>id!==st.liberoReplacedId);ids.push(st.liberoOnCourt)}return ids}
function rotationSteps(from,to){let n=0,r=from;while(r!==to&&n<6){r=ROT_NEXT[r];n++}return n}
function courtPos(id){
 if(st.liberoActive&&id===st.liberoOnCourt&&st.liberoReplacedId)return courtPos(st.liberoReplacedId);
 const base=st.lineup.indexOf(id)+1;if(!base)return null;
 const startRot=(st.setStart&&st.setStart.rot)||st.rot,steps=rotationSteps(startRot,st.rot);
 let pos=base;for(let i=0;i<steps;i++)pos=pos===1?6:pos-1;return pos
}
function rotationMatrix(){
 return [1,2,3,4,5,6].map(pos=>({position:pos,player:playerAtPos(pos),row:[2,3,4].includes(pos)?"front":"back"}));
}
function liberoEligible(){
 return !!(st.liberoOnCourt&&st.liberoReplacedId&&st.liberoIds.includes(st.liberoOnCourt)&&
   st.lineup.includes(st.liberoReplacedId)&&
   roleOf(st.liberoReplacedId).startsWith("MB")&&
   [1,5,6].includes(courtPos(st.liberoReplacedId)));
}
function playerAtPos(pos){return active().find(id=>courtPos(id)===pos)||null}
function front(){return active().filter(id=>[2,3,4].includes(courtPos(id)))}
function receivers(){
 const plan=(st.receivePlans||{})[st.rot];if(Array.isArray(plan)&&plan.length)return plan.filter(id=>active().includes(id));
 let ids=active().filter(id=>["AA1","AA2"].includes(roleOf(id)));
 if(st.liberoActive&&st.liberoOnCourt)ids.push(st.liberoOnCourt);
 else {const diagonal=active().find(id=>roleOf(id)==="D");if(diagonal)ids.push(diagonal)}
 return [...new Set(ids)]
}
function opponentReceivers(){return [...new Set(opponent.receivers.concat(opponent.liberos||[]).filter(x=>x&&x!=="#"&&x!=="#?"))]}
function attackers(){return active().filter(id=>{const p=byId(id);return p&&roleOf(id)!=="Z"&&p.role!=="L"&&!st.liberoIds.includes(id)})}
function roleBaseRoute(id){
 const r=roleOf(id);
 if(r.startsWith("MB"))return "III";
 if(r==="D"||r.startsWith("D/"))return "II";
 if(r.startsWith("AA"))return "IV";
 return null
}
function attackContext(){
 // K1 directly after reception is side-out; every later EVV attack in the rally is transition.
 const ch=draft.chain||[];
 const hasReception=ch.some(x=>x.side==="EVV"&&x.type==="Reception");
 const evvAttacks=ch.filter(x=>x.side==="EVV"&&x.type==="Attack").length;
 const hasDefense=ch.some(x=>x.side==="EVV"&&x.type==="Defense");
 return hasReception&&!hasDefense&&evvAttacks===0?"K1":"TRANSITION"
}
function attackRoutesFor(id,context=attackContext()){
 const pos=courtPos(id), base=roleBaseRoute(id);
 if(!pos||!base)return [];
 // Front row: normal role lane. Back row: only legal back-row lanes are offered.
 if([2,3,4].includes(pos))return [base];
 if(pos===1)return ["I"];
 if(pos===6)return ["PIPE"];
 // P5 is not auto-mapped to a front-row lane; avoids the old false assignment.
 return []
}
function attackOptions(context=attackContext()){
 return attackers().flatMap(id=>attackRoutesFor(id,context).map(zone=>({id,zone,pos:courtPos(id),context})))
}
function attackCandidates(target){return attackOptions().filter(x=>x.zone===target)}
function setupUI(){
 $("startSix").innerHTML=lineupEditor("ss",st.lineup);
 const repl=$("evvLiberoReplaces");if(repl){repl.innerHTML=`<option value="">Niemand</option>`+roster.filter(p=>p.role!=="L").map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}
}
function readSetup(){
 const picked=readLineupEditor("ss");if(!picked)return false;
 st.lineup=picked.ids;st.roles=picked.roles;st.receiveIds=[];st.receivePlans={};
 st.liberoOnCourt=$("evvLiberoOnCourt")?$("evvLiberoOnCourt").value:"";
 st.liberoReplacedId=$("evvLiberoReplaces")?$("evvLiberoReplaces").value:"";
 st.liberoActive=!!(st.liberoOnCourt&&st.liberoReplacedId);
 opponent.name=$("oppName").value.trim()||"Gegner";
 opponent.setter="#"+($("oppSetter").value.trim()||"?");
 opponent.liberos=[1,2].map(i=>"#"+($("oppLibero"+i).value.trim()||"?"));
 opponent.receivers=[1,2,3,4].map(i=>"#"+($("oppR"+i).value.trim()||"?"));
 st.rot=parseInt($("startRotation").value.slice(1),10)||1;
 st.setStart={rot:st.rot,serving:false,lineup:clone(st.lineup),roles:clone(st.roles)};
 if(st.liberoActive&&!liberoEligible()){toast("Libero nur für einen Mittelblocker in der Hinterreihe einsetzen");return false}
 return true
}
function start(serv){if(!readSetup())return;const keep=clone(st.lineup),keepRoles=clone(st.roles),keepRec=clone(st.receiveIds),keepLibs=clone(st.liberoIds),keepLibOn=st.liberoOnCourt,keepLibRep=st.liberoReplacedId,keepLibActive=st.liberoActive;st=fresh();st.lineup=keep;st.roles=keepRoles;st.receiveIds=keepRec;st.liberoIds=keepLibs;st.liberoOnCourt=keepLibOn;st.liberoReplacedId=keepLibRep;st.liberoActive=keepLibActive;st.rot=parseInt($("startRotation").value.slice(1),10)||1;st.serving=serv;st.started=true;st.setStart={rot:st.rot,serving:serv,lineup:clone(keep),roles:clone(keepRoles)};$("setup").classList.add("hidden");render()}
function currentServerId(){return playerAtPos(1)}
function currentServer(){
 if(!st.serving)return opponent.name;
 // Rotation number indexes current service turn; preserve selected six and substitutions.
 return nm(currentServerId()||"");
}
function renderHeader(){
 $("homeScore").textContent=st.e;$("oppScore").textContent=st.o;$("oppNameHead").textContent=opponent.name;$("setBadge").textContent=`S${st.set}${st.set===5?" · TB":""}`;$("rotationBadge").textContent=`R${st.rot}`;
 $("phase").textContent=st.serving?"K2":"K1";$("serveText").textContent=st.serving?"EVV Aufschlag":"Gegner Aufschlag";$("serverText").textContent=st.serving?`Aufschlag: ${currentServer()}`:`Aufschlag: ${opponent.name}`;
 $("lineups").innerHTML=`<div class="lineup"><b>EVV · aktive Sechs</b><div class="chips">${active().map(id=>`<span class="chip">${esc(nm(id))} · ${esc(roleOf(id))}</span>`).join("")}</div></div><div class="lineup"><b>${esc(opponent.name)}</b><div class="chips"><span class="chip">Z ${esc(opponent.setter)}</span><span class="chip">L1 ${esc((opponent.liberos||[])[0]||"–")}</span><span class="chip">L2 ${esc((opponent.liberos||[])[1]||"–")}</span>${opponent.receivers.map(x=>`<span class="chip">${esc(x)}</span>`).join("")}</div></div>`
}
function renderNav(){
 const nums=[...st.sets.map(s=>s.set),st.set].filter((v,i,a)=>a.indexOf(v)===i);
 $("setNav").innerHTML=nums.map(n=>`<button data-view="${n}" class="${view===n?"primary":""}">S${n}</button>`).join("")+`<button data-view="live" class="${view==="live"?"primary":""}">LIVE</button><button data-view="match" class="${view==="match"?"primary":""}">MATCH</button>`;
 document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{view=b.dataset.view==="live"||b.dataset.view==="match"?b.dataset.view:+b.dataset.view;render()})
}
function B(label,act,cls=""){return `<button class="${cls}" data-act="${esc(act)}">${label}</button>`}
function flowHead(title){return `<div class="flowTitle"><button class="backBtn" data-act="back">← Zurück</button><h2>${title}</h2><span></span></div>`}
function bindActs(){document.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>action(b.dataset.act))}
function setLastAttackResult(result){for(let i=(draft.chain||[]).length-1;i>=0;i--){if(draft.chain[i].side==="EVV"&&draft.chain[i].type==="Attack"){draft.chain[i].result=result;break}}}
function pushDraft(){draftHistory.push({draft:clone(draft),tab});if(draftHistory.length>30)draftHistory.shift()}
function draftBack(){const x=draftHistory.pop();if(!x)return toast("Kein vorheriger Rallye-Schritt");draft=x.draft;tab=x.tab;render()}
function clearDraftHistory(){draftHistory=[]}
function secondBallPlayers(side){return side==="EVV"?active():[]}
function action(s){
 const a=s.split("|");
 if(a[0]==="back")return draftBack();
 if(!["quick"].includes(a[0]))pushDraft();
 if(a[0]==="rec"){
   draft={step:"evvBall2",phase:"K1",receiver:a[1],reception:a[2],chain:[{side:"EVV",type:"Reception",player:a[1],quality:a[2]}]};if(a[2]==="A0")return commit("Gegner",Object.assign({},draft,{event:"Reception",result:"DIRECT_ERROR"}));render()
 }
 else if(a[0]==="b2"){
   if(a[1]==="SET"){draft.step="evvSet";render()}
   else if(a[1]==="OVER"){draft.secondBallKind="SECOND";draft.step="evvSecondBallPlayer";render()}
   else {draft.freeBallKind=a[1];draft.step="evvFreeBallPlayer";render()}
 }
 else if(a[0]==="fbp"){draft.freeBallPlayer=a[1];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"FreeBall",player:a[1],kind:draft.freeBallKind,position:courtPos(a[1])});draft.step="oppDefense";tab="opponent";render()}
 else if(a[0]==="b2p"){draft.secondBallPlayer=a[1];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"SecondBall",player:a[1],position:courtPos(a[1])});draft.step="evvSecondBallResult";render()}
 else if(a[0]==="b2r"){
   if(a[1]==="KILL"){let d=Object.assign({},draft,{event:"SecondBall",result:"KILL",attacker:draft.secondBallPlayer});pendingMark={w:"EVV",data:d};nineZonePicker("KILL",pendingMark);return}
   if(a[1]==="ERROR")return commit("Gegner",Object.assign({},draft,{event:"SecondBall",result:"ERROR"}));
   draft.chain=(draft.chain||[]).concat({side:"EVV",type:"SecondBallResult",result:"CONTINUE"});draft.step="oppDefense";tab="opponent";render()
 }
 else if(a[0]==="es"){draft.setterTarget=a[1];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Set",target:a[1]});draft.step="evvAttack";render()}
 else if(a[0]==="att"){if(!attackOptions().some(x=>x.id===a[1]&&x.zone===a[2]))return toast("Angriffsweg in dieser Rotation nicht zulässig");draft.attacker=a[1];draft.zone=a[2];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Attack",player:a[1],route:a[2]});draft.step="evvAttackResult";render()}
 else if(a[0]==="fin"){
   if(a[1]==="KILL"){setLastAttackResult("KILL");let d=Object.assign({},draft,{event:"Attack",result:"KILL"});pendingMark={w:"EVV",data:d};courtPicker();return}
   if(a[1]==="ERROR"||a[1]==="BLOCKED"){setLastAttackResult(a[1]);return commit("Gegner",Object.assign({},draft,{event:"Attack",result:a[1]}));}
   if(a[1]==="BLOCK_OUT"){setLastAttackResult("BLOCK_OUT");return commit("EVV",Object.assign({},draft,{event:"Attack",result:"BLOCK_OUT"}));}
   if(a[1]==="BLOCK_CONTINUE"){setLastAttackResult("BLOCK_TOUCH");draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"BlockTouch",result:"CONTINUE"});draft.step="evvDefense";tab="rally";render();return}
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
   draft=Object.assign({},draft,{step:"oppBall2",event:"OpponentReception",receiver:a[1],reception:a[2]});if(a[2]==="A0")return commit("EVV",Object.assign({},draft,{result:"DIRECT_ERROR"}));render()
 }
 else if(a[0]==="a0"){
   if(a[1]==="LOST")return commit("Gegner",Object.assign({},draft,{event:"Reception",result:"DIRECT_ERROR"}));
   draft.step="evvBall2";render();
 }
 else if(a[0]==="oa0"){
   if(a[1]==="LOST")return commit("EVV",Object.assign({},draft,{event:"OpponentReception",result:"DIRECT_ERROR"}));
   draft.step="oppBall2";tab="opponent";render();
 }
 else if(a[0]==="ob2"){
   if(a[1]==="SET"){draft.step="oppSet";render()}
   else if(a[1]==="OVER"){draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"SecondBall",position:a[2]||"?"});draft.step="oppSecondBallResult";render()}
   else {draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"FreeBall",kind:a[1],position:a[2]||"?"});draft.step="evvDefense";tab="rally";render()}
 }
 else if(a[0]==="ob2r"){if(a[1]==="KILL")return commit("Gegner",Object.assign({},draft,{event:"OpponentSecondBall",result:"KILL"}));if(a[1]==="ERROR")return commit("EVV",Object.assign({},draft,{event:"OpponentSecondBall",result:"ERROR"}));draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"SecondBallResult",result:"CONTINUE"});draft.step="evvDefense";tab="rally";render()}
 else if(a[0]==="os"){draft.setterTarget=a[1];draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"Set",target:a[1]});draft.step="oppAttack";render()}
 else if(a[0]==="of"){
   if(a[1]==="KILL")return commit("Gegner",Object.assign({},draft,{event:"OpponentAttack",result:"KILL"}));
   if(a[1]==="BLOCK"){draft.step="evvBlockChoice";tab="rally";render();return}
   if(a[1]==="ERROR")return commit("EVV",Object.assign({},draft,{event:"OpponentAttack",result:a[1]}));
   draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"AttackResult",result:"DEFENDED"});draft.step="evvDefense";tab="rally";render()
 }
 else if(a[0]==="ebc"){draft.blocker=a[1];draft.step="evvBlockResult";render()}
 else if(a[0]==="ebr"){if(a[1]==="TOOLED"){draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Block",player:draft.blocker,result:"TOOLED"});return commit("Gegner",Object.assign({},draft,{event:"OpponentAttack",result:"BLOCK_OUT",blocker:draft.blocker}))}
 else if(a[1]==="POINT"){draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Block",player:draft.blocker,result:"BLOCK"});return commit("EVV",Object.assign({},draft,{event:"OpponentAttack",result:"BLOCK",blocker:draft.blocker}))}draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Block",player:draft.blocker,result:"TOUCH"});if(a[1]==="EVV"){draft.step="evvDefense";tab="rally"}else{draft.step="oppDefense";tab="opponent"}render()}
 else if(a[0]==="ed"){draft.defender=a[1];draft.defense=a[2];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Defense",player:a[1],quality:a[2]});draft.step="evvBall2";render()}
 else if(a[0]==="blk"){if(!front().includes(a[1]))return toast("Blocker steht nicht in der Vorderreihe");draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Block",player:a[1],result:"BLOCK"});commit("EVV",Object.assign({},draft,{event:"OpponentAttack",result:"BLOCK",blocker:a[1]}))}
 else if(a[0]==="od"){draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"Defense",quality:a[1]});draft.step="oppBall2";render()}
}
function rally(){
 if(!st.started)return $("flow").innerHTML="<h2>Bereit</h2><p>Spiel einrichten und starten.</p>";
 if(view!=="live")return historical();
 if(st.matchEnded)return $("flow").innerHTML=`<div class="banner">MATCH BEENDET · ${setWins("EVV")}:${setWins("Gegner")} Sätze</div>${summary(allRallies())}<button id="finishedNew" class="primary">Neues Spiel</button>`;
 if(st.setEnded){$("flow").innerHTML=`<div class="banner">SATZ ${st.set} BEENDET · ${st.e}:${st.o}</div>${summary(st.rallies)}<button id="prep" class="primary">Nächsten Satz vorbereiten</button>`;$("prep").onclick=prepareNextSet;return}
 if(draft.step==="evvBlockChoice"){
   $("flow").innerHTML=flowHead("EVV · Wer blockt?")+`<div class="eligibleNote">Nur aktuelle Vorderreihe P2/P3/P4.</div><div class="grid3">${front().map(id=>B(`${esc(nm(id))} · P${courtPos(id)}`,`ebc|${id}`,"good")).join("")}</div>`;bindActs();return
 }
 if(draft.step==="evvBlockResult"){
   $("flow").innerHTML=flowHead(`${esc(nm(draft.blocker))} · Block`)+`<div class="grid2">${B("BLOCKPUNKT","ebr|POINT","good")}${B("BLOCK-OUT / ANGESCHLAGEN · Punkt Gegner","ebr|TOOLED","bad")}${B("BLOCKTOUCH · Gegner weiter","ebr|OPP","blue")}${B("BLOCKTOUCH · EVV Abwehr","ebr|EVV","blue")}</div>`;bindActs();return
 }
 if(draft.step==="evvDefense"){
   let h=flowHead("EVV · Abwehrqualität");active().forEach(id=>h+=`<div class="row"><b>${esc(nm(id))}</b>${["D3","D2","D1","D0"].map(q=>B(q,`ed|${id}|${q}`,q==="D3"?"good":q==="D0"?"bad":"")).join("")}</div>`);$("flow").innerHTML=h;bindActs();return
 }
 if(draft.step==="evvA0Decision"){$("flow").innerHTML=flowHead("A0 · Ist der Ball noch spielbar?")+`<div class="grid2">${B("DIREKTER PUNKT GEGNER","a0|LOST","bad")}${B("BALL GERETTET · WEITER","a0|SAVED","blue")}</div>`;bindActs();return}
 if(draft.step==="evvBall2"){$("flow").innerHTML=flowHead("EVV · 2. Ball")+`<div class="grid2">${B("ZUSPIEL","b2|SET","primary")}${B("2. BALL RÜBER","b2|OVER","blue")}${B("DANKEBALL RÜBER","b2|FREE","blue")}${B("NOTBALL / ANGESCHNITTEN","b2|CUT","blue")}</div>`;bindActs();return}
 if(draft.step==="evvFreeBallPlayer"){$("flow").innerHTML=flowHead(draft.freeBallKind==="CUT"?"EVV · Notball / angeschnitten rüber":"EVV · Dankeball rüber")+`<div class="eligibleNote">Kein Punkt: Ball geht zum Gegner, Rallye läuft weiter.</div><div class="grid3">${active().map(id=>B(`${esc(nm(id))} · P${courtPos(id)}`,`fbp|${id}`)).join("")}</div>`;bindActs();return}
 if(draft.step==="evvSecondBallPlayer"){$("flow").innerHTML=flowHead("EVV · Wer spielt den 2. Ball rüber?")+`<div class="grid3">${active().map(id=>B(`${esc(nm(id))} · P${courtPos(id)}`,`b2p|${id}`)).join("")}</div>`;bindActs();return}
 if(draft.step==="evvSecondBallResult"){$("flow").innerHTML=flowHead(`${esc(nm(draft.secondBallPlayer))} · 2. Ball von P${courtPos(draft.secondBallPlayer)}`)+`<div class="grid3">${B("PUNKT","b2r|KILL","good")}${B("GEGNER VERTEIDIGT","b2r|CONTINUE","blue")}${B("FEHLER","b2r|ERROR","bad")}</div>`;bindActs();return}
 if(draft.step==="evvSet"){
   const opts=attackOptions();$("flow").innerHTML=flowHead("EVV · Zuspiel / Angriffsweg")+`<div class="eligibleNote">Angriffsweg nach Rolle + aktueller Vorder-/Hinterreihe: AA→IV, MB→III, D→II; Hinterfeld Pipe/P6 bzw. I/P1.</div><div class="grid3">${opts.map(o=>B(`${o.zone} · ${esc(nm(o.id))} · P${o.pos}`,`es|${o.zone}`)).join("")}</div>`;bindActs();return}
 if(draft.step==="evvAttack"){
   let ao=attackCandidates(draft.setterTarget);$("flow").innerHTML=flowHead(`EVV · Angriff ${esc(draft.setterTarget||"")}`)+`<div class="eligibleNote">Rollen- und rotationsgebunden; K1 und Transition werden getrennt behandelt.</div><div class="grid2">${ao.map(o=>B(`${esc(nm(o.id))} · ${o.zone} · P${o.pos}`,`att|${o.id}|${o.zone}`)).join("")||"<p>Keine zulässige Angriffsoption.</p>"}</div>`;bindActs();return
 }
 if(draft.step==="evvAttackResult"){$("flow").innerHTML=flowHead("EVV · Angriffsergebnis")+`<div class="grid2">${B("KILL","fin|KILL","good")}${B("FEHLER","fin|ERROR","bad")}${B("BLOCKPUNKT GEGNER","fin|BLOCKED","bad")}${B("BLOCK-OUT · EVV Punkt","fin|BLOCK_OUT","good")}${B("BLOCKABPRALLER · EVV weiter","fin|BLOCK_CONTINUE","blue")}${B("GEGNER VERTEIDIGT · weiter","fin|CONTINUE","blue")}</div>`;bindActs();return}
 if(!st.serving){
   let h="<h2>K1 · Annahme</h2><div class='eligibleNote'>Alle tatsächlich aktiven Feldspieler außer Zuspieler; Mittelblocker bleibt ohne Libero auswählbar.</div>";receivers().forEach(id=>{h+=`<div class="row"><b>${esc(nm(id))} · P${courtPos(id)}</b>${["A3","A2","A1","A0"].map(q=>B(q,`rec|${id}|${q}`,q==="A3"?"good":q==="A0"?"bad":"")).join("")}</div>`});$("flow").innerHTML=h+`<div class="grid3">${B("Gegner AF","quick|EVV","good")}${B("Quick EVV","quick|EVV")}${B("Quick Gegner","quick|Gegner")}</div>`
 } else {
   $("flow").innerHTML=`<h2>K2 · Aufschlag</h2><div class="grid2">${B("ASS","serve|ACE","good")}${B("FEHLER","serve|ERR","bad")}${B("IM SPIEL","serve|IN","blue")}${B("Quick EVV","quick|EVV")}${B("Quick Gegner","quick|Gegner")}</div>`
 }
 bindActs()
}
function opponentTab(){
 if(draft.step==="oppA0Decision"){$("flow").innerHTML=flowHead("Gegner A0 · Ball verloren?")+`<div class="grid2">${B("DIREKTER PUNKT EVV","oa0|LOST","good")}${B("GEGNER RETTET · WEITER","oa0|SAVED","blue")}</div>`;bindActs();return}
 if(!st.started)return $("flow").innerHTML="<h2>Gegner</h2><p>Gegnerdaten im Setup festlegen.</p>";
 if(view!=="live")return historical();
 if(draft.step==="oppDefense"){$("flow").innerHTML=flowHead(`${esc(opponent.name)} · Abwehr`)+`<div class="grid4">${["D3","D2","D1","D0"].map(q=>B(q,`od|${q}`,q==="D3"?"good":q==="D0"?"bad":"")).join("")}</div>`}
 else if(draft.step==="oppReception"){$("flow").innerHTML=flowHead("Gegner · Annahme nach EVV-Aufschlag")+opponentReceivers().map(r=>`<div class="row"><b>${esc(r)}${(opponent.liberos||[]).includes(r)?" · L":""}</b>${["A3","A2","A1","A0"].map(q=>B(q,`or|${r}|${q}`,q==="A0"?"bad":"")).join("")}</div>`).join("")}
 else if(draft.step==="oppBall2")$("flow").innerHTML=flowHead(`${esc(opponent.name)} · 2. Ball`)+`<div class="grid2">${B("ZUSPIEL","ob2|SET","primary")}${[1,2,3,4,5,6].map(p=>B(`2. BALL RÜBER · P${p}`,`ob2|OVER|${p}`,"blue")).join("")}${[1,6,5].map(p=>B(`DANKEBALL · P${p}`,`ob2|FREE|${p}`,"blue")).join("")}${[1,6,5].map(p=>B(`NOTBALL / ANGESCHN. · P${p}`,`ob2|CUT|${p}`,"blue")).join("")}</div>`;
 else if(draft.step==="oppSecondBallResult")$("flow").innerHTML=flowHead(`${esc(opponent.name)} · 2. Ball Ergebnis`)+`<div class="grid3">${B("PUNKT GEGNER","ob2r|KILL","bad")}${B("EVV ABWEHR","ob2r|CONTINUE","blue")}${B("FEHLER GEGNER","ob2r|ERROR","good")}</div>`;
 else if(draft.step==="oppSet")$("flow").innerHTML=flowHead(`${esc(opponent.setter)} · Zuspiel wohin?`)+`<div class="grid4">${["IV","III","II","PIPE","I"].map(z=>B(z,`os|${z}`)).join("")}</div>`;
 else if(draft.step==="oppAttack")$("flow").innerHTML=flowHead(`Gegnerangriff ${esc(draft.setterTarget||"")}`)+`<div class="grid2">${B("KILL Gegner","of|KILL","bad")}${B("EVV BLOCK","of|BLOCK","good")}${B("Fehler Gegner","of|ERROR","good")}${B("EVV ABWEHR · Rallye weiter","of|DEFENSE","blue")}</div>`;
 else $("flow").innerHTML="<h2>Gegner</h2><p>Rallye im Rallye-Tab starten.</p>";
 bindActs()
}
function pct(a,n){return n?Math.round(a/n*100)+"%":"–"}
function summary(r){
 const rows=statRowsFrom(r),rec=rows.reduce((n,x)=>n+x.rec,0),pos=rows.reduce((n,x)=>n+x.a2+x.a3,0),kills=rows.reduce((n,x)=>n+x.kill,0),ace=rows.reduce((n,x)=>n+x.ac,0),af=rows.reduce((n,x)=>n+x.se,0);
 return `<div class="grid4"><div><b>${r.length}</b><div class="tiny">Rallyes</div></div><div><b>${pct(pos,rec)}</b><div class="tiny">Annahme+ ${pos}/${rec}</div></div><div><b>${kills}</b><div class="tiny">Kills</div></div><div><b>${ace}/${af}</b><div class="tiny">Ace/AF</div></div></div>`
}

function setRecord(s){return st.sets.find(x=>x.set===s)||null}
function ralliesForSet(s){
 if(s===st.set)return st.rallies.filter(r=>(r.set||st.set)===s);
 const x=setRecord(s);return x&&Array.isArray(x.rallies)?x.rallies:[]
}
function marksForSet(s){
 if(s===st.set)return (st.marks||[]).filter(m=>(m.set||st.set)===s);
 const x=setRecord(s);return x&&Array.isArray(x.marks)?x.marks:[]
}
function statRowsFrom(rr){
 const ids=[...new Set(roster.map(p=>p.id).concat(rr.flatMap(r=>[r.receiver,r.attacker,r.player,r.server,r.blocker]).filter(Boolean)))];
 return ids.map(id=>{
  let rec=[],srv=[],att=[],def=[],second=[],bl=0;
  rr.forEach(r=>{
   const ch=r.chain||[];
   ch.forEach(x=>{if(x.side!=="EVV")return;if(x.type==="Reception"&&x.player===id)rec.push(x);if(x.type==="Serve"&&x.player===id)srv.push(x);if(x.type==="Attack"&&x.player===id)att.push(x);if(x.type==="Defense"&&x.player===id)def.push(x);if(x.type==="SecondBall"&&x.player===id)second.push(x);if(x.type==="Block"&&x.player===id&&x.result==="BLOCK")bl++});
   if(!ch.length){if(r.receiver===id&&r.reception)rec.push({quality:r.reception});if(r.event==="Serve"&&r.server===id)srv.push({result:r.serve});if(r.event==="Attack"&&r.attacker===id)att.push({result:r.result});if(r.defender===id&&r.defense)def.push({quality:r.defense});if(r.blocker===id&&r.result==="BLOCK")bl++}
  });
  const q=x=>x.quality||x.reception,a3=rec.filter(x=>q(x)==="A3").length,a2=rec.filter(x=>q(x)==="A2").length,a1=rec.filter(x=>q(x)==="A1").length,a0=rec.filter(x=>q(x)==="A0").length;
  const sr=x=>x.result||x.serve,ac=srv.filter(x=>sr(x)==="ACE").length,se=srv.filter(x=>sr(x)==="ERROR").length;
  const kill=att.filter(x=>x.result==="KILL"||x.result==="BLOCK_OUT").length,bo=att.filter(x=>x.result==="BLOCK_OUT").length,ae=att.filter(x=>x.result==="ERROR").length,ab=att.filter(x=>x.result==="BLOCKED").length,eff=att.length?Math.round((kill-ae-ab)/att.length*100):0;
  const sbk=rr.filter(r=>r.event==="SecondBall"&&r.attacker===id&&r.result==="KILL").length,sbe=rr.filter(r=>r.event==="SecondBall"&&r.attacker===id&&r.result==="ERROR").length;
  const dq=x=>x.quality,d3=def.filter(x=>dq(x)==="D3").length,d2=def.filter(x=>dq(x)==="D2").length,d1=def.filter(x=>dq(x)==="D1").length,d0=def.filter(x=>dq(x)==="D0").length;
  const routeStats={};["IV","III","II","PIPE","I"].forEach(z=>{const aa=att.filter(x=>(x.route||x.zone)===z);routeStats[z]={n:aa.length,k:aa.filter(x=>x.result==="KILL"||x.result==="BLOCK_OUT").length,e:aa.filter(x=>x.result==="ERROR").length,b:aa.filter(x=>x.result==="BLOCKED").length}});
  return{id,rec:rec.length,a3,a2,a1,a0,rq:rec.length?Math.round((a3+a2)/rec.length*100):0,srv:srv.length,ac,se,att:att.length,kill,bo,ae,ab,eff,bl,second:second.length,sbk,sbe,def:def.length,d3,d2,d1,d0,routeStats}
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
 <h3>Angriff / Block</h3><div style="overflow-x:auto"><table class="statsTable"><thead><tr><th>Spieler</th><th>Angr.</th><th>Kill</th><th>Fehler</th><th>geblockt</th><th>Block-out</th><th>Eff.</th><th>Blockpkt.</th></tr></thead><tbody>${rows.filter(x=>x.att||x.bl).map(x=>`<tr><td>${esc(nm(x.id))}</td><td>${x.att}</td><td>${x.kill}</td><td>${x.ae}</td><td>${x.ab}</td><td>${x.bo||0}</td><td>${x.eff}%</td><td>${x.bl}</td></tr>`).join("")||'<tr><td colspan="8">Noch keine Angriffe/Blocks</td></tr>'}</tbody></table></div>
 <h3>Angriffspositionen</h3><div style="overflow-x:auto"><table class="statsTable"><thead><tr><th>Spieler</th><th>IV</th><th>III</th><th>II</th><th>Pipe</th><th>I</th></tr></thead><tbody>${rows.filter(x=>x.att).map(x=>`<tr><td>${esc(nm(x.id))}</td>${["IV","III","II","PIPE","I"].map(z=>{const q=x.routeStats[z];return `<td>${q.n} / ${q.k}K</td>`}).join("")}</tr>`).join("")||'<tr><td colspan="6">Noch keine Angriffe</td></tr>'}</tbody></table><div class="small">Anzeige je Position: Versuche / Kills. Frontangriffe folgen der Spielerrolle; Hinterfeld wird als Pipe bzw. I getrennt erfasst.</div></div>
 <h3>2. Ball rüber</h3><div style="overflow-x:auto"><table class="statsTable"><thead><tr><th>Spieler</th><th>Aktionen</th><th>Punkte</th><th>Fehler</th></tr></thead><tbody>${rows.filter(x=>x.second||x.sbk||x.sbe).map(x=>`<tr><td>${esc(nm(x.id))}</td><td>${x.second}</td><td>${x.sbk}</td><td>${x.sbe}</td></tr>`).join("")||'<tr><td colspan="4">Noch keine zweiten Bälle erfasst</td></tr>'}</tbody></table></div>
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
 <h3>EVV Start-6</h3><div class="grid2">${lineupEditor("n",st.lineup)}</div>
 <h3>${esc(opponent.name)} · aktuelle Aufstellung</h3><div class="grid2"><label>Zuspieler<input id="nOZ" value="${esc(opponent.setter)}"></label><label>Libero 1<input id="nOL1" value="${esc((opponent.liberos||[])[0]||"#")}"></label><label>Libero 2<input id="nOL2" value="${esc((opponent.liberos||[])[1]||"#")}"></label>${oppInputs}</div>
 <label>Startrotation<select id="nRot">${[1,2,3,4,5,6].map(r=>`<option ${r===st.rot?"selected":""}>${r}</option>`).join("")}</select></label>
 <div class="grid2"><button id="nK1">Gegner-Aufschlag · K1</button><button id="nK2" class="primary">EVV-Aufschlag · K2</button></div></div>`);
 const go=serving=>{
   const picked=readLineupEditor("n");if(!picked)return;const ids=picked.ids;st.roles=picked.roles; if(new Set(ids).size<6)return toast("EVV Start-6: Spieler doppelt");
   st.lineup=ids;st.rot=+$("nRot").value;st.serving=serving;
   if(st.liberoActive&&!liberoEligible()){st.liberoActive=false;st.liberoOnCourt="";st.liberoReplacedId="";toast("Libero beim Satzwechsel deaktiviert: Einsatzposition prüfen")}opponent.setter=$("nOZ").value.trim()||opponent.setter;opponent.liberos=[1,2].map(i=>$("nOL"+i).value.trim()||"#");opponent.receivers=[0,1,2,3].map(i=>$("nOR"+i).value.trim()||`#${i+1}`);
   st.set=next;st.e=0;st.o=0;st.setEnded=false;st.rallies=[];st.rallyUndo=[];st.marks=[];st.subPairs={};st.subCount=0;st.subUsed=[];st.setStart={rot:st.rot,serving,lineup:clone(ids),roles:clone(st.roles)};draft={};clearDraftHistory();view="live";closeModal();render();toast(`Satz ${next} gestartet`)
 };
 $("nK1").onclick=()=>go(false);$("nK2").onclick=()=>go(true);
}
function historical(){let r=view==="match"?allRallies():(st.sets.find(s=>s.set===view)?.rallies||(view===st.set?st.rallies:[]));$("flow").innerHTML=`<div class="banner">${view==="match"?"MATCH":"Satz "+view} · READ ONLY</div>${summary(r)}`}
function coach(){
 const rr=view==="live"||view==="match"?allRallies():ralliesForSet(view);
 const last=rr.slice(-5),rs=rotationStats(rr),rec=rr.flatMap(r=>(r.chain||[]).filter(x=>x.side==="EVV"&&x.type==="Reception").concat(!(r.chain||[]).length&&r.event==="Reception"?[{quality:r.reception,player:r.receiver}]:[]));
 const good=rec.filter(x=>["A2","A3"].includes(x.quality)).length;
 const weak=rs.filter(x=>x.k1>=5).sort((a,b)=>a.k1p-b.k1p)[0];
 const recentLoss=last.filter(x=>x.winner!=="EVV").length;
 const k1=rr.filter(x=>x.phase==="K1"),k2=rr.filter(x=>x.phase==="K2");
 const rate=x=>x.length?pct(x.filter(r=>r.winner==="EVV").length,x.length):"–";
 const guidance=[];
 if(weak&&weak.k1p<45)guidance.push(`R${weak.rot}: K1 ${weak.k1p}% bei ${weak.k1} Rallyes. Annahme, Zuspiel und Angriffsabschluss im Video getrennt prüfen.`);
 if(rec.length>=5&&good/rec.length<.55)guidance.push(`Annahme A2+A3 nur ${pct(good,rec.length)} (${good}/${rec.length}). Annahmeriegel und Aufschlagziel des Gegners prüfen.`);
 if(recentLoss>=4)guidance.push(`Vier oder mehr der letzten fünf Rallyes verloren: Auszeit und einfache erste Angriffsoption erwägen.`);
 if(!guidance.length)guidance.push("Noch keine belastbare Auffälligkeit. Mindestens fünf relevante Aktionen pro Kennzahl abwarten.");
 $("flow").innerHTML=`<h2>Coach · Entscheidungen</h2><div class="statCards"><div class="statCard"><span>K1 Sideout</span><b>${rate(k1)}</b><small>n=${k1.length}</small></div><div class="statCard"><span>K2 Breakpoint</span><b>${rate(k2)}</b><small>n=${k2.length}</small></div><div class="statCard"><span>Annahme A2+A3</span><b>${pct(good,rec.length)}</b><small>${good}/${rec.length}</small></div></div><div class="coachline"><b>Letzte fünf:</b> ${last.map(x=>x.winner==="EVV"?"✓":"×").join(" ")||"–"}</div><h3>Beobachtung → Handlung</h3>${guidance.map(g=>`<div class="coachline">${esc(g)}</div>`).join("")}<p class="small">Hinweise sind regelbasierte Prüfimpulse, keine automatische Kausalanalyse. Rotation R4/R5 entspricht nicht automatisch der taktischen Läuferbezeichnung L4/L5.</p>${tacticalBoard()}${trendPanel(rr)}${opponentTrend(rr)}${opponentPlayerStats(rr)}`;bindTactic();
}
// VIP: tactical board and independent reception plan, persisted with match state.
function receptionPlanner(){
 st.receivePlans=st.receivePlans||{};const selected=st.receivePlans[st.rot]||receivers();
 const choices=active().filter(id=>roleOf(id)!=="Z"||st.liberoIds.includes(id));
 modal(`<h2>Annahme R${st.rot} anpassen</h2><p class="small">Darf auch D enthalten. AA1/AA2 sind unabhängig von der Annahme. Drei Spieler sind eine Vorlage, keine Pflicht.</p>${choices.map(id=>`<label class="pickRow"><input type="checkbox" data-rec="${esc(id)}" ${selected.includes(id)?"checked":""}>${esc(nm(id))} · ${esc(roleOf(id))}</label>`).join("")}<div class="grid2"><button id="recDefault">Vorlage</button><button class="primary" id="recSave">Übernehmen</button></div>`);
 $("recDefault").onclick=()=>{st.receivePlans[st.rot]=[];closeModal();render();toast("Standardannahme aktiv")};
 $("recSave").onclick=()=>{const ids=[...document.querySelectorAll("[data-rec]:checked")].map(x=>x.dataset.rec);if(!ids.length)return toast("Mindestens einen Spieler wählen");st.receivePlans[st.rot]=ids;closeModal();render()};
}
function liberoPlanner(){
 const available=st.liberoIds||[];
 const select=(id,opts)=>`<select id="${id}">${opts.map(([v,label])=>`<option value="${esc(v)}">${esc(label)}</option>`).join("")}</select>`;
 const libs=[["","Kein Libero"],...available.map(id=>[id,nm(id)])];
 const middles=st.lineup.filter(id=>roleOf(id).startsWith("MB"));
 modal(`<h2>Libero · Satz ${st.set}</h2><p class="small">Ein oder zwei Liberos im Kader; jeweils nur einen für einen hinteren Mittelblocker aktivieren. Wechsel zwischen Rallyes.</p><label>Libero ${select("lpLib",libs)}</label><label>Ersetzt ${select("lpMB",[["","Niemand"],...middles.map(id=>[id,`${nm(id)} · P${courtPos(id)}`])])}</label><div class="grid2"><button id="lpCancel">Abbrechen</button><button id="lpSave" class="primary">Übernehmen</button></div>`);
 $("lpLib").value=st.liberoOnCourt||"";$("lpMB").value=st.liberoReplacedId||"";
 $("lpCancel").onclick=closeModal;
 $("lpSave").onclick=()=>{if(draft.step||st.setEnded)return toast("Nur zwischen Ballwechseln");const l=$("lpLib").value,m=$("lpMB").value;if(!!l!==!!m)return toast("Libero und Mittelblocker gemeinsam wählen");if(m&&![1,5,6].includes(courtPos(m)))return toast("Mittelblocker muss in der Hinterreihe stehen");st.liberoOnCourt=l;st.liberoReplacedId=m;st.liberoActive=!!l;st.receivePlans={};st.tacticPositions={};closeModal();render();toast("Libero-Einsatz aktualisiert")};
}
function opponentCourt(){
 const marks=allRallies().filter(r=>r.targetZone&&r.winner==="EVV");
 const count=Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,0]));marks.forEach(r=>count[r.targetZone]++);
 modal(`<h2>${esc(opponent.name)} · Kill-Zonen</h2><p class="small">Aufschlag-Asse und Angriffspunkte unserer Mannschaft auf dem gegnerischen Feld. Netz oben, Grundlinie unten. Nur erfasste Zonen.</p><div class="zone9">${Array.from({length:9},(_,i)=>`<div class="killZone"><b>${i+1}</b><strong>${count[i+1]}</strong><small>Punkte</small></div>`).join("")}</div><p class="small">${marks.length} markierte Punkte · Die Zonen 1–9 sind ein 3×3-Raster, nicht die offiziellen Spielpositionen.</p><h3>Gegner · Block und Feldabwehr</h3><p class="small">Taktische Grundordnung als Skizze, keine aus Video bestätigte Gegneraufstellung.</p><div class="tacticCourt opponentTactic"><div class="tacticNet">NETZ · 4 / 3 / 2</div>${[["#4",23,27],["#3",50,27],["#2",77,27],["#5",22,77],["#6",50,77],["#1",78,77]].map(([label,x,y])=>`<span class="tacticPlayer" style="left:${x}%;top:${y}%"><b>${label}</b><small>Gegner</small></span>`).join("")}<div class="tacticBaseline">GRUNDLINIE · 5 / 6 / 1</div></div><button id="oppClose">Schließen</button>`);$("oppClose").onclick=closeModal;
}
function tacticalPreset(kind){
 const defaultXY={1:[76,82],2:[77,28],3:[50,27],4:[23,28],5:[22,82],6:[50,80]};
 const defensive={1:[79,77],2:[72,29],3:[51,29],4:[29,29],5:[22,72],6:[51,76]};
 const positions=kind==="defense"?defensive:defaultXY;
 st.tacticPositions=Object.fromEntries(active().map(id=>[id,(positions[courtPos(id)]||positions[6]).slice()]));render();
}
function tacticalBoard(){
 const ids=active(),loc=st.tacticPositions||{},defaultXY={1:[76,82],2:[77,28],3:[50,27],4:[23,28],5:[22,82],6:[50,80]};
 const nodes=ids.map(id=>{const pos=courtPos(id)||6,xy=loc[id]||defaultXY[pos];return `<button class="tacticPlayer" data-player="${esc(id)}" style="left:${xy[0]}%;top:${xy[1]}%" aria-label="${esc(nm(id))}, Position ${pos}"><b>${esc(nm(id))}</b><small>${esc(roleOf(id))} · P${pos}</small></button>`}).join("");
 return `<div class="tacticActions"><button id="tacticReset">Grundordnung</button><button id="tacticDefense">Block / Abwehr 5+6</button><button id="recEdit">Annahme R${st.rot}</button><button id="liberoEdit">Libero verwalten</button><button id="oppCourtBtn">Gegnerfeld / Kill-Zonen</button></div><div class="tacticCourt" id="tacticCourt"><div class="tacticNet">NETZ · POSITION 4 / 3 / 2</div>${nodes}<div class="tacticBaseline">GRUNDLINIE · POSITION 5 / 6 / 1</div></div><p class="small">Taktische Skizze: Spieler mit dem Finger verschieben. Keine automatische Prüfung der Überlappungsregeln. Startpositionen vor Aufschlag separat kontrollieren.</p>`;
}
function bindTactic(){
 const court=$("tacticCourt");if(!court)return;
 $("recEdit").onclick=receptionPlanner;$("liberoEdit").onclick=liberoPlanner;$("oppCourtBtn").onclick=opponentCourt;
 $("tacticReset").onclick=()=>tacticalPreset("base");$("tacticDefense").onclick=()=>tacticalPreset("defense");
 court.querySelectorAll("[data-player]").forEach(el=>{el.addEventListener("pointerdown",e=>{e.preventDefault();el.setPointerCapture(e.pointerId)});el.addEventListener("pointermove",e=>{if(!el.hasPointerCapture(e.pointerId))return;const r=court.getBoundingClientRect(),x=Math.max(8,Math.min(92,(e.clientX-r.left)/r.width*100)),y=Math.max(13,Math.min(90,(e.clientY-r.top)/r.height*100));el.style.left=x+"%";el.style.top=y+"%";st.tacticPositions=st.tacticPositions||{};st.tacticPositions[el.dataset.player]=[x,y]});el.addEventListener("pointerup",()=>saveLocal())});
}
function opponentPlayerStats(rr){
 const actions=rr.flatMap(r=>r.chain||[]).filter(x=>x.side==="Gegner");
 const players=[...new Set(actions.map(x=>x.player||x.attacker||x.server||x.receiver).filter(Boolean))].sort();
 if(!players.length)return `<div class="coachline">Noch keine gegnerischen Einzelaktionen mit Spielernummer erfasst.</div>`;
 const cells=players.map(id=>{const own=actions.filter(x=>(x.player||x.attacker||x.server||x.receiver)===id),re=own.filter(x=>x.type==="Reception"),at=own.filter(x=>x.type==="Attack"),sv=own.filter(x=>x.type==="Serve");return `<tr><td>${esc(id)}</td><td>${re.length}</td><td>${pct(re.filter(x=>["A2","A3"].includes(x.quality)).length,re.length)}</td><td>${at.length}</td><td>${at.filter(x=>["KILL","BLOCK_OUT"].includes(x.result)).length}</td><td>${sv.length}</td></tr>`}).join("");
 return `<h3>Gegner · Spieleraktionen</h3><div class="tableScroll"><table class="statsTable"><thead><tr><th>Nr.</th><th>Annahme</th><th>A2+A3</th><th>Angriffe</th><th>Punkte</th><th>Aufschläge</th></tr></thead><tbody>${cells}</tbody></table></div>`;
}
function trendPanel(rr){
 const windows=[];for(let i=0;i<rr.length;i+=5){const slice=rr.slice(i,i+5),wins=slice.filter(x=>x.winner==="EVV").length;windows.push({from:i+1,to:i+slice.length,wins,n:slice.length})}
 return `<h3>Spielverlauf · 5er-Fenster</h3><div class="trendStrip">${windows.map(x=>`<div class="trendTile" title="Rallyes ${x.from}–${x.to}"><b>${x.wins}/${x.n}</b><small>${x.from}–${x.to}</small></div>`).join("")||"Noch keine Rallyes"}</div>`;
}
function opponentTrend(rr){
 const actions=rr.flatMap(r=>(r.chain||[]).filter(x=>x.side==="Gegner"));
 const receptions=actions.filter(x=>x.type==="Reception"),attacks=actions.filter(x=>x.type==="Attack"),serves=actions.filter(x=>x.type==="Serve");
 const good=receptions.filter(x=>["A2","A3"].includes(x.quality)).length;
 const halves=[rr.slice(-10,-5),rr.slice(-5)];
 return `<h3>Gegner · Verlauf</h3><div class="statCards"><div class="statCard"><span>Annahme positiv</span><b>${pct(good,receptions.length)}</b><small>n=${receptions.length}</small></div><div class="statCard"><span>Angriffe erfasst</span><b>${attacks.length}</b></div><div class="statCard"><span>Aufschläge erfasst</span><b>${serves.length}</b></div><div class="statCard"><span>Letzte 5 Punkte</span><b>${halves[1].filter(x=>x.winner!=="EVV").length}/5</b></div></div><p class="small">Gegnerkennzahlen zeigen nur ausdrücklich erfasste Aktionen. Fehlende Daten werden nicht geschätzt.</p>`;
}
function stats(){let rr,label,marks;if(view==="match"||view==="live"){rr=allRallies();label=view==="match"?"MATCH":"LIVE / MATCH";marks=allMarks()}else{rr=ralliesForSet(view);label=`SATZ ${view}`;marks=marksForSet(view)}$("flow").innerHTML=fullStatsFrom(rr,label)+trendPanel(rr)+opponentTrend(rr)+opponentPlayerStats(rr)+`<h3>EVV Zielkarte</h3><div id="statCourt" class="court"><div class="courtHint">NETZ ↑ · Landepunkte · ↓ GRUNDLINIE</div></div>`;setTimeout(()=>{marks.forEach(m=>{let d=document.createElement("span");d.className="mark";d.style.left=m.x*100+"%";d.style.top=m.y*100+"%";$("statCourt").appendChild(d)})},0)}
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
// A substitute is tied to the original starter and can enter only once per set.
function validateSub(out,inn){
 if(!st.started||st.setEnded||view!=="live"||draft.step)return "Wechsel nur zwischen Rallyes im laufenden Satz";
 if(!st.lineup.includes(out)||st.lineup.includes(inn)||!byId(inn)||byId(inn).role==="L")return "Spieler nicht verfügbar";
 if(st.subCount>=6)return "Sechs reguläre Wechsel erreicht";
 const starters=(st.setStart&&st.setStart.lineup)||st.lineup;
 const pairs=st.subPairs||{},used=st.subUsed||[];
 if(used.includes(inn))return "Spieler hat seinen zulässigen Einsatz bereits abgeschlossen";
 if(pairs[out])return pairs[out]===inn?null:"Rückwechsel nur mit ursprünglichem Partner";
 if(!starters.includes(out))return "Ersatzspieler darf nur mit ursprünglichem Startspieler zurückwechseln";
 if(starters.includes(inn))return "Startspieler darf nur auf seine ursprüngliche Position zurückkehren";
 if(Object.values(pairs).includes(inn))return "Ersatzspieler bereits einem Wechselpaar zugeordnet";
 return null;
}
function applySub(out,inn,voice){
 const err=validateSub(out,inn);if(err){toast(err);return false}
 const i=st.lineup.indexOf(out),pairs=st.subPairs||(st.subPairs={}),used=st.subUsed||(st.subUsed=[]);
 const isReturn=!!pairs[out];
 if(isReturn){delete pairs[out];used.push(out,inn)}else pairs[inn]=out;
 st.lineup[i]=inn;st.roles=st.roles||{};st.roles[inn]=st.roles[out]||(byId(out)||{}).role;delete st.roles[out];st.receiveIds=st.receiveIds.map(x=>x===out?inn:x);st.subCount++;
 st.events.push({type:"sub",set:st.set,out,inn,score:`${st.e}:${st.o}`,pos:i+1,return:isReturn,...(voice?{voice}:{})});
 render();toast(`${nm(inn)} ⇧ / ${nm(out)} ⇩`);return true;
}
function substitute(){
 if(!st.started||view!=="live"||st.setEnded||draft.step)return toast("Wechsel nur zwischen Rallyes im laufenden Satz");
 const bench=roster.filter(p=>!active().includes(p.id)&&p.role!=="L");
 const history=st.events.filter(e=>e.type==="sub"&&e.set===st.set);
 const hist=history.length?history.map(e=>`<div class="small">${esc(e.score)} · ${esc(nm(e.out))} raus → ${esc(nm(e.inn))} rein${e.return?" (Rückwechsel)":""}</div>`).join(""):"<p class='small'>Noch keine Wechsel in diesem Satz.</p>";
 modal(`<h2>Spielerwechsel · Satz ${st.set}</h2><p class="small">${st.subCount} von 6 regulären Wechseln · Rückwechsel nur mit ursprünglichem Partner.</p><label>RAUS<select id="subOut">${st.lineup.map(id=>`<option value="${id}">${esc(nm(id))}</option>`).join("")}</select></label><label>REIN<select id="subIn">${bench.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.role)}</option>`).join("")}</select></label><div class="grid2"><button id="cancelSub">Abbrechen</button><button id="doSub" class="primary">Wechsel bestätigen</button></div><h3>Wechselhistorie</h3>${hist}`);
 $("cancelSub").onclick=closeModal;
 $("doSub").onclick=()=>{if(applySub($("subOut").value,$("subIn").value))closeModal()};
}
function scoreFix(){if(view!=="live")return toast("Nur LIVE korrigierbar");modal(`<h2>Punkt korrigieren</h2><p class="small">Nur Spielstand. Keine Statistik, Rotation oder Aufschlagänderung.</p><div class="grid2"><button data-f="e,1">EVV +1</button><button data-f="e,-1">EVV −1</button><button data-f="o,1">Gegner +1</button><button data-f="o,-1">Gegner −1</button></div>`);document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{let [t,d]=b.dataset.f.split(",");st[t]=Math.max(0,st[t]+(+d));st.setEnded=false;st.matchEnded=false;checkEnd();closeModal();render()})}
function prepareNextSet(){
 if(!st.setEnded||st.matchEnded)return toast("Kein Satzwechsel möglich");
 const next=st.set+1;
 const options=(selected)=>roster.filter(p=>p.role!=="L").map(p=>`<option value="${p.id}" ${selected===p.id?"selected":""}>${esc(p.name)} · ${esc(p.role)}</option>`).join("");
 modal(`<h2>Satz ${next} · neue Startaufstellung</h2><p class="small">Jede Position frei wählen. Die bisherige Aufstellung ist vorausgewählt.</p><div class="grid2">${lineupEditor("ns",st.lineup)}</div><label>Startrotation<select id="nsRot">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${n===st.rot?"selected":""}>R${n}</option>`).join("")}</select></label><p class="small">Libero-Einsatz wird vor dem neuen Satz zurückgesetzt und kann anschließend neu festgelegt werden.</p><div class="grid2"><button id="nsRec">Gegner-Aufschlag · K1</button><button id="nsSrv" class="primary">EVV-Aufschlag · K2</button></div><button id="nsCancel">Abbrechen</button>`);
 const go=serv=>{
  const picked=readLineupEditor("ns");if(!picked)return;const ids=picked.ids;
  const newRot=Number($("nsRot").value);
  st.sets.push({set:st.set,e:st.e,o:st.o,rallies:clone(st.rallies),marks:clone(st.marks),start:clone(st.setStart),lineup:clone(st.lineup),roles:clone(st.roles),events:clone(st.events.filter(x=>x.set===st.set))});
  st.set=next;st.e=0;st.o=0;st.lineup=ids;st.roles=picked.roles;st.rot=newRot;st.serving=serv;st.setEnded=false;st.matchEnded=false;
  st.liberoActive=false;st.liberoOnCourt="";st.liberoReplacedId="";st.receivePlans={};st.tacticPositions={};
  st.rallies=[];st.rallyUndo=[];st.marks=[];st.subPairs={};st.subCount=0;st.subUsed=[];st.setStart={rot:newRot,serving:serv,lineup:clone(ids),roles:clone(st.roles)};
  draft={};clearDraftHistory();pendingMark=null;tab="rally";view="live";closeModal();render();toast(`Satz ${next} gestartet`);
 };
 $("nsRec").onclick=()=>go(false);$("nsSrv").onclick=()=>go(true);$("nsCancel").onclick=closeModal;
}

function importData(){
 const input=document.createElement("input");input.type="file";input.accept=".json,application/json";
 input.onchange=async()=>{try{
 const file=input.files&&input.files[0];if(!file)return;
 if(file.size>15*1024*1024)throw Error("Datei zu groß (maximal 15 MB)");
 const data=JSON.parse(await file.text());
 if(data.schema!=="EVV-QuickScout-1"||!data.match||!Array.isArray(data.match.lineup)||data.match.lineup.length!==6||!Array.isArray(data.match.rallies)||!Array.isArray(data.match.sets)||!data.opponent||typeof data.opponent.name!=="string")throw Error("Kein gültiges QuickScout-Backup");
 if(!confirm("Aktuellen Spielstand durch Backup ersetzen? Bitte vorher exportieren."))return;
 st=Object.assign(fresh(),data.match);opponent=Object.assign({name:"Gegner",setter:"#",liberos:["#","#"],receivers:[]},data.opponent);
 st.receivePlans=st.receivePlans||{};st.tacticPositions=st.tacticPositions||{};draft={};clearDraftHistory();view="live";tab="rally";saveLocal();setupUI();$("setup").classList.toggle("hidden",!!st.started);render();toast("Backup importiert");
 }catch(e){toast("Import fehlgeschlagen: "+e.message)}};input.click();
}
function newMatch(){
 modal(`<h2>Neues Spiel beginnen</h2><p>Der aktuelle Spielstand wird durch ein neues Spiel ersetzt. Exportiere ihn vorher als JSON, damit keine Daten verloren gehen.</p><div class="grid2"><button id="nmExport">Backup exportieren</button><button id="nmCancel">Abbrechen</button></div><button id="nmConfirm" class="danger">Neues Spiel ohne Übernahme starten</button>`);
 $("nmExport").onclick=exportData;$("nmCancel").onclick=closeModal;
 $("nmConfirm").onclick=()=>{st=fresh();opponent={name:"Gegner",setter:"#",liberos:["#","#"],receivers:["#","#","#","#"]};draft={};draftHistory=[];pendingMark=null;tab="rally";view="live";closeModal();$("setup").classList.remove("hidden");setupUI();$("oppName").value="Gegner";["oppSetter","oppLibero1","oppLibero2","oppR1","oppR2","oppR3","oppR4"].forEach(id=>{if($(id))$(id).value=""});render();toast("Neues Spiel einrichten")};
}
function exportData(){
 const payload={schema:"EVV-QuickScout-1",version:APP_VERSION,exportedAt:new Date().toISOString(),opponent,match:st};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=`EVV_Scout_S${st.set}_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function printReport(){
 const rr=allRallies(),r=rotationStats(rr),rec=statRowsFrom(rr);
 const popup=window.open("","_blank");if(!popup)return toast("Pop-ups für Druckansicht erlauben");
 const html=`<!doctype html><html lang="de"><meta charset="utf-8"><title>EVV Spielbericht</title><style>body{font:14px Arial;margin:25px;color:#182238}h1{border-bottom:3px solid #e87929;padding-bottom:12px}table{border-collapse:collapse;width:100%;margin:14px 0 25px}th,td{border:1px solid #ccd3dd;padding:7px;text-align:left}th{background:#edf1f6}.note{color:#5a6575} @media print{button{display:none}}</style><h1>EVV QuickScout · Matchbericht</h1><p>Gegner: ${esc(opponent.name)} · Version ${APP_VERSION} · Stand ${new Date().toLocaleString("de-DE")}</p><h2>Sätze</h2><table><tr><th>Satz</th><th>EVV</th><th>Gegner</th></tr>${st.sets.concat([{set:st.set,e:st.e,o:st.o}]).map(x=>`<tr><td>${x.set}</td><td>${x.e}</td><td>${x.o}</td></tr>`).join("")}</table><h2>K1/K2 je Rotation</h2><table><tr><th>R</th><th>K1 n</th><th>K1 %</th><th>K2 n</th><th>K2 %</th></tr>${r.map(x=>`<tr><td>${x.rot}</td><td>${x.k1}</td><td>${x.k1?x.k1p+"%":"–"}</td><td>${x.k2}</td><td>${x.k2?x.k2p+"%":"–"}</td></tr>`).join("")}</table><h2>Spieler</h2><table><tr><th>Name</th><th>Annahmen</th><th>A2+A3</th><th>Angriffe</th><th>Kills</th><th>Effizienz</th></tr>${rec.filter(x=>x.rec||x.att).map(x=>`<tr><td>${esc(nm(x.id))}</td><td>${x.rec}</td><td>${x.a2+x.a3}</td><td>${x.att}</td><td>${x.kill}</td><td>${x.att?x.eff+"%":"–"}</td></tr>`).join("")}</table><h2>Coaching-Notizen</h2><p>Stärke: _______________________________________________________________________</p><p>Baustelle: _____________________________________________________________________</p><p>Nächstes Training: ____________________________________________________________</p><p class="note">K1 = Sideout, K2 = Breakpoint. Quoten nur mit Stichprobengröße interpretieren.</p><button onclick="window.print()">Drucken</button></html>`;
 popup.document.write(html);popup.document.close();
}
function rallyLabel(x){let a=[];if(x.serve)a.push(`Aufschlag ${x.serve}`);if(x.receiver&&x.reception)a.push(`Annahme ${x.receiver} ${x.reception}`);if(x.setterTarget)a.push(`Zuspiel ${x.setterTarget}`);if(x.attacker)a.push(`Angriff ${nm(x.attacker)} ${x.zone||""} ${x.result||""}`.trim());else if(x.event==="OpponentAttack")a.push(`Gegnerangriff ${x.result||""}`.trim());else if(!a.length)a.push(x.event||"Rally");return a.join(" → ")}
function recent(){let r=allRallies().slice(-3).reverse();$("recent").innerHTML=`<h3>Letzte Rallys</h3><div class="history">${r.length?r.map(x=>`S${x.set} · ${esc(x.after)} · ${esc(rallyLabel(x))} · ${esc(x.winner)}`).join("<br>"):"Noch keine Rally"}</div>`}
function render(){
 saveLocal();
 renderHeader();renderNav();document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 if(tab==="rally")rally();else if(tab==="opponent")opponentTab();else if(tab==="coach")coach();else stats();recent();if($("finishedNew"))$("finishedNew").onclick=newMatch;
 $("nextSet").disabled=!st.setEnded||st.matchEnded;$("substitute").disabled=!st.started||view!=="live"||!!draft.step
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
$("startReceive").onclick=()=>start(false);$("startServe").onclick=()=>start(true);
function undoLast(){if(view!=="live")return toast("Undo nur LIVE");let x=st.rallyUndo.pop();if(!x)return toast("Keine Rally zum Undo");restore(x);draft={};clearDraftHistory();pendingMark=null;render();toast("Letzte Rally vollständig zurückgesetzt")}
$("undo").onclick=undoLast;$("newMatch").onclick=newMatch;
$("exportData").onclick=exportData;$("importData").onclick=importData;$("printReport").onclick=printReport;$("scoreFix").onclick=scoreFix;$("substitute").onclick=substitute;$("timeout").onclick=()=>{
 if(!st.started||view!=="live")return toast("Auszeit nur im laufenden Satz");
 modal(`<h2>Auszeit erfassen</h2><p class="small">Spielstand ${st.e}:${st.o} · S${st.set} · R${st.rot}</p><div class="grid2"><button id="toEVV" class="primary">EVV-Auszeit</button><button id="toOpp">${esc(opponent.name)}-Auszeit</button></div><button id="toCancel">Abbrechen</button>`);
 $("toEVV").onclick=()=>{st.events.push({type:"timeout",team:"EVV",set:st.set,score:`${st.e}:${st.o}`,rot:st.rot});closeModal();tab="coach";render();toast("EVV-Auszeit gespeichert")};
 $("toOpp").onclick=()=>{st.events.push({type:"timeout",team:"Gegner",set:st.set,score:`${st.e}:${st.o}`,rot:st.rot});closeModal();tab="coach";render();toast("Gegner-Auszeit gespeichert")};
 $("toCancel").onclick=closeModal;
};$("nextSet").onclick=()=>{if(!st.setEnded)return toast("Satz läuft noch");prepareNextSet()};

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
 if(c.type==="reception"){if(!receivers().includes(c.player))return toast(`${nm(c.player)} ist nicht in der aktuellen Annahme`); if(c.q==="A0")commit("Gegner",{event:"Reception",receiver:c.player,reception:c.q,voice:c.raw,result:"DIRECT_ERROR",chain:[{side:"EVV",type:"Reception",player:c.player,quality:"A0"}]});else{draft={step:2,receiver:c.player,reception:c.q,voice:c.raw};tab="rally";render();toast("Annahme gespeichert · Angriff weiter per Tap/Sprache")};return}
 if(c.type==="kill"){if(!attackers().includes(c.player))return toast(`${nm(c.player)} ist aktuell kein Angreifer`);pendingMark={w:"EVV",data:{event:"Attack",attacker:c.player,zone:c.zone,result:"KILL",voice:c.raw}};courtPicker();return}
 if(c.type==="block"){if(!front().includes(c.player))return toast(`${nm(c.player)} ist aktuell nicht Vorderreihe`);commit("EVV",{event:"Block",player:c.player,result:"BLOCK",voice:c.raw});return}
 if(c.type==="sub"){applySub(c.out,c.inn,c.raw);return}
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

const restored=loadLocal();document.title=`EVV QuickScout V${APP_VERSION}`;if($("buildLabel"))$("buildLabel").textContent=`V${APP_VERSION}`;if($("setupVersion"))$("setupVersion").textContent=`V${APP_VERSION}`;setupUI();if(restored&&st.started){$("setup").classList.add("hidden")}render();
window.EVV_QS_TEST={newMatch,liberoPlanner,opponentCourt,checkEnd,setWins,opponentPlayerStats,trendPanel,tacticalPreset,importData,action,commit,applySub,undoLast,start,setView:v=>{view=v},getDraft:()=>clone(draft),setLineup:(ids,roles,rot,lib)=>{st.lineup=ids.slice();st.roles=Object.assign({},roles);st.rot=rot||1;if(lib)Object.assign(st,lib)},begin:(serv,rot)=>{st.started=true;st.serving=serv;st.rot=rot||st.rot;st.setStart={rot:st.rot,serving:serv,lineup:clone(st.lineup),roles:clone(st.roles)}},target,isSetWin,rotNext:r=>ROT_NEXT[r],fresh,state:()=>clone(st),courtPos,rotationMatrix,liberoEligible,front,receivers,attackOptions,attackRoutesFor,roleBaseRoute,roleOf,readLineupEditor,ralliesForSet,marksForSet,opponentReceivers,version:APP_VERSION};
})();