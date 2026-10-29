(function(){
"use strict";
const $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
const APP_VERSION=globalThis.EVV_VERSION||"7.19.0-k1-auto-mb";
const ROT_NEXT={5:6,6:1,1:2,2:3,3:4,4:5}; // confirmed live-test convention: R5→R6→R1
let roster=[
{id:"johann",name:"Johann",role:"Z"},{id:"michael",name:"Michael",role:"AA1"},{id:"janik",name:"Janik",role:"MB1"},
{id:"jonas",name:"Jonas",role:"D"},{id:"maksym",name:"Maxim",role:"AA2"},{id:"dirk",name:"Dirk",role:"MB2"},
{id:"niklas",name:"Niklas",role:"MB1"},{id:"arthur",name:"Arthur",role:"AA"},{id:"lion",name:"Lion",role:"D"},{id:"david",name:"David",role:"AA"},{id:"reinhold",name:"Reinhold",role:"Z"},{id:"felix",name:"Felix",role:"AA"},{id:"jens",name:"Jens",role:"D"},{id:"amar",name:"Anmol",role:"L"},{id:"alex",name:"Sascha",role:"L"}];
const JERSEY={niklas:"5",johann:"6",michael:"16",janik:"15",jonas:"12",maksym:"1",dirk:"4",arthur:"14",felix:"20",jens:"7",amar:"99",alex:"?",david:"10",lion:"8"};
function jersey(id){if(id==="niklas"&&!st.jerseyNumbers?.niklas&&Object.entries(st.jerseyNumbers||{}).some(([other,n])=>other!==id&&n==="5"))return "?";return st.jerseyNumbers?.[id]||JERSEY[id]||"?"}
const ROLES=["Z","D","AA1","AA2","MB1","MB2"];
const defaultRoles=()=>({johann:"Z",jens:"D",michael:"AA1",arthur:"AA2",janik:"MB1",dirk:"MB2"});
function roleOf(id){return (st.roles||{})[id]||(byId(id)||{}).role||""}
function roleOptions(selected){return ROLES.map(r=>`<option value="${r}" ${selected===r?"selected":""}>${r}</option>`).join("")}
function lineupEditor(prefix,ids){return ids.map((id,i)=>`<label>Startplatz P${i+1}<select id="${prefix}P${i}">${roster.filter(p=>p.role!=="L").map(p=>`<option value="${p.id}" ${p.id===id?"selected":""}>${esc(p.name)} #${jersey(p.id)}</option>`).join("")}</select><select aria-label="Rolle für Startplatz ${i+1}" id="${prefix}R${i}">${roleOptions(roleOf(id))}</select></label>`).join("")}
function readLineupEditor(prefix){const ids=[0,1,2,3,4,5].map(i=>$(prefix+"P"+i).value),roles=[0,1,2,3,4,5].map(i=>$(prefix+"R"+i).value);if(st.started&&ids.some(id=>st.liberoIds.includes(id))){toast("Gemeldeter Libero darf nicht als Feldspieler aufgestellt werden");return null}if(new Set(ids).size!==6||new Set(roles).size!==6||!ROLES.every(r=>roles.includes(r))){toast("Sechs verschiedene Spieler und jede Rolle genau einmal wählen");return null}const pos=Object.fromEntries(roles.map((r,i)=>[r,i+1]));if([['Z','D'],['AA1','AA2'],['MB1','MB2']].some(([a,b])=>Math.abs(pos[a]-pos[b])!==3)){toast('5:1: Z/D, AA1/AA2 und MB1/MB2 gegenüber aufstellen');return null}return {ids,roles:Object.fromEntries(ids.map((id,i)=>[id,roles[i]]))}}
function roleForPosition(pos){const id=st.lineup[pos-1];return id?roleOf(id):""}
const byId=id=>roster.find(p=>p.id===id), nm=id=>(byId(id)||{name:id}).name;
let opponent={name:"Gegner",setter:"#",liberos:["#","#"],receivers:["#","#","#","#"]};
let tab="rally",view="live",draft={},draftHistory=[],pendingMark=null;
let storageLoadFailed=false,restoredRuntime=null;
let st=fresh();
function fresh(){return{started:false,set:1,e:0,o:0,rot:1,serving:true,setEnded:false,matchEnded:false,
lineup:["johann","michael","janik","jens","arthur","dirk"],roles:defaultRoles(),receiveIds:[],receivePlans:{},tacticPositions:{},opponentPositions:{},sixBoards:{},liberoIds:["amar","alex"],liberoOnCourt:"",liberoReplacedId:"",liberoActive:false,liberoAutoEnabled:true,liberoPreferredId:"",liberoPreferredMB:"",
rallies:[],sets:[],rallyUndo:[],events:[],marks:[],setStart:null,subPairs:{},subCount:0,subUsed:[]}}
function esc(s){return String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}
function toast(s){$("toast").textContent=s;$("toast").classList.remove("hidden");setTimeout(()=>$("toast").classList.add("hidden"),1100)}
function modal(html){$("modalBox").classList.remove("presentation");$("modalBox").innerHTML=html;$("modalBox").scrollTop=0;$("modal").classList.remove("hidden");$("modalBox").setAttribute("role","dialog");$("modalBox").setAttribute("aria-modal","true");$("modalBox").querySelector("button,input,select")?.focus()}
let editorGuard=null;
window.addEventListener("beforeunload",e=>{if(editorGuard&&!editorGuard.peek()){e.preventDefault();e.returnValue=""}});
function closeModal(){if(editorGuard&&!editorGuard())return;editorGuard=null;$("modalBox").classList.remove("presentation");$("modal").classList.add("hidden");$("modalBox").innerHTML=""}
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeModal()});
function target(set=st.set){return set===5?15:25}
function isSetWin(e=st.e,o=st.o,set=st.set){return (e>=target(set)||o>=target(set))&&Math.abs(e-o)>=2}
function setWins(team){let w=st.sets.filter(s=>(team==="EVV"?s.e>s.o:s.o>s.e)).length;if(st.setEnded&&(team==="EVV"?st.e>st.o:st.o>st.e))w++;return w}
function checkEnd(){st.setEnded=isSetWin();st.matchEnded=false;if(st.setEnded){const w=st.e>st.o?"EVV":"Gegner";st.matchEnded=setWins(w)>=3}}
function snapshot(){return clone({opponentTeam:st.opponentTeam,teamControl:st.teamControl,teamUndo:st.teamUndo,coachNotes:st.coachNotes,e:st.e,o:st.o,rot:st.rot,serving:st.serving,setEnded:st.setEnded,matchEnded:st.matchEnded,rallies:st.rallies,marks:st.marks,events:st.events,subPairs:st.subPairs,subCount:st.subCount,subUsed:st.subUsed,lineup:st.lineup,roles:st.roles,receiveIds:st.receiveIds,receivePlans:st.receivePlans,tacticPositions:st.tacticPositions,opponentPositions:st.opponentPositions,sixBoards:st.sixBoards,liberoOnCourt:st.liberoOnCourt,liberoReplacedId:st.liberoReplacedId,liberoActive:st.liberoActive,liberoAutoEnabled:st.liberoAutoEnabled,liberoPreferredId:st.liberoPreferredId,liberoPreferredMB:st.liberoPreferredMB})}
function restore(x){for(const k of ['opponentTeam','teamControl','teamUndo'])if(!(k in x))delete st[k];Object.assign(st,clone(x));syncOpponentAliases()}
const STORE_KEY="evvQuickScoutV77";
function sanitizeLiberoName(v){return String(v||"").trim().slice(0,45)}
function liberoRoster(){return roster.filter(p=>p.role==="L")}
function liberoCandidateOptions(selected){return `<option value="">Nicht gemeldet</option>`+roster.map(p=>`<option value="${esc(p.id)}" ${p.id===selected?"selected":""}>${esc(p.name)} #${jersey(p.id)}</option>`).join("")}
function liberoSlotIds(){return [1,2].map(i=>$("evvLiberoSlot"+i)?.value||"")}
function configureLiberoSlots(ids,names){
 const chosen=ids.filter(Boolean);if(new Set(chosen).size!==chosen.length){toast("Libero 1 und 2 müssen verschieden sein");return false}
 ids.forEach((id,i)=>{if(id&&["amar","alex"].includes(id)){const name=sanitizeLiberoName(names[i]);if(name)byId(id).name=name}});
 st.liberoIds=chosen;st.liberoOnCourt=chosen.includes(st.liberoOnCourt)?st.liberoOnCourt:"";
 if(!st.liberoOnCourt){st.liberoActive=false;st.liberoReplacedId="";st.liberoPreferredId="";st.liberoPreferredMB=""}
 st.receivePlans={};return true
}
function configureLiberos(names){
 const ids=["amar","alex"];
 ids.forEach((id,i)=>{const name=sanitizeLiberoName(names[i]);const player=byId(id);if(player)player.name=name||["Anmol","Sascha"][i]});
 st.liberoIds=ids.filter((id,i)=>!!sanitizeLiberoName(names[i]));
 if(st.liberoOnCourt&&!st.liberoIds.includes(st.liberoOnCourt)){st.liberoOnCourt="";st.liberoReplacedId="";st.liberoActive=false}
 st.receivePlans={};
}
function setupLiberoSelectors(){
 const picker=$("evvLiberoOnCourt");if(!picker)return;const old=picker.value||st.liberoOnCourt||"";
 picker.innerHTML=`<option value="">Kein Libero</option>`+st.liberoIds.map(id=>`<option value="${esc(id)}">${esc(nm(id))}</option>`).join("");
 picker.value=st.liberoIds.includes(old)?old:"";
}
function readLiberoNames(){return [1,2].map(i=>$("evvLiberoName"+i)?.value??(st.liberoIds[i-1]&&["amar","alex"].includes(st.liberoIds[i-1])?nm(st.liberoIds[i-1]):""))}
function applyLiberoNames(){const ids=liberoSlotIds();if(!configureLiberoSlots(ids,readLiberoNames()))return false;setupLiberoSelectors();return true}
function saveLocal(){if(storageLoadFailed)return false;try{localStorage.setItem(STORE_KEY,JSON.stringify({schemaVersion:2,st,opponent,roster,runtime:{draft,draftHistory,pendingMark,liveMode,tab,view}}));if($("storageWarning"))$("storageWarning").remove();return true}catch(e){if(!$("storageWarning")){const warning=document.createElement("p");warning.id="storageWarning";warning.setAttribute("role","alert");warning.textContent="Speichern fehlgeschlagen. Stand bleibt im Arbeitsspeicher. Bitte jetzt exportieren; Seite nicht schließen.";document.body.prepend(warning)}toast("Speicher voll: Bitte Backup exportieren");return false}}
// Preserve an explicit "no libero" choice when loading pre-flag matches.
function loadedMatch(match){
 const result=Object.assign(fresh(),match);
 result.sixBoards=result.sixBoards||{};
 if(!Object.prototype.hasOwnProperty.call(match,"liberoAutoEnabled")&&match.started)
  result.liberoAutoEnabled=!!(match.liberoOnCourt||match.liberoPreferredId||match.liberoActive);
 return result;
}
function loadLocal(){try{const raw=localStorage.getItem(STORE_KEY);if(!raw)return false;const d=JSON.parse(raw);if(d&&d.st){if(d.schemaVersion&&d.schemaVersion!==2)throw Error("Unbekannte Speicherversion");validateMatch(d.st);validateOpponent(d.opponent);validateRuntime(d.runtime);restoredRuntime=d.runtime||null;st=loadedMatch(d.st);opponent=Object.assign(opponent,d.opponent||{});if(Array.isArray(d.roster)){for(const saved of d.roster){const item=byId(saved.id);if(item&&saved.role==="L")item.name=sanitizeLiberoName(saved.name)||item.name}}if(!opponent.liberos)opponent.liberos=[opponent.libero||"#","#"];if(!st.roles)st.roles=Object.fromEntries(st.lineup.map(id=>[id,(byId(id)||{}).role]).filter(x=>ROLES.includes(x[1])));if(!st.liberoIds)st.liberoIds=[st.liberoId||"amar","alex"];st.receivePlans=st.receivePlans||{};st.tacticPositions=st.tacticPositions||{};st.opponentPositions=st.opponentPositions||{};st.sixBoards=st.sixBoards||{};st.liberoIds=Array.isArray(st.liberoIds)?st.liberoIds:[];return true}throw Error("Kein Spielstand")}catch(e){storageLoadFailed=true;const warning=document.createElement("p");warning.id="storageWarning";warning.setAttribute("role","alert");warning.textContent="Spielstand nicht lesbar. Rohdaten bleiben erhalten. Export sichert die unveränderten Rohdaten zur Wiederherstellung.";document.body.prepend(warning);toast("Spielstand nicht lesbar. Gespeicherte Daten bleiben unverändert; bitte vor einem Neustart sichern.")}return false}
function rotate(){st.rot=ROT_NEXT[st.rot]||st.rot}
// Team configuration: libero never serves. The original middle blocker serves in P1.
// A registered libero can return when the same middle blocker enters the back row.
function liberoReplacementEligible(id){
 return !!id&&st.lineup.includes(id)&&(/^(MB|AA)/.test(roleOf(id)))&&[1,5,6].includes(courtPos(id));
}
// A registered libero replaces one nominated MB or outside hitter in the back row.
// The nominated player remains in the rotation and returns on the front row or to serve.
function legacySyncLiberoRotation(){
 if(st.liberoAutoEnabled===false){st.liberoActive=false;st.liberoOnCourt="";st.liberoReplacedId="";return}
 // K1: replace whichever of the two middle blockers is currently in the back row.
 // On our serve at P1 the original MB serves; no libero serves in this configuration.
 const libero=st.liberoPreferredId||st.liberoOnCourt||st.liberoIds[0]||"";
 const middles=st.lineup.filter(id=>/^MB/.test(roleOf(id)));
 const eligible=middles.filter(id=>[1,5,6].includes(courtPos(id)));
 // Keep the current replacement if still eligible to avoid needless switches.
 const previous=st.liberoReplacedId;
 const preferred=st.liberoPreferredMB;
 const replaced=eligible.includes(previous)?previous:eligible.includes(preferred)?preferred:(eligible[0]||"");
 const valid=!!libero&&st.liberoIds.includes(libero)&&!st.lineup.includes(libero)&&!!replaced;
 st.liberoOnCourt=libero;
 st.liberoReplacedId=replaced;
 st.liberoActive=valid&&!(courtPos(replaced)===1&&st.serving);
}

// Versioned persistence: validate before mutation, retain the previous successful write on failure.
function validateMatch(m){
 const fail=()=>{throw Error("Ungültige Spieldaten")},obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
 if(!obj(m)||!Number.isInteger(m.set)||m.set<1||m.set>5||!Number.isInteger(m.rot)||m.rot<1||m.rot>6)fail();
 for(const n of ['e','o'])if(!Number.isInteger(m[n])||m[n]<0||m[n]>10000)fail();
 if(!Array.isArray(m.lineup)||m.lineup.length!==6||new Set(m.lineup).size!==6||m.lineup.some(id=>!byId(id)))fail();
 for(const key of ['sets','rallies','rallyUndo','events','marks'])if(!Array.isArray(m[key]))fail();
 const rally=r=>{if(!obj(r)||!['EVV','Gegner'].includes(r.winner)||r.chain&&!Array.isArray(r.chain))fail();if(r.chain?.some(c=>!obj(c)||!['EVV','Gegner'].includes(c.side)||typeof c.type!=='string'))fail();validateCoachData(r.coaching,r.chain||[],false);if(r.opponentIdentity&&(!obj(r.opponentIdentity)||Object.entries(r.opponentIdentity).some(([i,id])=>!/^\d+$/.test(i)||r.chain?.[Number(i)]?.side!=='Gegner'||typeof id!=='string'||!m.opponentTeam?.roster?.[id])))fail()};
 m.rallies.forEach(rally);m.sets.forEach(s=>{if(!obj(s)||!Number.isInteger(s.set)||s.set<1||s.set>5||!Array.isArray(s.rallies)||![s.e,s.o].every(n=>Number.isInteger(n)&&n>=0))fail();s.rallies.forEach(rally)});
 if(m.roles&&(!obj(m.roles)||Object.values(m.roles).some(r=>!ROLES.includes(r))))fail();
 if(m.liberoIds&&(!Array.isArray(m.liberoIds)||m.liberoIds.some(id=>!byId(id))||new Set(m.liberoIds).size!==m.liberoIds.length||m.liberoIds.length>2))fail();
 const xy=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=100);
 const map=(o,check)=>{if(o!==undefined&&(!obj(o)||Object.values(o).some(v=>!check(v))))fail()};
 for(const key of ['started','serving','setEnded','matchEnded'])if(typeof m[key]!=='boolean')fail();
 if(m.liberoActive&&(!m.liberoIds?.includes(m.liberoOnCourt)||!m.lineup.includes(m.liberoReplacedId)||m.lineup.includes(m.liberoOnCourt)))fail();
 map(m.jerseyNumbers,n=>typeof n==='string'&&/^\d{1,5}$/.test(n));if(m.jerseyNumbers&&Object.keys(m.jerseyNumbers).some(id=>!byId(id)))fail();
 map(m.tacticPositions,xy);map(m.opponentPositions,xy);
 map(m.hybridFormations,f=>obj(f)&&obj(f.targets)&&obj(f.routes)&&Object.values(f.targets).every(xy)&&Object.values(f.routes).every(path=>Array.isArray(path)&&path.every(xy)));
 if(m.matchPlan!==undefined)validatePlan(m.matchPlan);map(m.matchPlanTemplates,p=>validatePlan(p));
 map(m.formationBook,validFormation);
 map(m.defenseStandards,f=>f===null||validFormation(f)&&Object.keys(f.targets).length===6&&!f.base&&!f.opponents);if(m.defenseStandards&&Object.keys(m.defenseStandards).some(k=>!DEFENSE_KINDS.includes(k)))fail();
 map(m.formationTemplates,t=>obj(t)&&Number.isInteger(t.rotation)&&t.rotation>=1&&t.rotation<=6&&Number.isInteger(t.opponentRotation)&&t.opponentRotation>=1&&t.opponentRotation<=6&&FORMATION_KINDS.includes(t.kind)&&['base','tactical'].includes(t.stance)&&(t.scope===undefined||['rotation','standard'].includes(t.scope))&&validFormation(t.formation));
 map(m.sixBoards,b=>obj(b)&&obj(b.players)&&Array.isArray(b.pins)&&Object.values(b.players).every(xy)&&b.pins.every(xy));
 map(m.receivePlans,ids=>Array.isArray(ids)&&ids.every(id=>!!byId(id)));
 // Undo snapshots become live state. Validate their contents as strictly as the
 // enclosing match before accepting an import or restoring local storage.
 for(const u of m.rallyUndo){
  if(!obj(u)||Object.prototype.hasOwnProperty.call(u,'rallyUndo')||![u.e,u.o].every(n=>Number.isInteger(n)&&n>=0)||!Array.isArray(u.lineup)||u.lineup.length!==6||new Set(u.lineup).size!==6||u.lineup.some(id=>!byId(id)))fail();
  const prior={...m,...u,rallyUndo:[]};for(const key of ['teamControl','opponentTeam','teamUndo'])if(!Object.prototype.hasOwnProperty.call(u,key))delete prior[key];validateMatch(prior);
 }
 for(const mark of m.marks)if(!obj(mark)||![mark.x,mark.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1))fail();
 map(m.startPresets,p=>obj(p)&&Array.isArray(p.lineup)&&p.lineup.length===6&&new Set(p.lineup).size===6&&p.lineup.every(id=>!!byId(id))&&obj(p.roles)&&p.lineup.every(id=>ROLES.includes(p.roles[id]))&&Array.isArray(p.liberoIds)&&p.liberoIds.every(id=>!!byId(id)));
 const visit=(v,depth=0)=>{if(depth>80)fail();if(v&&typeof v==='object'){for(const k of Object.keys(v)){if(['__proto__','prototype','constructor'].includes(k))fail();visit(v[k],depth+1)}}};visit(m);
 validateMasterData(m);return true;
}
function validateOpponent(o){if(o&&Object.keys(o).some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Ungültige Gegnerdaten');if(!o||typeof o.name!=='string'||!Array.isArray(o.receivers)||o.receivers.some(x=>typeof x!=='string')||(o.liberos&&(!Array.isArray(o.liberos)||o.liberos.some(x=>typeof x!=='string'))))throw Error('Ungültige Gegnerdaten');if(o.courtAnchor){const a=o.courtAnchor;if(!Number.isInteger(a.set)||a.set<1||a.set>5||!Number.isInteger(a.rotation)||a.rotation<1||a.rotation>6||!Number.isInteger(a.sideouts)||a.sideouts<0||!a.positions||Object.keys(a.positions).length!==6||![1,2,3,4,5,6].every(p=>typeof a.positions[p]==='string'&&/^\d{1,5}$/.test(a.positions[p]))||new Set(Object.values(a.positions)).size!==6||typeof a.libero!=='string'||!/^\d{0,5}$/.test(a.libero)||!Number.isInteger(a.replaces)||a.replaces<0||a.replaces>6||!!a.libero!==!!a.replaces||a.libero&&Object.values(a.positions).includes(a.libero))throw Error('Ungültige Gegneraufstellung')}}
function validateRuntime(r){
 if(!r)return;
 const checkDraft=d=>{if(!d||typeof d!=='object'||Array.isArray(d)||d.chain&&(!Array.isArray(d.chain)||d.chain.some(x=>!x||typeof x.type!=='string'||!['EVV','Gegner'].includes(x.side))))throw Error('Ungültiger Rallyeentwurf');validateCoachData(d.coaching,d.chain||[],true)};
 checkDraft(r.draft);if(r.draftHistory&&(!Array.isArray(r.draftHistory)||r.draftHistory.length>30))throw Error('Ungültiger Entwurfsverlauf');for(const h of r.draftHistory||[])checkDraft(h.draft);
 if(r.pendingMark&&(!['EVV','Gegner'].includes(r.pendingMark.w)||!r.pendingMark.data||typeof r.pendingMark.data!=='object'||Array.isArray(r.pendingMark.data)))throw Error('Ungültiger Zielpunkt');
 if(r.pendingMark)validateCoachData(r.pendingMark.data.coaching,r.pendingMark.data.chain||[],true);
 if(r.view!==undefined&&!['live','match',1,2,3,4,5].includes(r.view))throw Error('Ungültige Ansicht');
}
function turnaroundAnalysis(rr){
 const x={observed:0,incomplete:0,kills:0,attackingRallies:0,firstAttackKill:0,killByTwo:0,killByThree:0,chances:0,transitionRallies:0,transitionKills:0,transitionPoints:0,chancesWithoutAttack:0,multipleTransitions:0,blockPoints:0,opponentErrors:0,attacksToKill:[]};
 for(const r of rr){const ids=new Set(),ch=(r.chain||[]).filter(c=>{if(!c.id)return true;if(ids.has(c.id))return false;ids.add(c.id);return true}),complete=r.observationComplete===true||(r.observationComplete!==false&&ch.length>0&&r.event!=='Quick'&&r.event!=='VoiceQuick');if(!complete)x.incomplete++;else x.observed++;
 let attacks=0,chances=0,open=false,attacked=false;
 for(const c of ch){if(c.side!=='EVV')continue;
 if(c.type==='TransitionChance'||c.type==='Defense'&&['D2','D3'].includes(c.quality)){if(open&&!attacked)x.chancesWithoutAttack++;chances++;open=true;attacked=false}
 if(c.type==='Attack'){attacks++;if(open)attacked=true}
 }
 if(open&&!attacked)x.chancesWithoutAttack++;
 const kill=r.winner==='EVV'&&ch.some(c=>c.side==='EVV'&&c.type==='Attack'&&['KILL','BLOCK_OUT'].includes(c.result));
 if(attacks&&complete)x.attackingRallies++;
 if(kill){x.kills++;x.attacksToKill.push(attacks);if(complete&&attacks===1)x.firstAttackKill++;if(complete&&attacks<=2)x.killByTwo++;if(complete&&attacks<=3)x.killByThree++;if(open&&attacked)x.transitionKills++}
 if(ch.some(c=>c.side==='EVV'&&c.type==='Block'&&c.result==='BLOCK')&&r.winner==='EVV')x.blockPoints++;
 if(r.winner==='EVV'&&(['OpponentAttack','OpponentSecondBall'].includes(r.event)&&r.result==='ERROR'||['OpponentReception','OpponentDefense'].includes(r.event)&&r.result==='DIRECT_ERROR'))x.opponentErrors++;
 x.chances+=chances;if(chances)x.transitionRallies++;if(chances>1)x.multipleTransitions++;if(chances&&r.winner==='EVV')x.transitionPoints++;
 }
 x.killByTwoRate=x.attackingRallies?100*x.killByTwo/x.attackingRallies:null;x.killByThreeRate=x.attackingRallies?100*x.killByThree/x.attackingRallies:null;
 x.firstAttackKillRate=x.attackingRallies?100*x.firstAttackKill/x.attackingRallies:null;
 x.transitionKillRate=x.chances?100*x.transitionKills/x.chances:null;x.transitionPointRate=x.transitionRallies?100*x.transitionPoints/x.transitionRallies:null;
 x.transitionConversionRate=x.chances?100*x.transitionPoints/x.chances:null;
 return x;
}
// Trainer cockpit: projections of existing match events; presentation never writes match data.
const cockpitDefaults={minimum:8,hysteresis:5,k1:{red:40,green:60},k2:{red:20,green:40},reception:{red:45,green:65},attack:{red:25,green:45},first:{red:25,green:45},transition:{red:20,green:40}};
let cockpitPreferences={theme:'dark',thresholds:clone(cockpitDefaults)};
try{const p=JSON.parse(localStorage.getItem('evvQuickScoutCockpitPreferences')||'null');if(p){if(['auto','light','dark'].includes(p.theme))cockpitPreferences.theme=p.theme;const c=p.thresholds;if(c&&Number.isInteger(c.minimum)&&c.minimum>=5&&c.minimum<=50&&Number.isFinite(c.hysteresis)&&c.hysteresis>=0&&c.hysteresis<=15&&['k1','k2','reception','attack','first','transition'].every(k=>c[k]&&Number.isFinite(c[k].red)&&Number.isFinite(c[k].green)&&c[k].red>=0&&c[k].red<c[k].green&&c[k].green<=100))cockpitPreferences.thresholds=clone(c)}}catch(e){}
function cockpitTheme(){document.documentElement.dataset.theme=cockpitPreferences.theme}
function cockpitRatio(n,d){return {numerator:n,denominator:d,percent:d?100*n/d:null}}
function cockpitMetrics(rr){
 const rows=statRowsFrom(rr),sum=k=>rows.reduce((s,x)=>s+x[k],0),k1=rr.filter(r=>r.phase==='K1'),k2=rr.filter(r=>r.phase==='K2'),wins=rr=>rr.filter(r=>r.winner==='EVV').length,t=turnaroundAnalysis(rr);
 return {k1:cockpitRatio(wins(k1),k1.length),k2:cockpitRatio(wins(k2),k2.length),reception:cockpitRatio(sum('a2')+sum('a3'),sum('rec')),attack:cockpitRatio(sum('kill'),sum('att')),first:cockpitRatio(t.firstAttackKill,t.attackingRallies),transition:cockpitRatio(t.transitionKills,t.chances),turnaround:t};
}
function cockpitFilter(rr,{scope='live',set=st.set,detailSet=0,rotation=0,phase='all'}={}){return rr.filter(r=>(detailSet?r.set===Number(detailSet):scope==='live'?r.set===set:true)&&(!rotation||r.rotation===Number(rotation))&&(phase==='all'||r.phase===phase))}
function rotationSignal(rr,phase,cfg=cockpitPreferences.thresholds){
 const rows=rr.filter(r=>r.phase===phase);let status='neutral',wins=0;
 rows.forEach((r,i)=>{wins+=r.winner==='EVV'?1:0;if(i+1<cfg.minimum)return;const p=100*wins/(i+1),c=cfg[phase==='K1'?'k1':'k2'],h=cfg.hysteresis;
 if(status==='neutral')status=p<c.red?'red':p>=c.green?'green':'amber';
 else if(status==='red'){if(p>=c.green+h)status='green';else if(p>=c.red+h)status='amber'}
 else if(status==='green'){if(p<c.red-h)status='red';else if(p<c.green-h)status='amber'}
 else if(p<c.red-h)status='red';else if(p>=c.green+h)status='green';
 });return {...cockpitRatio(wins,rows.length),status,phase};
}
const cockpitStatus={neutral:'○ Daten fehlen',red:'! Handlungsbedarf',amber:'△ Beobachten',green:'✓ Stabil'};
function metricCard(key,label,m,action=''){const tag=action?'button':'article',c=cockpitPreferences.thresholds[key],status=m.denominator<cockpitPreferences.thresholds.minimum?'neutral':m.percent<c.red?'red':m.percent>=c.green?'green':'amber';return `<${tag} ${action?`type="button" id="${action}"`:""} class="metricCard ${status}" data-metric="${key}"><span>${esc(label)}</span><strong>${m.percent===null?'–':m.percent.toFixed(1)+'%'}</strong><small>${m.numerator} / ${m.denominator}</small><em>${cockpitStatus[status]}</em></${tag}>`}
function cockpitHints(m){const hints=[];for(const [key,label] of [['k1','K1: Annahme und ersten Angriff prüfen.'],['k2','K2: Aufschlag und Anschlussabwehr prüfen.'],['reception','Annahmeriegel und gegnerische Aufschlagziele prüfen.']])if(m[key].denominator>=cockpitPreferences.thresholds.minimum&&m[key].percent<cockpitPreferences.thresholds[key].red)hints.push(label);if(m.turnaround.chancesWithoutAttack&&hints.length<3)hints.push(`${m.turnaround.chancesWithoutAttack} Chancen ohne Angriff: Anschlusszuspiel prüfen.`);return hints.slice(0,3)}
function cockpitDashboard(host,prefix='analysis',initial={}){
 const state={scope:'live',rotation:0,detailSet:0,phase:'all',...initial},id=s=>prefix+s;
 host.innerHTML=`<section class="trainerDashboard"><div class="cockpitHeading"><div><span class="eyebrow">TRAINER COCKPIT</span><h2>Analyse</h2></div><button type="button" id="${id('Settings')}">Darstellung &amp; Ampel</button></div><nav class="scopeTabs" aria-label="Analysebereich">${[['live','LIVE'],['match','MATCH'],['rotations','ROTATIONEN']].map(([s,l])=>`<button data-scope="${s}">${l}</button>`).join('')}</nav><p class="cockpitContext" id="${id('Context')}"></p><div id="${id('Results')}"></div><p id="${id('Draft')}" class="draftNotice"></p><details id="${id('Details')}"><summary>Details &amp; Filter</summary><div class="grid3"><label>Satz<select id="${id('Set')}"><option value="0">Ansicht verwenden</option>${[1,2,3,4,5].map(n=>`<option>${n}</option>`).join('')}</select></label><label>Rotation<select id="${id('Rot')}"><option value="0">Alle</option>${[1,2,3,4,5,6].map(n=>`<option>${n}</option>`).join('')}</select></label><label>Phase<select id="${id('Phase')}"><option value="all">K1 + K2</option><option>K1</option><option>K2</option></select></label></div><p class="small">Abgeschlossene Rallyes bilden die Quoten. Grau: weniger als ${cockpitPreferences.thresholds.minimum} relevante Beobachtungen. Konfigurierbare Coaching-Grenzen, keine Leistungsnorm. Nicht beobachtete Kontakte werden nicht ergänzt.</p><div id="${id('Definitions')}"></div><p id="${id('FormationHint')}"></p><label>Formationskontext<select id="${id('FormationKind')}"><option value="receive">K1 · Annahme</option><option value="defense-IV">K2 · Abwehr IV</option><option value="defense-III">K2 · Abwehr III</option><option value="defense-II">K2 · Abwehr II</option><option value="defense-I">Abwehr Hinterfeld I</option></select></label><div class="grid2"><button id="${id('Tactics')}">Taktik anzeigen</button><button id="${id('Formation')}">Trainer-Editor</button></div></details></section>`;
 const q=s=>host.querySelector('#'+id(s));
 function draw(){
 const rr=cockpitFilter(allRallies(),{...state,set:st.set}),m=cockpitMetrics(rr),t=m.turnaround;
 host.querySelectorAll('[data-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scope===state.scope)));
 q('Context').textContent=`${state.scope==='live'?'LIVE · Satz '+st.set:state.scope==='match'?'MATCH · alle Sätze':'ROTATIONEN · gesamtes Match'} · ${rr.length} abgeschlossene Rallyes${state.rotation?' · R'+state.rotation:''}${state.phase!=='all'?' · '+state.phase:''}`;
 const cards=[['k1','K1 · Sideout'],['k2','K2 · Breakpoint'],['reception','Annahme positiv'],['attack','Angriff · Killquote'],['first','First-Attack-Kill'],['transition','Transition-Killquote']].map(([k,l])=>metricCard(k,l,m[k])).join('');
 const hints=cockpitHints(m),rate=(n,d)=>d?(100*n/d).toFixed(1)+'%':'–';
 q('Results').innerHTML=`<div class="metricGrid">${cards}</div>${state.scope==='rotations'?`<div class="rotationGrid">${[1,2,3,4,5,6].map(r=>{const x=cockpitMetrics(rr.filter(x=>x.rotation===r));return `<button class="rotationCard" data-rotation-card="${r}"><b>R${r}</b><span>K1 ${rate(x.k1.numerator,x.k1.denominator)} · ${x.k1.numerator}/${x.k1.denominator}</span><span>K2 ${rate(x.k2.numerator,x.k2.denominator)} · ${x.k2.numerator}/${x.k2.denominator}</span><small>Analyse &amp; Taktik öffnen →</small></button>`}).join('')}</div>`:''}<section class="turnaroundCard"><h3>Turnaround</h3><div class="turnGrid">${[['Transition-Chancen',t.chances],['Transition-Kills',t.transitionKills],['Transition-Killquote',rate(t.transitionKills,t.chances),`${t.transitionKills}/${t.chances} Chancen`],['Transition-Punktquote',rate(t.transitionPoints,t.transitionRallies),`${t.transitionPoints}/${t.transitionRallies} Rallyes mit Chance`],['Chancen ohne Angriff',t.chancesWithoutAttack],['Mehrfach-Transition-Rallyes',t.multipleTransitions],['First-Attack-Kill',rate(t.firstAttackKill,t.attackingRallies),`${t.firstAttackKill}/${t.attackingRallies} Angriffsrallyes`],['Kill bis Angriff 2',rate(t.killByTwo,t.attackingRallies),`${t.killByTwo}/${t.attackingRallies} Angriffsrallyes`],['Kill bis Angriff 3',rate(t.killByThree,t.attackingRallies),`${t.killByThree}/${t.attackingRallies} Angriffsrallyes`]].map(([l,v,d],i)=>`<div data-turn="${['chances','kills','killRate','pointRate','withoutAttack','multiple','first','byTwo','byThree'][i]}"><span>${l}</span><b>${v}</b>${d?`<small>${d}</small>`:''}</div>`).join('')}</div><p class="observationNote">${t.observed} vollständig · ${t.incomplete} unvollständig beobachtet</p></section><ul class="coachingHints">${hints.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>`;
 q('Draft').textContent=draft.chain?.length?`Aktuelle Rallye · eigene Angriffe ${turnaroundMetrics(draft.chain).attacks} · Transition-Chancen ${turnaroundMetrics(draft.chain).transitions} · noch nicht in den Quoten enthalten`:'Keine laufende Rallye';
 q('Definitions').textContent=`FAK und kumulative Killquoten: vollständig beobachtete Rallyes mit eigenem Angriff. Transition-Killquote: Kills / kontrollierte Chancen. Punktquote: gewonnene Rallyes mit Chance / Rallyes mit Chance. Chancenbezogene Verwertung ${rate(t.transitionPoints,t.chances)} (${t.transitionPoints}/${t.chances}); Blockpunkte ${t.blockPoints}, Gegnerfehler ${t.opponentErrors}.`;
 q('Formation').disabled=q('Tactics').disabled=!state.rotation;q('FormationHint').textContent=state.rotation?`R${state.rotation} · Vorschau verändert keine Live-Rotation`:'Rotation für eine gezielte Vorschau auswählen.';
 host.querySelectorAll('[data-rotation-card]').forEach(b=>b.onclick=()=>rotationCoaching(Number(b.dataset.rotationCard),{rallies:rr.filter(r=>r.rotation===Number(b.dataset.rotationCard)),scopeState:{...state},label:state.scope==='live'?'Satz '+st.set:'MATCH · gewählte Filter'}));
 }
 host.querySelectorAll('[data-scope]').forEach(b=>b.onclick=()=>{Object.assign(state,{scope:b.dataset.scope,rotation:0,detailSet:0,phase:'all'});q('Rot').value='0';q('Set').value='0';q('Phase').value='all';draw()});
 for(const [field,key] of [['Set','detailSet'],['Rot','rotation'],['Phase','phase']])q(field).onchange=()=>{state[key]=field==='Phase'?q(field).value:Number(q(field).value);draw()};
 q('Formation').onclick=()=>formationEditor(state.rotation,q('FormationKind').value);q('Tactics').onclick=()=>matchTactics(state.rotation,q('FormationKind').value);q('Settings').onclick=cockpitSettings;
 q('Rot').value=state.rotation;q('Set').value=state.detailSet;q('Phase').value=state.phase;if(state.rotation||state.detailSet||state.phase!=='all')q('Details').open=true;draw();const modalBox=host.closest('.modalbox');if(modalBox)modalBox.scrollTop=0;
}
function analysisPanel(initial={}){modal('<button id="analysisClose" class="dialogClose" aria-label="Analyse schließen">×</button><div class="grid3 analysisLinks"><button id="analysisGoCoach">Coach-Übersicht</button><button id="analysisGoStats">Spielerstatistik</button><button id="analysisGoOpponent">Gegneranalyse</button></div><div id="analysisHost"></div>');cockpitDashboard($('analysisHost'),'analysis',initial);$('analysisClose').onclick=closeModal;for(const [id,next]of [['analysisGoCoach','coach'],['analysisGoStats','stats'],['analysisGoOpponent','opponent']])$(id).onclick=()=>{closeModal();tab=next;render()}}

function cockpitSettings(){
 const c=cockpitPreferences.thresholds;
 modal(`<h2>Darstellung &amp; Rotationsampel</h2><label>Darstellung<select id="cockpitTheme"><option value="auto">System</option><option value="light">Hell</option><option value="dark">Dunkel</option></select></label><label>Leistungsprofil<select id="signalPreset"><option value="custom">Eigene Grenzen</option><option value="development">Entwicklung</option><option value="club">Verein</option><option value="performance">Leistung</option></select></label><div class="grid2"><label>Mindestens Beobachtungen<input id="signalMinimum" type="number" min="5" max="50" value="${c.minimum}"></label><label>Stabilitätsabstand in Prozentpunkten<input id="signalHysteresis" type="number" min="0" max="15" value="${c.hysteresis}"></label></div><div class="thresholdGrid">${[['k1','K1'],['k2','K2'],['reception','Annahme'],['attack','Angriff'],['first','FAK'],['transition','Transition']].map(([k,l])=>`<label>${l} · Rot unter<input id="${k}Red" type="number" min="0" max="99" value="${c[k].red}"></label><label>${l} · Grün ab<input id="${k}Green" type="number" min="1" max="100" value="${c[k].green}"></label>`).join('')}</div><p class="small">Coaching-Orientierung, keine normierten Leistungsgrenzen. K1 und K2 werden getrennt bewertet. Nach dem ersten Status gilt der Stabilitätsabstand für Wechsel; Undo berechnet aus den verbleibenden Rallyes neu.</p><div class="grid2"><button id="signalCancel">Abbrechen</button><button id="signalSave" class="primary">Übernehmen</button></div>`);
 $('cockpitTheme').value=cockpitPreferences.theme;
 $('signalPreset').onchange=()=>{const offset={development:-10,club:0,performance:10}[$('signalPreset').value];if(offset===undefined)return;for(const k of ['k1','k2','reception','attack','first','transition']){$(k+'Red').value=Math.max(0,cockpitDefaults[k].red+offset);$(k+'Green').value=Math.min(100,cockpitDefaults[k].green+offset)}};
 $('signalCancel').onclick=closeModal;$('signalSave').onclick=()=>{const minimum=Number($('signalMinimum').value),hysteresis=Number($('signalHysteresis').value),next={minimum,hysteresis};for(const k of ['k1','k2','reception','attack','first','transition'])next[k]={red:Number($(k+'Red').value),green:Number($(k+'Green').value)};if(!Number.isInteger(minimum)||minimum<5||minimum>50||!Number.isFinite(hysteresis)||hysteresis<0||hysteresis>15||Object.entries(next).some(([k,v])=>typeof v==='object'&&(!Number.isFinite(v.red)||!Number.isFinite(v.green)||v.red<0||v.red>=v.green||v.green>100)))return toast('Grenzen prüfen: 0 ≤ Rot < Grün ≤ 100');cockpitPreferences={theme:$('cockpitTheme').value,thresholds:next};try{localStorage.setItem('evvQuickScoutCockpitPreferences',JSON.stringify(cockpitPreferences))}catch(e){toast('Darstellung nur für diese Sitzung gespeichert')}cockpitTheme();closeModal();render()};
}
function rotationCoaching(rotation=st.rot,context=null){
 const rr=context?.rallies||allRallies().filter(r=>r.set===st.set&&r.rotation===rotation),m=cockpitMetrics(rr),phase=st.serving?'K2':'K1',signal=rotationSignal(rr,phase),hints=cockpitHints(m);
 modal(`<section class="rotationCoaching"><span class="eyebrow">${esc(context?.label||'SATZ '+st.set)} · ${context||rotation!==st.rot?'ANALYSE / VORSCHAU':'LIVE'}</span><h2>Rotation R${rotation}</h2><p class="signalStatus ${signal.status}">${phase}: ${cockpitStatus[signal.status]} · ${signal.numerator}/${signal.denominator}</p><div class="metricGrid">${[['k1','K1 · Sideout'],['k2','K2 · Breakpoint'],['reception','Annahme positiv'],['attack','Angriff · Killquote']].map(([k,l])=>metricCard(k,l,m[k],k==='k1'?'rotationK1Tactics':k==='k2'?'rotationK2Tactics':'')).join('')}</div><p>${esc(hints[0]||'Daten sammeln; keine belastbare Auffälligkeit.')}</p><div class="grid2"><button id="rotationAnalysis">Analyse</button><button id="rotationTactics" class="primary">Taktik anzeigen · ${phase}</button></div><button id="rotationClose">Schließen</button></section>`);
 $('rotationAnalysis').onclick=()=>analysisPanel({...context?.scopeState,rotation});$('rotationTactics').onclick=()=>matchTactics(rotation,phase==='K1'?'receive':'defense-IV');$('rotationK1Tactics').onclick=()=>matchTactics(rotation,'receive');$('rotationK2Tactics').onclick=()=>matchTactics(rotation,'defense-IV');$('rotationClose').onclick=closeModal;
}
const DEFENSE_KINDS=['defense-IV','defense-II','defense-III','defense-I'];
const FORMATION_KINDS=['receive',...DEFENSE_KINDS];
function formationLabel(kind){return ({receive:'K1', 'defense-IV':'ABWEHR IV','defense-II':'ABWEHR II','defense-III':'ABWEHR III','defense-I':'ABWEHR HINTERFELD I'})[kind]||kind}
const DEFENSE_TASKS={
 'defense-IV':{1:'line',2:'block',3:'block',4:'short',5:'diagonal',6:'shadow-long'},
 'defense-II':{1:'diagonal',2:'short',3:'block',4:'block',5:'line',6:'shadow-long'},
 'defense-III':{1:'shadow-edge',2:'short',3:'block',4:'short',5:'shadow-edge',6:'deep-P5'},
 'defense-I':{1:'angle',2:'short',3:'block',4:'block',5:'angle',6:'angle'}
};
const DEFENSE_TASK_LABELS={block:'Block',short:'Nahsicherung',line:'Linie',diagonal:'Diagonale','shadow-long':'Blockschatten / lang','shadow-edge':'Blockschattenrand','deep-P5':'Tief hinter P5',angle:'Feldabwehr · Winkel'};
function builtinDefense(kind){
 const iv={1:[93,72],2:[82,7],3:[65,7],4:[22,33],5:[24,65],6:[57,88]},mirror={1:5,2:4,3:3,4:2,5:1,6:6};
 const targets=kind==='defense-IV'?iv:kind==='defense-II'?Object.fromEntries(Object.entries(iv).map(([p,[x,y]])=>[mirror[p],[100-x,y]])):kind==='defense-III'?{1:[63,61],2:[78,32],3:[50,7],4:[22,32],5:[37,61],6:[32,89]}:kind==='defense-I'?{1:[79,67],2:[78,33],3:[35,7],4:[18,7],5:[17,70],6:[47,89]}:null;
 return targets?{targets,routes:{},ballPaths:[],assignment:'roles',proposal:true,attackOrigin:({'defense-IV':[85,32],'defense-II':[15,32],'defense-III':[50,32],'defense-I':[20,20]})[kind]}:null;
}
function defenseStandard(kind){if(!DEFENSE_KINDS.includes(kind))return null;return clone(Object.prototype.hasOwnProperty.call(st.defenseStandards||{},kind)?st.defenseStandards[kind]:builtinDefense(kind))}
function saveDefenseStandard(kind,f){
 if(!DEFENSE_KINDS.includes(kind)||f!==null&&(!validFormation(f)||Object.keys(f.targets).length!==6||f.base||f.opponents))throw Error('EVV-Standard: sechs eigene Ziele und gültige Wege erforderlich');
 const previous=st.defenseStandards;st.defenseStandards={...previous,[kind]:f===null?null:clone({...f,assignment:'roles'})};
 if(!saveLocal()){if(previous)st.defenseStandards=previous;else delete st.defenseStandards;throw Error('Standard nicht gespeichert · bitte exportieren')}return true;
}
function hasOwnTactics(f){return !!(Object.keys(f?.targets||{}).length||Object.keys(f?.routes||{}).length||f?.ballPaths?.length||Object.keys(f?.attacks||{}).length||f?.arrows?.length)}
function formationSource(rotation,kind){const f=st.formationBook?.[`${rotation}:${kind}`];return hasOwnTactics(f)?'rotation':st.teamDefaults?.[teamDefaultKey('EVV',rotation,kind)]?'team':defenseStandard(kind)?'standard':kind==='receive'&&builtinK1(rotation)?'k1-standard':'neutral'}
// Task slots are tactical field zones, never new legal rotation positions.
function tacticalPlayers(rotation,kind,data){
 const players=formationPlayers(rotation,kind==='receive'?false:st.serving),mapping=Object.fromEntries(players.map(p=>[p.id,p.pos]));let assignmentNote='';
 if(data.assignment==='roles'){
  const front=players.filter(p=>[2,3,4].includes(p.pos)),back=players.filter(p=>[1,5,6].includes(p.pos));
  if(front.filter(p=>/^MB/.test(roleOf(p.id))).length!==1){assignmentNote='Rollenaufstellung nicht eindeutig · Regelplätze verwendet'}else{
   const cost=(p,slot)=>{const role=roleOf(p.id),lib=st.liberoIds.includes(p.id);return (slot===3?(/^MB/.test(role)?0:100):slot===4?(/^AA/.test(role)?0:10):slot===2?(['Z','D'].includes(role)?0:10):slot===5?(lib?0:/^MB/.test(role)?2:30):slot===1?(role==='Z'?0:role==='D'?1:/^AA/.test(role)?5:20):/^AA/.test(role)?0:role==='D'?3:role==='Z'?5:20)+Math.abs(p.pos-slot)/100};
   const assign=(group,slots)=>{const perms=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];let best=null,score=Infinity;for(const order of perms){const n=slots.reduce((sum,slot,i)=>sum+cost(group[order[i]],slot),0);if(n<score){score=n;best=order}}slots.forEach((slot,i)=>mapping[group[best[i]].id]=slot)};
   assign(front,[2,3,4]);assign(back,[1,5,6]);
  }
 }
 return {assignmentNote,players:players.map(p=>({...p,rulePosition:p.pos,tacticalPosition:mapping[p.id],playerId:p.id,role:roleOf(p.id),task:DEFENSE_TASKS[kind]?.[mapping[p.id]]||''}))};
}
function defenseShadow(data,kind){
 const slots=Object.entries(DEFENSE_TASKS[kind]||{}).filter(([,t])=>t==='block').map(([p])=>Number(p));if(!slots.length)return [];
 const origin=data.attackOrigin||builtinDefense(kind).attackOrigin,[ax,ay]=[origin[0],(origin[1]-50)*2],points=slots.map(p=>data.targets[p]||formationDefaults[p]),y=Math.min(...points.map(p=>p[1])),left=Math.max(0,Math.min(...points.map(p=>p[0]))-4),right=Math.min(100,Math.max(...points.map(p=>p[0]))+4),project=x=>Math.max(0,Math.min(100,ax+(x-ax)*(100-ay)/Math.max(1,y-ay)));
 return [[left,50+y/2],[right,50+y/2],[project(right),100],[project(left),100]];
}

function cockpitFormation(rotation=st.rot,kind='receive'){
 const data=formationFor(rotation,kind),assignment=tacticalPlayers(rotation,kind,data);return {rotation,kind,data,source:formationSource(rotation,kind),assignmentNote:assignment.assignmentNote,configured:Object.keys(data.targets).length>0,players:assignment.players.map(p=>({...p,name:nm(p.id),number:jersey(p.id),libero:st.liberoIds.includes(p.id),xy:data.targets[p.tacticalPosition]||null}))};
}
function opponentSideouts(){return st.rallies.filter(r=>r.winner==='Gegner'&&r.servingBefore===true).length}
function cockpitOpponentLegacy(previewRotation=0){
 const a=opponent.courtAnchor,liveSteps=a&&a.set===st.set?opponentSideouts()-a.sideouts:0,configured=!!a&&a.set===st.set&&liveSteps>=0,steps=configured&&previewRotation?(previewRotation-a.rotation+6)%6:liveSteps;
 return {configured,rotation:configured?(a.rotation-1+steps)%6+1:null,players:[1,2,3,4,5,6].map(slot=>{let pos=slot;if(configured)for(let i=0;i<steps%6;i++)pos=pos===1?6:pos-1;const lib=configured&&a.libero&&a.replaces===slot&&[1,5,6].includes(pos)&&!(pos===1&&!st.serving);return {slot,pos,number:configured?a.positions[slot]:'',libero:false}})};
}
function cockpitOpponent(previewRotation=0){if(!st.opponentTeam)return cockpitOpponentLegacy(previewRotation);const t=teamState('Gegner',previewRotation);return {configured:t.configured,rotation:t.rotation,players:t.players.map(p=>({...p,slot:p.slot,number:p.number}))}}
function matchTactics(rotation=st.rot,kind=st.serving?'defense-IV':'receive',initialTactical=true,initialOpponent=0){
 let selectedRotation=rotation,selectedKind=kind,tactical=initialTactical,follow=rotation===st.rot,opponentPreview=initialOpponent,showTasks=false,opponentKind='auto';
 modal(`<div class="matchTactics"><div class="cockpitHeading"><div><span class="eyebrow">TAKTIK</span><h2>Spielbetrieb</h2></div><button id="tacticsPresent">Vergrößern</button><button id="tacticsClose">Schließen</button></div><div class="scopeTabs"><button id="tacticsFollow">Live folgen</button><label>Rotationsvorschau<select id="tacticsRotation">${[1,2,3,4,5,6].map(r=>`<option>${r}</option>`).join('')}</select></label></div><label class="opponentPreview">Gegnerrotation<select id="tacticsOpponentRotation"><option value="0">Live folgen</option>${[1,2,3,4,5,6].map(r=>`<option value="${r}">Vorschau R${r}</option>`).join('')}</select></label><details class="opponentKindDetails"><summary>Gegnerformation · optional</summary><select id="tacticsOpponentKind"><option value="auto">Passend zur EVV-Phase</option>${FORMATION_KINDS.map(k=>`<option value="${k}">${formationLabel(k)}</option>`).join('')}</select></details><nav class="formationTabs">${FORMATION_KINDS.map(k=>[k,formationLabel(k)]).map(([k,l])=>`<button data-formation-kind="${k}">${l}</button>`).join('')}</nav><div class="scopeTabs"><button id="tacticsBase">Ausgangsstellung</button><button id="tacticsTarget">Taktische Stellung</button></div><button id="tacticsTasks" aria-pressed="false">Aufgaben &amp; Abwehrbereiche</button><p id="tacticsContext"></p><div id="tacticsLegend"></div><div id="matchCourt"></div><div class="tacticsFooter"><button id="tacticsEdit">Trainer-Editor</button><button id="tacticsOpponent">Gegner aufstellen</button><button id="tacticsOwnNumbers">EVV-Nummern</button><button id="tacticsOwnLineup">Startsechs</button><button id="tacticsOwnLibero">EVV · L1/L2</button><button id="tacticsOppLibero">Gegner · L1/L2</button><button id="tacticsTeamUndo">Teamaktion zurück</button><button id="tacticsLegacy">Altvorlagen übernehmen</button></div></div>`);
 function draw(){const b=cockpitFormation(selectedRotation,selectedKind),opp=cockpitOpponent(opponentPreview),defaults=formationDefaults;const own=tactical?b.data:b.data.base||emptyFormation(),enemyRoot=b.data.opponents?.[opp.rotation],enemy=(tactical?enemyRoot:enemyRoot?.base)||emptyFormation();$('tacticsOpponentRotation').value=opponentPreview;
 $('tacticsRotation').value=selectedRotation;$('tacticsFollow').setAttribute('aria-pressed',String(follow));$('tacticsBase').setAttribute('aria-pressed',String(!tactical));$('tacticsTarget').setAttribute('aria-pressed',String(tactical));document.querySelectorAll('[data-formation-kind]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.formationKind===selectedKind)));
 $('tacticsContext').textContent=`${follow?'LIVE':'VORSCHAU'} · EVV R${selectedRotation} · ${selectedKind==='receive'?'K1 · Annahme':formationLabel(selectedKind)} · ${b.source==='k1-standard'?'5:1-Standard · Läufer '+(laeufer('EVV',selectedRotation)?.label||'?')+' · ':b.source==='team'?'Teamstandard · ':b.source==='standard'?'EVV-Standard · ':b.source==='rotation'?'Rotationsanpassung'+(b.data.assignment==='roles'?' · ':' · positionsgebunden · '):''}${b.data.proposal?'Editierbare Vorschlagswerte · ':''}${b.assignmentNote?b.assignmentNote+' · ':''}${tactical?(b.configured?Object.keys(b.data.targets).length===6?(['standard','k1-standard','team'].includes(b.source)?'gemeinsame Grundordnung':'Gespeicherte Formation'):'Teilformation · '+Object.keys(b.data.targets).length+'/6 Ziele':'Nicht eingerichtet · Regelpositionen angezeigt'):'Regelpositionen'}${opp.configured?' · Gegner '+(opponentPreview?'Vorschau ':'Live ')+'R'+opp.rotation:' · Gegner nicht eingerichtet'}`;
 $('tacticsLegend').innerHTML=showTasks&&tactical&&DEFENSE_KINDS.includes(selectedKind)?`<div class="defenseLegend">${b.players.slice().sort((a,b)=>a.tacticalPosition-b.tacticalPosition).map(p=>`<span><b>Zone P${p.tacticalPosition} · ${esc(DEFENSE_TASK_LABELS[p.task])}</b><small>#${esc(p.number)} ${esc(p.name)} · Regel-P${p.rulePosition} · ${esc(p.role)}</small></span>`).join('')}</div>`:'';
 $('matchCourt').innerHTML=boardView({rotation:selectedRotation,kind:selectedKind,tactical,opRotation:opponentPreview,opKind:opponentKind==='auto'?(selectedKind==='receive'?'defense-IV':'receive'):opponentKind,showTasks});bindBoardPlayers($('matchCourt'));


 }
 $('tacticsOpponentKind').onchange=()=>{opponentKind=$('tacticsOpponentKind').value;draw()};$('tacticsTasks').onclick=()=>{showTasks=!showTasks;$('tacticsTasks').setAttribute('aria-pressed',String(showTasks));draw()};$('tacticsOpponentRotation').onchange=()=>{opponentPreview=Number($('tacticsOpponentRotation').value);draw()};$('tacticsFollow').onclick=()=>{follow=true;selectedRotation=st.rot;draw()};$('tacticsRotation').onchange=()=>{selectedRotation=Number($('tacticsRotation').value);follow=false;draw()};document.querySelectorAll('[data-formation-kind]').forEach(b=>b.onclick=()=>{selectedKind=b.dataset.formationKind;draw()});$('tacticsBase').onclick=()=>{tactical=false;draw()};$('tacticsTarget').onclick=()=>{tactical=true;draw()};$('tacticsEdit').onclick=()=>formationEditor(selectedRotation,selectedKind,tactical?'tactical':'base',cockpitOpponent(opponentPreview).rotation||1,null,'rotation',opponentKind==='auto'?null:opponentKind);$('tacticsOpponent').onclick=editOpponentJerseys;$('tacticsOwnNumbers').onclick=editOwnNumbers;$('tacticsOwnLineup').onclick=masterOwnLineup;$('tacticsOwnLibero').onclick=()=>masterLiberoPanel('EVV');$('tacticsOppLibero').onclick=()=>masterLiberoPanel('Gegner');$('tacticsTeamUndo').onclick=()=>{if(undoTeamAction())matchTactics(selectedRotation,selectedKind,tactical)};$('tacticsLegacy').onclick=()=>legacySketchImport(selectedRotation,selectedKind);$('tacticsPresent').onclick=()=>{const on=$('modalBox').classList.toggle('presentation');$('tacticsPresent').textContent=on?'Verkleinern':'Vergrößern'};$('tacticsClose').onclick=closeModal;draw();
}
cockpitTheme();

const formationDefaults={1:[80,80],2:[80,25],3:[50,25],4:[20,25],5:[20,80],6:[50,80]};
function activeFormation(){const step=String(draft.step||''),defending=(!step&&st.serving)||step.startsWith('opp')||['evvDefense','evvBlockChoice','evvBlockResult'].includes(step);const lane=['IV','III','II','I'].includes(draft.setterTarget)?draft.setterTarget:'IV',kind=defending?'defense-'+lane:'receive';return {rotation:st.rot,kind,data:formationFor(st.rot,kind)}}
function formationFor(rotation,kind='receive'){
 const saved=st.formationBook?.[`${rotation}:${kind}`];if(hasOwnTactics(saved))return clone(saved);
 const team=st.teamDefaults?.[teamDefaultKey('EVV',rotation,kind)],standard=team||defenseStandard(kind);
 if(standard){const extra=clone(saved||{});for(const k of ['targets','routes','ballPaths','attacks','assignment','proposal','attackOrigin','arrows'])delete extra[k];return {...clone(standard),...extra}}
 const result=emptyFormation();if(kind==='receive'){const old=hybridFormation(rotation);for(const p of formationPlayers(rotation)){if(old.targets[p.id])result.targets[p.pos]=old.targets[p.id];if(old.routes[p.id])result.routes[p.pos]=old.routes[p.id]}if(hasOwnTactics(result))return clone(result);const k1=builtinK1(rotation);if(k1)return {...k1,...clone(saved||{})}}
 return clone(saved||result);
}
function emptyFormation(){return {targets:{},routes:{},ballPaths:[]}}
function validBaseFormation(targets){
 const t=Object.fromEntries([1,2,3,4,5,6].map(p=>[p,targets[p]||formationDefaults[p]]));
 return t[4][0]<t[3][0]&&t[3][0]<t[2][0]&&t[5][0]<t[6][0]&&t[6][0]<t[1][0]&&t[4][1]<t[5][1]&&t[3][1]<t[6][1]&&t[2][1]<t[1][1];
}
function validFormation(f,depth=0){
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x),point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=100),path=p=>Array.isArray(p)&&p.every(point),slots=(x,check)=>obj(x)&&Object.entries(x).every(([k,v])=>['1','2','3','4','5','6'].includes(k)&&check(v));
 if(depth>2||!obj(f)||Object.keys(f).some(k=>!['targets','routes','ballPaths','attacks','base','opponents','proposal','attackOrigin','assignment','arrows'].includes(k))||!slots(f.targets,point)||!slots(f.routes,path)||!Array.isArray(f.ballPaths)||!f.ballPaths.every(path)||f.attacks!==undefined&&!slots(f.attacks,path))return false;
 if(f.proposal!==undefined&&typeof f.proposal!=='boolean'||f.assignment!==undefined&&!['roles','positions'].includes(f.assignment)||f.attackOrigin!==undefined&&(!point(f.attackOrigin)||f.attackOrigin[1]>=50))return false;
 if(f.arrows!==undefined&&!validArrows(f.arrows))return false;
 if(f.base!==undefined&&(!validFormation(f.base,depth+1)||!validBaseFormation(f.base.targets)))return false;
 if(f.opponents!==undefined&&(!obj(f.opponents)||depth>0||!Object.entries(f.opponents).every(([r,v])=>['1','2','3','4','5','6'].includes(r)&&validFormation(v,depth+1))))return false;
 return true;
}
function saveFormation(rotation,kind,f){
 if(![1,2,3,4,5,6].includes(rotation)||!FORMATION_KINDS.includes(kind))throw Error('Ungültige Formation');
 if(!validFormation(f))throw Error('Ungültige Koordinaten');
 st.formationBook=st.formationBook||{};const key=`${rotation}:${kind}`,previous=st.formationBook[key];st.formationBook[key]=clone(f);if(!saveLocal()){if(previous)st.formationBook[key]=previous;else delete st.formationBook[key];throw Error('Speichern fehlgeschlagen · bitte exportieren')}return true;
}
// Pure tactical projection: preview phase must not change live libero state.
function formationPlayers(rotation,serving=st.serving){return teamState('EVV',rotation).players.map(p=>({id:p.id,pos:p.pos}))}
function touchButton(id,handler){
 const b=$(id);b.style.touchAction='manipulation';b.onclick=handler;
 b.onpointerup=e=>{
  if(e.pointerType==='mouse')return;
  e.preventDefault();let timer;
  const clear=()=>{document.removeEventListener('click',compatibilityClick,true);document.removeEventListener('pointerdown',clear,true);clearTimeout(timer)};
  const compatibilityClick=click=>{clear();if(click.detail!==0){click.preventDefault();click.stopImmediatePropagation()}};
  // WebKit can retarget this click after a dialog disappears. Catch the same
  // gesture at document level; a new pointerdown or keyboard click stays free.
  document.addEventListener('click',compatibilityClick,true);document.addEventListener('pointerdown',clear,true);timer=setTimeout(clear,1000);
  handler();
 };
}
function formationEditor(rotation=st.rot,kind='receive',stance='tactical',opponentRotation=cockpitOpponent().rotation||1,loaded=null,scope='rotation',enemyKind=null){
 const opponentKind=enemyKind||(kind==='receive'?'defense-IV':'receive');if(!DEFENSE_KINDS.includes(kind))scope='rotation';if(scope==='standard')stance='tactical';
 const baseline=()=>scope==='standard'?(defenseStandard(kind)||{...emptyFormation(),assignment:'roles',proposal:true,attackOrigin:builtinDefense(kind).attackOrigin}):formationFor(rotation,kind);
 let working=clone(loaded||baseline()),selected=1,team='own',gesture=null,resetPending=false,selectedArrow=null,arrowSequence=0;const history=[],future=[];
 const remember=(before,reset=resetPending)=>{history.push({working:clone(before),reset});if(history.length>40)history.shift();future.length=0};
 const initial=()=>JSON.stringify(working);let saved=JSON.stringify(baseline());
 const dirty=()=>initial()!==saved;
 const leave=fn=>{if(dirty()&&!confirm('Ungespeicherte Änderungen verwerfen? Abbrechen und Speichern wählen, um sie zu behalten.'))return false;editorGuard=null;fn();return true};
 editorGuard=()=>!dirty()||confirm('Ungespeicherte Änderungen verwerfen? Abbrechen und Speichern wählen, um sie zu behalten.');
 editorGuard.peek=()=>!dirty();
 const layer=(which=team)=>{let f=working;if(which==='opponent'){f.opponents=f.opponents||{};f=f.opponents[opponentRotation]=f.opponents[opponentRotation]||opponentFormation(opponentRotation,opponentKind)}if(stance==='base')f=f.base=f.base||emptyFormation();return f};
 const readLayer=which=>{const f=which==='own'?working:working.opponents?.[opponentRotation]||opponentFormation(opponentRotation,opponentKind);return (stance==='base'?f?.base:f)||emptyFormation()};
 const playerList=()=>tacticalPlayers(rotation,kind,stance==='base'?{}:working).players.map(p=>({...p,pos:stance==='base'?p.rulePosition:p.tacticalPosition})),opp=cockpitOpponent(opponentRotation);
 modal(`<h2>Formationseditor · beide Mannschaften</h2><label>Speicherbereich<select id="formScope"><option value="rotation">Individuell · diese Rotation</option>${DEFENSE_KINDS.includes(kind)?'<option value="standard">EVV-Standard · alle Rotationen</option>':''}</select></label><p class="small">Rotationsanpassung hat Vorrang vor EVV-Standard. Ältere positionsbezogene Bilder bleiben unverändert. Im Standardbereich werden nur eigene taktische Ziele gespeichert.</p><div class="grid2"><label>EVV Rotation<select id="formRotation">${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label><label>Gegnerrotation<select id="formOpponentRotation">${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label><label>Formation<select id="formKind"><option value="receive">Annahme</option><option value="defense-IV">Abwehr IV</option><option value="defense-III">Abwehr III</option><option value="defense-II">Abwehr II</option><option value="defense-I">Abwehr Hinterfeld I</option></select></label><label>Stellung<select id="formStance"><option value="tactical">Taktische Stellung</option><option value="base">Ausgangsstellung · Reihenfolge prüfen</option></select></label></div><label>Werkzeug<select id="formTool"><option value="move">Spieler verschieben</option><option value="select">Pfeil auswählen / bearbeiten</option><option value="route">Laufweg des gewählten Spielers</option><option value="ball">Ballweg</option><option value="attack">Angriffsroute</option><option value="set">Zuspielweg</option><option value="block">Blockweg</option><option value="defense">Abwehrweg</option></select></label><p class="small">Beide Teams ziehen oder Spieler auswählen → Ziel antippen. Ausgangsstellungen werden auf P4–P3–P2, P5–P6–P1 und Vorder-/Hinterreihe geprüft. Gegner ${opp.configured?'konfiguriert':'nicht eingerichtet: zunächst Trikotnummern im Spielbetrieb eintragen'}.</p><div id="defenseOptions" ${DEFENSE_KINDS.includes(kind)?'':'hidden'}><label><input type="checkbox" id="formProposed"> Koordinaten sind noch editierbare Vorschlagswerte</label><div class="grid2"><label>Angriffsort · links / rechts<input id="formAttackX" type="range" min="0" max="100"></label><label>Angriffstiefe · Grundlinie / Netz<input id="formAttackY" type="range" min="0" max="49"></label></div><p class="small">Angriffsort und drei Hinterfeldziele für den tatsächlich beobachteten Winkel anpassen. Die Regelrotation bleibt unverändert.</p><button id="formUseStandard">EVV-Standard verwenden · eigene Anpassung lösen</button><button id="formStandardOff">EVV-Standard deaktivieren</button></div><p id="formStatus" role="status"></p><svg id="formationSvg" viewBox="0 0 900 1800" role="img" aria-label="Volleyballfeld 9 mal 18 Meter"></svg><div class="grid3"><button id="formSave" class="primary">Speichern</button><button id="formReset">Zurücksetzen</button><button id="formUndo">Undo</button><button id="formRedo">Redo</button></div><div class="grid3"><label>Einzelner Pfeil<select id="formArrowSelect"><option value="">Pfeil wählen</option></select></label><button id="formDeleteArrow">Gewählten Pfeil löschen</button><button id="formSaveTeam">Teamstandard speichern · dieser Läufer</button></div><p class="small">Pfeil auswählen: sichtbare Start-/Endgriffe ziehen oder den ganzen Pfeil verschieben. Das Zeichenwerkzeug bleibt für weitere Pfeile aktiv. Maximal 100 Pfeile je Vorlage.</p><div class="grid2"><label>Vorlagenname<input id="formName" maxlength="50" placeholder="z. B. Tiefe Abwehr"></label><button id="formSaveAs">Speichern unter</button><label>Gespeicherte Vorlage<select id="formTemplate"><option value="">Vorlage wählen</option>${Object.keys(st.formationTemplates||{}).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select></label><button id="formLoad">Vorlage laden</button></div><div class="grid2"><label>Kopieren nach<select id="formCopyRot">${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label><button id="formCopy">Kopie speichern</button></div><div class="grid2"><button id="formView">Spielbetrieb anzeigen</button><button id="formClose">Schließen</button></div>`);
 $('formRotation').value=rotation;$('formKind').value=kind;$('formStance').value=stance;$('formOpponentRotation').value=opponentRotation;$('formScope').value=scope;for(const id of ['formRotation','formOpponentRotation','formStance','formCopyRot','formCopy'])$(id).disabled=scope==='standard';$('formSave').textContent=scope==='standard'?'EVV-Standard speichern':'Speichern';$('formReset').textContent=scope==='standard'?'EVV-Vorschlag laden':'Zurücksetzen';$('formUseStandard').hidden=scope==='standard'||!DEFENSE_KINDS.includes(kind)||stance==='base';$('formStandardOff').hidden=scope!=='standard';
 const svg=$('formationSvg');
 const toFull=(xy,which)=>which==='own'?[xy[0],50+xy[1]/2]:[100-xy[0],(100-xy[1])/2];
 const toLocal=(xy,which)=>which==='own'?[xy[0],(xy[1]-50)*2]:[100-xy[0],100-xy[1]*2];
 const clamp=p=>p.map(v=>Math.max(7,Math.min(93,v)));
 const draw=()=>{
 let handleMarkup='';const origin=working.attackOrigin||builtinDefense(kind)?.attackOrigin||[50,25];$('formProposed').checked=!!working.proposal;$('formAttackX').value=origin[0];$('formAttackY').value=origin[1];
 $('formStatus').textContent=(dirty()?'Ungespeichert':'Gespeichert / unverändert')+` · ${scope==='standard'?'EVV-Standard · alle Rotationen':'Rotationsanpassung'} · EVV R${rotation} · Gegner R${opponentRotation} · ${kind} · Gegner ${opponentKind} · ${stance==='base'?'Ausgangsstellung':'Taktische Stellung'}`;
 svg.dataset.boardEngine='canonical-v8';svg.innerHTML=`<defs><marker id="formArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs>${boardFrame(900,1800)}`;
 for(const which of ['own','opponent']){const f=readLayer(which),arrows=formationArrows(f),full=(a,p)=>a.space==='court'?p:toFull(p,which);
 for(const a of arrows){const points=a.points.map(p=>full(a,p).map((v,i)=>v*(i?18:9)).join(',')).join(' '),sel=selectedArrow?.team===which&&selectedArrow.id===a.id,color=a.kind==='ball'||a.kind==='set'?'#d55765':a.kind==='attack'?'#a855b7':'#1683ce';
 svg.innerHTML+=`<polyline data-arrow-id="${esc(a.id)}" data-arrow-team="${which}" ${a.kind==='run'&&which==='own'?`data-route="${a.player}"`:''} ${a.kind==='attack'?'data-attack-route':''} points="${points}" fill="none" stroke="${color}" stroke-width="${sel?16:10}" marker-end="url(#formArrow)" tabindex="0" role="button" aria-label="${esc(a.kind)} · Pfeil ${esc(a.id)}"/>`;
 if(sel&&$('formTool').value==='select')for(const [handle,index]of [['start',0],['end',a.points.length-1]]){const xy=full(a,a.points[index]);handleMarkup+=`<circle data-arrow-id="${esc(a.id)}" data-arrow-team="${which}" data-arrow-handle="${handle}" cx="${xy[0]*9}" cy="${xy[1]*18}" r="57" fill="#f2c65c33" stroke="#c08712" stroke-width="7" tabindex="0" role="button" aria-label="${handle==='start'?'Startpunkt':'Endpunkt'} des Pfeils"/>`}
 }
 const list=which==='own'?playerList():opp.players;
 for(const p of list){const xy=toFull(f.targets[p.pos]||formationDefaults[p.pos],which),id=which==='own'?p.id:null,lib=which==='own'?st.liberoIds.includes(id):p.libero,number=which==='own'?jersey(id):p.number||'?',sel=team===which&&selected===p.pos;
 svg.innerHTML+=`<g ${which==='own'?`data-form-slot="${p.pos}" data-rule-position="${p.rulePosition}" data-player-id="${p.id}"`:''} data-form-team="${which}" data-form-position="${p.pos}" transform="translate(${xy[0]*9},${xy[1]*18})"><circle r="57" fill="${which==='own'?'#126ad5':'#ac3b50'}" stroke="${sel?'#f0b323':lib?'#fff':'#263a52'}" stroke-width="8"/><title>${which==='own'?esc(nm(id)):'Gegner'} · P${p.pos}</title><text text-anchor="middle" y="12" font-size="36" fill="white">${esc(number)}${lib?' L':''}</text></g>`}
 }
 svg.innerHTML+=handleMarkup;const list=formationArrows(readLayer(team));$('formArrowSelect').innerHTML='<option value="">Pfeil wählen</option>'+list.map(a=>`<option value="${esc(a.id)}">${esc(a.kind)} · ${esc(a.id)}</option>`).join('');$('formArrowSelect').value=selectedArrow?.team===team?selectedArrow.id:'';$('formDeleteArrow').disabled=!selectedArrow;$('formUndo').disabled=!history.length;$('formRedo').disabled=!future.length;
 };
 const coords=e=>{const r=svg.getBoundingClientRect();return [(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100]};
 const moveTarget=e=>{resetPending=false;const p=coords(e),g=gesture;layer().targets[selected]=clamp(toLocal([p[0]-g.offset[0],p[1]-g.offset[1]],team))};
 const arrowLayer=(which=team)=>{const f=layer(which);if(!f.arrows)f.arrows=formationArrows(f);return f};
 const mirror=f=>{f.routes={};f.attacks={};f.ballPaths=[];for(const a of f.arrows||[]){if(a.kind==='run'&&a.player)f.routes[a.player]=clone(a.points);if(a.kind==='attack'&&a.player)f.attacks[a.player]=clone(a.points);if(a.kind==='ball'||a.kind==='set')f.ballPaths.push(clone(a.space==='court'?a.points:a.points.map(p=>toFull(p,team))))}};
 const editArrow=(g,current)=>{const f=arrowLayer(g.arrow.team),a=f.arrows.find(a=>a.id===g.arrow.id),root=g.before,base=(g.arrow.team==='own'?root:root.opponents?.[opponentRotation])||opponentFormation(opponentRotation,opponentKind),source=formationArrows(stance==='base'?base.base||emptyFormation():base).find(a=>a.id===g.arrow.id);if(!a||!source)return;
 const pos=p=>a.space==='court'?p:toLocal(p,g.arrow.team),now=pos(current),start=pos(g.start);a.points=clone(source.points);if(g.handle){const i=g.handle==='start'?0:a.points.length-1;a.points[i]=now.map(v=>Math.max(0,Math.min(100,v)))}else{const delta=now.map((v,i)=>v-start[i]),min=[0,1].map(i=>Math.min(...a.points.map(p=>p[i]))),max=[0,1].map(i=>Math.max(...a.points.map(p=>p[i])));for(let i=0;i<2;i++)delta[i]=Math.max(-min[i],Math.min(100-max[i],delta[i]));a.points=a.points.map(p=>p.map((v,i)=>v+delta[i]))}mirror(f);
 };
 svg.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;const candidate=e.target.closest('[data-arrow-id]'),node=e.target.closest('[data-form-team]'),tool=$('formTool').value,hit=candidate&&tool==='select'?candidate:null;if(hit){team=hit.dataset.arrowTeam;selectedArrow={team,id:hit.dataset.arrowId}}else if(node){team=node.dataset.formTeam;selected=Number(node.dataset.formPosition);selectedArrow=null}else selectedArrow=null;
 if(team==='opponent'&&scope==='standard')return toast('EVV-Standard speichert nur eigene Ziele');if(team==='opponent'&&!opp.configured)return toast('Zuerst die Gegneraufstellung bestätigen');e.preventDefault();const start=coords(e),xy=toFull(readLayer(team).targets[selected]||formationDefaults[selected],team);gesture={id:e.pointerId,tool:hit?'arrow':tool,arrow:selectedArrow?clone(selectedArrow):null,handle:hit?.dataset.arrowHandle,start,before:clone(working),resetBefore:resetPending,onPlayer:!!node,moved:false,client:[e.clientX,e.clientY],offset:node?[start[0]-xy[0],start[1]-xy[1]]:[0,0]};svg.setPointerCapture(e.pointerId);draw()};
 svg.onpointermove=e=>{if(!gesture||gesture.id!==e.pointerId)return;e.preventDefault();if(Math.hypot(e.clientX-gesture.client[0],e.clientY-gesture.client[1])>=4)gesture.moved=true;if(gesture.moved){if(gesture.tool==='move')moveTarget(e);if(gesture.tool==='arrow')editArrow(gesture,coords(e));draw()}};
 svg.onpointerup=e=>{if(!gesture||gesture.id!==e.pointerId)return;const g=gesture,end=coords(e);if(g.tool==='move'&&(g.moved||!g.onPlayer))moveTarget(e);if(g.tool==='arrow'&&g.moved)editArrow(g,end);
 if(['route','ball','set','attack','block','defense'].includes(g.tool)&&g.moved){const f=arrowLayer();if(f.arrows.length>=100){working=g.before;toast('Höchstens 100 Pfeile je Vorlage')}else{let id;do{id='a-'+(++arrowSequence)}while(f.arrows.some(a=>a.id===id));const court=['ball','set'].includes(g.tool),a={id,kind:g.tool==='route'?'run':g.tool,player:selected,points:court?[g.start,end].map(p=>p.map(v=>Math.max(0,Math.min(100,v)))):[clamp(toLocal(g.start,team)),clamp(toLocal(end,team))],space:court?'court':'team'};f.arrows.push(a);mirror(f);selectedArrow={team,id}}}
 if(JSON.stringify(working)!==JSON.stringify(g.before)){remember(g.before,g.resetBefore);resetPending=false}gesture=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);draw()};
 const cancel=e=>{if(gesture){working=gesture.before;resetPending=gesture.resetBefore}gesture=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);draw()};svg.onpointercancel=cancel;svg.onlostpointercapture=e=>{if(gesture)cancel(e)};
 svg.onkeydown=e=>{const node=e.target.closest('[data-arrow-id]');if(!node)return;team=node.dataset.arrowTeam;selectedArrow={team,id:node.dataset.arrowId};if(e.key==='Enter'||e.key===' '){e.preventDefault();draw();svg.querySelector('[data-arrow-id="'+selectedArrow.id+'"][data-arrow-handle="start"]')?.focus({preventScroll:true});return}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();$('formDeleteArrow').click();return}const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!delta)return;e.preventDefault();remember(working);const f=arrowLayer(),a=f.arrows.find(a=>a.id===selectedArrow.id),i=node.dataset.arrowHandle==='start'?0:node.dataset.arrowHandle==='end'?a.points.length-1:null;const move=p=>p.map((v,j)=>Math.max(0,Math.min(100,v+delta[j]*(e.shiftKey?5:1))));a.points=i===null?a.points.map(move):a.points.map((p,j)=>j===i?move(p):p);const focusHandle=node.dataset.arrowHandle;mirror(f);draw();svg.querySelector((focusHandle?'circle':'polyline')+'[data-arrow-id="'+selectedArrow.id+'"]'+(focusHandle?'[data-arrow-handle="'+focusHandle+'"]':''))?.focus({preventScroll:true});};
 $('formTool').onchange=()=>{selectedArrow=null;draw()};
 $('formArrowSelect').onchange=()=>{$('formTool').value='select';selectedArrow=$('formArrowSelect').value?{team,id:$('formArrowSelect').value}:null;draw()};
 touchButton('formDeleteArrow',()=>{if(!selectedArrow)return;remember(working);const f=arrowLayer(selectedArrow.team);f.arrows=f.arrows.filter(a=>a.id!==selectedArrow.id);mirror(f);selectedArrow=null;draw()});
 touchButton('formRedo',()=>{const next=future.pop();if(!next)return;history.push({working:clone(working),reset:resetPending});working=next.working;resetPending=next.reset;selectedArrow=null;draw()});
 touchButton('formSaveTeam',()=>{try{const which=team==='own'?'EVV':'Gegner',r=team==='own'?rotation:opponentRotation,f=team==='own'?working:working.opponents?.[opponentRotation]||opponentFormation(opponentRotation,opponentKind);saveTeamDefault(which,r,team==='own'?kind:opponentKind,f);if(team==='own'&&JSON.stringify(working.opponents||{})===JSON.stringify(JSON.parse(saved).opponents||{})){saved=initial();draw()}toast(which+'-Standard für diesen Läufer gespeichert')}catch(e){toast(e.message)}});
 const switchTo=(r,k,s,o,nextScope=scope)=>{if(!leave(()=>formationEditor(r,k,s,o,null,nextScope,enemyKind))){$('formRotation').value=rotation;$('formKind').value=kind;$('formStance').value=stance;$('formOpponentRotation').value=opponentRotation;$('formScope').value=scope}};
 $('formScope').onchange=()=>switchTo(rotation,kind,stance,opponentRotation,$('formScope').value);$('formProposed').onchange=()=>{working.proposal=$('formProposed').checked;draw()};for(const id of ['formAttackX','formAttackY'])$(id).oninput=()=>{working.attackOrigin=[Number($('formAttackX').value),Number($('formAttackY').value)];draw()};
 $('formRotation').onchange=()=>switchTo(Number($('formRotation').value),kind,stance,opponentRotation);$('formKind').onchange=()=>switchTo(rotation,$('formKind').value,stance,opponentRotation);$('formStance').onchange=()=>switchTo(rotation,kind,$('formStance').value,opponentRotation);$('formOpponentRotation').onchange=()=>switchTo(rotation,kind,stance,Number($('formOpponentRotation').value));
 const confirmFormation=()=>{if(scope==='standard')working.assignment='roles';if(resetPending)return working;for(const which of ['own',...(opp.configured&&scope!=='standard'?['opponent']:[])]){const f=layer(which);f.targets=Object.fromEntries([1,2,3,4,5,6].map(pos=>[pos,clone(f.targets[pos]||formationDefaults[pos])]));if(stance==='base'&&!validBaseFormation(f.targets))throw Error((which==='own'?'EVV':'Gegner')+': ungültige Ausgangsstellung. Reihenfolge P4–P3–P2, P5–P6–P1 und Vorder-/Hinterreihe prüfen.')}return working};
 const persist=(target=rotation)=>{try{const f=confirmFormation();if(scope==='standard')saveDefenseStandard(kind,f);else saveFormation(target,kind,f);if(target===rotation)saved=initial();draw();toast('Formation gespeichert');return true}catch(e){toast(e.message);$('formStatus').textContent=e.message;return false}};
 touchButton('formSave',()=>persist());touchButton('formCopy',()=>persist(Number($('formCopyRot').value)));
 touchButton('formSaveAs',()=>{const name=$('formName').value.trim();if(!name||['__proto__','prototype','constructor'].includes(name))return toast('Vorlagenname angeben');if(st.formationTemplates?.[name]&&!confirm('Vorlage überschreiben?'))return;if(!persist())return;st.formationTemplates=st.formationTemplates||{};const previous=st.formationTemplates[name];st.formationTemplates[name]={rotation,opponentRotation,kind,stance,scope,opponentKind:enemyKind,formation:clone(working)};if(!saveLocal()){if(previous)st.formationTemplates[name]=previous;else delete st.formationTemplates[name];return}const option=document.createElement('option');option.value=name;option.textContent=name;if(![...$('formTemplate').options].some(o=>o.value===name))$('formTemplate').appendChild(option);$('formTemplate').value=name;toast('Vorlage gespeichert')});
 touchButton('formLoad',()=>{const t=st.formationTemplates?.[$('formTemplate').value];if(!t)return toast('Vorlage wählen');if(dirty()&&!confirm('Ungespeicherte Änderungen durch Vorlage ersetzen?'))return;editorGuard=null;formationEditor(t.rotation,t.kind,t.stance,t.opponentRotation,t.formation,t.scope||'rotation',t.opponentKind||null);toast('Vorlage geladen · Speichern zum Übernehmen')});
 touchButton('formReset',()=>{remember(working);selectedArrow=null;if(scope==='standard'){working=builtinDefense(kind);resetPending=false;draw();return}resetPending=true;const f=layer();f.targets={};f.routes={};f.ballPaths=[];delete f.attacks;delete f.arrows;draw()});
 touchButton('formUseStandard',()=>{if(dirty()&&!confirm('Ungespeicherte Änderungen verwerfen?'))return;if(!confirm('Eigene taktische Rotationsanpassung lösen? Ausgangsstellung und Gegnerbilder bleiben erhalten.'))return;const f=formationFor(rotation,kind);f.targets={};f.routes={};f.ballPaths=[];delete f.attacks;delete f.assignment;delete f.proposal;delete f.attackOrigin;try{saveFormation(rotation,kind,f);editorGuard=null;formationEditor(rotation,kind,stance,opponentRotation)}catch(e){toast(e.message)}});touchButton('formStandardOff',()=>{if(dirty()&&!confirm('Ungespeicherte Änderungen verwerfen?'))return;if(!confirm('Gemeinsamen Standard deaktivieren? Individuelle Rotationsanpassungen bleiben erhalten.'))return;try{saveDefenseStandard(kind,null);editorGuard=null;matchTactics(rotation,kind)}catch(e){toast(e.message)}});
 touchButton('formUndo',()=>{const prev=history.pop();if(!prev)return;future.push({working:clone(working),reset:resetPending});working=prev.working;resetPending=prev.reset;selectedArrow=null;draw()});
 touchButton('formClose',closeModal);touchButton('formView',()=>leave(()=>matchTactics(rotation,kind,stance==='tactical',opponentRotation)));draw();
}
function saveLineupPreset(name){name=String(name||'Startaufstellung').trim().slice(0,50);st.startPresets=st.startPresets||{};st.startPresets[name]=clone({lineup:st.lineup,roles:st.roles,liberoIds:st.liberoIds,liberoAutoEnabled:st.liberoAutoEnabled,liberoPreferredId:st.liberoPreferredId,liberoPreferredMB:st.liberoPreferredMB});saveLocal()}

// Tactical targets never alter lineup, courtPos or legal rotation.
function saveHybridFormation(rotation,targets,routes={}){
 if(!Number.isInteger(rotation)||rotation<1||rotation>6)throw Error("Rotation 1–6 erforderlich");
 const valid=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=100);
 for(const [id,xy] of Object.entries(targets))if(!byId(id)||!valid(xy))throw Error("Ungültiges taktisches Ziel");
 for(const [id,path] of Object.entries(routes))if(!byId(id)||!Array.isArray(path)||!path.every(valid))throw Error("Ungültiger Laufweg");
 st.hybridFormations=st.hybridFormations||{};st.hybridFormations[rotation]=clone({targets,routes});saveLocal();
}
function hybridFormation(rotation){return clone((st.hybridFormations||{})[rotation]||{targets:{},routes:{}})}
// Additive rally metrics: never infer attacks from points, blocks or opponent errors.
function turnaroundMetrics(chain=[]){
 const seen=new Set();let attacks=0,transitions=0;
 for(const x of chain){if(x.id){if(seen.has(x.id))continue;seen.add(x.id)}
 if(x.side!=="EVV")continue;
 if(x.type==="Attack")attacks++;
 if(x.type==="TransitionChance"||(x.type==="Defense"&&["D2","D3"].includes(x.quality)))transitions++;
 }
 return {attacks,transitions};
}
function quickAttackState(){
 const last=(draft.chain||[]).filter(c=>c.side==="EVV"&&["Attack","Defense","TransitionChance","FreeBall","SecondBall"].includes(c.type)).at(-1);
 return {transition:!!last&&(last.type==="TransitionChance"||last.side==="EVV"&&last.type==="Defense"&&["D2","D3"].includes(last.quality)),waiting:!!last&&last.side==="EVV"&&last.type==="Attack"&&last.result==="CONTINUE"&&draft.step==="oppDefense"};
}
let liveMode="detail",selectedQuickPlayer=null,quickPending=null,quickRevision=0;
function hybridMode(mode){liveMode=mode;selectedQuickPlayer=null;quickPending=null;render()}
// Restored drafts may contain IDs from an earlier browser process.
function nextQuickContactId(){const used=new Set((draft.chain||[]).map(c=>c.id)),prefix=`q-${st.set}-${st.rallies.length}-`;let n=quickRevision;while(used.has(prefix+n))n++;return prefix+n}
function hybridAction(kind,player=null,revision=quickRevision){
 if(revision!==quickRevision||view!=="live"||!st.started||st.setEnded||st.matchEnded)return;
 quickRevision++;
 if(kind==="transition"){
 // A repeated defense tap without an intervening own attack is the same chance.
 const chain=draft.chain||[];
 if(quickAttackState().transition)return render();
 pushDraft();selectedQuickPlayer=null;quickPending=null;delete draft.quickAttacker;draft.chain=chain.concat({side:"EVV",type:"TransitionChance",id:nextQuickContactId()});draft.phase=draft.phase||(st.serving?"K2":"K1");draft.step="evvBall2";tab="rally";return render();
 }
 if(["kill","error","continue"].includes(kind)&&quickAttackState().waiting)return render();
 if(kind==="opponentError"){quickPending=null;return commit("EVV",{...draft,event:"OpponentAttack",result:"ERROR",chain:draft.chain||[]})}
 if(kind==="ace"){if(!st.serving)return render();player=currentServerId()}
 const openAttack=(draft.chain||[]).at(-1);if(["kill","error","continue"].includes(kind)&&openAttack?.side==="EVV"&&openAttack.type==="Attack"&&!openAttack.result)player=openAttack.player;
 const eligible=kind==="block"?front():kind==="a0"?receivers():["kill","error","continue"].includes(kind)?attackOptions().map(x=>x.id):active();
 if(!player||!eligible.includes(player)){quickPending=kind;return render()}
 pushDraft();const chain=(draft.chain||[]).slice(),id=nextQuickContactId();
 const result=kind==="kill"?"KILL":kind==="error"?"ERROR":"CONTINUE";
 if(["kill","error","continue"].includes(kind)){const last=chain.at(-1);if(last&&last.side==="EVV"&&last.type==="Attack"&&!last.result)chain[chain.length-1]={...last,result};else chain.push({side:"EVV",type:"Attack",player,result,id})}
 else if(kind==="a0")chain.push({side:"EVV",type:"Reception",player,quality:"A0",id});
 else if(kind==="d0")chain.push({side:"EVV",type:"Defense",player,quality:"D0",id});
 else if(kind==="ace")chain.push({side:"EVV",type:"Serve",player,result:"ACE",id});
 else if(kind==="block")chain.push({side:"EVV",type:"Block",player,result:"BLOCK",id});
 if(["kill","error","continue"].includes(kind))captureCoachContact(chain,chain.length-1);
 if(kind==="continue"){draft.chain=chain;draft.step="oppDefense";delete draft.quickAttacker;selectedQuickPlayer=null;tab="opponent";quickPending=null;return render()}
 const win=["kill","ace","block"].includes(kind)?"EVV":"Gegner";
 const event={kill:"Attack",error:"Attack",ace:"Serve",a0:"Reception",d0:"Defense",block:"Block"}[kind];
 quickPending=null;selectedQuickPlayer=null;
 commit(win,{...draft,event,chain,...(["kill","error"].includes(kind)?{attacker:player}:{}),result:kind==="block"?"BLOCK":kind==="ace"?"ACE":["a0","d0"].includes(kind)?"DIRECT_ERROR":result});
}
function hybridPanel(){
 const coords={1:[80,76],2:[80,29],3:[50,29],4:[20,29],5:[20,76],6:[50,76]},state=quickAttackState();
 const pending=quickPending,attackIds=attackOptions().map(x=>x.id),choosing=state.transition&&!draft.quickAttacker&&!pending;
 const eligible=pending==="block"?front():pending==="a0"?receivers():choosing||["kill","error","continue"].includes(pending)?attackIds:active();
 const openAttack=(draft.chain||[]).at(-1),selected=openAttack?.side==="EVV"&&openAttack.type==="Attack"&&!openAttack.result?openAttack.player:draft.quickAttacker||selectedQuickPlayer,metrics=turnaroundMetrics(draft.chain),formation=activeFormation();
 const freePending=freeChanceRecords({chain:draft.chain||[],coaching:draft.coaching}).at(-1);
 const hint=state.waiting?'Rallye läuft weiter · nächste kontrollierte Abwehr als Transition erfassen':pending?'Spieler für die gewählte Aktion wählen':choosing?'Abwehr kontrolliert · Angreifer wählen':state.transition&&selected?`${nm(selected)} · Angriffsergebnis wählen`:freePending&&!freePending.firstAttack&&freePending.direct===null?'Dankeball erfasst · Angriff dokumentieren':'Spieler oder Aktion wählen';
 $("flow").innerHTML=`<h2>Schnellmodus</h2><p id="activeFormation">R${formation.rotation} · ${esc(formation.kind==="receive"?"Annahme":"Abwehr "+formation.kind.replace("defense-",""))} · ${Object.keys(formation.data.targets).length} Taktikziele</p><p id="quickHint" role="status">${esc(hint)}</p><div class="quickArena"><div class="liveCourt" aria-label="Regeltechnische Feldpositionen">${boardView({quick:true,tactical:false,eligible,selected})}</div><div class="quickActions">${[["kill","Angriffspunkt"],["continue","Angriff verteidigt"],["error","Angriffsfehler"],["block","Blockpunkt"],["opponentError","Gegnerfehler"],["d0","D0 · Abwehrfehler"],["ace","Ass"],["a0","A0 · Annahmefehler"]].map(([k,label])=>`<button class="${['kill','ace','block','opponentError'].includes(k)?'good':['error','a0','d0'].includes(k)?'bad':'blue'}" data-quick="${k}" ${(k==="ace"&&!st.serving||state.waiting&&['kill','error','continue'].includes(k))?"disabled":""}>${label}</button>`).join("")}</div></div><p id="quickMetrics" aria-live="polite">Aktuelle Rallye · eigene Angriffe: ${metrics.attacks} · Transition-Chancen: ${metrics.transitions}</p><div class="quickFooter"><button class="transitionButton primary" id="quickTransition">Abwehr gewonnen / Transition</button><button id="quickUndo">↶ Undo</button></div>`;
 bindBoardPlayers($('flow'));const rev=quickRevision;
 document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>hybridAction(b.dataset.quick,selected,rev));
 document.querySelectorAll('[data-quick-player]').forEach(b=>b.onclick=()=>{if(pending)hybridAction(pending,b.dataset.quickPlayer,rev);else{selectedQuickPlayer=b.dataset.quickPlayer;if(state.transition)draft.quickAttacker=b.dataset.quickPlayer;quickRevision++;render()}});
 $('quickTransition').onclick=()=>hybridAction('transition',null,rev);$('quickUndo').onclick=undoLast;
}

function commit(w,data={},preSnapshot=null){
 if(w!=="EVV"&&w!=="Gegner")throw new Error("Ungültiger Rallye-Sieger");
 if(st.setEnded||st.matchEnded)return toast("Satz ist beendet");
 if(data.coaching){data={...data,coaching:clone(data.coaching)};delete data.coaching.pending;}
 st.rallyUndo.push(preSnapshot?clone(preSnapshot):snapshot());
 prepareTeamForRally();
 const before=`${st.e}:${st.o}`,rb=st.rot,sb=st.serving;
 if(w==="EVV"){st.e++;if(!st.serving){st.serving=true;rotate()}}
 else{st.o++;if(st.serving)st.serving=false}
 syncLiberoRotation('rally');
 if(st.opponentTeam&&data.chain){data={...data,opponentIdentity:Object.fromEntries(data.chain.flatMap((c,i)=>{const n=String(c.player||c.attacker||c.server||c.receiver||'').replace(/^#/,''),p=c.side==='Gegner'&&Object.values(st.opponentTeam.roster).find(p=>p.number&&p.number===n);return p?[[i,p.id]]:[]}))}}
 data=Object.assign({},data,{winner:w,before,after:`${st.e}:${st.o}`,rotation:rb,servingBefore:sb,phase:data.phase||(sb?"K2":"K1"),set:st.set});
 data.turnaround=turnaroundMetrics(data.chain);
 data.observationComplete=data.observationComplete??!!data.chain?.some(c=>c.side==="EVV"&&["Serve","Reception"].includes(c.type));
 st.rallies.push(data);syncOpponentLiberoAfterRally();draft={};quickPending=null;selectedQuickPlayer=null;quickRevision++;clearDraftHistory();tab="rally";view="live";checkEnd();render();toast(`${w} ${before} → ${st.e}:${st.o}`)
}
function allRallies(){return st.sets.flatMap(s=>s.rallies).concat(st.rallies)}
function allMarks(){return st.sets.flatMap(s=>s.marks||[]).concat(st.marks)}
function active(){let ids=st.lineup.slice();if(st.liberoActive&&st.liberoOnCourt&&st.liberoReplacedId){ids=ids.filter(id=>id!==st.liberoReplacedId);ids.push(st.liberoOnCourt)}return ids}
function rotationSteps(from,to){let n=0,r=from;while(r!==to&&n<6){r=ROT_NEXT[r];n++}return n}
function courtPos(id){
 if(st.liberoActive&&id===st.liberoOnCourt&&st.liberoReplacedId)return courtPos(st.liberoReplacedId);
 const base=st.lineup.indexOf(id)+1;if(!base)return null;
 const startRot=(st.setStart&&st.setStart.rot)||st.rot,steps=rotationSteps(startRot,st.rot);
 return physicalPosition(base,steps)
}
function rotationMatrix(){
 return [1,2,3,4,5,6].map(pos=>({position:pos,player:playerAtPos(pos),row:[2,3,4].includes(pos)?"front":"back"}));
}
function liberoEligible(){
 return !!(st.liberoOnCourt&&st.liberoReplacedId&&st.liberoIds.includes(st.liberoOnCourt)&&
   st.lineup.includes(st.liberoReplacedId)&&
   /^(MB|AA)/.test(roleOf(st.liberoReplacedId))&&
   [1,5,6].includes(courtPos(st.liberoReplacedId)));
}
function playerAtPos(pos){return active().find(id=>courtPos(id)===pos)||null}
function front(){return active().filter(id=>[2,3,4].includes(courtPos(id)))}
function receivers(){
 const on=active(), plan=(st.receivePlans||{})[st.rot];
 const libero=st.liberoActive&&on.includes(st.liberoOnCourt)?st.liberoOnCourt:null;
 const selected=Array.isArray(plan)?plan.filter(id=>on.includes(id)):[];
 const outside=on.filter(id=>/^AA/.test(roleOf(id)));
 const fallback=on.filter(id=>roleOf(id)==="D"||/^MB/.test(roleOf(id)));
 // Four selectable reception players: libero plus three other court players.
 // Explicit reception plan takes priority, but never hides an active libero.
 const ordered=[...new Set([...selected,...outside,...fallback,...on])].filter(id=>id!==libero);
 return [...(libero?[libero]:[]),...ordered.slice(0,libero?3:4)];
}

function opponentReceivers(){if(st.opponentTeam?.confirmed)return teamState('Gegner').players.filter(p=>p.number).map(p=>'#'+p.number);return [...new Set(opponent.receivers.concat(opponent.liberos||[]).filter(x=>x&&x!=="#"&&x!=="#?"))]}
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
 [1,2].forEach(i=>{const selected=st.liberoIds[i-1]||"";const slot=$("evvLiberoSlot"+i);if(slot)slot.innerHTML=liberoCandidateOptions(selected);const el=$("evvLiberoName"+i);if(el)el.value=selected&&["amar","alex"].includes(selected)?nm(selected):""});setupLiberoSelectors();
 $("startSix").innerHTML=lineupEditor("ss",st.lineup);
 const repl=$("evvLiberoReplaces");if(repl){repl.innerHTML=`<option value="">Niemand</option>`+roster.filter(p=>p.role!=="L").map(p=>`<option value="${esc(p.id)}">${esc(p.name)} #${jersey(p.id)}</option>`).join("")}
}
function readSetup(){
 const picked=readLineupEditor("ss");if(!picked)return false;
 if(picked.ids.some(id=>liberoSlotIds().includes(id))){toast("Libero kann nicht gleichzeitig Startspieler sein");return false}
 if(!applyLiberoNames())return false;
 st.lineup=picked.ids;st.roles=picked.roles;st.receiveIds=[];st.receivePlans={};
 st.liberoOnCourt=$("evvLiberoOnCourt")?$("evvLiberoOnCourt").value:"";
 st.liberoReplacedId=$("evvLiberoReplaces")?$("evvLiberoReplaces").value:"";
 st.liberoActive=!!(st.liberoOnCourt&&st.liberoReplacedId);st.liberoAutoEnabled=!!$("evvAutoLibero")?.checked;
 st.liberoPreferredId=st.liberoOnCourt||st.liberoIds[0]||"";st.liberoPreferredMB=st.liberoReplacedId||"";
 opponent.name=$("oppName").value.trim()||"Gegner";
 opponent.setter="#"+($("oppSetter").value.trim()||"?");
 opponent.liberos=[1,2].map(i=>"#"+($("oppLibero"+i).value.trim()||"?"));
 opponent.receivers=[1,2,3,4].map(i=>"#"+($("oppR"+i).value.trim()||"?"));
 st.rot=parseInt($("startRotation").value.slice(1),10)||1;
 st.setStart={rot:st.rot,serving:false,lineup:clone(st.lineup),roles:clone(st.roles)};
 if(st.liberoActive&&!liberoEligible()){toast("Libero nur für einen Mittelblocker in der Hinterreihe einsetzen");return false}
 return true
}
function start(serv){if(!readSetup())return;const planning={liberoAutoEnabled:st.liberoAutoEnabled,matchPlan:st.matchPlan,matchPlanTemplates:st.matchPlanTemplates,jerseyNumbers:st.jerseyNumbers,startPresets:st.startPresets,formationBook:st.formationBook,defenseStandards:st.defenseStandards,formationTemplates:st.formationTemplates,hybridFormations:st.hybridFormations,teamDefaults:st.teamDefaults,playerRoles:st.playerRoles};const keep=clone(st.lineup),keepRoles=clone(st.roles),keepRec=clone(st.receiveIds),keepLibs=clone(st.liberoIds),keepLibOn=st.liberoOnCourt,keepLibRep=st.liberoReplacedId,keepLibActive=st.liberoActive,keepPreferred=st.liberoPreferredId,keepMB=st.liberoPreferredMB;st=fresh();Object.assign(st,planning);st.lineup=keep;st.roles=keepRoles;st.receiveIds=keepRec;st.liberoIds=keepLibs;st.liberoOnCourt=keepLibOn;st.liberoReplacedId=keepLibRep;st.liberoActive=keepLibActive;st.liberoPreferredId=keepPreferred;st.liberoPreferredMB=keepMB;if(keepLibActive&&serv&&courtPos(keepLibRep)===1){toast('P1: Feldspieler schlägt selbst auf · Libero-Auswahl korrigieren');return}st.rot=parseInt($("startRotation").value.slice(1),10)||1;st.serving=serv;st.started=true;st.setStart={rot:st.rot,serving:serv,lineup:clone(keep),roles:clone(keepRoles)};masterStart();syncLiberoRotation('start');$("setup").classList.add("hidden");render()}
function currentServerId(){const id=playerAtPos(1);return st.liberoIds.includes(id)?st.liberoReplacedId:id}
function currentServer(){
 if(!st.serving)return opponent.name;
 // Rotation number indexes current service turn; preserve selected six and substitutions.
 return nm(currentServerId()||"");
}
function timeoutCount(team,set=st.set){return (st.events||[]).filter(x=>x.type==='timeout'&&x.team===team&&Number(x.set)===Number(set)).length}
function timeoutSummary(){const count=t=>timeoutCount(t);return `Auszeiten S${st.set}: EVV ${Math.min(2,count("EVV"))}/2 · ${esc(opponent.name)} ${Math.min(2,count("Gegner"))}/2${count("EVV")>2||count("Gegner")>2?" · ⚠ Historische Auszeiten prüfen":""}`}
function renderHeader(){
 if(!$('rotationSignal')){const signal=document.createElement('button');signal.id='rotationSignal';signal.type='button';$('rotationBadge').after(signal)}
 const signalPhase=st.serving?'K2':'K1',signalData=rotationSignal(st.rallies.filter(r=>r.rotation===st.rot),signalPhase);$('rotationSignal').className='rotationSignal '+signalData.status;$('rotationSignal').textContent=signalPhase+' · '+{neutral:'○ wenig Daten',red:'! niedrig',amber:'△ prüfen',green:'✓ stabil'}[signalData.status];$('rotationSignal').setAttribute('aria-label',`Rotation R${st.rot}, ${signalPhase}: ${cockpitStatus[signalData.status]}, ${signalData.numerator} von ${signalData.denominator}`);$('rotationSignal').onclick=()=>rotationCoaching();
 $("homeScore").textContent=st.e;$("oppScore").textContent=st.o;$("oppNameHead").textContent=opponent.name;$("setBadge").textContent=`S${st.set}${st.set===5?" · TB":""}`;$("rotationBadge").textContent=`R${st.rot}`;
 $("phase").textContent=st.serving?"K2":"K1";$("serveText").textContent=st.serving?"EVV Aufschlag":"Gegner Aufschlag";$("serverText").textContent=st.serving?`Aufschlag: ${currentServer()}`:`Aufschlag: ${opponent.name}`;
 $("lineups").innerHTML=`<div class="timeoutSummary" aria-live="polite">${timeoutSummary()}</div><div class="lineup"><b>EVV · aktive Sechs</b><div class="chips">${active().map(id=>`<span class="chip">${esc(nm(id))} · ${esc(roleOf(id))}</span>`).join("")}</div></div><div class="lineup"><b>${esc(opponent.name)}</b><div class="chips"><span class="chip">Z ${esc(opponent.setter)}</span><span class="chip">L1 ${esc((opponent.liberos||[])[0]||"–")}</span><span class="chip">L2 ${esc((opponent.liberos||[])[1]||"–")}</span>${opponent.receivers.map(x=>`<span class="chip">${esc(x)}</span>`).join("")}</div></div>`
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
 if(a[0]==="liberoPlanner")return liberoPlanner();
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
 else if(a[0]==="es"){draft.setterTarget=a[1];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Set",target:a[1]});captureCoachContact(draft.chain,draft.chain.length-1);draft.step="evvAttack";render()}
 else if(a[0]==="att"){if(!attackOptions().some(x=>x.id===a[1]&&x.zone===a[2]))return toast("Angriffsweg in dieser Rotation nicht zulässig");draft.attacker=a[1];draft.zone=a[2];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Attack",player:a[1],route:a[2]});captureCoachContact(draft.chain,draft.chain.length-1);draft.step="evvAttackResult";render()}
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
   draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"Attack",route:draft.setterTarget,result:a[1]});
   if(a[1]==="KILL"){nineZonePicker("OPP_KILL",{w:"Gegner",data:Object.assign({},draft,{event:"OpponentAttack",result:"KILL"})});return}
   if(a[1]==="BLOCK"){draft.step="evvBlockChoice";tab="rally";render();return}
   if(a[1]==="ERROR")return commit("EVV",Object.assign({},draft,{event:"OpponentAttack",result:a[1]}));
   draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"AttackResult",result:"DEFENDED"});draft.step="evvDefense";tab="rally";render()
 }
 else if(a[0]==="ebc"){draft.blocker=a[1];draft.step="evvBlockResult";render()}
 else if(a[0]==="ebr"){if(a[1]==="TOOLED"){draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Block",player:draft.blocker,result:"TOOLED"});return commit("Gegner",Object.assign({},draft,{event:"OpponentAttack",result:"BLOCK_OUT",blocker:draft.blocker}))}
 else if(a[1]==="POINT"){draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Block",player:draft.blocker,result:"BLOCK"});return commit("EVV",Object.assign({},draft,{event:"OpponentAttack",result:"BLOCK",blocker:draft.blocker}))}draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Block",player:draft.blocker,result:"TOUCH"});if(a[1]==="EVV"){draft.step="evvDefense";tab="rally"}else{draft.step="oppDefense";tab="opponent"}render()}
 else if(a[0]==="ed"){draft.defender=a[1];draft.defense=a[2];draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Defense",player:a[1],quality:a[2]});if(a[2]==="D0")return commit("Gegner",Object.assign({},draft,{event:"Defense",result:"DIRECT_ERROR"}));draft.step="evvBall2";render()}
 else if(a[0]==="blk"){if(!front().includes(a[1]))return toast("Blocker steht nicht in der Vorderreihe");draft.chain=(draft.chain||[]).concat({side:"EVV",type:"Block",player:a[1],result:"BLOCK"});commit("EVV",Object.assign({},draft,{event:"OpponentAttack",result:"BLOCK",blocker:a[1]}))}
 else if(a[0]==="od"){draft.chain=(draft.chain||[]).concat({side:"Gegner",type:"Defense",quality:a[1]});if(a[1]==="D0")return commit("EVV",Object.assign({},draft,{event:"OpponentDefense",result:"DIRECT_ERROR"}));draft.step="oppBall2";render()}
}
function rally(){
 if(!st.started)return $("flow").innerHTML="<h2>Bereit</h2><p>Spiel einrichten und starten.</p>";
 if(view!=="live")return historical();
 if(st.matchEnded)return $("flow").innerHTML=`<div class="banner">MATCH BEENDET · ${setWins("EVV")}:${setWins("Gegner")} Sätze</div>${summary(allRallies())}<button id="finishedNew" class="primary">Neues Spiel</button>`;
 if(st.setEnded){$("flow").innerHTML=`<div class="banner">SATZ ${st.set} BEENDET · ${st.e}:${st.o}</div>${summary(st.rallies)}<button id="prep" class="primary">Nächsten Satz vorbereiten</button>`;$("prep").onclick=prepareNextSet;return}
 if(liveMode==="quick")return hybridPanel();
 if(draft.step==="evvBlockChoice"){
   $("flow").innerHTML=flowHead("EVV · Wer blockt?")+`<div class="eligibleNote">Nur aktuelle Vorderreihe P2/P3/P4.</div><div class="grid3">${front().map(id=>B(`${esc(nm(id))} #${jersey(id)} · P${courtPos(id)}`,`ebc|${id}`,"good")).join("")}</div>`;bindActs();return
 }
 if(draft.step==="evvBlockResult"){
   $("flow").innerHTML=flowHead(`${esc(nm(draft.blocker))} · Block`)+`<div class="grid2">${B("BLOCKPUNKT","ebr|POINT","good")}${B("BLOCK-OUT / ANGESCHLAGEN · Punkt Gegner","ebr|TOOLED","bad")}${B("BLOCKTOUCH · Gegner weiter","ebr|OPP","blue")}${B("BLOCKTOUCH · EVV Abwehr","ebr|EVV","blue")}</div>`;bindActs();return
 }
 if(draft.step==="evvDefense"){
   let h=flowHead("EVV · Abwehrqualität");active().forEach(id=>h+=`<div class="row"><b>${esc(nm(id))}</b>${["D3","D2","D1","D0"].map(q=>B(q,`ed|${id}|${q}`,q==="D3"?"good":q==="D0"?"bad":"")).join("")}</div>`);$("flow").innerHTML=h;bindActs();return
 }
 if(draft.step==="evvA0Decision"){$("flow").innerHTML=flowHead("A0 · Ist der Ball noch spielbar?")+`<div class="grid2">${B("DIREKTER PUNKT GEGNER","a0|LOST","bad")}${B("BALL GERETTET · WEITER","a0|SAVED","blue")}</div>`;bindActs();return}
 if(draft.step==="evvBall2"){$("flow").innerHTML=flowHead("EVV · 2. Ball")+`<div class="grid2">${B("ZUSPIEL","b2|SET","primary")}${B("2. BALL RÜBER","b2|OVER","blue")}${B("DANKEBALL RÜBER","b2|FREE","blue")}${B("NOTBALL / ANGESCHNITTEN","b2|CUT","blue")}</div>`;bindActs();return}
 if(draft.step==="evvFreeBallPlayer"){$("flow").innerHTML=flowHead(draft.freeBallKind==="CUT"?"EVV · Notball / angeschnitten rüber":"EVV · Dankeball rüber")+`<div class="eligibleNote">Kein Punkt: Ball geht zum Gegner, Rallye läuft weiter.</div><div class="grid3">${active().map(id=>B(`${esc(nm(id))} #${jersey(id)} · P${courtPos(id)}`,`fbp|${id}`)).join("")}</div>`;bindActs();return}
 if(draft.step==="evvSecondBallPlayer"){$("flow").innerHTML=flowHead("EVV · Wer spielt den 2. Ball rüber?")+`<div class="grid3">${active().map(id=>B(`${esc(nm(id))} #${jersey(id)} · P${courtPos(id)}`,`b2p|${id}`)).join("")}</div>`;bindActs();return}
 if(draft.step==="evvSecondBallResult"){$("flow").innerHTML=flowHead(`${esc(nm(draft.secondBallPlayer))} · 2. Ball von P${courtPos(draft.secondBallPlayer)}`)+`<div class="grid3">${B("PUNKT","b2r|KILL","good")}${B("GEGNER VERTEIDIGT","b2r|CONTINUE","blue")}${B("FEHLER","b2r|ERROR","bad")}</div>`;bindActs();return}
 if(draft.step==="evvSet"){
   const opts=attackOptions();$("flow").innerHTML=flowHead("EVV · Zuspiel / Angriffsweg")+`<div class="eligibleNote">Angriffsweg nach Rolle + aktueller Vorder-/Hinterreihe: AA→IV, MB→III, D→II; Hinterfeld Pipe/P6 bzw. I/P1.</div><div class="grid3">${opts.map(o=>B(`${o.zone} · ${esc(nm(o.id))} · P${o.pos}`,`es|${o.zone}`)).join("")}</div>`;bindActs();return}
 if(draft.step==="evvAttack"){
   let ao=attackCandidates(draft.setterTarget);$("flow").innerHTML=flowHead(`EVV · Angriff ${esc(draft.setterTarget||"")}`)+`<div class="eligibleNote">Rollen- und rotationsgebunden; K1 und Transition werden getrennt behandelt.</div><div class="grid2">${ao.map(o=>B(`${esc(nm(o.id))} · ${o.zone} · P${o.pos}`,`att|${o.id}|${o.zone}`)).join("")||"<p>Keine zulässige Angriffsoption.</p>"}</div>`;bindActs();return
 }
 if(draft.step==="evvAttackResult"){$("flow").innerHTML=flowHead("EVV · Angriffsergebnis")+`<div class="grid2">${B("KILL","fin|KILL","good")}${B("FEHLER","fin|ERROR","bad")}${B("BLOCKPUNKT GEGNER","fin|BLOCKED","bad")}${B("BLOCK-OUT · EVV Punkt","fin|BLOCK_OUT","good")}${B("BLOCKABPRALLER · EVV weiter","fin|BLOCK_CONTINUE","blue")}${B("GEGNER VERTEIDIGT · weiter","fin|CONTINUE","blue")}</div>`;bindActs();return}
 if(!st.serving){
   let h=`<h2>K1 · Annahme</h2><div class="eligibleNote">${st.liberoActive?"Libero aktiv: "+esc(nm(st.liberoOnCourt))+" · P"+courtPos(st.liberoOnCourt):"Kein Libero auf dem Feld. Über „Libero verwalten“ aktivieren oder Einsatzposition prüfen."}</div><button type="button" data-act="liberoPlanner" class="liberoK1Btn">⚙ Libero / Annahme prüfen</button>`;receivers().forEach(id=>{h+=`<div class="row"><b>${esc(nm(id))} #${jersey(id)} · P${courtPos(id)}</b>${["A3","A2","A1","A0"].map(q=>B(q,`rec|${id}|${q}`,q==="A3"?"good":q==="A0"?"bad":"")).join("")}</div>`});$("flow").innerHTML=h+`<div class="grid3">${B("Gegner AF","quick|EVV","good")}${B("Quick EVV","quick|EVV")}${B("Quick Gegner","quick|Gegner")}</div>`
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
 <h3>Angriff / Block</h3><div style="overflow-x:auto"><table class="statsTable"><thead><tr><th>Spieler</th><th>Angr.</th><th>Kill</th><th>Fehler</th><th>Eigener Angriff geblockt</th><th>Block-out</th><th>Eff.</th><th>Eigene Blockpunkte</th></tr></thead><tbody>${rows.filter(x=>x.att||x.bl).map(x=>`<tr><td>${esc(nm(x.id))}</td><td>${x.att}</td><td>${x.kill}</td><td>${x.ae}</td><td>${x.ab}</td><td>${x.bo||0}</td><td>${x.eff}%</td><td>${x.bl}</td></tr>`).join("")||'<tr><td colspan="8">Noch keine Angriffe/Blocks</td></tr>'}</tbody></table></div>
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
   /* Libero nach neuer Satzrotation neu berechnen */opponent.setter=$("nOZ").value.trim()||opponent.setter;opponent.liberos=[1,2].map(i=>$("nOL"+i).value.trim()||"#");opponent.receivers=[0,1,2,3].map(i=>$("nOR"+i).value.trim()||`#${i+1}`);
   st.set=next;st.e=0;st.o=0;st.setEnded=false;st.rallies=[];st.rallyUndo=[];st.marks=[];st.subPairs={};st.subCount=0;st.subUsed=[];st.setStart={rot:st.rot,serving,lineup:clone(ids),roles:clone(st.roles)};masterNewSet();syncLiberoRotation('set');draft={};clearDraftHistory();view="live";closeModal();render();toast(`Satz ${next} gestartet`)
 };
 $("nK1").onclick=()=>go(false);$("nK2").onclick=()=>go(true);
}
function historical(){let r=view==="match"?allRallies():(st.sets.find(s=>s.set===view)?.rallies||(view===st.set?st.rallies:[]));$("flow").innerHTML=`<div class="banner">${view==="match"?"MATCH":"Satz "+view} · READ ONLY</div>${summary(r)}`}
function coach(){
 cockpitDashboard($("flow"),'dash');
 $("flow").querySelector('.cockpitHeading').insertAdjacentHTML('beforeend','<button id="coachTactics" class="primary">Taktik anzeigen</button>');
 $('coachTactics').onclick=()=>matchTactics();
}
// VIP: tactical board and independent reception plan, persisted with match state.
function receptionPlanner(){
 st.receivePlans=st.receivePlans||{};const selected=st.receivePlans[st.rot]||receivers();
 const choices=active().filter(id=>roleOf(id)!=="Z"||st.liberoIds.includes(id));
 modal(`<h2>Annahme R${st.rot} anpassen</h2><p class="small">Darf auch D enthalten. AA1/AA2 sind unabhängig von der Annahme. K1 erlaubt vier Annahmespieler: Libero plus drei weitere Feldspieler (z. B. vorderer Mittelblocker).</p>${choices.map(id=>`<label class="pickRow"><input type="checkbox" data-rec="${esc(id)}" ${selected.includes(id)?"checked":""}>${esc(nm(id))} #${jersey(id)} · ${esc(roleOf(id))}</label>`).join("")}<div class="grid2"><button id="recDefault">Vorlage</button><button class="primary" id="recSave">Übernehmen</button></div>`);
 $("recDefault").onclick=()=>{st.receivePlans[st.rot]=[];closeModal();render();toast("Standardannahme aktiv")};
 $("recSave").onclick=()=>{const ids=[...document.querySelectorAll("[data-rec]:checked")].map(x=>x.dataset.rec);if(ids.length!==4)return toast("Genau vier Annahmespieler wählen");st.receivePlans[st.rot]=ids;closeModal();render()};
}
function liberoPlannerLegacy(){
 const options=selected=>'<option value="">Nicht gemeldet</option>'+roster.map(p=>`<option value="${esc(p.id)}" ${selected===p.id?'selected':''}>${esc(p.name)} #${jersey(p.id)}</option>`).join('');
 const mids=st.lineup.filter(id=>/^(MB|AA)/.test(roleOf(id)));
 modal(`<h2>Libero · Satz ${st.set}</h2><p class="small">Zuerst Libero 1/2 wählen, dann den aktiven Libero und seinen Mittelblocker. <b>Einmal „Speichern & übernehmen“</b> drücken. Ein Libero darf nicht gleichzeitig in der Start-Sechs stehen.</p><div class="grid2"><label>Libero 1<select id="lpSlot1">${options(st.liberoIds[0])}</select></label><label>Libero 2<select id="lpSlot2">${options(st.liberoIds[1])}</select></label></div><label>Aktiver Libero<select id="lpLib"></select></label><label>Ersetzt MB / Annahme-Außen<select id="lpMB"><option value="">Niemand</option>${mids.map(id=>`<option value="${id}">${esc(nm(id))} #${jersey(id)} · P${courtPos(id)}</option>`).join('')}</select></label><p id="lpHint" class="small" aria-live="polite"></p><div class="grid2"><button id="lpCancel">Abbrechen</button><button id="lpSave" class="primary">Speichern & übernehmen</button></div>`);
 const refresh=()=>{const ids=[$('lpSlot1').value,$('lpSlot2').value].filter(Boolean),sel=$('lpLib').value||st.liberoPreferredId||st.liberoOnCourt||ids[0]||'';$('lpLib').innerHTML='<option value="">Kein Libero</option>'+ids.map(id=>`<option value="${id}">${esc(nm(id))} #${jersey(id)}</option>`).join('');$('lpLib').value=ids.includes(sel)?sel:(ids[0]||'');$('lpHint').textContent=ids.length?'Gemeldet: '+ids.map(id=>nm(id)).join(' / '):'Kein Libero gemeldet';};
 $('lpSlot1').addEventListener('change',refresh);$('lpSlot2').addEventListener('change',refresh);refresh();
 $('lpMB').value=st.liberoPreferredMB||st.liberoReplacedId||mids.find(id=>[5,6].includes(courtPos(id)))||'';
 $('lpCancel').onclick=closeModal;
 $('lpSave').onclick=()=>{
  if(draft.step||st.setEnded)return toast('Nur zwischen Ballwechseln');
  const ids=[$('lpSlot1').value,$('lpSlot2').value],chosen=ids.filter(Boolean),l=$('lpLib').value,m=$('lpMB').value;
  if(new Set(chosen).size!==chosen.length)return toast('Libero 1 und 2 müssen verschieden sein');
  if(chosen.some(id=>st.lineup.includes(id)))return toast('Libero steht noch in der Start-Sechs! Zuerst auswechseln.');
  if(st.started&&st.rallies.length&&chosen.some(id=>!st.liberoIds.includes(id)))return toast('Libero-Meldung während des Spiels nicht ändern');
  if(l&&!chosen.includes(l))return toast('Aktiven Libero aus der Meldung wählen');
  if(!!l!==!!m)return toast('Libero und Mittelblocker gemeinsam wählen');
  if(m&&![1,5,6].includes(courtPos(m)))return toast('Ersatzspieler muss hinten stehen');
  if(m&&courtPos(m)===1&&st.serving)return toast('P1: regulärer Spieler schlägt selbst auf');
  if(!configureLiberoSlots(ids,['','']))return;
  st.liberoAutoEnabled=!!l;st.liberoPreferredId=l;st.liberoPreferredMB=m;st.liberoOnCourt=l;st.liberoReplacedId=m;st.liberoActive=!!l;syncLiberoRotation();st.receivePlans={};saveLocal();closeModal();render();toast(l?nm(l)+' als Libero übernommen':'Libero-Einsatz beendet');
 };
}

function opponentCourtLegacy(){
 const marks=allRallies().filter(r=>r.targetZone&&r.winner==="EVV");
 const count=Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,0]));marks.forEach(r=>count[r.targetZone]++);
 const defaults={4:[23,27],3:[50,27],2:[77,27],5:[22,77],6:[50,77],1:[78,77]};
 st.opponentPositions=st.opponentPositions||{};st.sixBoards=st.sixBoards||{};
 const nodes=[4,3,2,5,6,1].map(pos=>{const xy=st.opponentPositions[pos]||defaults[pos],player=cockpitOpponent().players.find(p=>p.pos===pos),number=player?.number||opponent.positionNumbers?.[pos]||'?';return `<button type="button" class="tacticPlayer opponentSymbol" data-opp-player="${pos}" style="left:${xy[0]}%;top:${xy[1]}%"><b>#${esc(number)}</b><small>${player?.libero?'L · ':''}P${pos}</small></button>`}).join("");
 modal(`<h2>${esc(opponent.name)} · Kill-Zonen</h2><p class="small">Zonen zeigen dokumentierte EVV-Punkte. Zonen für die Skizze auswählen. Angriff, Ass und Gegner-Kill werden direkt im Live-Scouting als Zone erfasst.</p><div class="zone9">${Array.from({length:9},(_,i)=>`<button type="button" class="killZone" data-opp-zone="${i+1}"><b>${i+1}</b><strong>${count[i+1]}</strong><small>Punkte</small></button>`).join("")}</div><p class="small" id="oppZoneInfo">${marks.length} markierte Punkte · Zone auswählen</p><h3>Gegner · Block und Feldabwehr</h3><div class="grid2"><button type="button" id="oppModeMove" class="primary">Spieler verschieben</button><button type="button" id="oppModeZone">📍 Punkte markieren</button></div><p class="small" id="oppModeHelp">Finger oder Apple Pencil: Spieler ziehen.</p><p class="small">Spieler auf dem Feld mit Maus oder Finger verschieben. Die Skizze wird lokal gespeichert und ist keine verifizierte Rotation.</p><div class="tacticCourt opponentTactic" id="opponentTacticCourt"><div class="tacticNet">NETZ · 4 / 3 / 2</div>${nodes}<div class="tacticBaseline">GRUNDLINIE · 5 / 6 / 1</div></div><div class="grid3"><button id="oppUndoPin">Letzten Punkt löschen</button><button id="oppReset">Skizze zurücksetzen</button><button id="oppClose">Schließen</button></div>`);
 document.querySelectorAll("[data-opp-zone]").forEach(el=>el.onclick=()=>{document.querySelectorAll("[data-opp-zone]").forEach(b=>b.classList.remove("selected"));el.classList.add("selected");$("oppZoneInfo").textContent=`Zone ${el.dataset.oppZone}: ${count[+el.dataset.oppZone]} dokumentierte EVV-Punkte`;});
 const court=$("opponentTacticCourt");
 let zoneMode=false,drag=null;
 const moveButton=$("oppModeMove"),zoneButton=$("oppModeZone");
 const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
 const coords=e=>{const r=court.getBoundingClientRect();return {x:clamp((e.clientX-r.left)/r.width*100,0,100),y:clamp((e.clientY-r.top)/r.height*100,0,100)};};
 const zoneAt=(x,y)=>1+Math.min(2,Math.floor(y/100*3))*3+Math.min(2,Math.floor(x/100*3));
 const markAt=(x,y)=>{
  const zone=zoneAt(x,y);st.opponentSketchMarks=st.opponentSketchMarks||[];
  st.opponentSketchMarks.push({x,y,zone,at:Date.now()});
  const pin=document.createElement("span");pin.className="zonePin";pin.style.left=x+"%";pin.style.top=y+"%";court.appendChild(pin);
  document.querySelectorAll("[data-opp-zone]").forEach(el=>el.classList.toggle("selected",+el.dataset.oppZone===zone));
  $("oppZoneInfo").textContent=`Zone ${zone} · ${st.opponentSketchMarks.length} Skizzenpunkte (keine Spielstatistik)`;saveLocal();
 };
 (st.opponentSketchMarks||[]).forEach(m=>{const pin=document.createElement("span");pin.className="zonePin";pin.style.left=m.x+"%";pin.style.top=m.y+"%";court.appendChild(pin)});
 const setMode=on=>{zoneMode=on;moveButton.classList.toggle("primary",!on);zoneButton.classList.toggle("primary",on);court.classList.toggle("markMode",on);$("oppModeHelp").textContent=on?"Finger oder Pencil: Feld antippen.":"Spieler berühren und direkt verschieben."};
 moveButton.onclick=()=>setMode(false);zoneButton.onclick=()=>setMode(true);
 court.addEventListener("pointerdown",e=>{
  if(e.button!==undefined&&e.button!==0)return;
  const node=e.target.closest("[data-opp-player]");if(!zoneMode&&!node)return;
  e.preventDefault();const pt=coords(e);
  const start=node?st.opponentPositions[node.dataset.oppPlayer]||defaults[node.dataset.oppPlayer]:null;
  drag={id:e.pointerId,node:zoneMode?null:node,dx:start?start[0]-pt.x:0,dy:start?start[1]-pt.y:0,x:start?.[0],y:start?.[1]};
  court.setPointerCapture(e.pointerId);
  if(node&&!zoneMode)node.classList.add("dragging");
 });
 court.addEventListener("pointermove",e=>{
  if(!drag||drag.id!==e.pointerId||!drag.node)return;
  e.preventDefault();const pt=coords(e),d=drag;
  d.x=clamp(pt.x+d.dx,7,93);d.y=clamp(pt.y+d.dy,12,90);
  // Direct update on every pointer event, without frame throttling or CSS easing.
  d.node.style.left=d.x+"%";d.node.style.top=d.y+"%";
 });
 const finish=e=>{
  if(!drag||drag.id!==e.pointerId)return;
  const d=drag;drag=null;
  if(d.node){d.node.classList.remove("dragging");if(e.type==="pointerup"){
   const pt=coords(e);d.x=clamp(pt.x+d.dx,7,93);d.y=clamp(pt.y+d.dy,12,90);
   d.node.style.left=d.x+"%";d.node.style.top=d.y+"%";
   st.opponentPositions[d.node.dataset.oppPlayer]=[d.x,d.y];saveLocal();
  }}else if(e.type==="pointerup"){const pt=coords(e);markAt(pt.x,pt.y)}
  if(court.hasPointerCapture(e.pointerId))court.releasePointerCapture(e.pointerId);
 };
 court.addEventListener("pointerup",finish);court.addEventListener("pointercancel",finish);
 setMode(false);
 $("oppUndoPin").onclick=()=>{if(!st.opponentSketchMarks?.length)return toast("Keine Skizzenpunkte");st.opponentSketchMarks.pop();saveLocal();opponentCourt()};
 $("oppReset").onclick=()=>{st.opponentPositions={};st.opponentSketchMarks=[];saveLocal();opponentCourt()};$("oppClose").onclick=closeModal;
}
function tacticalPreset(kind){
 const defaultXY={1:[76,82],2:[77,28],3:[50,27],4:[23,28],5:[22,82],6:[50,80]};
 const defensive={1:[79,77],2:[72,29],3:[51,29],4:[29,29],5:[22,72],6:[51,76]};
 const positions=kind==="defense"?defensive:defaultXY;
 st.tacticPositions=Object.fromEntries(active().map(id=>[id,(positions[courtPos(id)]||positions[6]).slice()]));render();
}
// Six independent coaching sketches: each attack lane has its own defensive setup.
function sixBoardKey(team,lane){return team+'_'+lane}
function sixBoardPositions(team,lane){
 st.sixBoards=st.sixBoards||{};
 const key=sixBoardKey(team,lane);
 if(!st.sixBoards[key])st.sixBoards[key]={players:{},pins:[]};
 return st.sixBoards[key];
}
function saveSixPresets(){
 st.sixPresets=st.sixPresets||{};
 for(const team of ['EVV','Gegner'])for(const lane of ['IV','III','II']){
  const key=sixBoardKey(team,lane),board=sixBoardPositions(team,lane);
  st.sixPresets[key]=clone(board);
 }
 saveLocal();toast('Sechs taktische Grundformationen gespeichert');
}
function loadSixPresets(){
 if(!st.sixPresets||!Object.keys(st.sixPresets).length)return toast('Noch keine Grundformation gespeichert');
 for(const [key,board] of Object.entries(st.sixPresets))st.sixBoards[key]=clone(board);
 saveLocal();render();toast('Taktische Grundformationen geladen');
}
function pencilNotes(){
 st.coachNotes=st.coachNotes||{};const key='S'+st.set;
 modal(`<h2>✎ Coach-Notizen · Satz ${st.set}</h2><p class="small">Mit Apple Pencil oder Finger schreiben. Notizen bleiben lokal im Spiel gespeichert. Für ein Backup bitte JSON exportieren.</p><canvas id="noteCanvas" width="900" height="480" style="width:100%;height:auto;background:#fff;border:1px solid #cbd5e1;border-radius:14px;touch-action:none"></canvas><label>Kurze Textnotiz<textarea id="noteText" rows="3" placeholder="Beobachtung / Auszeit / nächste Aktion">${esc(st.coachNotes[key]?.text||'')}</textarea></label><div class="grid3"><button id="noteClear">Zeichnung löschen</button><button id="noteCancel">Schließen</button><button id="noteSave" class="primary">Speichern</button></div>`);
 const canvas=$('noteCanvas'),ctx=canvas.getContext('2d');ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=3;ctx.strokeStyle='#1d4ed8';const saved=st.coachNotes[key]?.image;
 if(saved){const im=new Image();im.onload=()=>ctx.drawImage(im,0,0,canvas.width,canvas.height);im.src=saved;}
 let activePointer=null;const xy=e=>{const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*canvas.width/r.width,(e.clientY-r.top)*canvas.height/r.height]};
 canvas.addEventListener('pointerdown',e=>{e.preventDefault();activePointer=e.pointerId;canvas.setPointerCapture(e.pointerId);const [x,y]=xy(e);ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+.01,y+.01);ctx.stroke()});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==activePointer)return;const [x,y]=xy(e);ctx.lineTo(x,y);ctx.stroke()});
 ['pointerup','pointercancel'].forEach(ev=>canvas.addEventListener(ev,e=>{if(e.pointerId===activePointer)activePointer=null}));
 $('noteClear').onclick=()=>ctx.clearRect(0,0,canvas.width,canvas.height);
 $('noteCancel').onclick=closeModal;
 $('noteSave').onclick=()=>{st.coachNotes[key]={text:$('noteText').value.slice(0,4000),image:canvas.toDataURL('image/png')};saveLocal();closeModal();toast('Notizen gespeichert')};
}
function tacticalBoard(){
 const lanes=[['IV',4],['III',3],['II',2]];
 const rows=[['EVV','EVV · Angriff → Gegnerabwehr'],['Gegner',esc(opponent.name)+' · Angriff → EVV-Abwehr']];
 const cards=rows.map(([team,title])=>`<section class="sixBoardRow"><h3>${title}</h3><div class="sixBoardGrid">${lanes.map(([lane,pos])=>{
  const board=sixBoardPositions(team,lane),defaultXY={1:[80,80],2:[80,25],3:[50,25],4:[20,25],5:[20,80],6:[50,80]};
  const nodes=[4,3,2,5,6,1].map(p=>{const xy=board.players[p]||defaultXY[p];const evvId=playerAtPos(p);const evvLabel=evvId?`${nm(evvId)} #${jersey(evvId)}`:`P${p}`;const oppLabels=[opponent.setter,...opponent.receivers,...opponent.liberos].filter(x=>x&&x!=="#"&&x!=="#?");const oppLabel=(opponent.positionNumbers||{})[p]||oppLabels[[4,3,2,5,6,1].indexOf(p)]||`#${p}`;const label=team==='EVV'?(cockpitOpponent().players.find(x=>x.pos===p)?.number||opponent.positionNumbers?.[p]||'?'):jersey(evvId);return `<button type="button" class="tacticPlayer sixPlayer ${team==='EVV'?'opponentSymbol':'ownSymbol'}" data-six-player="${p}" style="left:${xy[0]}%;top:${xy[1]}%" aria-label="${esc(label)} Abwehrposition ${p} verschieben"><b>#${esc(label)}</b><small>${team==='Gegner'?esc(nm(evvId)):''}</small></button>`}).join('');
  const pins=board.pins.map((xy,i)=>`<span class="sixPin" style="left:${xy[0]}%;top:${xy[1]}%" aria-label="Zielpunkt ${i+1}"></span>`).join('');
  return `<article class="sixBoardCard"><div class="sixBoardTitle"><strong>Angriff ${lane}</strong><span>Position ${pos}</span></div><div class="tacticCourt sixCourt" data-six-team="${team}" data-six-lane="${lane}"><div class="tacticNet">NETZ · 4 / 3 / 2</div>${nodes}${pins}<div class="tacticBaseline">5 / 6 / 1</div></div><div class="sixControls"><button type="button" class="sixMode" data-six-mode="mark">◎ Ziel markieren</button><button type="button" class="sixUndo">↶</button><button type="button" class="sixReset">Reset</button></div><p class="sixHint">Spieler ziehen oder auswählen → Feld anklicken · Zielmodus für Markierungen</p></article>`;
 }).join('')}</div></section>`).join('');
 return `<div class="tacticActions"><button id="tacticSavePreset">Grundformation speichern</button><button id="tacticLoadPreset">Grundformation laden</button><button id="tacticReset">Alle zurücksetzen</button><button id="coachPencil">✎ Stiftnotizen</button><button id="recEdit">Annahme R${st.rot}</button><button id="liberoEdit">Libero verwalten</button><button id="oppCourtBtn">Gegnerfeld / Kill-Zonen</button><button id="oppJerseys">Gegner-Trikotnummern</button></div><p class="small">Sechs getrennte Taktikbilder: oben EVV-Angriff IV/III/II, unten Gegnerangriff IV/III/II. Jede Abwehrformation und Zielmarkierung wird unabhängig gespeichert. Skizzen sind keine offiziellen Rotationsaufstellungen.</p>${cards}`;
}
function editOwnNumbers(){
 modal(`<h2>EVV · Trikotnummern</h2><p class="small">Fehlende Nummern bleiben als ? sichtbar. Bekannte Nummern dürfen korrigiert werden; leere Felder behalten die bisherige Nummer. Spieleridentität und historische Aktionen bleiben erhalten.</p><div class="grid3">${roster.map(p=>`<label>${esc(nm(p.id))}<input id="jersey-${p.id}" inputmode="numeric" maxlength="5" value="${jersey(p.id)==='?'?'':esc(jersey(p.id))}"></label>`).join('')}</div><div class="grid2"><button id="ownNumbersCancel">Abbrechen</button><button id="ownNumbersSave" class="primary">Speichern</button></div>`);
 $('ownNumbersCancel').onclick=closeModal;$('ownNumbersSave').onclick=()=>{const values=Object.fromEntries(roster.map(p=>[p.id,$('jersey-'+p.id).value.trim().replace(/[^0-9]/g,'').slice(0,5)]).filter(([,n])=>n)),effective=roster.map(p=>values[p.id]||jersey(p.id)).filter(n=>n&&n!=='?');if(new Set(effective).size!==effective.length)return toast('Trikotnummern müssen eindeutig sein');rememberTeamAction('EVV-Trikotnummern');st.jerseyNumbers={...st.jerseyNumbers,...values};closeModal();render();matchTactics()};
}
function editOpponentJerseysLegacy(){
 const previous=opponent.courtAnchor,current=cockpitOpponent(),numbers=current.configured?Object.fromEntries(current.players.map(p=>[p.pos,previous.positions[p.slot]])):opponent.positionNumbers||{};
 modal(`<h2>Gegner · aktuelle Aufstellung</h2><p class="small">Trikotnummern der aktuellen Positionen eintragen. Die Zuordnung gilt ab diesem Spielstand für Satz ${st.set}. Nur vollständig konfigurierte Aufstellungen rotieren automatisch.</p><label>Aktuelle Gegnerrotation<select id="oppStartRot">${[1,2,3,4,5,6].map(r=>`<option>${r}</option>`).join('')}</select></label><div class="grid3">${[1,2,3,4,5,6].map(p=>`<label>P${p}<input inputmode="numeric" maxlength="5" id="oppNum${p}" value="${esc(numbers[p]||'')}"></label>`).join('')}</div><div class="grid2"><label>Libero # (optional)<input id="oppCourtLibero" inputmode="numeric" maxlength="5" value="${esc(previous?.libero||'')}"></label><label>Ersetzt Startposition<select id="oppCourtReplaces"><option value="0">Keine Ersetzung</option>${[1,2,3,4,5,6].map(r=>`<option value="${r}">P${r}</option>`).join('')}</select></label></div><div class="grid2"><button id="oppConfigCancel">Abbrechen</button><button id="saveOppNum" class="primary">Speichern</button></div>`);
 $('oppStartRot').value=cockpitOpponent().rotation||1;$('oppCourtReplaces').value=current.configured?(current.players.find(p=>p.slot===previous.replaces)?.pos||0):previous?.replaces||0;
 $('oppConfigCancel').onclick=closeModal;$('saveOppNum').onclick=()=>{const numbers=Object.fromEntries([1,2,3,4,5,6].map(p=>[p,$('oppNum'+p).value.trim().replace(/[^0-9]/g,'').slice(0,5)])),libero=$('oppCourtLibero').value.trim().replace(/[^0-9]/g,''),replaces=Number($('oppCourtReplaces').value);const filled=Object.values(numbers).filter(Boolean);if(new Set(filled).size!==filled.length||libero&&filled.includes(libero)||!!libero!==!!replaces)return toast('Eindeutige Nummern und Libero-Ersetzung prüfen');opponent.positionNumbers=numbers;if(filled.length===6){opponent.receivers=Object.values(numbers).map(n=>'#'+n);opponent.liberos=libero?['#'+libero]:[];}if(filled.length===6)opponent.courtAnchor={set:st.set,rotation:Number($('oppStartRot').value),sideouts:opponentSideouts(),positions:numbers,libero,replaces};else delete opponent.courtAnchor;closeModal();render();matchTactics()};
}
function bindTactic(){
 if(!$('recEdit'))return;
 $('coachPencil').onclick=pencilNotes;$('tacticSavePreset').onclick=saveSixPresets;$('tacticLoadPreset').onclick=loadSixPresets;$('recEdit').onclick=receptionPlanner;$('liberoEdit').onclick=liberoPlanner;$('oppCourtBtn').onclick=opponentCourt;$('oppJerseys').onclick=editOpponentJerseys;
 $('tacticReset').onclick=()=>{if(!confirm('Alle sechs Taktikskizzen zurücksetzen?'))return;st.sixBoards={};saveLocal();render()};
 document.querySelectorAll('.sixBoardCard').forEach(card=>{
  const court=card.querySelector('.sixCourt'),team=court.dataset.sixTeam,lane=court.dataset.sixLane;
  const board=sixBoardPositions(team,lane),mode=card.querySelector('.sixMode');let marking=false,selected=null;
  const select=el=>{selected=el;court.querySelectorAll('.sixPlayer').forEach(p=>p.setAttribute('aria-pressed',String(p===el)));card.querySelector('.sixHint').textContent=el?'Zielposition auf dem Feld anklicken':'Spieler ziehen oder auswählen → Feld anklicken'};
  mode.onclick=()=>{select(null);marking=!marking;mode.classList.toggle('primary',marking);mode.textContent=marking?'✓ Zielmodus aktiv':'◎ Ziel markieren'};
  const point=(e,player)=>{const r=court.getBoundingClientRect(),w=court.clientWidth,h=court.clientHeight,padX=player?player.offsetWidth/(2*w)*100:3,padY=player?player.offsetHeight/(2*h)*100:3;return [Math.max(padX,Math.min(100-padX,(e.clientX-r.left-court.clientLeft)/w*100)),Math.max(padY,Math.min(100-padY,(e.clientY-r.top-court.clientTop)/h*100))]};
  const place=(el,xy)=>{el.style.left=xy[0]+'%';el.style.top=xy[1]+'%';board.players[el.dataset.sixPlayer]=xy};
  court.addEventListener('pointerup',e=>{if(e.target.closest('button'))return;if(!marking){if(selected){place(selected,point(e,selected));select(null);saveLocal()}return;}const xy=point(e);board.pins.push(xy);const dot=document.createElement('span');dot.className='sixPin';dot.style.left=xy[0]+'%';dot.style.top=xy[1]+'%';court.appendChild(dot);saveLocal()});
  card.querySelector('.sixUndo').onclick=()=>{board.pins.pop();saveLocal();render()};
  card.querySelector('.sixReset').onclick=()=>{board.players={};board.pins=[];saveLocal();render()};
  court.querySelectorAll('.sixPlayer').forEach(el=>{
   let gesture=null;
   el.addEventListener('dragstart',e=>e.preventDefault());
   el.addEventListener('click',e=>{if(e.detail===0&&!marking)select(el)});
   el.addEventListener('pointerdown',e=>{if(marking||!e.isPrimary||e.button!==0)return;e.preventDefault();e.stopPropagation();const r=el.getBoundingClientRect();gesture={id:e.pointerId,x:e.clientX,y:e.clientY,dx:e.clientX-(r.left+r.width/2),dy:e.clientY-(r.top+r.height/2),before:board.players[el.dataset.sixPlayer]?.slice(),left:el.style.left,top:el.style.top,moved:false};el.setPointerCapture(e.pointerId);el.classList.add('dragging')});
   const move=e=>{if(!gesture||gesture.id!==e.pointerId)return;if(Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>=4)gesture.moved=true;if(gesture.moved)place(el,point({clientX:e.clientX-gesture.dx,clientY:e.clientY-gesture.dy},el))};
   el.addEventListener('pointermove',move);
   el.addEventListener('pointerup',e=>{if(!gesture||gesture.id!==e.pointerId)return;e.stopPropagation();move(e);const moved=gesture.moved;gesture=null;if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);el.classList.remove('dragging');select(moved?null:el);saveLocal()});
   const cancel=()=>{if(!gesture)return;if(gesture.before)board.players[el.dataset.sixPlayer]=gesture.before;else delete board.players[el.dataset.sixPlayer];el.style.left=gesture.left;el.style.top=gesture.top;gesture=null;el.classList.remove('dragging');saveLocal()};el.addEventListener('pointercancel',cancel);el.addEventListener('lostpointercapture',cancel);
  });
 });
}
function opponentPlayerStats(rr){
 const actions=rr.flatMap(r=>(r.chain||[]).flatMap((c,i)=>c.side==='Gegner'?[{contact:c,id:r.opponentIdentity?.[i]||null,number:c.player||c.attacker||c.server||c.receiver||null}]:[])).filter(x=>x.id||x.number),groups=new Map();
 for(const a of actions){const key=a.id||'legacy:'+a.number;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(a)}
 if(!groups.size)return '<div class="coachline">Noch keine gegnerischen Einzelaktionen mit Spielernummer erfasst.</div>';
 const cells=[...groups.entries()].map(([id,entries])=>{const own=entries.map(a=>a.contact),re=own.filter(x=>x.type==='Reception'),at=own.filter(x=>x.type==='Attack'),sv=own.filter(x=>x.type==='Serve'),known=st.opponentTeam?.roster[id],labels=[...new Set(entries.map(a=>a.number).filter(Boolean))],label=known?'#'+(known.number||'?'):labels[0];return `<tr><td>${esc(label)}${known&&labels.some(n=>n!=='#'+known.number)?`<small>Beobachtet: ${labels.map(esc).join(', ')}</small>`:''}</td><td>${re.length}</td><td>${pct(re.filter(x=>['A2','A3'].includes(x.quality)).length,re.length)}</td><td>${at.length}</td><td>${at.filter(x=>['KILL','BLOCK_OUT'].includes(x.result)).length}</td><td>${sv.length}</td></tr>`}).join('');
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
 modal(`<p class="zoneInstruction">Jetzt Landepunkt wählen: eine der 9 großen Zonen antippen</p><h2>${kind==="ACE"?"Aufschlag-Ass":kind==="OPP_KILL"?"Gegnerangriff · Landepunkt":"Angriffspunkt"} · Zielzone</h2><div class="courtOrient"><b>↑ NETZ</b><span>1–3 netznah · 4–6 Mitte · 7–9 grundliniennah</span></div><div class="zone9">
 ${[1,2,3,4,5,6,7,8,9].map(z=>`<button type="button" data-zone="${z}"><b>${z}</b><span>${z<=3?"NETZ":z<=6?"MITTE":"GRUNDLINIE"}</span></button>`).join("")}
 </div><div class="courtOrient bottom"><b>↓ GRUNDLINIE</b></div><button id="skipMark">Überspringen</button>`);
 document.querySelectorAll("[data-zone]").forEach(b=>b.onclick=()=>{
   const z=+b.dataset.zone,[x,y]=zoneCenter(z),p=pendingMark,pre=snapshot(); pendingMark=null;
   p.data.targetZone=z;p.data.court={x,y};st.marks.push({x,y,zone:z,set:st.set,player:p.data.attacker||p.data.server||null,side:p.w,kind});
   closeModal();commit(p.w,p.data,pre)
 });
 $("skipMark").onclick=()=>{let p=pendingMark;pendingMark=null;closeModal();commit(p.w,p.data)};saveLocal();
}
function courtPicker(){nineZonePicker("KILL",pendingMark)}
// A substitute is tied to the original starter and can enter only once per set.
function validateSub(out,inn){
 if(!st.started||st.setEnded||view!=="live"||draft.step)return "Wechsel nur zwischen Rallyes im laufenden Satz";
 if(!st.lineup.includes(out)||st.lineup.includes(inn)||!byId(inn)||byId(inn).role==="L"||st.liberoIds.includes(inn))return "Spieler nicht verfügbar";
 if(st.subCount>=6)return "Sechs reguläre Wechsel erreicht";
 const starters=(st.setStart&&st.setStart.lineup)||st.lineup;
 const pairs=st.subPairs||{},used=st.subUsed||[];
 if(used.includes(inn)||used.includes(out))return "Spieler hat seinen zulässigen Einsatz bereits abgeschlossen";
 if(pairs[out])return pairs[out]===inn?null:"Rückwechsel nur mit ursprünglichem Partner";
 if(!starters.includes(out))return "Ersatzspieler darf nur mit ursprünglichem Startspieler zurückwechseln";
 if(starters.includes(inn))return "Startspieler darf nur auf seine ursprüngliche Position zurückkehren";
 if(Object.values(pairs).includes(inn))return "Ersatzspieler bereits einem Wechselpaar zugeordnet";
 return null;
}
function applySub(out,inn,voice,selectedRole=null){
 const err=validateSub(out,inn);if(err){toast(err);return false}if(selectedRole&&st.lineup.some(id=>id!==out&&roleOf(id)===selectedRole)){toast('Aktive Satzrolle bereits belegt; 5:1-Rollen beibehalten');return false}
 if(st.liberoActive&&st.liberoReplacedId===out){toast('Zuerst tatsächliche Libero-Rückkehr dokumentieren');return false}if(st.teamControl)rememberTeamAction('EVV-Wechsel');
 const i=st.lineup.indexOf(out),pairs=st.subPairs||(st.subPairs={}),used=st.subUsed||(st.subUsed=[]);
 const isReturn=!!pairs[out];
 if(isReturn){delete pairs[out];used.push(out,inn)}else pairs[inn]=out;
 st.lineup[i]=inn;st.roles=st.roles||{};st.roles[inn]=selectedRole&&ROLES.includes(selectedRole)?selectedRole:st.roles[out]||(byId(out)||{}).role;delete st.roles[out];st.receiveIds=st.receiveIds.map(x=>x===out?inn:x);st.subCount++;syncLiberoRotation('sub');
 st.events.push({type:"sub",set:st.set,out,inn,score:`${st.e}:${st.o}`,pos:i+1,return:isReturn,...(voice?{voice}:{})});
 render();toast(`${nm(inn)} ⇧ / ${nm(out)} ⇩`);return true;
}
function substitute(){
 if(!st.started||view!=="live"||st.setEnded||draft.step)return toast("Wechsel nur zwischen Rallyes im laufenden Satz");
 const bench=roster.filter(p=>!active().includes(p.id)&&p.role!=="L");
 const history=st.events.filter(e=>e.type==="sub"&&e.set===st.set);
 const hist=history.length?history.map(e=>`<div class="small">${esc(e.score)} · ${esc(nm(e.out))} raus → ${esc(nm(e.inn))} rein${e.return?" (Rückwechsel)":""}</div>`).join(""):"<p class='small'>Noch keine Wechsel in diesem Satz.</p>";
 modal(`<h2>Spielerwechsel · Satz ${st.set}</h2><p class="small">${st.subCount} von 6 regulären Wechseln · Rückwechsel nur mit ursprünglichem Partner.</p><label>RAUS<select id="subOut">${st.lineup.map(id=>`<option value="${id}">${esc(nm(id))}</option>`).join("")}</select></label><label>REIN<select id="subIn">${bench.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.role)}</option>`).join("")}</select></label><div class="grid2"><label>Aktive Satzrolle<select id="subRole">${roleOptions(roleOf(st.lineup[0]))}</select></label><button id="cancelSub">Abbrechen</button><button id="doSub" class="primary">Wechsel bestätigen</button></div><h3>Wechselhistorie</h3>${hist}`);
 $('subOut').onchange=()=>{$('subRole').value=roleOf($('subOut').value)};$("cancelSub").onclick=closeModal;
 $("doSub").onclick=()=>{if(applySub($("subOut").value,$("subIn").value,null,$("subRole").value))closeModal()};
}
function scoreFix(){if(view!=="live")return toast("Nur LIVE korrigierbar");modal(`<h2>Punkt korrigieren</h2><p class="small">Nur Spielstand. Keine Statistik, Rotation oder Aufschlagänderung.</p><div class="grid2"><button data-f="e,1">EVV +1</button><button data-f="e,-1">EVV −1</button><button data-f="o,1">Gegner +1</button><button data-f="o,-1">Gegner −1</button></div>`);document.querySelectorAll("[data-f]").forEach(b=>b.onclick=()=>{let [t,d]=b.dataset.f.split(",");st[t]=Math.max(0,st[t]+(+d));st.setEnded=false;st.matchEnded=false;checkEnd();closeModal();render()})}
function prepareNextSet(){
 if(!st.setEnded||st.matchEnded)return toast("Kein Satzwechsel möglich");
 const next=st.set+1;
 let wizardLib={liberoAutoEnabled:st.liberoAutoEnabled,liberoPreferredId:st.liberoPreferredId,liberoPreferredMB:st.liberoPreferredMB,liberoIds:clone(st.liberoIds)};
 const options=(selected)=>roster.filter(p=>p.role!=="L").map(p=>`<option value="${p.id}" ${selected===p.id?"selected":""}>${esc(p.name)} · ${esc(p.role)}</option>`).join("");
 modal(`<h2>Satz ${next} · neue Startaufstellung</h2><p class="small">Jede Position frei wählen. Die bisherige Aufstellung ist vorausgewählt.</p><label>Startvorlage<select id="nsPreset"><option value="">Letzte Aufstellung übernehmen</option>${Object.keys(st.startPresets||{}).map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('')}</select></label><button id="nsSavePreset">Letzte Aufstellung als Vorlage speichern</button><label><input type="checkbox" id="nsKeepLib" checked> Libero-Konfiguration übernehmen</label><p>Gespeicherte Annahme-/Abwehrformationen werden nach Rotation geladen. Erst K1/K2 starten bestätigt die Aufstellung.</p><div class="grid2">${lineupEditor("ns",st.lineup)}</div><label>Startrotation<select id="nsRot">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${n===st.rot?"selected":""}>R${n}</option>`).join("")}</select></label><p class="small">Aufstellung und Libero vor dem Start kontrollieren. Taktische Ziele bleiben getrennt von Regelpositionen.</p><div class="grid2"><button id="nsRec">Gegner-Aufschlag · K1</button><button id="nsSrv" class="primary">EVV-Aufschlag · K2</button></div><button id="nsCancel">Abbrechen</button>`);
 $('nsPreset').onchange=()=>{const p=st.startPresets?.[$('nsPreset').value]||{lineup:st.lineup,roles:st.roles,...wizardLib};p.lineup.forEach((id,i)=>{$('nsP'+i).value=id;$('nsR'+i).value=p.roles[id]});wizardLib=clone(p)};
 $('nsSavePreset').onclick=()=>{saveLineupPreset('Gespeicherte Startaufstellung');prepareNextSet()};
 const go=serv=>{
  const picked=readLineupEditor("ns");if(!picked)return;const ids=picked.ids;
  const newRot=Number($("nsRot").value);
  st.sets.push({...(st.opponentTeam?{opponentTeam:clone(st.opponentTeam),teamControl:clone(st.teamControl)}:{}),set:st.set,e:st.e,o:st.o,rallies:clone(st.rallies),marks:clone(st.marks),start:clone(st.setStart),lineup:clone(st.lineup),roles:clone(st.roles),events:clone(st.events.filter(x=>x.set===st.set))});
  st.set=next;st.e=0;st.o=0;st.lineup=ids;st.roles=picked.roles;st.rot=newRot;st.serving=serv;st.setEnded=false;st.matchEnded=false;
  const keepLib=$('nsKeepLib').checked;
  st.liberoActive=false;st.liberoOnCourt="";st.liberoReplacedId="";
  if(keepLib){st.liberoIds=clone(wizardLib.liberoIds);st.liberoAutoEnabled=wizardLib.liberoAutoEnabled;st.liberoPreferredId=wizardLib.liberoPreferredId||"";st.liberoPreferredMB=wizardLib.liberoPreferredMB||""}else{st.liberoAutoEnabled=false;st.liberoPreferredId="";st.liberoPreferredMB=""}
  st.receivePlans={};st.tacticPositions={};st.sixBoards={};
  st.rallies=[];st.rallyUndo=[];st.marks=[];st.subPairs={};st.subCount=0;st.subUsed=[];st.setStart={rot:newRot,serving:serv,lineup:clone(ids),roles:clone(st.roles)};masterNewSet();syncLiberoRotation('set');
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
 if(data.schema!=="EVV-QuickScout-1")throw Error("Kein gültiges QuickScout-Backup");validateMatch(data.match);validateOpponent(data.opponent);validateRuntime(data.runtime);
 if(!confirm("Aktuellen Spielstand durch Backup ersetzen? Bitte vorher exportieren."))return;
 storageLoadFailed=false;st=loadedMatch(data.match);opponent=Object.assign({name:"Gegner",setter:"#",liberos:["#","#"],receivers:[]},data.opponent);if(Array.isArray(data.roster)){for(const saved of data.roster){const player=byId(saved.id);if(player&&saved.role==="L")player.name=sanitizeLiberoName(saved.name)||player.name}}
 st.receivePlans=st.receivePlans||{};st.tacticPositions=st.tacticPositions||{};draft={};clearDraftHistory();view="live";tab="rally";pendingMark=null;if(data.runtime){draft=data.runtime.draft;draftHistory=data.runtime.draftHistory||[];pendingMark=data.runtime.pendingMark||null;liveMode=data.runtime.liveMode==="quick"?"quick":"detail"}saveLocal();setupUI();$("setup").classList.toggle("hidden",!!st.started);render();if(pendingMark)nineZonePicker("KILL",pendingMark);toast("Backup im Arbeitsspeicher übernommen");
 }catch(e){toast("Import fehlgeschlagen: "+e.message)}};input.click();
}
function newMatch(){
 modal(`<h2>Neues Spiel beginnen</h2><p>Der aktuelle Spielstand wird durch ein neues Spiel ersetzt. Exportiere ihn vorher als JSON, damit keine Daten verloren gehen.</p><div class="grid2"><button id="nmExport">Backup exportieren</button><button id="nmCancel">Abbrechen</button></div><button id="nmConfirm" class="danger">Neues Spiel ohne Übernahme starten</button>`);
 $("nmExport").onclick=exportData;$("nmCancel").onclick=closeModal;
 $("nmConfirm").onclick=()=>{const planning={matchPlanTemplates:st.matchPlanTemplates,jerseyNumbers:st.jerseyNumbers,startPresets:st.startPresets,formationBook:st.formationBook,defenseStandards:st.defenseStandards,formationTemplates:st.formationTemplates,hybridFormations:st.hybridFormations,teamDefaults:st.teamDefaults,playerRoles:st.playerRoles};storageLoadFailed=false;st=fresh();Object.assign(st,planning);opponent={name:"Gegner",setter:"#",liberos:["#","#"],receivers:["#","#","#","#"]};draft={};draftHistory=[];pendingMark=null;tab="rally";view="live";closeModal();$("setup").classList.remove("hidden");setupUI();$("oppName").value="Gegner";["oppSetter","oppLibero1","oppLibero2","oppR1","oppR2","oppR3","oppR4"].forEach(id=>{if($(id))$(id).value=""});render();toast("Neues Spiel einrichten")};
}
function exportData(){
 const payload={schema:"EVV-QuickScout-1",runtime:{draft,draftHistory,pendingMark,liveMode,tab,view},version:APP_VERSION,exportedAt:new Date().toISOString(),opponent,match:st,roster};
 const blob=new Blob([storageLoadFailed?(localStorage.getItem(STORE_KEY)||""):JSON.stringify(payload,null,2)],{type:storageLoadFailed?"text/plain":"application/json"});const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=storageLoadFailed?`EVV_Recovery_${new Date().toISOString().slice(0,10)}.txt`:`EVV_Scout_S${st.set}_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
}
function printReport(){
 const rr=allRallies(),r=rotationStats(rr),rec=statRowsFrom(rr);
 const popup=window.open("","_blank");if(!popup)return toast("Pop-ups für Druckansicht erlauben");
 const html=`<!doctype html><html lang="de"><meta charset="utf-8"><title>EVV Spielbericht</title><style>body{font:14px Arial;margin:25px;color:#182238}h1{border-bottom:3px solid #e87929;padding-bottom:12px}table{border-collapse:collapse;width:100%;margin:14px 0 25px}th,td{border:1px solid #ccd3dd;padding:7px;text-align:left}th{background:#edf1f6}.note{color:#5a6575} @media print{button{display:none}}</style><h1>EVV QuickScout · Matchbericht</h1><p>Gegner: ${esc(opponent.name)} · Version ${APP_VERSION} · Stand ${new Date().toLocaleString("de-DE")}</p><h2>Sätze</h2><table><tr><th>Satz</th><th>EVV</th><th>Gegner</th></tr>${st.sets.concat([{set:st.set,e:st.e,o:st.o}]).map(x=>`<tr><td>${x.set}</td><td>${x.e}</td><td>${x.o}</td></tr>`).join("")}</table><h2>K1/K2 je Rotation</h2><table><tr><th>R</th><th>K1 n</th><th>K1 %</th><th>K2 n</th><th>K2 %</th></tr>${r.map(x=>`<tr><td>${x.rot}</td><td>${x.k1}</td><td>${x.k1?x.k1p+"%":"–"}</td><td>${x.k2}</td><td>${x.k2?x.k2p+"%":"–"}</td></tr>`).join("")}</table><h2>Spieler</h2><table><tr><th>Name</th><th>Annahmen</th><th>A2+A3</th><th>Angriffe</th><th>Kills</th><th>Effizienz</th></tr>${rec.filter(x=>x.rec||x.att).map(x=>`<tr><td>${esc(nm(x.id))}</td><td>${x.rec}</td><td>${x.a2+x.a3}</td><td>${x.att}</td><td>${x.kill}</td><td>${x.att?x.eff+"%":"–"}</td></tr>`).join("")}</table><h2>Coaching-Notizen</h2><p>Stärke: _______________________________________________________________________</p><p>Baustelle: _____________________________________________________________________</p><p>Nächstes Training: ____________________________________________________________</p><p class="note">K1 = Sideout, K2 = Breakpoint. Quoten nur mit Stichprobengröße interpretieren.</p><button onclick="window.print()">Drucken</button></html>`;
 popup.document.write(html);popup.document.close();
}
function rallyLabel(x){let a=[];if(x.serve)a.push(`Aufschlag ${x.serve}`);if(x.receiver&&x.reception)a.push(`Annahme ${x.receiver} ${x.reception}`);if(x.setterTarget)a.push(`Zuspiel ${x.setterTarget}`);if(x.attacker)a.push(`Angriff ${nm(x.attacker)} ${x.zone||""} ${x.result||""}`.trim());else if(x.event==="OpponentAttack")a.push(`Gegnerangriff ${x.result||""}`.trim());else if(!a.length)a.push(x.event||"Rally");return a.join(" → ")}
function recent(){let r=allRallies().slice(-3).reverse();$("recent").innerHTML=`<h3>Abgeschlossene Rallyes · letzte drei</h3><div class="history">${r.length?r.map(x=>`S${x.set} · ${esc(x.after)} · ${esc(rallyLabel(x))} · ${esc(x.winner)}${x.observationComplete===false?" · unvollständig beobachtet":""}${x.turnaround?` · Angriffe ${x.turnaround.attacks} · Transitions ${x.turnaround.transitions}`:""}`).join("<br>"):"Noch keine Rally"}</div>`}
function render(){
 $('masterNav')?.querySelectorAll('#matchTactics,#turnaroundReport').forEach(n=>n.remove());
 document.body.classList.toggle("cockpitView",tab==="coach");
 document.body.classList.toggle("quickLive",liveMode==="quick"&&st.started&&view==="live"&&["rally","opponent"].includes(tab));
 saveLocal();
 if(!$("hybridModes")){const nav=document.createElement("section");nav.id="hybridModes";nav.className="card hybridModes";$("flow").before(nav)}
 $("hybridModes").innerHTML=`<button id="modeQuick" aria-pressed="${liveMode==='quick'}">Schnellmodus</button><button id="modeDetail" aria-pressed="${liveMode==='detail'}">Detailmodus</button>`;$("modeQuick").onclick=()=>hybridMode("quick");$("modeDetail").onclick=()=>hybridMode("detail");
 $("hybridModes").insertAdjacentHTML("beforeend",`<button id="matchTactics">Taktik</button><button id="formationEditor">Editor</button><button id="turnaroundReport">Analyse</button>`);$("matchTactics").onclick=()=>matchTactics();$("formationEditor").onclick=()=>formationEditor();$("turnaroundReport").onclick=analysisPanel;
 renderHeader();renderNav();document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 if(liveMode==="quick"&&(tab==="rally"||tab==="opponent"))rally();else if(tab==="rally")rally();else if(tab==="opponent")opponentTab();else if(tab==="coach")coach();else stats();if(liveMode==="detail"&&tab==="rally"&&st.started&&!st.setEnded&&view==="live")$("flow").insertAdjacentHTML("afterbegin",`<details class="detailBoard"><summary>Aktuelle Aufstellung · beide Mannschaften</summary>${boardView({quick:true,scouting:false,tactical:false})}</details>`);if(document.querySelector(".detailBoard"))bindBoardPlayers(document.querySelector(".detailBoard"));recent();if($("finishedNew"))$("finishedNew").onclick=newMatch;renderPlanEntry();renderMasterNav();
 $("nextSet").disabled=!st.setEnded||st.matchEnded;$("substitute").disabled=!st.started||view!=="live"||!!draft.step
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
$("startReceive").onclick=()=>start(false);$("startServe").onclick=()=>start(true);
function undoLast(){if(view!=="live")return toast("Undo nur LIVE");let x=st.rallyUndo.pop();if(!x)return toast("Keine Rally zum Undo");restore(x);draft={};clearDraftHistory();pendingMark=null;quickPending=null;selectedQuickPlayer=null;quickRevision++;closeModal();render();toast("Letzte Rally vollständig zurückgesetzt")}
$("undo").onclick=undoLast;$("newMatch").onclick=newMatch;
$("exportData").onclick=exportData;$("importData").onclick=importData;$("printReport").onclick=printReport;$("scoreFix").onclick=scoreFix;$("substitute").onclick=substitute;$("timeout").onclick=()=>{
 if(!st.started||view!=="live")return toast("Auszeit nur im laufenden Satz");
 modal(`<h2>Auszeit erfassen</h2><p class="small">${timeoutSummary()}</p><p class="small">Spielstand ${st.e}:${st.o} · S${st.set} · R${st.rot}</p><div class="grid2"><button id="toEVV" class="primary">EVV-Auszeit</button><button id="toOpp">${esc(opponent.name)}-Auszeit</button></div><button id="toCourt">Auszeit-Feld öffnen</button><button id="toCancel">Abbrechen</button>`);
 $("toEVV").onclick=()=>{if(timeoutCount("EVV")>=2)return toast("EVV: zwei Auszeiten verbraucht");st.events.push({type:"timeout",team:"EVV",set:st.set,score:`${st.e}:${st.o}`,rot:st.rot});closeModal();tab="coach";saveLocal();render();toast("EVV-Auszeit gespeichert")};
 $("toOpp").onclick=()=>{if(timeoutCount("Gegner")>=2)return toast("Gegner: zwei Auszeiten verbraucht");st.events.push({type:"timeout",team:"Gegner",set:st.set,score:`${st.e}:${st.o}`,rot:st.rot});closeModal();tab="coach";saveLocal();render();toast("Gegner-Auszeit gespeichert")};
 $('toCourt').onclick=()=>{matchTactics();$('modalBox').classList.add('presentation')};$("toCancel").onclick=closeModal;
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
 $("voiceNo").onclick=()=>{voicePending=null;closeModal();stopVoiceRecognition()};
 $("voiceYes").onclick=()=>{closeModal();executeVoice(cmd);voicePending=null;stopVoiceRecognition()};
}
function executeVoice(c){
 if(view!=="live")return toast("Sprachaktionen nur LIVE");
 if(c.type==="undo"){undoLast();return}
 if(c.type==="quick"){commit(c.winner,{event:"VoiceQuick",voice:c.raw});return}
 if(c.type==="serve"){if(c.result==="ACE"){nineZonePicker("ACE",{w:"EVV",data:{event:"Serve",serve:"ACE",voice:c.raw}})}else commit("Gegner",{event:"Serve",serve:"ERROR",voice:c.raw});return}
 if(c.type==="reception"){if(!receivers().includes(c.player))return toast(`${nm(c.player)} ist nicht in der aktuellen Annahme`); if(c.q==="A0")commit("Gegner",{event:"Reception",receiver:c.player,reception:c.q,voice:c.raw,result:"DIRECT_ERROR",chain:[{side:"EVV",type:"Reception",player:c.player,quality:"A0"}]});else{pushDraft();draft={step:"evvBall2",phase:"K1",receiver:c.player,reception:c.q,voice:c.raw,chain:[{side:"EVV",type:"Reception",player:c.player,quality:c.q}]};tab="rally";render();toast("Annahme gespeichert · Angriff weiter per Tap/Sprache")};return}
 if(c.type==="kill"){if(!attackers().includes(c.player))return toast(`${nm(c.player)} ist aktuell kein Angreifer`);pendingMark={w:"EVV",data:{event:"Attack",attacker:c.player,zone:c.zone,result:"KILL",voice:c.raw}};courtPicker();return}
 if(c.type==="block"){if(!front().includes(c.player))return toast(`${nm(c.player)} ist aktuell nicht Vorderreihe`);commit("EVV",{event:"Block",player:c.player,result:"BLOCK",voice:c.raw});return}
 if(c.type==="sub"){applySub(c.out,c.inn,c.raw);return}
 toast("Befehl nicht übernommen")
}
// Privacy and Safari stability: single recognition per explicit tap; never retry automatically.
function stopVoiceRecognition(){
 voiceListening=false;
 const old=voiceRec;voiceRec=null;
 if(old){old.onend=null;old.onerror=null;old.onresult=null;try{old.abort()}catch(e){}}
 const b=$("voiceBtn");if(b)b.textContent="🎙 Sprache";
 const indicator=$("voiceState");if(indicator){indicator.textContent="🎙 Sprache aus";indicator.classList.remove("listening")}
}
function startVoiceRecognition(){
 if(!SpeechAPI||!window.isSecureContext)return;
 stopVoiceRecognition();
 voiceListening=true;
 const b=$("voiceBtn");if(b)b.textContent="⏹ Sprache stoppen";
 try{
  const rec=new SpeechAPI();voiceRec=rec;rec.lang="de-DE";rec.interimResults=false;rec.continuous=false;rec.maxAlternatives=3;
  rec.onresult=e=>{const heard=e.results[e.results.length-1][0].transcript;const cmd=parseVoice(heard);stopVoiceRecognition();if(cmd.type==="unknown")toast(`Nicht sicher: „${heard}“`);else voiceConfirm(cmd)};
  rec.onerror=e=>{const reason=e.error;stopVoiceRecognition();if(reason!=="aborted")toast("Sprache beendet: "+reason+" · zum erneuten Start tippen")};
  rec.onend=()=>{if(voiceListening){stopVoiceRecognition();toast("Sprache beendet · zum erneuten Start tippen")}};
  rec.start();
 }catch(e){stopVoiceRecognition();toast("Mikrofon nicht gestartet · Browserberechtigung prüfen")}
}
function toggleVoice(){
 if(voiceListening){stopVoiceRecognition();toast("Sprache ausgeschaltet");return}
 if(!SpeechAPI||!window.isSecureContext){toast("Sprache benötigt einen kompatiblen Browser und HTTPS");return}
 startVoiceRecognition();
}
window.addEventListener("pagehide",stopVoiceRecognition);
document.addEventListener("visibilitychange",()=>{if(document.hidden)stopVoiceRecognition()});
$("voiceBtn").onclick=toggleVoice;

// Matchplan analytics only project documented contacts; optional context never adds game contacts.
const PLAN_TARGETS=['IV','III','II','PIPE','I','BACK'];
function planDefaults(){return {firstSetWin:true,minimum:5,openingOpponent:5,openingGap:3,targets:{k1:60,k2:35,middleGood:35,kill:45,freeDirect:60},curve:[[0,0],[5,8],[10,13],[15,18],[20,23]],shortCurve:[[0,0],[3,5],[6,8],[9,11],[12,14]]}}
function validCurve(curve){return Array.isArray(curve)&&curve.length>=2&&curve.length<=20&&curve[0]?.[0]===0&&curve[0]?.[1]===0&&curve.every((p,i)=>Array.isArray(p)&&p.length===2&&Number.isInteger(p[0])&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=100)&&(!i||p[0]>curve[i-1][0]&&p[1]>=curve[i-1][1]))}
function validatePlan(p){if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!['firstSetWin','minimum','openingOpponent','openingGap','targets','curve','shortCurve'].includes(k))||typeof p.firstSetWin!=='boolean'||!Number.isInteger(p.minimum)||p.minimum<3||p.minimum>50||!Number.isInteger(p.openingOpponent)||p.openingOpponent<1||p.openingOpponent>20||!Number.isInteger(p.openingGap)||p.openingGap<1||p.openingGap>10||!validCurve(p.curve)||!validCurve(p.shortCurve)||!p.targets||Object.keys(p.targets).length!==5||!['k1','k2','middleGood','kill','freeDirect'].every(k=>Number.isFinite(p.targets[k])&&p.targets[k]>=0&&p.targets[k]<=100))throw Error('Matchplan: Ziele, Stichprobe und ansteigende Kurven ab 0:0 prüfen');return true}
function currentPlan(){return clone(st.matchPlan||planDefaults())}
function saveMatchPlan(p,name=''){validatePlan(p);if(name){name=name.trim().slice(0,50);if(!name||['__proto__','constructor','prototype'].includes(name))throw Error('Vorlagenname prüfen')}const old=st.matchPlan,templates=st.matchPlanTemplates;st.matchPlan=clone(p);if(name)st.matchPlanTemplates={...templates,[name]:clone(p)};if(!saveLocal()){if(old)st.matchPlan=old;else delete st.matchPlan;if(templates)st.matchPlanTemplates=templates;else delete st.matchPlanTemplates;throw Error('Matchplan nicht gespeichert')}return true}
function pacerAt(opponentScore,curve){if(!Number.isFinite(opponentScore)||opponentScore<0||opponentScore>10000||!validCurve(curve))throw Error('Ungültige Pacer-Kurve');let i=1;while(i<curve.length-1&&opponentScore>curve[i][0])i++;const [x0,y0]=curve[i-1],[x1,y1]=curve[i];return y0+(opponentScore-x0)*(y1-y0)/(x1-x0)}
function livePacer(){const p=currentPlan(),goal=pacerAt(st.o,st.set===5?p.shortCurve:p.curve),delta=st.e-goal;return {e:st.e,o:st.o,set:st.set,goal,delta,status:st.e+st.o===0?'neutral':delta>=0?'green':delta<=-p.openingGap?'red':'amber',progress:goal?Math.min(100,Math.max(0,100*st.e/goal)):st.e?100:0}}
function planRatio(n,d){return {n,d,pct:d?100*n/d:null}}
function receptionCategory(q){return ({A3:'A+',A2:'A~',A1:'A−'})[q]||null}
function coachTarget(t){return PLAN_TARGETS.includes(t)?(['PIPE','I','BACK'].includes(t)?'Hinterfeld':t):null}
function attackOutcome(c,chain,index){if(c.result)return c.result;const next=chain[index+1];return next?.side==='EVV'&&next.type==='AttackResult'?next.result:null}
function knownAttackResult(result){return ['KILL','BLOCK_OUT','ERROR','BLOCKED','CONTINUE','BLOCK_TOUCH','BLOCK_CONTINUE'].includes(result)}
function receptionBefore(chain,index){for(let i=index-1;i>=0;i--){const c=chain[i];if(c.side==='Gegner'||c.side==='EVV'&&['Attack','Defense','TransitionChance','FreeBall'].includes(c.type))return null;if(c.side==='EVV'&&c.type==='Reception')return ['A3','A2','A1','A0'].includes(c.quality)?c.quality:null}return null}
function annotatedSetter(c,meta){return c.setter||c.player||(Object.prototype.hasOwnProperty.call(meta||{},'setter')?meta.setter:null)||null}
function setterAnalysis(rr,filter={}){
 const rows=[];let unattributedAttacks=0;
 for(const r of rr){const chain=r.chain||[];if(r.event==='Attack'&&r.attacker&&!chain.some(c=>c.side==='EVV'&&c.type==='Attack'))unattributedAttacks++;const seen=new Set(),phase=r.phase|| (r.servingBefore===true?'K2':r.servingBefore===false?'K1':null);let reception=null,pending=null;
 for(let i=0;i<chain.length;i++){const c=chain[i];if(c.id&&seen.has(c.id))continue;if(c.id)seen.add(c.id);const meta=r.coaching?.contacts?.[i]||{};
 if(c.side==='EVV'&&c.type==='Reception')reception=c.quality;
 if(c.side==='Gegner'&&['Attack','FreeBall','Serve','Set','SecondBall'].includes(c.type)||c.side==='EVV'&&['Defense','TransitionChance'].includes(c.type)){reception=null;pending=null}
 if(c.side==='EVV'&&c.type==='Set'){pending={setter:annotatedSetter(c,meta),quality:receptionCategory(reception||meta.quality),rawQuality:reception||meta.quality||null,assignmentSource:c.player||c.setter?'contact':meta.setterSource||meta.source||'unknown',target:coachTarget(c.target),rawTarget:c.target||null,phase,attacker:null,result:null,source:'set-contact',set:r.set,rotation:r.rotation};rows.push(pending)}
 if(c.side==='EVV'&&c.type==='Attack'){if(pending){pending.attacker=c.player||null;pending.result=attackOutcome(c,chain,i);pending=null}else if(Object.prototype.hasOwnProperty.call(r.coaching?.contacts||{},i)){rows.push({setter:meta.setter||null,quality:receptionCategory(reception||meta.quality),rawQuality:reception||meta.quality||null,target:coachTarget(c.route)||coachTarget(meta.target),rawTarget:coachTarget(c.route)?c.route:meta.target||null,phase,attacker:c.player||null,result:attackOutcome(c,chain,i),source:'attack-context',assignmentSource:meta.setterSource||meta.source||'unknown',set:r.set,rotation:r.rotation})}else unattributedAttacks++;reception=null}
 if(c.side==='EVV'&&c.type==='FreeBall'){pending=null;reception=null}
 }}
 const comparable=rows.filter(x=>(!filter.setter||x.setter===filter.setter)&&(!filter.quality||x.quality===filter.quality)),selected=comparable.filter(x=>!filter.phase||x.phase===filter.phase);
 const ratioFor=rr=>planRatio(rr.filter(x=>x.target==='III').length,rr.filter(x=>x.target!==null).length),distribution={};for(const target of ['IV','III','II','Hinterfeld',null]){const subset=selected.filter(x=>x.target===target),attacks=subset.filter(x=>knownAttackResult(x.result));distribution[target||'unknown']={count:subset.length,share:planRatio(subset.length,selected.length),kill:planRatio(attacks.filter(x=>['KILL','BLOCK_OUT'].includes(x.result)).length,attacks.length),error:planRatio(attacks.filter(x=>['ERROR','BLOCKED'].includes(x.result)).length,attacks.length),unknownAttack:subset.length-attacks.length}}
 const phases={};for(const phase of ['K1','K2']){const rr=comparable.filter(x=>x.phase===phase),att=rr.filter(x=>knownAttackResult(x.result));phases[phase]={samples:rr.length,middle:ratioFor(rr),kill:planRatio(att.filter(x=>['KILL','BLOCK_OUT'].includes(x.result)).length,att.length)}}
 return {rows:selected,allRows:rows,phases,middleDelta:phases.K1.middle.d&&phases.K2.middle.d?phases.K1.middle.pct-phases.K2.middle.pct:null,contactSetter:selected.filter(x=>x.setter&&x.assignmentSource==='contact').length,automatic:selected.filter(x=>x.setter&&x.assignmentSource==='automatic').length,manual:selected.filter(x=>x.setter&&x.assignmentSource==='manual').length,unattributedAttacks,distribution,middle:ratioFor(selected),middleGood:ratioFor(selected.filter(x=>x.quality==='A+')),middleMedium:ratioFor(selected.filter(x=>x.quality==='A~')),middlePoor:ratioFor(selected.filter(x=>x.quality==='A−')),unknownSetter:selected.filter(x=>!x.setter).length,unknownTarget:selected.filter(x=>!x.target).length,a0:selected.filter(x=>x.rawQuality==='A0').length,unknownQuality:selected.filter(x=>!x.quality&&x.rawQuality!=='A0').length,explicitSets:selected.filter(x=>x.source==='set-contact').length,contexts:selected.filter(x=>x.source==='attack-context').length};
}
function freeChanceRecords(r){
 const ch=r.chain||[],events=[],seen=new Set();for(let i=0;i<ch.length;i++){const c=ch[i];if(c.id&&seen.has(c.id))continue;if(c.id)seen.add(c.id);if(c.side==='Gegner'&&c.type==='FreeBall'&&c.kind==='FREE')events.push({index:i+1,source:'contact'})}
 for(const f of r.coaching?.freeChances||[])events.push({index:f.index,source:'manual'});events.sort((a,b)=>a.index-b.index|| (a.source==='contact'?-1:1));
 const chances=[];for(const e of events){const previous=chances.at(-1);if(previous&&!ch.slice(previous.index,e.index).some(c=>c.type==='Attack'&&c.side==='EVV'||c.side==='Gegner'||c.side==='EVV'&&c.type==='FreeBall'))continue;chances.push({...e})}
 return chances.map((e,k)=>{let organized=null,firstAttack=null,direct=null,interrupted=false;const end=chances[k+1]?.index??ch.length;for(let i=e.index;i<end;i++){const c=ch[i];if(c.side==='Gegner'||c.side==='EVV'&&c.type==='FreeBall'){interrupted=true;break}if(c.side==='EVV'&&c.type==='Set')organized=true;if(c.side==='EVV'&&c.type==='Attack'){const override=r.coaching?.contacts?.[i]?.organized;if(typeof override==='boolean')organized=override;const result=attackOutcome(c,ch,i);firstAttack={player:c.player||null,result};if(knownAttackResult(result))direct=['KILL','BLOCK_OUT'].includes(result);break}if(c.side==='EVV'&&['Defense','Reception'].includes(c.type)&&['D0','A0'].includes(c.quality)){interrupted=true;break}}
 if(interrupted)direct=false;if(direct===null&&['Serve','Defense','Reception','OpponentAttack','OpponentDefense','SecondBall','OpponentSecondBall'].includes(r.event))direct=false;
 return {...e,organized:firstAttack?organized:null,firstAttack,direct};});
}
function freeBallAnalysis(rr){let chances=0,organized=0,unknownOrganization=0,directKills=0,observedDirect=0,chanceRallies=0,pointWins=0,lateWins=0,unknownDirect=0,multiple=0,knownPoints=0,unclassifiedWins=0;for(const r of rr){const list=freeChanceRecords(r);if(!list.length)continue;chanceRallies++;if(list.length>1)multiple++;chances+=list.length;organized+=list.filter(x=>x.organized===true).length;unknownOrganization+=list.filter(x=>x.organized===null).length;directKills+=list.filter(x=>x.direct===true).length;observedDirect+=list.filter(x=>x.direct!==null).length;unknownDirect+=list.filter(x=>x.direct===null).length;if(['EVV','Gegner'].includes(r.winner))knownPoints++;if(r.winner==='EVV'){pointWins++;if(list.every(x=>x.direct===false))lateWins++;else if(!list.some(x=>x.direct===true))unclassifiedWins++}}
 return {chances,organized,unknownOrganization,chanceRallies,pointWins,lateWins,unclassifiedWins,multiple,unknownDirect,direct:planRatio(directKills,observedDirect),point:planRatio(pointWins,knownPoints)};
}
function validateCoachData(c,chain,allowPending=false){if(c===undefined)return;const fail=()=>{throw Error('Ungültiger Scouting-Kontext')},obj=x=>x&&typeof x==='object'&&!Array.isArray(x),entry=x=>obj(x)&&Object.keys(x).every(k=>['setter','target','source','organized','quality','setterSource'].includes(k))&&(x.setter===undefined||x.setter===null||!!byId(x.setter))&&(x.target===undefined||x.target===null||PLAN_TARGETS.includes(x.target))&&(x.quality===undefined||x.quality===null||['A3','A2','A1','A0'].includes(x.quality))&&(x.setterSource===undefined||['automatic','manual','contact'].includes(x.setterSource))&&(x.source===undefined||['automatic','manual'].includes(x.source))&&(x.organized===undefined||x.organized===null||typeof x.organized==='boolean');
 if(!obj(c)||Object.keys(c).some(k=>!['contacts','pending','freeChances'].includes(k)))fail();if(c.pending!==undefined&&(!allowPending||!entry(c.pending)))fail();if(c.contacts!==undefined&&(!obj(c.contacts)||Object.entries(c.contacts).some(([i,x])=>!/^\d+$/.test(i)||!chain[+i]||chain[+i].side!=='EVV'||!['Set','Attack'].includes(chain[+i].type)||!entry(x))))fail();if(c.freeChances!==undefined&&(!Array.isArray(c.freeChances)||c.freeChances.length>200||c.freeChances.some(x=>!obj(x)||Object.keys(x).some(k=>k!=='index')||!Number.isInteger(x.index)||x.index<0||x.index>chain.length)||new Set(c.freeChances.map(x=>x.index)).size!==c.freeChances.length))fail();
}
function inferredSetter(chain,index){const ids=active().filter(id=>roleOf(id)==='Z');if(ids.length!==1)return null;for(let i=index-1;i>=0;i--){if(chain[i].side==='Gegner')break;if(chain[i].side==='EVV'&&chain[i].player&&['Reception','Defense','Set','SecondBall'].includes(chain[i].type)){if(chain[i].player===ids[0])return null;break}}return ids[0]}
function captureCoachContact(chain,index){const c=chain[index];if(!c||c.side!=='EVV'||!['Set','Attack'].includes(c.type))return;const coach=draft.coaching||(draft.coaching={contacts:{}});coach.contacts=coach.contacts||{};if(coach.contacts[index])return;const pending=coach.pending||{},has=k=>Object.prototype.hasOwnProperty.call(pending,k),previousSet=chain.slice(0,index).reverse().find(x=>['Set','Attack','Defense','TransitionChance','FreeBall'].includes(x.type)||x.side==='Gegner');
 // An attack already associated with a recorded set must not become a second pass sample.
 if(c.type==='Attack'&&previousSet?.side==='EVV'&&previousSet.type==='Set'){const organized=pending.organized??coach.contacts[chain.lastIndexOf(previousSet)]?.organized;if(typeof organized==='boolean')coach.contacts[index]={organized,source:'manual'};delete coach.pending;return}
 const routes=c.type==='Set'?[c.target]:c.route?[c.route]:attackRoutesFor(c.player),target=c.type==='Set'?c.target:has('target')?pending.target:routes.length===1?routes[0]:null;
 coach.contacts[index]={setter:has('setter')?pending.setter:inferredSetter(chain,index),target:PLAN_TARGETS.includes(target)?target:null,source:Object.keys(pending).length?'manual':'automatic',setterSource:has('setter')?'manual':'automatic',quality:receptionBefore(chain,index)||(has('quality')?pending.quality:null),organized:typeof pending.organized==='boolean'?pending.organized:null};delete coach.pending;
}
function markFreeChance(){if(!st.started||st.setEnded||st.matchEnded||view!=='live')return toast('Dankeball nur im laufenden Spiel');const chain=draft.chain||[],pending=freeChanceRecords({chain,coaching:draft.coaching}).at(-1);if(pending&&!chain.slice(pending.index).some(c=>c.side==='Gegner'||c.side==='EVV'&&['Attack','FreeBall'].includes(c.type)))return toast('Dankeball-Chance bereits erfasst');pushDraft();draft.coaching=draft.coaching||{};draft.coaching.freeChances=draft.coaching.freeChances||[];let index=chain.length;if(chain.at(-1)?.side==='EVV'&&chain.at(-1)?.type==='Attack'&&!chain.at(-1).result){index--;if(chain[index-1]?.side==='EVV'&&chain[index-1].type==='Set')index--}if(chain.at(-1)?.side==='EVV'&&chain.at(-1)?.type==='Set')index=Math.max(0,chain.length-1);if(!draft.coaching.freeChances.some(x=>x.index===index))draft.coaching.freeChances.push({index});if(!['evvBall2','evvSet','evvAttack','evvAttackResult'].includes(draft.step))draft.step='evvDefense';closeModal();collapsePlanDock();render();toast('Dankeball-Chance erfasst · kein Punkt, kein zusätzlicher Angriff')}
function collapsePlanDock(){document.querySelector('.bottom')?.classList.remove('expanded');if($('moreActions')){$('moreActions').textContent='Mehr ⋯';$('moreActions').setAttribute('aria-expanded','false')}}
function openingCoaching(){const p=currentPlan(),rr=allRallies().filter(r=>r.set===1);const found=rr.find(r=>typeof r.after==='string'&&/^\d+:\d+$/.test(r.after)&&Number(r.after.split(':')[1])===p.openingOpponent);let score=found?found.after.split(':').map(Number):null;if(!score&&st.set===1&&st.o===p.openingOpponent)score=[st.e,st.o];const goal=pacerAt(p.openingOpponent,p.curve),first=st.set===1?st:st.sets.find(s=>s.set===1);let early=false;if(!score&&first&&first.o<p.openingOpponent&&first.e>=goal){score=[first.e,first.o];early=true}const delta=score?score[0]-goal:null;let hint='';if(delta!==null&&delta<=-p.openingGap&&st.set===1&&st.o<=p.openingOpponent){const prefix=found?rr.slice(0,rr.indexOf(found)+1):rr,k1=cockpitMetrics(prefix).k1;hint=`Startphase ${planNumber(delta)} – ${k1.denominator>=p.minimum&&k1.percent<p.targets.k1?'K1 prüfen.':'Zwischenziel verfehlt.'}`}
 return {goal,score,delta,hint,early,state:score?(delta>=0?'erreicht':'verfehlt'):st.set===1&&st.o<p.openingOpponent?'offen':'nicht dokumentiert'};
}
function planNumber(n){return Number(n.toFixed(1)).toLocaleString('de-DE')}
function planPercent(q){return q.d?planNumber(q.pct)+' %':'–'}
function planRatioHTML(q,goal=null){const p=currentPlan(),status=q.d<p.minimum?'neutral':goal===null?'neutral':q.pct>=goal?'green':'amber';return `<span class="planValue ${status}">${planPercent(q)}</span><small>${q.n} / ${q.d}${q.d<p.minimum?' · wenig Daten':''}${goal!==null?' · Ziel '+goal+' %':''}</small>`}
function planBarHTML(prefix){const p=currentPlan(),pace=livePacer(),m=cockpitMetrics(st.rallies),s=setterAnalysis(st.rallies),f=freeBallAnalysis(st.rallies),signal=rotationSignal(st.rallies.filter(r=>r.rotation===st.rot),st.serving?'K2':'K1');return `<nav class="matchPlanBar" aria-label="Matchplan live"><button id="${prefix}Pacer"><span>LIVE-PACER</span><b class="${pace.status}">${pace.delta>0?'+':''}${planNumber(pace.delta)}</b><small>${st.e}:${st.o} · Ziel ${planNumber(pace.goal)}</small></button><button id="${prefix}K1"><span>K1</span>${planRatioHTML(planRatio(m.k1.numerator,m.k1.denominator),p.targets.k1)}</button><button id="${prefix}K2"><span>K2</span>${planRatioHTML(planRatio(m.k2.numerator,m.k2.denominator),p.targets.k2)}</button><button id="${prefix}Middle"><span>Mitte bei A+</span>${planRatioHTML(s.middleGood,p.targets.middleGood)}</button><button id="${prefix}Free"><span>Dankeball direkt</span>${planRatioHTML(f.direct,p.targets.freeDirect)}</button><button id="${prefix}Rotation"><span>Rotation R${st.rot}</span><b>${esc(cockpitStatus[signal.status])}</b><small>${signal.numerator} / ${signal.denominator}</small></button></nav>`}
function bindPlanBar(prefix){$(prefix+'Pacer').onclick=()=>matchPlanPanel();$(prefix+'K1').onclick=()=>analysisPanel({phase:'K1'});$(prefix+'K2').onclick=()=>analysisPanel({phase:'K2'});$(prefix+'Middle').onclick=()=>setterPanel({quality:'A+'});$(prefix+'Free').onclick=freeBallPanel;$(prefix+'Rotation').onclick=()=>rotationCoaching()}

function capturePanel(){
 const ch=draft.chain||[],last=ch.at(-1),open=last?.side==='EVV'&&['Set','Attack'].includes(last.type)&&!last.result,index=open?ch.length-1:null;let contextIndex=index;if(open&&last.type==='Attack'){for(let i=index-1;i>=0;i--){if(ch[i].side==='Gegner'||['Attack','Defense','TransitionChance','FreeBall'].includes(ch[i].type))break;if(ch[i].side==='EVV'&&ch[i].type==='Set'){contextIndex=i;break}}}const contact=contextIndex===null?null:ch[contextIndex],meta={...(contextIndex!==null?draft.coaching?.contacts?.[contextIndex]:draft.coaching?.pending),...(index!==null?draft.coaching?.contacts?.[index]:{})};
 modal(`<h2>Zuspiel & Dankeball · optional</h2><p class="small">Keine Pflichtangabe. Automatisch nur bei eindeutiger aktiver Besetzung und eindeutigem Angriffsweg. Unbekannt bleibt unbekannt. Bereits erfasste Kontakte werden nicht verdoppelt.</p><label>Zuspieler<select id="contextSetter"><option value="auto">Automatisch, falls eindeutig</option><option value="unknown">Unbekannt</option>${active().map(id=>`<option value="${esc(id)}">${esc(nm(id))}</option>`).join('')}</select></label><label>Ziel des nächsten Angriffs<select id="contextTarget"><option value="auto">Automatisch, falls eindeutig</option><option value="unknown">Unbekannt</option>${[['IV','IV'],['III','III · Mitte'],['II','II'],['BACK','Hinterfeld · Zone offen'],['I','Hinterfeld I'],['PIPE','Pipe']].map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label><label>Dokumentierte Annahme vor diesem Angriff<select id="contextQuality"><option value="auto">Vorhandene Annahme übernehmen</option><option value="unknown">Unbekannt</option><option value="A3">A+ · A3</option><option value="A2">A~ · A2</option><option value="A1">A− · A1</option><option value="A0" disabled>A0 · gesonderter Fehler</option></select></label><label>Organisierter erster Angriff nach Dankeball<select id="contextOrganized"><option value="">Nicht zusätzlich beurteilt</option><option value="yes">Ja · beobachtet</option><option value="no">Nein · beobachtet</option></select></label><div class="grid2"><button id="contextFree">Dankeball-Chance markieren</button><button id="contextUnmark">Letzte offene Markierung entfernen</button></div><p class="small">Nur einen tatsächlich beobachteten gegnerischen Dankeball markieren. FREE ist eine Chance; CUT/Notball, bloße Abwehr und eigener Dankeball sind keine automatischen Chancen.</p><div class="grid2"><button id="contextCancel">Schließen</button><button id="contextSave" class="primary">Kontext übernehmen</button></div>`);
 $('contextSetter').value=(meta.setterSource||meta.source)==='manual'?(meta.setter||'unknown'):'auto';$('contextTarget').value=meta.source==='manual'?(meta.target||'unknown'):'auto';$('contextQuality').value=meta.source==='manual'?(meta.quality||'unknown'):'auto';const reception=receptionBefore(ch,index??ch.length);if(reception){$('contextQuality').value=reception;$('contextQuality').disabled=true};$('contextOrganized').value=meta.organized===true?'yes':meta.organized===false?'no':'';
 if(contact?.type==='Set'||contact?.type==='Attack'&&contact.route){$('contextTarget').value=contact.target||contact.route;$('contextTarget').disabled=true;if(contact.player||contact.setter){$('contextSetter').value=contact.player||contact.setter;$('contextSetter').disabled=true}}
 $('contextFree').disabled=!st.started||st.setEnded||st.matchEnded||view!=='live';$('contextFree').onclick=markFreeChance;
 $('contextUnmark').onclick=()=>{const list=draft.coaching?.freeChances;if(!list?.length)return toast('Keine optionale Markierung');const f=list.at(-1);if(ch.slice(f.index).some(c=>c.side==='EVV'&&c.type==='Attack'&&c.result||c.side==='Gegner'))return toast('Nur eine noch offene Markierung entfernen');pushDraft();list.pop();closeModal();render();toast('Offene Dankeball-Markierung entfernt')};
 $('contextSave').onclick=()=>{if(!st.started||st.setEnded||st.matchEnded||view!=='live')return toast('Kontext nur in laufender Rallye');pushDraft();const p={},setter=$('contextSetter').value,target=$('contextTarget').value,organized=$('contextOrganized').value;if(setter!=='auto'&&!$('contextSetter').disabled)p.setter=setter==='unknown'?null:setter;if(target!=='auto'&&!$('contextTarget').disabled)p.target=target==='unknown'?null:target;if(Object.prototype.hasOwnProperty.call(p,'setter'))p.setterSource='manual';if(organized)p.organized=organized==='yes';const quality=$('contextQuality').value;if(quality!=='auto'&&!$('contextQuality').disabled)p.quality=quality==='unknown'?null:quality;draft.coaching=draft.coaching||{};if(index!==null){draft.coaching.contacts=draft.coaching.contacts||{};const old=draft.coaching.contacts[contextIndex]||{};draft.coaching.contacts[contextIndex]={...old,...p,source:'manual'};if(index!==contextIndex&&Object.prototype.hasOwnProperty.call(p,'organized'))draft.coaching.contacts[index]={...draft.coaching.contacts[index],organized:p.organized,source:'manual'}}else if(Object.keys(p).length)draft.coaching.pending={...p,source:'manual'};else delete draft.coaching.pending;closeModal();collapsePlanDock();render();toast('Optionaler Kontext übernommen')};$('contextCancel').onclick=closeModal;
}
function setterPanel(initial={}){
 modal(`<section id="setterAnalysis"><div class="cockpitHeading"><h2>Zuspieler-Cockpit</h2><button id="setterClose">Schließen</button></div><p class="small">Den Gegner schwindlig spielen! Nur dokumentierte Zuspiele und beim Erfassen zugeordnete Angriffskontexte. Keine nachträgliche Zuordnung älterer unbekannter Zuspieler.</p><div class="grid2"><label>Zeitraum<select id="setterScope"><option value="live">LIVE · aktueller Satz</option><option value="match">MATCH</option></select></label><label>Zuspieler<select id="setterPlayer"><option value="">Alle · einschließlich unbekannt</option>${roster.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label><label>Annahme<select id="setterQuality"><option value="">Alle Qualitäten</option><option>A+</option><option>A~</option><option>A−</option></select></label><label>Phase<select id="setterPhase"><option value="">K1 + K2</option><option>K1</option><option>K2</option></select></label></div><div id="setterResults"></div><details><summary>Definitionen & Datenqualität</summary><p class="small">A3 → A+, A2 → A~, A1 → A−. A0 bleibt gesonderter direkter Annahmefehler, unbekannte Annahme bleibt unbekannt. Ziele I und Pipe zählen als Hinterfeld. Mitte-Anteile beziehen sich auf bekannte Ziele. Angriffspunkt/Fehler beziehen sich auf Angriffe mit dokumentiertem Ergebnis; Block-out ist Angriffspunkt, ERROR/BLOCKED sind Fehler/Blockverlust. Unbeobachtete Ergebnisse werden ausgeschlossen.</p></details><button id="setterCapture">Optionalen Rallye-Kontext erfassen</button></section>`);
 $('setterQuality').value=initial.quality||'';$('setterPlayer').value=initial.setter||'';
 function draw(){const rr=$('setterScope').value==='match'?allRallies():st.rallies,x=setterAnalysis(rr,{setter:$('setterPlayer').value,quality:$('setterQuality').value,phase:$('setterPhase').value});
 $('setterResults').innerHTML=`${middlePacerHTML(rr,{setter:$('setterPlayer').value,quality:$('setterQuality').value,phase:$('setterPhase').value})}<div class="planSummary"><article><h3>Mitte gesamt</h3>${planRatioHTML(x.middle)}</article><article><h3>Mitte bei A+</h3>${planRatioHTML(x.middleGood,currentPlan().targets.middleGood)}</article><article><h3>Mitte bei A~</h3>${planRatioHTML(x.middleMedium)}</article><article><h3>Mitte bei A−</h3>${planRatioHTML(x.middlePoor)}</article></div><div class="planTableWrap"><table class="statsTable"><thead><tr><th>Ziel</th><th>Verteilung</th><th>Angriffspunkt</th><th>Fehler/Blockverlust</th></tr></thead><tbody>${['IV','III','II','Hinterfeld','unknown'].map(k=>{const z=x.distribution[k];return `<tr data-setter-target="${k}"><th>${k==='unknown'?'Unbekannt':k}</th><td>${planRatioHTML(z.share)}</td><td>${planRatioHTML(z.kill)}</td><td>${planRatioHTML(z.error)}</td></tr>`}).join('')}</tbody></table></div><p id="setterQualityNote" class="draftNotice">${x.explicitSets} Zuspielkontakte · ${x.contexts} Angriffskontexte · Zuspieler im Kontakt ${x.contactSetter} / automatisch ${x.automatic} / manuell ${x.manual} / unbekannt ${x.unknownSetter} · Ziel unbekannt ${x.unknownTarget} · A0 gesondert ${x.a0} · Annahme unbekannt ${x.unknownQuality} · Angriffe ohne Zuspielkontext ${x.unattributedAttacks}</p><details><summary>K1 / K2 direkt vergleichen</summary><div class="planSummary">${['K1','K2'].map(phase=>`<article><h3>${phase} · Mitte</h3>${planRatioHTML(x.phases[phase].middle)}<h3>Angriffspunktquote</h3>${planRatioHTML(x.phases[phase].kill)}</article>`).join('')}</div><p class="small">Mitte K1 minus K2: ${x.middleDelta===null?'–':planNumber(x.middleDelta)+' Prozentpunkte'} · gleicher Zuspieler-/Annahmefilter</p></details><p class="small">K1/K2 bleibt die ursprüngliche Phase der Rallye. Bei laufender Rallye werden noch keine Quoten ergänzt.</p>`;
 }
 for(const id of ['setterScope','setterPlayer','setterQuality','setterPhase'])$(id).onchange=draw;$('setterClose').onclick=closeModal;$('setterCapture').onclick=capturePanel;draw();
}
function freeBallPanel(){
 modal(`<section><div class="cockpitHeading"><h2>Dankeball-Verwertung</h2><button id="freeClose">Schließen</button></div><label>Zeitraum<select id="freeScope"><option value="live">LIVE · aktueller Satz</option><option value="match">MATCH</option></select></label><div id="freeResults"></div><details><summary>Was zählt?</summary><p class="small">Eine Chance entsteht nur aus gegnerischem FREE-Kontakt oder optionaler ausdrücklicher Markierung. Der erste eigene Angriff bis zum nächsten gegnerischen Kontakt zählt für die Direktquote. Organisiert bedeutet beobachtetes Zuspiel plus Angriff oder eine ausdrückliche Trainerbewertung. Direkte Kills und spätere Siege sind getrennt. Unbekannte Direktergebnisse werden aus deren Nenner ausgeschlossen und angezeigt. Die Punktquote zählt Ballwechsel mit Chance einmal, auch bei mehreren Chancen.</p></details><button id="freeMark">Dankeball-Chance jetzt markieren</button></section>`);
 const draw=()=>{const x=freeBallAnalysis($('freeScope').value==='match'?allRallies():st.rallies),running=freeChanceRecords({chain:draft.chain||[],coaching:draft.coaching}).length;$('freeResults').innerHTML=`<div class="planSummary"><article><h3>Direkte Killquote</h3><div data-free="direct">${planRatioHTML(x.direct,currentPlan().targets.freeDirect)}</div></article><article><h3>Punktquote · Ballwechsel</h3><div data-free="point">${planRatioHTML(x.point)}</div></article></div><p id="freeCounts">${x.chances} dokumentierte Chancen · ${x.chanceRallies} Ballwechsel · ${x.organized} organisierte erste Angriffe · ${x.lateWins} spätere Gewinne</p><p class="draftNotice">Direktergebnis unbekannt ${x.unknownDirect} · Aufbau unbewertet ${x.unknownOrganization} · Siege mit unklarem Direktverlauf ${x.unclassifiedWins} · laufende Rallye ${running} Chancen (separat, noch ohne Quote)</p>`};$('freeScope').onchange=draw;$('freeClose').onclick=closeModal;$('freeMark').onclick=markFreeChance;draw();
}
function matchPlanPanel(){
 const p=currentPlan(),pace=livePacer(),opening=openingCoaching(),first=st.sets.find(x=>x.set===1)||(st.set===1&&st.setEnded?st:null),firstState=!p.firstSetWin?'deaktiviert':first?(first.e>first.o?'erreicht':'verfehlt'):st.set>1?'nicht dokumentiert':'offen';
 modal(`<section id="matchPlanPanel"><div class="cockpitHeading"><div><span class="eyebrow">DEN GEGNER SCHWINDLIG SPIELEN!</span><h2>Matchplan & Live-Pacer</h2></div><button id="planClose">Schließen</button></div>${planBarHTML('panel')}<div class="pacerCard ${pace.status}"><span>Satz ${pace.set} · ${pace.e}:${pace.o}</span><strong id="pacerDeviation">LIVE-PACER ${pace.delta>0?'+':''}${planNumber(pace.delta)}</strong><span id="pacerTarget">Zielwert ${planNumber(pace.goal)} · Abweichung in Punkten</span><meter id="pacerProgress" min="0" max="100" value="${pace.progress}" aria-label="Erfüllung des aktuellen Punktziels"></meter><small>Soll-Ist-Vergleich · keine Vorhersage des Satzgewinns</small></div><p id="openingStatus">Startziel Satz 1: EVV ${planNumber(opening.goal)} bei Gegner ${p.openingOpponent} · ${opening.state}${opening.early?' · vorzeitig belegt':''}${opening.score?' ('+opening.score.join(':')+')':''}</p>${opening.hint?`<p class="openingHint">${esc(opening.hint)}</p>`:''}<div class="planSummary"><article><h3>Angriffspunktquote</h3><button id="planKill">${planRatioHTML(planRatio(cockpitMetrics(st.rallies).attack.numerator,cockpitMetrics(st.rallies).attack.denominator),p.targets.kill)}</button></article><article><h3>Ersten Satz gewinnen</h3><b id="firstSetGoal">${firstState}</b><small>Konfigurierbares Trainerziel</small></article></div>${middlePacerHTML(st.rallies)}<div class="grid3"><button id="planEdit">Trainerziele bearbeiten</button><button id="planSetter">Zuspieler-Cockpit</button><button id="planCapture">Optionaler Rallye-Kontext</button></div><details><summary>Zielkurven & Definition</summary><p class="small">Zwischen den Stützpunkten wird linear interpoliert. Ab dem letzten Punkt wird die letzte Steigung fortgesetzt; es wird kein Satzgewinn vorhergesagt. Die Anzeige rundet erst am Ende auf eine Dezimalstelle. Grün: Ziel erreicht/voraus. Gelb: kleiner Rückstand. Rot: Rückstand ab ${p.openingGap} Punkten. 0:0 bleibt neutral. Satz 5 hat eine eigene konfigurierbare 15-Punkte-Kurve.</p><p>${p.curve.map(([o,e])=>'Gegner '+o+' → EVV '+e).join(' · ')}</p><p class="small">Ziele sind bearbeitbare Trainer-Vorschläge, keine allgemeingültigen Leistungsnormen. Die Leiste zeigt den aktuellen Satz; Zuspiel-/Dankeball-Details bieten LIVE und MATCH.</p></details></section>`);
 bindPlanBar('panel');$('planClose').onclick=closeModal;$('planEdit').onclick=matchPlanEditor;$('planSetter').onclick=()=>setterPanel();$('planCapture').onclick=capturePanel;$('planKill').onclick=()=>analysisPanel();
}
function matchPlanEditor(){
 const initial=currentPlan();let working=clone(initial),baseline=JSON.stringify(initial);const read=()=>{const targets=Object.fromEntries(['k1','k2','middleGood','kill','freeDirect'].map(k=>[k,$('goal-'+k).value.trim()===''?NaN:Number($('goal-'+k).value)]));const parse=id=>$(id).value.split(/\n/).map(line=>line.trim()).filter(Boolean).map(line=>{const parts=line.split(':');return parts.length===2&&parts.every(p=>p.trim()!=='')?parts.map(Number):[NaN,NaN]});return {firstSetWin:$('planFirst').checked,minimum:Number($('planMinimum').value),openingOpponent:Number($('planOpening').value),openingGap:Number($('planGap').value),targets,curve:parse('planCurve'),shortCurve:parse('planShortCurve')}};
 modal(`<h2>Matchplan · Trainerziele</h2><p class="small">Bearbeitbare Vorschläge, keine allgemeingültigen Leistungsnormen. Änderungen gelten für dieses Spiel; benannte Vorlagen sind wiederverwendbar.</p><label><input id="planFirst" type="checkbox"> Ersten Satz gewinnen</label><div class="grid2">${[['k1','K1 mindestens'],['k2','K2 mindestens'],['middleGood','Mitte bei A+ mindestens'],['kill','Angriffspunktquote mindestens'],['freeDirect','Direkte Dankeball-Killquote mindestens']].map(([k,l])=>`<label>${l} (%)<input type="number" min="0" max="100" id="goal-${k}"></label>`).join('')}<label>Mindeststichprobe<input type="number" id="planMinimum" min="3" max="50"></label><label>Startziel · Gegnerpunkte<input type="number" id="planOpening" min="1" max="20"></label><label>Deutlicher Rückstand ab (Punkte)<input type="number" id="planGap" min="1" max="10"></label></div><div class="grid2"><label>25-Punkte-Kurve · Gegner:EVV je Zeile<textarea id="planCurve" rows="6"></textarea></label><label>Satz 5 · 15-Punkte-Kurve<textarea id="planShortCurve" rows="6"></textarea></label></div><p class="small">Beide Kurven beginnen bei 0:0. Gegnerpunkte streng steigend, EVV-Ziele nicht fallend. Zwischenpunkte linear; letzte Steigung wird fortgesetzt.</p><div class="grid2"><label>Vorlage<select id="planTemplate"><option value="">Vorlage wählen</option>${Object.keys(st.matchPlanTemplates||{}).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select></label><button id="planLoad">Vorlage laden</button><label>Vorlagenname<input id="planName" maxlength="50"></label><button id="planSaveAs">Speichern unter</button></div><p id="planError" role="alert"></p><div class="grid2"><button id="planCancel">Abbrechen</button><button id="planSave" class="primary">Matchplan speichern</button></div>`);
 const fill=p=>{$('planFirst').checked=p.firstSetWin;for(const [k,v]of Object.entries(p.targets))$('goal-'+k).value=v;$('planMinimum').value=p.minimum;$('planOpening').value=p.openingOpponent;$('planGap').value=p.openingGap;$('planCurve').value=p.curve.map(x=>x.join(':')).join('\n');$('planShortCurve').value=p.shortCurve.map(x=>x.join(':')).join('\n')};fill(working);
 editorGuard=()=>JSON.stringify(read())===baseline||confirm('Ungespeicherte Matchplan-Änderungen verwerfen?');editorGuard.peek=()=>JSON.stringify(read())===baseline;
 const save=name=>{try{const next=read();validatePlan(next);if(name&&st.matchPlanTemplates?.[name]&&!confirm('Matchplan-Vorlage überschreiben?'))return;saveMatchPlan(next,name);baseline=JSON.stringify(next);editorGuard=null;closeModal();render();matchPlanPanel();toast('Matchplan gespeichert')}catch(e){$('planError').textContent=e.message}};
 $('planSave').onclick=()=>save('');$('planSaveAs').onclick=()=>{const name=$('planName').value.trim();if(!name)return $('planError').textContent='Vorlagenname angeben';save(name)};$('planLoad').onclick=()=>{const p=st.matchPlanTemplates?.[$('planTemplate').value];if(!p)return $('planError').textContent='Vorlage wählen';if(JSON.stringify(read())!==baseline&&!confirm('Ungespeicherte Eingaben durch Vorlage ersetzen?'))return;fill(p);$('planError').textContent='Vorlage geladen · Speichern zum Übernehmen'};$('planCancel').onclick=closeModal;
}
function renderPlanEntry(){
 let button=$('matchPlanLive');if(!button){const existing=$('compactLineups');let row=document.querySelector('.planHeaderRow');if(!row){row=document.createElement('div');row.className='planHeaderRow';existing.before(row);row.append(existing)}button=document.createElement('button');button.id='matchPlanLive';button.type='button';row.append(button)}const pace=livePacer();button.textContent='PACER '+(pace.delta>0?'+':'')+planNumber(pace.delta);button.className='pacerEntry '+pace.status;button.setAttribute('aria-label',`Matchplan, Satz ${st.set}, ${st.e}:${st.o}, Pacer ${planNumber(pace.delta)}`);button.onclick=matchPlanPanel;
 const dock=document.querySelector('.bottom');if(!$('markFreeBall')){dock.insertAdjacentHTML('beforeend','<button id="markFreeBall">＋ Dankeball</button><button id="scoutContext">Zuspiel-Kontext</button>');$('markFreeBall').onclick=markFreeChance;$('scoutContext').onclick=capturePanel}for(const id of ['markFreeBall','scoutContext'])$(id).disabled=!st.started||st.setEnded||st.matchEnded||view!=='live';
 if(tab==='coach'){const host=document.createElement('div');host.id='coachMatchPlan';host.innerHTML=planBarHTML('coachPlan')+(openingCoaching().hint?`<p class="openingHint">${esc(openingCoaching().hint)}</p>`:'');$('flow').prepend(host);if(openingCoaching().hint){const hints=$('flow').querySelectorAll('.coachingHints li');for(let i=2;i<hints.length;i++)hints[i].remove()}bindPlanBar('coachPlan')}
}


// MASTER_LIBRARY_BEGIN
const MASTER_FORMATIONS={"schema":"evv-quickscout-formation-library/v2","coordinate_system":{"x":"0 left sideline, 1 right sideline","y":"0 net, 1 endline","perspective":"own court viewed from behind baseline"},"rules":{"front_positions":[2,3,4],"back_positions":[1,6,5],"clockwise_rotation":"1→6→5→4→3→2→1","roles_opposite_pairs":[["Z","D"],["AA1","AA2"],["MB1","MB2"]],"critical":"Rule positions are NOT jersey numbers; K1 overlap legality must be validated geometrically and at serve contact."},"formations":[{"id":"LAEUFER_I","setter_at_position":1,"rotation_steps_from_setter_P1":0,"role_to_rule_position":{"Z":1,"AA1":2,"MB1":3,"D":4,"AA2":5,"MB2":6},"pre_serve_safe_baseline":{"Z":{"x":0.82,"y":0.78},"AA1":{"x":0.82,"y":0.23},"MB1":{"x":0.5,"y":0.23},"D":{"x":0.18,"y":0.23},"AA2":{"x":0.18,"y":0.78},"MB2":{"x":0.5,"y":0.78}},"reception_tactical_overlay":{"status":"editable_coach_default","coordinates":{"Z":{"x":0.7,"y":0.18},"AA1":{"x":0.15,"y":0.2},"MB1":{"x":0.5,"y":0.12},"D":{"x":0.86,"y":0.2},"AA2":{"x":0.28,"y":0.75},"MB2":{"x":0.55,"y":0.82}},"setter_run":[{"x":0.94,"y":0.68},{"x":0.7,"y":0.18}],"note":"Drei Annahmespieler: beide AA und tatsächlich aktiver Hinterfeld-MB bzw. dessen tatsächlich eingesetzter Libero. Vorschlag; keine automatische Libero-Ersetzung."},"libero_candidate_back_row_mb":["MB2"],"reception_pre_serve":{"Z":{"x":0.94,"y":0.68},"AA1":{"x":0.5,"y":0.56},"MB1":{"x":0.27,"y":0.18},"D":{"x":0.12,"y":0.18},"AA2":{"x":0.18,"y":0.82},"MB2":{"x":0.82,"y":0.82}},"receivers":["AA1","AA2","MB2"],"validation":{"symbol_center_overlap":true,"front_back_pairs":true,"receivers":3,"reference_images_verified":false}},{"id":"LAEUFER_II","setter_at_position":2,"rotation_steps_from_setter_P1":5,"role_to_rule_position":{"Z":2,"AA1":3,"MB1":4,"D":5,"AA2":6,"MB2":1},"pre_serve_safe_baseline":{"Z":{"x":0.82,"y":0.23},"AA1":{"x":0.5,"y":0.23},"MB1":{"x":0.18,"y":0.23},"D":{"x":0.18,"y":0.78},"AA2":{"x":0.5,"y":0.78},"MB2":{"x":0.82,"y":0.78}},"reception_tactical_overlay":{"status":"editable_coach_default","coordinates":{"Z":{"x":0.7,"y":0.18},"AA1":{"x":0.15,"y":0.2},"MB1":{"x":0.5,"y":0.12},"D":{"x":0.86,"y":0.75},"AA2":{"x":0.28,"y":0.75},"MB2":{"x":0.55,"y":0.82}},"setter_run":[{"x":0.72,"y":0.18},{"x":0.7,"y":0.18}],"note":"Drei Annahmespieler: beide AA und tatsächlich aktiver Hinterfeld-MB bzw. dessen tatsächlich eingesetzter Libero. Vorschlag; keine automatische Libero-Ersetzung."},"libero_candidate_back_row_mb":["MB2"],"reception_pre_serve":{"Z":{"x":0.72,"y":0.18},"AA1":{"x":0.5,"y":0.56},"MB1":{"x":0.12,"y":0.18},"D":{"x":0.06,"y":0.48},"AA2":{"x":0.18,"y":0.82},"MB2":{"x":0.82,"y":0.82}},"receivers":["AA1","AA2","MB2"],"validation":{"symbol_center_overlap":true,"front_back_pairs":true,"receivers":3,"reference_images_verified":false}},{"id":"LAEUFER_III","setter_at_position":3,"rotation_steps_from_setter_P1":4,"role_to_rule_position":{"Z":3,"AA1":4,"MB1":5,"D":6,"AA2":1,"MB2":2},"pre_serve_safe_baseline":{"Z":{"x":0.5,"y":0.23},"AA1":{"x":0.18,"y":0.23},"MB1":{"x":0.18,"y":0.78},"D":{"x":0.5,"y":0.78},"AA2":{"x":0.82,"y":0.78},"MB2":{"x":0.82,"y":0.23}},"reception_tactical_overlay":{"status":"editable_coach_default","coordinates":{"Z":{"x":0.7,"y":0.18},"AA1":{"x":0.15,"y":0.2},"MB1":{"x":0.55,"y":0.82},"D":{"x":0.86,"y":0.75},"AA2":{"x":0.28,"y":0.75},"MB2":{"x":0.5,"y":0.12}},"setter_run":[{"x":0.72,"y":0.18},{"x":0.7,"y":0.18}],"note":"Drei Annahmespieler: beide AA und tatsächlich aktiver Hinterfeld-MB bzw. dessen tatsächlich eingesetzter Libero. Vorschlag; keine automatische Libero-Ersetzung."},"libero_candidate_back_row_mb":["MB1"],"reception_pre_serve":{"Z":{"x":0.72,"y":0.18},"AA1":{"x":0.5,"y":0.56},"MB1":{"x":0.18,"y":0.82},"D":{"x":0.5,"y":0.48},"AA2":{"x":0.82,"y":0.82},"MB2":{"x":0.9,"y":0.18}},"receivers":["AA1","MB1","AA2"],"validation":{"symbol_center_overlap":true,"front_back_pairs":true,"receivers":3,"reference_images_verified":false}},{"id":"LAEUFER_IV","setter_at_position":4,"rotation_steps_from_setter_P1":3,"role_to_rule_position":{"Z":4,"AA1":5,"MB1":6,"D":1,"AA2":2,"MB2":3},"pre_serve_safe_baseline":{"Z":{"x":0.18,"y":0.23},"AA1":{"x":0.18,"y":0.78},"MB1":{"x":0.5,"y":0.78},"D":{"x":0.82,"y":0.78},"AA2":{"x":0.82,"y":0.23},"MB2":{"x":0.5,"y":0.23}},"reception_tactical_overlay":{"status":"editable_coach_default","coordinates":{"Z":{"x":0.7,"y":0.18},"AA1":{"x":0.28,"y":0.75},"MB1":{"x":0.55,"y":0.82},"D":{"x":0.86,"y":0.75},"AA2":{"x":0.15,"y":0.2},"MB2":{"x":0.5,"y":0.12}},"setter_run":[{"x":0.12,"y":0.18},{"x":0.7,"y":0.18}],"note":"Drei Annahmespieler: beide AA und tatsächlich aktiver Hinterfeld-MB bzw. dessen tatsächlich eingesetzter Libero. Vorschlag; keine automatische Libero-Ersetzung."},"libero_candidate_back_row_mb":["MB1"],"reception_pre_serve":{"Z":{"x":0.12,"y":0.18},"AA1":{"x":0.18,"y":0.82},"MB1":{"x":0.82,"y":0.82},"D":{"x":0.94,"y":0.68},"AA2":{"x":0.5,"y":0.56},"MB2":{"x":0.27,"y":0.18}},"receivers":["AA1","MB1","AA2"],"validation":{"symbol_center_overlap":true,"front_back_pairs":true,"receivers":3,"reference_images_verified":false}},{"id":"LAEUFER_V","setter_at_position":5,"rotation_steps_from_setter_P1":2,"role_to_rule_position":{"Z":5,"AA1":6,"MB1":1,"D":2,"AA2":3,"MB2":4},"pre_serve_safe_baseline":{"Z":{"x":0.18,"y":0.78},"AA1":{"x":0.5,"y":0.78},"MB1":{"x":0.82,"y":0.78},"D":{"x":0.82,"y":0.23},"AA2":{"x":0.5,"y":0.23},"MB2":{"x":0.18,"y":0.23}},"reception_tactical_overlay":{"status":"editable_coach_default","coordinates":{"Z":{"x":0.7,"y":0.18},"AA1":{"x":0.28,"y":0.75},"MB1":{"x":0.55,"y":0.82},"D":{"x":0.86,"y":0.2},"AA2":{"x":0.15,"y":0.2},"MB2":{"x":0.5,"y":0.12}},"setter_run":[{"x":0.06,"y":0.48},{"x":0.7,"y":0.18}],"note":"Drei Annahmespieler: beide AA und tatsächlich aktiver Hinterfeld-MB bzw. dessen tatsächlich eingesetzter Libero. Vorschlag; keine automatische Libero-Ersetzung."},"libero_candidate_back_row_mb":["MB1"],"reception_pre_serve":{"Z":{"x":0.06,"y":0.48},"AA1":{"x":0.18,"y":0.82},"MB1":{"x":0.82,"y":0.82},"D":{"x":0.72,"y":0.18},"AA2":{"x":0.5,"y":0.56},"MB2":{"x":0.12,"y":0.18}},"receivers":["AA1","MB1","AA2"],"validation":{"symbol_center_overlap":true,"front_back_pairs":true,"receivers":3,"reference_images_verified":false}},{"id":"LAEUFER_VI","setter_at_position":6,"rotation_steps_from_setter_P1":1,"role_to_rule_position":{"Z":6,"AA1":1,"MB1":2,"D":3,"AA2":4,"MB2":5},"pre_serve_safe_baseline":{"Z":{"x":0.5,"y":0.78},"AA1":{"x":0.82,"y":0.78},"MB1":{"x":0.82,"y":0.23},"D":{"x":0.5,"y":0.23},"AA2":{"x":0.18,"y":0.23},"MB2":{"x":0.18,"y":0.78}},"reception_tactical_overlay":{"status":"editable_coach_default","coordinates":{"Z":{"x":0.7,"y":0.18},"AA1":{"x":0.28,"y":0.75},"MB1":{"x":0.5,"y":0.12},"D":{"x":0.86,"y":0.2},"AA2":{"x":0.15,"y":0.2},"MB2":{"x":0.55,"y":0.82}},"setter_run":[{"x":0.5,"y":0.48},{"x":0.7,"y":0.18}],"note":"Drei Annahmespieler: beide AA und tatsächlich aktiver Hinterfeld-MB bzw. dessen tatsächlich eingesetzter Libero. Vorschlag; keine automatische Libero-Ersetzung."},"libero_candidate_back_row_mb":["MB2"],"reception_pre_serve":{"Z":{"x":0.5,"y":0.48},"AA1":{"x":0.82,"y":0.82},"MB1":{"x":0.9,"y":0.18},"D":{"x":0.72,"y":0.18},"AA2":{"x":0.5,"y":0.56},"MB2":{"x":0.18,"y":0.82}},"receivers":["AA1","AA2","MB2"],"validation":{"symbol_center_overlap":true,"front_back_pairs":true,"receivers":3,"reference_images_verified":false}}],"k2_defense_templates":[{"id":"OPP_IV","block_rule_positions":[2,3],"near_cover":[4],"deep_defense":[1,5,6]},{"id":"OPP_II","block_rule_positions":[3,4],"near_cover":[2],"deep_defense":[1,5,6]},{"id":"OPP_III","block_rule_positions":[3],"near_cover":[2,4],"deep_defense":[1,5,6]},{"id":"OPP_BACK_I","block_rule_positions":[3,4],"near_cover":[2],"deep_defense":[1,5,6]}],"notes":["K2-Blockrollen sind Trainerwünsche, keine erzwungene Spielerposition oder juristische Rotationsregel.","Libero-Ersetzung nur als protokollierte legale Aktion; taktische Vorschau getrennt.","Bei einem MB im Hinterfeld nicht automatisch unterstellen, dass er bereits durch einen Libero ersetzt wurde."],"source_seed_sha256":"9e474042e9ae42c40e74c84db24c8e2629380c86844efe583193921e06991fab","provenance":"Eigenständig ausgearbeitete Trainer-Vorschläge aus dem gelieferten Seed; keine Bildrekonstruktion."};
// MASTER_LIBRARY_END
// Master playbook: canonical views over the existing EVV rotation and stable opponent IDs.
const MASTER_ROLE_CHOICES=['?','AA','AA1','AA2','MB','MB1','MB2','D','Z','L'];
const MASTER_PLAYER_ROLES={johann:['Z'],david:['AA','Z'],jens:['MB','D'],felix:['AA'],amar:['L'],lion:['D'],niklas:['MB']};
function physicalPosition(slot,steps){return ((slot-1-steps%6+6)%6)+1}
function teamState(team='EVV',previewRotation=0){
 if(!['EVV','Gegner'].includes(team))throw Error('Unbekannte Mannschaft');
 if(team==='EVV'){
  const steps=previewRotation?rotationSteps(st.rot,previewRotation):0;
  const players=st.lineup.map(id=>{const pos=physicalPosition(courtPos(id),steps),replaced=st.liberoActive&&st.liberoReplacedId===id&&[1,5,6].includes(pos)&&!(pos===1&&st.serving),actual=replaced?st.liberoOnCourt:id;return {id:actual,regularId:id,name:nm(actual),number:jersey(actual),roles:clone(st.playerRoles?.[actual]||MASTER_PLAYER_ROLES[actual]||[byId(actual)?.role||'?']),role:replaced?'L':roleOf(id),regularRole:roleOf(id),pos,libero:!!replaced,replaces:replaced?id:null}});
  return {id:team,rotation:previewRotation||st.rot,serving:st.serving,set:st.set,configured:true,start:clone(st.setStart),lineup:st.lineup.slice(),players,liberoIds:st.liberoIds.slice(),substitutions:clone(st.events.filter(e=>e.type==='sub'))};
 }
 const t=st.opponentTeam;
 if(!t){const old=cockpitOpponentLegacy(previewRotation);return {id:team,rotation:old.rotation||1,serving:!st.serving,set:st.set,configured:old.configured,lineup:old.players.map(p=>'op-'+p.slot),players:old.players.map(p=>({id:'op-'+p.slot,regularId:'op-'+p.slot,name:'',number:p.number||'',roles:['?'],role:p.libero?'L':'?',pos:p.pos,slot:p.slot,libero:false,replaces:null})),liberoIds:[],substitutions:[]}}
 const live=t.set===st.set?Math.max(0,opponentSideouts()-t.sideouts):0,rotation=previewRotation||((t.rotation-1+live)%6+1),steps=previewRotation?rotationSteps(t.rotation,previewRotation):live,lib=st.teamControl?.Gegner?.active;
 return {id:team,rotation,serving:!st.serving,set:st.set,configured:t.set===st.set&&t.confirmed,lineup:t.lineup.slice(),players:t.lineup.map((id,i)=>{const pos=physicalPosition(i+1,steps),replaced=lib&&lib.replaces===id&&[1,5,6].includes(pos)&&!(pos===1&&!st.serving),p=t.roster[replaced?lib.id:id];return {id:p.id,regularId:id,name:p.name||'',number:p.number,roles:p.roles.slice(),role:replaced?'L':t.roles[id]||'?',regularRole:t.roles[id]||'?',pos,slot:i+1,libero:!!replaced,replaces:replaced?id:null}}),liberoIds:t.liberoIds.slice(),substitutions:clone(t.events)};
}
function ensureOpponentTeam(){
 if(st.opponentTeam)return st.opponentTeam;
 const old=teamState('Gegner'),roster={},lineup=[];
 for(let p=1;p<=6;p++){const id='op-'+p,player=old.players.find(x=>x.pos===p);lineup.push(id);roster[id]={id,number:player?.number||'',roles:['?']}}
 for(let i=1;i<=2;i++){const id='op-l'+i,n=String(opponent.liberos?.[i-1]||'').replace(/[^0-9]/g,'');roster[id]={id,number:n,roles:['L']}}
 st.opponentTeam={schema:1,set:st.set,confirmed:old.configured,rotation:old.rotation,sideouts:opponentSideouts(),lineup,starters:lineup.slice(),roles:Object.fromEntries(lineup.map(id=>[id,'?'])),roster,liberoIds:['op-l1','op-l2'],events:[],pairs:{},used:[],subCount:0,nextId:7};
 return st.opponentTeam;
}
function controlFor(team){
 st.teamControl=st.teamControl||{};
 if(!st.teamControl[team])st.teamControl[team]={history:[],last:team==='EVV'&&st.liberoActive?st.rallies.length:-1,auto:false,unavailable:[],active:team==='EVV'&&st.liberoActive?{id:st.liberoOnCourt,replaces:st.liberoReplacedId}:null};
 return st.teamControl[team];
}
function teamActionSnapshot(){return clone({lineup:st.lineup,roles:st.roles,jerseyNumbers:st.jerseyNumbers,playerRoles:st.playerRoles,opponentTeam:st.opponentTeam,teamControl:st.teamControl,liberoIds:st.liberoIds,liberoOnCourt:st.liberoOnCourt,liberoReplacedId:st.liberoReplacedId,liberoActive:st.liberoActive,liberoAutoEnabled:st.liberoAutoEnabled,liberoPreferredId:st.liberoPreferredId,liberoPreferredMB:st.liberoPreferredMB,subPairs:st.subPairs,subUsed:st.subUsed,subCount:st.subCount,events:st.events})}
function rememberTeamAction(label){const a={set:st.set,at:st.rallies.length,label,state:teamActionSnapshot()};st.teamUndo=st.teamUndo||[];st.teamUndo.push(a);if(st.teamUndo.length>20)st.teamUndo.shift()}
function undoTeamAction(){const a=st.teamUndo?.at(-1);if(!a)return toast('Keine Teamaktion zum Zurücknehmen');if(a.set!==st.set||a.at!==st.rallies.length)return toast('Zuerst spätere Rallyes mit Rallye-Undo zurücknehmen');st.teamUndo.pop();for(const key of ['opponentTeam','teamControl','jerseyNumbers','playerRoles'])if(!(key in a.state))delete st[key];Object.assign(st,clone(a.state));syncOpponentAliases();render();toast(a.label+' zurückgenommen');return true}
function betweenRallies(){return st.started&&!st.setEnded&&view==='live'&&!draft.chain?.length&&!pendingMark}
function syncOpponentAliases(){
 if(!st.opponentTeam)return;
 const t=teamState('Gegner');opponent.receivers=t.players.filter(p=>p.number).map(p=>'#'+p.number);opponent.liberos=t.liberoIds.map(id=>'#'+(st.opponentTeam.roster[id]?.number||'?'));const setter=t.players.find(p=>p.role==='Z');opponent.setter=setter?.number?'#'+setter.number:'#?';
}
function opponentSetPlayer(id,number,role='?'){
 if(!betweenRallies())throw Error('Nummern/Rollen nur zwischen Ballwechseln ändern');
 const t=ensureOpponentTeam();if(!t.roster[id]||!MASTER_ROLE_CHOICES.includes(role)||!/^\d{0,5}$/.test(number))throw Error('Nummer oder Rolle ungültig');
 if(number&&Object.values(t.roster).some(p=>p.id!==id&&p.number===number))throw Error('Trikotnummer bereits vergeben');
 if(role==='L'&&t.lineup.includes(id))throw Error('Libero über das Libero-Menü einem Hinterfeldspieler zuordnen');
 if(t.liberoIds.includes(id)&&role!=='L')throw Error('Gemeldeten Libero nicht als Feldspieler umdeuten');
 rememberTeamAction('Gegnerdaten');t.roster[id].number=number;t.roster[id].roles=[...new Set([...(t.roster[id].roles||[]).filter(r=>r!=='?'),...(role==='?'?[]:[role])])];if(!t.roster[id].roles.length)t.roster[id].roles=['?'];if(t.lineup.includes(id))t.roles[id]=role;t.confirmed=true;syncOpponentAliases();saveLocal();return true;
}
function opponentSub(out,number,role=null){
 if(!betweenRallies())throw Error('Wechsel nur zwischen Ballwechseln');const t=ensureOpponentTeam();
 if(!t.lineup.includes(out)||!/^\d{1,5}$/.test(number)||t.subCount>=6)throw Error('Wechselspieler oder Wechselzahl ungültig');
 if(st.teamControl?.Gegner?.active?.replaces===out)throw Error('Zuerst den ersetzten Feldspieler für den Libero zurückholen');
 let incoming=Object.values(t.roster).find(p=>p.number===number);if(t.used.includes(out))throw Error('Zulässiger Einsatz bereits abgeschlossen');if(incoming&&(t.lineup.includes(incoming.id)||t.liberoIds.includes(incoming.id)||t.used.includes(incoming.id)))throw Error('Spieler ist nicht als regulärer Wechsel verfügbar');
 const back=!!t.pairs[out];if(back&&incoming?.id!==t.pairs[out])throw Error('Rückwechsel nur mit ursprünglichem Startspieler');if(!back&&!t.starters.includes(out))throw Error('Nur ursprünglicher Rückwechselpartner zulässig');if(!back&&incoming&&t.starters.includes(incoming.id))throw Error('Startspieler darf nur in sein Wechselpaar zurückkehren');
 if(role!==null&&!MASTER_ROLE_CHOICES.filter(x=>x!=='L').includes(role))throw Error('Aktive Rolle ungültig');rememberTeamAction('Gegnerwechsel');
 if(!incoming){const id='op-'+t.nextId++;incoming={id,number,roles:[role||t.roles[out]||'?']};t.roster[id]=incoming}
 const i=t.lineup.indexOf(out),previous=t.roles[out];t.lineup[i]=incoming.id;t.roles[incoming.id]=role||previous||'?';delete t.roles[out];if(back){delete t.pairs[out];t.used.push(out,incoming.id)}else t.pairs[incoming.id]=out;t.subCount++;t.events.push({type:'sub',set:st.set,out,inn:incoming.id,role:t.roles[incoming.id],at:st.rallies.length,score:`${st.e}:${st.o}`,return:back});syncOpponentAliases();saveLocal();return true;
}
function applyLibero(team,liberoId='',replaces='',exception='',note=''){
 if(!betweenRallies()&&!(exception==='injury'&&st.started&&!st.setEnded&&view==='live'&&draft.chain?.length&&!pendingMark))throw Error('Libero-Ersetzung nur zwischen Ballwechseln; echte Verletzung gesondert dokumentieren');
 if(team==='Gegner')ensureOpponentTeam();const state=teamState(team),existing=st.teamControl?.[team],c=existing||{history:[],last:team==='EVV'&&st.liberoActive?st.rallies.length:-1,auto:false,unavailable:[],active:null},current=team==='EVV'&&st.liberoActive?{id:st.liberoOnCourt,replaces:st.liberoReplacedId}:team==='Gegner'?c.active:null;
 if(current?.id===liberoId&&current.replaces===replaces||!current&&!liberoId)return true;
 if(liberoId){if(!state.liberoIds.includes(liberoId)||state.lineup.includes(liberoId)||c.unavailable.includes(liberoId))throw Error('Libero nicht verfügbar');const p=state.players.find(p=>p.regularId===replaces);if(!p||![1,5,6].includes(p.pos)||p.pos===1&&state.serving)throw Error('Nur Hinterfeld; der Libero schlägt nicht auf');if(current&&current.replaces!==replaces)throw Error('Zuerst Rückkehr des tatsächlich ersetzten Spielers dokumentieren')}
 if(exception&&!['injury','penaltyFront'].includes(exception))throw Error('Ausnahme ungültig');if(exception&&(!current||note.trim().length<3))throw Error('Ausnahme mit tatsächlichem Anlass dokumentieren');if(exception==='penaltyFront'){const p=state.players.find(p=>p.regularId===current.replaces);if(!p||![2,3,4].includes(p.pos))throw Error('Strafrotation muss den Libero tatsächlich in die Vorderreihe bringen')}
 if(c.last>=st.rallies.length&&!exception)throw Error('Mindestens eine abgeschlossene Rallye zwischen Libero-Ersetzungen erforderlich');
 rememberTeamAction('Libero-Ersetzung');if(!existing){st.teamControl=st.teamControl||{};st.teamControl[team]=c}if(exception==='injury')c.unavailable.push(current.id);
 c.history.push({type:'libero',set:st.set,at:st.rallies.length,from:current?.id||null,to:liberoId||null,replaces:replaces||current?.replaces,exception:exception||null,note:exception?note.trim():null});c.last=st.rallies.length;c.active=liberoId?{id:liberoId,replaces}:null;
 if(team==='EVV'){st.liberoActive=!!liberoId;st.liberoOnCourt=liberoId;st.liberoReplacedId=liberoId?replaces:'';st.liberoPreferredId=liberoId;st.liberoPreferredMB=liberoId?replaces:'';st.liberoAutoEnabled=c.auto}
 syncOpponentAliases();saveLocal();return true;
}
function syncMasterLibero(reason){
 const c=st.teamControl?.EVV;if(!c)return legacySyncLiberoRotation();
 if(reason==='view')return;
 const at=st.rallies.length+(reason==='rally'?1:0),id=st.liberoReplacedId,pos=id?courtPos(id):null;
 if(st.liberoActive&&(!st.lineup.includes(id)||![1,5,6].includes(pos)||pos===1&&st.serving)){
  c.history.push({type:'libero',set:st.set,at,from:st.liberoOnCourt,to:null,replaces:id,forced:true});c.last=at;c.active=null;st.liberoActive=false;st.liberoOnCourt='';st.liberoReplacedId='';
 }
 if(c.auto&&!st.liberoActive&&c.last<at){const mb=st.lineup.find(id=>/^MB/.test(roleOf(id))&&[1,5,6].includes(courtPos(id))&&!(courtPos(id)===1&&st.serving)),lib=st.liberoPreferredId&&!c.unavailable.includes(st.liberoPreferredId)?st.liberoPreferredId:st.liberoIds.find(id=>!c.unavailable.includes(id));if(mb&&lib&&st.liberoIds.includes(lib)){st.liberoActive=true;st.liberoOnCourt=lib;st.liberoReplacedId=mb;c.active={id:lib,replaces:mb};c.last=at;c.history.push({type:'libero',set:st.set,at,from:null,to:lib,replaces:mb,automatic:true})}}
}
function syncOpponentLiberoAfterRally(){
 const c=st.teamControl?.Gegner;if(!c?.active)return;const t=teamState('Gegner'),p=t.players.find(p=>p.regularId===c.active.replaces);if(!p||![1,5,6].includes(p.pos)||p.pos===1&&t.serving){c.history.push({type:'libero',set:st.set,at:st.rallies.length,from:c.active.id,to:null,replaces:c.active.replaces,forced:true});c.last=st.rallies.length;c.active=null}syncOpponentAliases();
}
function masterStart(){
 st.teamControl={EVV:{history:[],last:-1,auto:!!st.liberoAutoEnabled,unavailable:[],active:null}};
 const c=st.teamControl.EVV;if(st.liberoActive){c.active={id:st.liberoOnCourt,replaces:st.liberoReplacedId};c.last=0;c.history.push({type:'libero',set:st.set,at:0,from:null,to:st.liberoOnCourt,replaces:st.liberoReplacedId,initial:true})}
 ensureOpponentTeam();
}
function masterNewSet(){
 if(!st.teamControl)return;const unavailable=Object.fromEntries(Object.entries(st.teamControl).map(([team,c])=>[team,clone(c.unavailable)]));st.teamControl={EVV:{history:[],last:-1,auto:!!st.liberoAutoEnabled,unavailable:unavailable.EVV||[],active:null},Gegner:{history:[],last:-1,auto:false,unavailable:unavailable.Gegner||[],active:null}};
 if(st.opponentTeam){const t=st.opponentTeam;t.set=st.set;t.rotation=1;t.sideouts=0;t.starters=t.lineup.slice();t.confirmed=false;t.events=[];t.pairs={};t.used=[];t.subCount=0}st.teamUndo=[];
}
function k1Geometry(players){
 const front=[4,3,2],back=[5,6,1],role=p=>String(p.regularRole||p.role),aa=players.filter(p=>role(p).startsWith('AA')),mb=players.filter(p=>role(p).startsWith('MB')),setter=players.find(p=>p.role==='Z');
 if(aa.length!==2||players.filter(p=>role(p)==='D').length!==1||!setter||players.filter(p=>p.role==='Z').length!==1||mb.length!==2)return null;
 const fa=aa.find(p=>front.includes(p.pos)),ba=aa.find(p=>back.includes(p.pos)),bm=mb.find(p=>back.includes(p.pos));if(!fa||!ba||!bm)return null;
 const xs={},targets={},base={},fi=front.indexOf(fa.pos),rec=[ba.pos,bm.pos].sort((a,b)=>back.indexOf(a)-back.indexOf(b));
 front.forEach((p,i)=>xs[p]=i===fi?50:i<fi?12+15*i:72+18*(i-fi-1));back.forEach((p,i)=>xs[p]=p===rec[0]?18:p===rec[1]?82:i===0?6:i===2?94:50);
 for(const p of players){base[p.pos]=[xs[p.pos],front.includes(p.pos)?p.id===fa.id?56:18:rec.includes(p.pos)?82:Math.max(48,(p.pos===1&&fa.pos===2||p.pos===6&&fa.pos===3||p.pos===5&&fa.pos===4?56:18)+12)];targets[p.pos]=role(p)==='Z'?[70,18]:role(p).startsWith('AA')?front.includes(p.pos)?[15,20]:[28,75]:role(p).startsWith('MB')?front.includes(p.pos)?[50,12]:[55,82]:[86,front.includes(p.pos)?20:75]}
 if(!validBaseFormation(base))throw Error('Interner K1-Overlapfehler');
 const arrows=[{id:'setter-run',kind:'run',player:setter.pos,points:[clone(base[setter.pos]),clone(targets[setter.pos])]}];for(const p of players.filter(p=>!p.libero&&p.role!=='Z')){const x=p.role.startsWith('AA')?front.includes(p.pos)?15:50:p.role.startsWith('MB')?50:86;arrows.push({id:'attack-'+p.pos,kind:'attack',player:p.pos,points:[[x,front.includes(p.pos)?44:76],[x,front.includes(p.pos)?10:40]]})}
 return {targets,routes:{[setter.pos]:[clone(base[setter.pos]),clone(targets[setter.pos])]},ballPaths:[],attacks:Object.fromEntries(arrows.filter(a=>a.kind==='attack').map(a=>[a.player,clone(a.points)])),arrows,base:{targets:base,routes:{},ballPaths:[]},proposal:true,assignment:'positions'};
}
function laeufer(team='EVV',rotation=0){const setter=teamState(team,rotation).players.filter(p=>p.role==='Z');return setter.length===1?{position:setter[0].pos,label:['','I','II','III','IV','V','VI'][setter[0].pos],id:setter[0].id}:null}
function builtinK1(rotation=st.rot,team='EVV'){
 const players=teamState(team,rotation).players,f=k1Geometry(players);if(!f)return null;
 const regularRole=p=>p.libero?(team==='EVV'?roleOf(p.regularId):st.opponentTeam?.roles[p.regularId]):p.role;
 const seed=MASTER_FORMATIONS.formations.find(t=>Object.entries(t.role_to_rule_position).every(([r,pos])=>players.some(p=>regularRole(p)===r&&p.pos===pos)));
 if(seed){f.base.targets=Object.fromEntries(players.map(p=>{const q=seed.reception_pre_serve[regularRole(p)];return [p.pos,[q.x*100,q.y*100]]}));f.targets=Object.fromEntries(players.map(p=>{const q=seed.reception_tactical_overlay.coordinates[regularRole(p)];return [p.pos,[q.x*100,q.y*100]]}));const z=players.find(p=>p.role==='Z');f.routes[z.pos]=[clone(f.base.targets[z.pos]),clone(f.targets[z.pos])];f.arrows[0].points=clone(f.routes[z.pos])}
 return f;
}
function teamDefaultKey(team,rotation,kind){const l=laeufer(team,rotation);return team+':'+(l?'L'+l.position:'R'+rotation)+':'+kind}
function saveTeamDefault(team,rotation,kind,f){if(!['EVV','Gegner'].includes(team)||!validFormation(f))throw Error('Ungültige Teamvorlage');const key=teamDefaultKey(team,rotation,kind),old=st.teamDefaults;const data=clone(f);delete data.opponents;st.teamDefaults={...old,[key]:data};if(!saveLocal()){st.teamDefaults=old;throw Error('Teamvorlage nicht gespeichert')}return true}
function opponentFormation(rotation,kind){return clone(st.teamDefaults?.[teamDefaultKey('Gegner',rotation,kind)]||(kind==='receive'?builtinK1(rotation,'Gegner'):null)||emptyFormation())}
function middlePacer(rr,filter={}){const a=setterAnalysis(rr,filter),rows=a.rows.filter(r=>r.quality==='A+'&&r.target!==null&&r.target!=='unknown'),actual=rows.filter(r=>r.target==='III').length,goal=rows.length*currentPlan().targets.middleGood/100;return {actual,eligible:rows.length,goal,delta:actual-goal,unknown:a.rows.filter(r=>r.quality==='A+'&&(!r.target||r.target==='unknown')).length}}
function validArrows(arrows){return Array.isArray(arrows)&&arrows.length<=100&&new Set(arrows.map(a=>a?.id)).size===arrows.length&&arrows.every(a=>a&&typeof a.id==='string'&&/^[\w-]{1,60}$/.test(a.id)&&['run','ball','set','attack','block','defense'].includes(a.kind)&&(a.player===undefined||[1,2,3,4,5,6].includes(a.player))&&Array.isArray(a.points)&&a.points.length>=2&&a.points.length<=20&&(a.space===undefined||['team','court'].includes(a.space))&&a.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=100))&&Object.keys(a).every(k=>['id','kind','player','points','space'].includes(k)))}
function formationArrows(f){if(f.arrows)return clone(f.arrows);const out=[];for(const [slot,path]of Object.entries(f.routes||{}))if(path.length>=2)out.push({id:'legacy-run-'+slot,kind:'run',player:Number(slot),points:clone(path)});for(const [slot,path]of Object.entries(f.attacks||{}))if(path.length>=2)out.push({id:'legacy-attack-'+slot,kind:'attack',player:Number(slot),points:clone(path)});(f.ballPaths||[]).forEach((path,i)=>{if(path.length>=2)out.push({id:'legacy-ball-'+i,kind:'ball',space:'court',points:clone(path)})});return out}
function validateMasterData(m){
 const bad=()=>{throw Error('Ungültige Team-/Pfeildaten')},obj=x=>x&&typeof x==='object'&&!Array.isArray(x);
 if(m.teamDefaults&&(!obj(m.teamDefaults)||Object.values(m.teamDefaults).some(f=>!validFormation(f))))bad();
 if(m.playerRoles&&(!obj(m.playerRoles)||Object.entries(m.playerRoles).some(([id,r])=>!byId(id)||!Array.isArray(r)||r.length>6||r.some(x=>!MASTER_ROLE_CHOICES.includes(x)))))bad();
 if(m.opponentIdentity&&(!obj(m.opponentIdentity)))bad();
 const t=m.opponentTeam;if(t){if(!obj(t)||t.schema!==1||!Number.isInteger(t.set)||t.set<1||t.set>5||!Number.isInteger(t.rotation)||t.rotation<1||t.rotation>6||!Number.isInteger(t.sideouts)||t.sideouts<0||typeof t.confirmed!=='boolean'||!obj(t.roster)||Object.keys(t.roster).length>60||!Array.isArray(t.lineup)||t.lineup.length!==6||new Set(t.lineup).size!==6||t.lineup.some(id=>!t.roster[id])||!Array.isArray(t.starters)||t.starters.length!==6||t.starters.some(id=>!t.roster[id])||!obj(t.roles)||Object.entries(t.roles).some(([id,r])=>!t.roster[id]||!MASTER_ROLE_CHOICES.includes(r))||!Array.isArray(t.liberoIds)||t.liberoIds.length>2||new Set(t.liberoIds).size!==t.liberoIds.length||t.liberoIds.some(id=>!t.roster[id]||t.lineup.includes(id))||!Array.isArray(t.events)||!Number.isInteger(t.subCount)||t.subCount<0||t.subCount>6||!obj(t.pairs)||!Array.isArray(t.used)||!Number.isInteger(t.nextId)||t.nextId<7)bad();
 const numbers=[];for(const [id,p]of Object.entries(t.roster)){if(!/^op-[\w-]+$/.test(id)||p.id!==id||typeof p.number!=='string'||!/^\d{0,5}$/.test(p.number)||!Array.isArray(p.roles)||p.roles.some(r=>!MASTER_ROLE_CHOICES.includes(r)))bad();if(p.number)numbers.push(p.number)}if(new Set(numbers).size!==numbers.length)bad();
 for(const [a,b]of Object.entries(t.pairs))if(!t.roster[a]||!t.roster[b])bad();if(t.used.some(id=>!t.roster[id]))bad();}
 if(m.teamControl){if(!obj(m.teamControl)||Object.keys(m.teamControl).some(k=>!['EVV','Gegner'].includes(k)))bad();for(const [team,c]of Object.entries(m.teamControl)){const ids=team==='EVV'?roster.map(p=>p.id):Object.keys(t?.roster||{});if(!obj(c)||!Array.isArray(c.history)||c.history.length>1000||!Number.isInteger(c.last)||c.last< -1||typeof c.auto!=='boolean'||!Array.isArray(c.unavailable)||c.unavailable.some(id=>!ids.includes(id))||c.active&&(!ids.includes(c.active.id)||!ids.includes(c.active.replaces)))bad();for(const h of c.history)if(!obj(h)||h.type!=='libero'||!Number.isInteger(h.at)||h.at<0||h.from&&!ids.includes(h.from)||h.to&&!ids.includes(h.to)||h.replaces&&!ids.includes(h.replaces))bad()}}
 if(t){if(new Set(t.starters).size!==6||Object.keys(t.roles).length!==6||t.lineup.some(id=>!Object.prototype.hasOwnProperty.call(t.roles,id))||t.events.length!==t.subCount||t.events.some(e=>!e||e.type!=='sub'||!t.roster[e.out]||!t.roster[e.inn]||!Number.isInteger(e.at)||e.at<0||typeof e.return!=='boolean')||t.nextId<=Math.max(...Object.keys(t.roster).filter(id=>/^op-\d+$/.test(id)).map(id=>Number(id.slice(3)))))bad()}
 if(m.teamControl)for(const [team,c]of Object.entries(m.teamControl)){if(new Set(c.unavailable).size!==c.unavailable.length)bad();if(c.active){const ids=team==='EVV'?m.liberoIds:t?.liberoIds,lineup=team==='EVV'?m.lineup:t?.lineup;if(!ids?.includes(c.active.id)||!lineup?.includes(c.active.replaces)||lineup.includes(c.active.id))bad()}if(team==='EVV'&&typeof m.liberoActive==='boolean'&&(m.liberoActive!==!!c.active||c.active&&(m.liberoOnCourt!==c.active.id||m.liberoReplacedId!==c.active.replaces)))bad()}
 if(m.teamUndo){if(!Array.isArray(m.teamUndo)||m.teamUndo.length>20)bad();for(const u of m.teamUndo){if(!obj(u)||!Number.isInteger(u.at)||u.at<0||!Number.isInteger(u.set)||u.set<1||u.set>5||!obj(u.state)||u.state.teamUndo||!Array.isArray(u.state.lineup)||u.state.lineup.length!==6||new Set(u.state.lineup).size!==6||u.state.lineup.some(id=>!byId(id))||!u.state.roles||Object.values(u.state.roles).some(r=>!ROLES.includes(r))||typeof u.state.liberoActive!=='boolean')bad();validateMasterData(u.state)}}
}

function syncLiberoRotation(reason='view'){return syncMasterLibero(reason)}
function masterPlayerMenu(team,id){
 if(!betweenRallies())return toast('Spielerdaten zwischen Ballwechseln bearbeiten');
 if(team==='Gegner')ensureOpponentTeam();const p=teamState(team).players.find(p=>p.id===id)||st.opponentTeam?.roster[id];if(!p)return;
 const own=team==='EVV',regular=p.regularId||id,activeRole=own?roleOf(regular):st.opponentTeam.roles[regular]||p.roles?.[0]||'?',number=own?jersey(id):p.number;
 modal(`<h2>${own?'EVV':'Gegner'} · Spieler</h2><p class="small">${own?esc(nm(id)):'Gegner · P'+(p.pos||'?')} · Nummernkorrekturen ändern keine Spieleridentität.</p><label>Trikotnummer<input id="mpNumber" inputmode="numeric" maxlength="5" value="${esc(number==='?'?'':number)}"></label><label>Aktive Satzrolle<select id="mpRole">${MASTER_ROLE_CHOICES.map(r=>`<option value="${r}">${r}</option>`).join('')}</select></label>${own?`<fieldset><legend>Erlaubte Rollen · für künftige Aufstellungen</legend>${['AA','MB','D','Z','L'].map(r=>`<label class="roleChoice"><input type="checkbox" data-allowed-role="${r}" ${(st.playerRoles?.[id]||MASTER_PLAYER_ROLES[id]||[roleOf(id)]).some(x=>x.startsWith(r))?'checked':''}>${r}</label>`).join('')}</fieldset>`:''}<p id="mpError" role="alert"></p><div class="grid2"><button id="mpSave" class="primary">Übernehmen</button><button id="mpLibero">L1 / L2 · Ersetzung</button>${own?'':'<button id="mpSub">#raus → #rein</button>'}<button id="mpCancel">Abbrechen</button></div>`);
 $('mpRole').value=p.libero?'L':activeRole;
 $('mpCancel').onclick=closeModal;$('mpLibero').onclick=()=>masterLiberoPanel(team);
 if(!own)$('mpSub').onclick=()=>masterOpponentSub(regular);
 $('mpSave').onclick=()=>{try{const n=$('mpNumber').value.trim(),role=$('mpRole').value;if(own){if(!/^\d{0,5}$/.test(n))throw Error('Nur Trikotnummern verwenden');if(p.libero&&role!=='L'||!p.libero&&!ROLES.includes(role))throw Error('Aktive Feldrolle AA1/AA2, MB1/MB2, D oder Z wählen; Libero separat einsetzen');if(n&&roster.some(other=>other.id!==id&&jersey(other.id)===n))throw Error('Trikotnummer bereits vergeben');if(!p.libero&&Object.entries(st.roles).some(([other,r])=>other!==regular&&r===role))throw Error('Satzrolle bereits belegt · Startsechs gemeinsam bearbeiten');rememberTeamAction('EVV-Spielerdaten');st.jerseyNumbers=st.jerseyNumbers||{};if(n)st.jerseyNumbers[id]=n;else delete st.jerseyNumbers[id];st.playerRoles=st.playerRoles||{};st.playerRoles[id]=[...document.querySelectorAll('[data-allowed-role]:checked')].map(e=>e.dataset.allowedRole);if(!st.playerRoles[id].length)st.playerRoles[id]=[role];if(!p.libero)st.roles[regular]=role;saveLocal()}else opponentSetPlayer(id,n,role);closeModal();render();matchTactics()}catch(e){$('mpError').textContent=e.message}};
}
function masterOpponentSub(out){
 const t=ensureOpponentTeam(),p=t.roster[out];if(!p)return;modal(`<h2>Gegner · regulärer Wechsel</h2><p>#${esc(p.number||'?')} raus · ${t.subCount}/6 Wechsel. Rückwechsel bleibt an den ursprünglichen Partner gebunden.</p><label>#rein<input id="osNumber" inputmode="numeric" maxlength="5"></label><label>Aktive Rolle<select id="osRole">${MASTER_ROLE_CHOICES.filter(r=>r!=='L').map(r=>`<option>${r}</option>`).join('')}</select></label><p id="osError" role="alert"></p><div class="grid2"><button id="osSave" class="primary">Wechsel dokumentieren</button><button id="osCancel">Abbrechen</button></div>`);$('osRole').value=t.roles[out]||'?';$('osCancel').onclick=closeModal;$('osSave').onclick=()=>{try{opponentSub(out,$('osNumber').value.trim(),$('osRole').value);closeModal();render();matchTactics()}catch(e){$('osError').textContent=e.message}};
}
function masterOpponentLineup(){
 if(!betweenRallies())return toast('Aufstellung zwischen Ballwechseln bearbeiten');const t=ensureOpponentTeam(),state=teamState('Gegner'),ordered=state.players.slice().sort((a,b)=>a.pos-b.pos);
 modal(`<h2>Gegner · Aufstellung und Rollen</h2><p class="small">Einmal die Startsechs festlegen. Unbekannte Nummern und Rollen sind erlaubt. Bestätigte Positionen rotieren nur bei gegnerischem Sideout.</p><label>Aktuelle Gegnerrotation<select id="oppStartRot">${[1,2,3,4,5,6].map(n=>`<option>${n}</option>`).join('')}</select></label><button id="opPropose">5:1-Rollen vorschlagen · noch nicht übernehmen</button><div class="grid3">${ordered.map(p=>`<label>P${p.pos}<input id="oppNum${p.pos}" inputmode="numeric" maxlength="5" value="${esc(t.roster[p.regularId].number)}"><select id="oppRole${p.pos}" aria-label="Gegnerrolle P${p.pos}">${MASTER_ROLE_CHOICES.filter(r=>r!=='L').map(r=>`<option value="${r}" ${t.roles[p.regularId]===r?'selected':''}>${r}</option>`).join('')}</select></label>`).join('')}</div><div class="grid3"><label>Libero 1 #<input id="oppCourtLibero" inputmode="numeric" maxlength="5" value="${esc(t.roster[t.liberoIds[0]].number)}"></label><label>Libero 2 #<input id="oppCourtLibero2" inputmode="numeric" maxlength="5" value="${esc(t.roster[t.liberoIds[1]].number)}"></label><label>L1 tatsächlich auf dem Feld für<select id="oppCourtReplaces"><option value="0">Keine neue Ersetzung</option>${ordered.map(p=>`<option value="${p.pos}">P${p.pos} · #${esc(t.roster[p.regularId].number||'?')}</option>`).join('')}</select></label></div><p id="opLineupError" role="alert"></p><div class="grid2"><button id="saveOppNum" class="primary">Aufstellung bestätigen</button><button id="oppConfigCancel">Abbrechen</button></div>`);
 $('oppStartRot').value=state.rotation;$('opPropose').onclick=()=>ROLES.forEach((r,i)=>$('oppRole'+(i+1)).value=['Z','AA1','MB1','D','AA2','MB2'][i]);$('oppConfigCancel').onclick=closeModal;
 $('saveOppNum').onclick=()=>{try{
 const copy=clone(t),nums=ordered.map(p=>$('oppNum'+p.pos).value.trim()),libs=[$('oppCourtLibero').value.trim(),$('oppCourtLibero2').value.trim()],filled=[...nums,...libs].filter(Boolean);if(filled.some(n=>!/^\d{1,5}$/.test(n))||new Set(filled).size!==filled.length)throw Error('Eindeutige Trikotnummern verwenden');
 ordered.forEach((p,i)=>{copy.roster[p.regularId].number=nums[i];copy.roles[p.regularId]=$('oppRole'+p.pos).value;copy.roster[p.regularId].roles=[...new Set([...(copy.roster[p.regularId].roles||[]).filter(r=>r!=='?'),...(copy.roles[p.regularId]!=='?'?[copy.roles[p.regularId]]:[])])];if(!copy.roster[p.regularId].roles.length)copy.roster[p.regularId].roles=['?']});copy.liberoIds.forEach((id,i)=>copy.roster[id].number=libs[i]);copy.lineup=ordered.map(p=>p.regularId);copy.rotation=Number($('oppStartRot').value);copy.sideouts=opponentSideouts();copy.set=st.set;copy.confirmed=true;if(!copy.events.length&&copy.subCount===0)copy.starters=copy.lineup.slice();
 const replaces=Number($('oppCourtReplaces').value),partner=replaces?copy.lineup[replaces-1]:null;if(partner&&(!libs[0]||![1,5,6].includes(replaces)||replaces===1&&!st.serving))throw Error('L1 nur für einen Hinterfeldspieler ohne Aufschlagrecht einsetzen');
 const c=st.teamControl?.Gegner;if(partner&&c?.last>=st.rallies.length&&!(c.active?.id===copy.liberoIds[0]&&c.active.replaces===partner))throw Error('Zwischen Libero-Ersetzungen muss eine Rallye liegen');
 rememberTeamAction('Gegneraufstellung');st.opponentTeam=copy;opponent.positionNumbers=Object.fromEntries(nums.map((n,i)=>[i+1,n]));if(nums.every(Boolean))opponent.courtAnchor={set:st.set,rotation:copy.rotation,sideouts:copy.sideouts,positions:clone(opponent.positionNumbers),libero:partner?libs[0]:'',replaces:replaces||0};
 if(partner)applyLibero('Gegner',copy.liberoIds[0],partner);syncOpponentAliases();saveLocal();closeModal();render();matchTactics();
 }catch(e){$('opLineupError').textContent=e.message}};
}
function masterLiberoPanel(team='EVV'){
 const emergency=!betweenRallies()&&!!draft.chain?.length&&!st.setEnded;if(!betweenRallies()&&!emergency)return toast('Libero-Menü nur zwischen Ballwechseln');if(team==='Gegner')ensureOpponentTeam();const own=team==='EVV',t=teamState(team),c=st.teamControl?.[team],current=own&&st.liberoActive?{id:st.liberoOnCourt,replaces:st.liberoReplacedId}:c?.active;
 const label=id=>own?`${nm(id)} #${jersey(id)}`:`L${t.liberoIds.indexOf(id)+1} #${st.opponentTeam.roster[id].number||'?'}`;
 modal(`<h2>${own?'EVV':'Gegner'} · Libero-Ersetzung</h2><p class="small">Nur echte Ersetzungen dokumentieren. Eine vollständige Rallye zwischen Ersetzungen; Rückkehr ausschließlich zum tatsächlich ersetzten Spieler. Keine regulären Wechselpunkte.</p>${own?`<div class="grid2">${[1,2].map(i=>`<label>Libero ${i}<select id="lpSlot${i}">${liberoCandidateOptions(t.liberoIds[i-1])}</select></label>`).join('')}</div>`:`<div class="grid2">${t.liberoIds.map((id,i)=>`<label>Libero ${i+1} #<input id="mlNumber${i+1}" inputmode="numeric" maxlength="5" value="${esc(st.opponentTeam.roster[id].number)}"></label>`).join('')}</div>`}<label>Aktiver Libero<select id="lpLib"><option value="">Feldspieler zurück · kein Libero</option>${t.liberoIds.map(id=>`<option value="${id}">${esc(label(id))}</option>`).join('')}</select></label><label>Tatsächlich ersetzter Spieler<select id="lpMB"><option value="">Niemand</option>${t.players.map(p=>`<option value="${p.regularId}">${own?esc(nm(p.regularId)):'#'+esc(st.opponentTeam.roster[p.regularId].number||'?')} · P${p.pos} · ${esc(own?roleOf(p.regularId):st.opponentTeam.roles[p.regularId])}</option>`).join('')}</select></label>${own?`<label><input id="mlAuto" type="checkbox" ${c?.auto?'checked':''}> Grundordnung nach Rallyes automatisch fortsetzen</label>`:''}<label>Dokumentierte Ausnahme<select id="mlException"><option value="">Keine</option><option value="injury">Aktiver Libero kann nicht weiterspielen</option></select></label><label>Begründung bei Ausnahme<input id="mlNote" maxlength="150"></label><p id="lpHint" role="alert"></p><p class="small">Aktiv: ${current?esc(label(current.id)):'kein Libero'} · ${(c?.history||[]).length} echte Ersetzungen dokumentiert</p><div class="grid3"><button id="lpSave" class="primary">Speichern & übernehmen</button><button id="mlUndo">Teamaktion zurücknehmen</button><button id="lpCancel">Abbrechen</button></div>`);
 if(emergency){$('mlException').value='injury';$('mlException').disabled=true;$('lpHint').textContent='Spielunterbrechung: tatsächliche Verletzung begründen. Keine Rallye und kein Punkt werden erfunden.'}$('lpLib').value=current?.id||'';$('lpMB').value=current?.replaces||'';$('lpLib').onchange=()=>{if(!$('lpLib').value)$('lpMB').value=''};$('lpCancel').onclick=closeModal;$('mlUndo').onclick=()=>{if(undoTeamAction())masterLiberoPanel(team)};
 $('lpSave').onclick=()=>{const before=teamActionSnapshot(),oldUndo=clone(st.teamUndo||[]);try{
 const l=$('lpLib').value,m=$('lpMB').value;if(l&&!m)throw Error('Tatsächlichen Hinterfeldspieler wählen');if(own){const ids=[$('lpSlot1').value,$('lpSlot2').value].filter(Boolean);if(new Set(ids).size!==ids.length||ids.some(id=>st.lineup.includes(id)))throw Error('Zwei verschiedene Liberos außerhalb der Startsechs wählen');if(st.rallies.length&&JSON.stringify(ids)!==JSON.stringify(st.liberoIds))throw Error('Meldung im laufenden Satz nicht umdeuten');if(l&&!ids.includes(l))throw Error('Aktiven Libero aus der Meldung wählen');st.liberoIds=ids}else{const nums=t.liberoIds.map((id,i)=>$('mlNumber'+(i+1)).value.trim());if(nums.some(n=>!/^\d{0,5}$/.test(n))||new Set(nums.filter(Boolean)).size!==nums.filter(Boolean).length||nums.some(n=>n&&Object.values(st.opponentTeam.roster).some(p=>!t.liberoIds.includes(p.id)&&p.number===n)))throw Error('Eindeutige Libero-Nummern verwenden');t.liberoIds.forEach((id,i)=>st.opponentTeam.roster[id].number=nums[i])}
 applyLibero(team,l,m,$('mlException').value,$('mlNote').value);const control=controlFor(team);if(own){control.auto=$('mlAuto').checked;st.liberoAutoEnabled=control.auto}saveLocal();closeModal();render();toast('Tatsächliche Libero-Ersetzung übernommen');
 }catch(e){restore(before);st.teamUndo=oldUndo;saveLocal();$('lpHint').textContent=e.message}};
}
function masterOwnLineup(){
 if(!betweenRallies())return toast('Aufstellung zwischen Ballwechseln bearbeiten');modal(`<h2>EVV · Startsechs und Satzrollen</h2><p class="small">Reguläre Wechsel über Wechsel erfassen. Die Startsechs kann vor der ersten Rallye bestätigt werden.</p><div class="grid3">${lineupEditor('mls',st.lineup)}</div><p id="mlsError" role="alert"></p><div class="grid2"><button id="mlsSave">Startsechs bestätigen</button><button id="mlsClose">Schließen</button></div>`);$('mlsClose').onclick=closeModal;$('mlsSave').onclick=()=>{if(st.rallies.length)return $('mlsError').textContent='Nach Matchbeginn reguläre Wechsel verwenden';const picked=readLineupEditor('mls');if(!picked)return;const rolePositions=Object.fromEntries(picked.ids.map((id,i)=>[picked.roles[id],i+1]));if([['Z','D'],['AA1','AA2'],['MB1','MB2']].some(([a,b])=>Math.abs(rolePositions[a]-rolePositions[b])!==3))return $('mlsError').textContent='5:1: Z/D, AA1/AA2 und MB1/MB2 gegenüber aufstellen';rememberTeamAction('EVV-Startsechs');st.lineup=picked.ids;st.roles=picked.roles;st.setStart={rot:st.rot,serving:st.serving,lineup:clone(st.lineup),roles:clone(st.roles)};closeModal();render();matchTactics(st.rot,'receive',false)};
}

function editOpponentJerseys(){return masterOpponentLineup()}
function liberoPlanner(){return masterLiberoPanel('EVV')}
// One coordinate projection and board frame, shared by live, preview and editor.
function boardProject(point,team='own',quick=false){const [x,y]=team==='own'?[point[0],50+point[1]/2]:[100-point[0],(100-point[1])/2];return quick?[y,100-x]:[x,y]}
function boardFrame(width=100,height=100,quick=false){const path=quick?'M33.333 0V100 M66.667 0V100':'M0 33.333H100 M0 66.667H100',net=quick?'M50 0V100':'M0 50H100';return `<g transform="scale(${width/100} ${height/100})"><rect x="0" y="0" width="100" height="100" class="boardGround"/><path d="${path}" class="courtLine"/><path d="${net}" class="courtNet"/></g>`}
function boardPathMarkup(f,which='own',quick=false){return formationArrows(f).map(a=>{const points=a.points.map(p=>a.space==='court'?(quick?[p[1],100-p[0]]:p):boardProject(p,which,quick)).map(p=>p.join(',')).join(' ');return `<polyline data-board-arrow="${esc(a.id)}" points="${points}" class="${a.kind==='ball'||a.kind==='set'?'ballPath':a.kind==='attack'?'attackPath':'runPath'}"/>`}).join('')}
function boardView({rotation=st.rot,kind='receive',tactical=true,opRotation=0,opKind=kind==='receive'?'defense-IV':'receive',quick=false,scouting=true,eligible=[],selected=null,showTasks=false}={}){
 const b=cockpitFormation(rotation,kind),opp=cockpitOpponent(opRotation),enemyTemplate=b.data.opponents?.[opp.rotation]||opponentFormation(opp.rotation||1,opKind),own=tactical?b.data:b.data.base||emptyFormation(),enemy=tactical?enemyTemplate:enemyTemplate.base||emptyFormation();
 const node=(p,which)=>{const isOwn=which==='own',slot=isOwn?(tactical?p.tacticalPosition:p.pos):p.pos,layer=isOwn?own:enemy,local=quick?formationDefaults[p.pos]:layer.targets[slot]||formationDefaults[slot],xy=boardProject(local,which,quick),id=isOwn?p.id:p.id||'op-'+p.slot,number=isOwn?jersey(id):p.number||'?',lib=!!p.libero,attrs=isOwn?`${quick?'':`data-court-player="${esc(id)}"`} data-tactical-position="${p.tacticalPosition}" data-defense-task="${esc(p.task||'')}" data-player-role="${esc(p.role||'?')}" ${quick&&scouting?`data-quick-player="${esc(id)}"`:quick?`data-readonly-player="${esc(id)}"`:''}`:quick?`data-quick-opponent="${esc(id)}"`:`data-opponent-slot="${p.slot}" data-opp-player="${p.pos}" data-opponent-id="${esc(id)}"`;
 return `<button type="button" class="courtAthlete ${isOwn?'evvAthlete':'opponentAthlete'} ${quick&&isOwn?'livePlayer':''} ${lib?'isLibero':''} ${showTasks&&p.task==='block'?'blockAthlete':''}" ${attrs} data-position="${p.pos}" aria-label="${isOwn?esc(nm(id)):'Gegner'} · Nummer ${esc(number)} · P${p.pos}${lib?' · Libero':''}" ${quick&&isOwn?`aria-pressed="${selected===id}" ${scouting&&eligible.includes(id)?'':'disabled'}`:''} style="left:${xy[0]}%;top:${xy[1]}%"><b>${esc(number)}${lib?'<sup>L</sup>':''}</b><span class="srOnly">${isOwn?esc(nm(id)):''}</span></button>`};
 const tasks=showTasks&&tactical&&DEFENSE_KINDS.includes(kind)?`<polygon class="blockShadow" points="${defenseShadow(own,kind).map(p=>p.join(',')).join(' ')}"/>${b.players.filter(p=>p.task!=='block').map(p=>{const xy=boardProject(p.xy||formationDefaults[p.tacticalPosition]);return `<ellipse class="defenseZone" cx="${xy[0]}" cy="${xy[1]}" rx="8" ry="4"/>`}).join('')}<circle class="attackOrigin" cx="${(own.attackOrigin||builtinDefense(kind).attackOrigin)[0]}" cy="${(own.attackOrigin||builtinDefense(kind).attackOrigin)[1]}" r="1.5"/>`:'';
 return `<div class="canonicalCourt ${quick?'compactBoard':'sharedCourt'}" data-board-engine="canonical-v8" data-own-kind="${kind}" data-opponent-kind="${opKind}" aria-label="Gemeinsames Feld · ${quick?'Live, Regelplätze':'Spielbetrieb · keine Positionsbearbeitung'}"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${boardFrame(100,100,quick)}${quick?'':tasks+boardPathMarkup(own,'own')+boardPathMarkup(enemy,'opponent')}</svg><span class="courtTeam opponentTeam">${esc(opponent.name)}${opp.configured?' · R'+opp.rotation:' · Angaben offen'}</span>${opp.players.map(p=>node(p,'opponent')).join('')}${b.players.map(p=>node(p,'own')).join('')}<span class="boardOwnLabel">EVV · R${rotation}</span></div>`;
}
function bindBoardPlayers(host){host.querySelectorAll('[data-opponent-id],[data-quick-opponent]').forEach(el=>el.onclick=()=>masterPlayerMenu('Gegner',el.dataset.opponentId||el.dataset.quickOpponent));host.querySelectorAll('[data-court-player]:not([data-quick-player])').forEach(el=>el.onclick=()=>masterPlayerMenu('EVV',el.dataset.courtPlayer))}

function middlePacerHTML(rr,filter={}){const x=middlePacer(rr,filter);return `<article class="pacerCard middlePacer" data-middle-pacer><h3>Mitte-Pacer · A+</h3><strong>Ist ${x.actual} · Soll ${planNumber(x.goal)}</strong><span>Abweichung ${x.delta>0?'+':''}${planNumber(x.delta)} Zuspiele</span><small>${x.actual} / ${x.eligible} dokumentierte geeignete Zuspiele · ${x.eligible<currentPlan().minimum?'wenig Daten':'Stichprobe ausreichend'} · unbekanntes Ziel ${x.unknown}</small><small>Trainerziel ${currentPlan().targets.middleGood} %. Angriffserfolg nach dem Zuspiel ist keine technische Zuspielnote.</small></article>`}
const MASTER_ICONS={"radio":"<!-- @license lucide-static v0.468.0 - ISC -->\n<svg aria-hidden=\"true\" focusable=\"false\"\n  class=\"lucide lucide-radio\"\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"24\"\n  height=\"24\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M4.9 19.1C1 15.2 1 8.8 4.9 4.9\" />\n  <path d=\"M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5\" />\n  <circle cx=\"12\" cy=\"12\" r=\"2\" />\n  <path d=\"M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5\" />\n  <path d=\"M19.1 4.9C23 8.8 23 15.1 19.1 19\" />\n</svg>\n","users-round":"<!-- @license lucide-static v0.468.0 - ISC -->\n<svg aria-hidden=\"true\" focusable=\"false\"\n  class=\"lucide lucide-users-round\"\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"24\"\n  height=\"24\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M18 21a8 8 0 0 0-16 0\" />\n  <circle cx=\"10\" cy=\"8\" r=\"5\" />\n  <path d=\"M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3\" />\n</svg>\n","volleyball":"<!-- @license lucide-static v0.468.0 - ISC -->\n<svg aria-hidden=\"true\" focusable=\"false\"\n  class=\"lucide lucide-volleyball\"\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"24\"\n  height=\"24\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M11.1 7.1a16.55 16.55 0 0 1 10.9 4\" />\n  <path d=\"M12 12a12.6 12.6 0 0 1-8.7 5\" />\n  <path d=\"M16.8 13.6a16.55 16.55 0 0 1-9 7.5\" />\n  <path d=\"M20.7 17a12.8 12.8 0 0 0-8.7-5 13.3 13.3 0 0 1 0-10\" />\n  <path d=\"M6.3 3.8a16.55 16.55 0 0 0 1.9 11.5\" />\n  <circle cx=\"12\" cy=\"12\" r=\"10\" />\n</svg>\n","chart-no-axes-combined":"<!-- @license lucide-static v0.468.0 - ISC -->\n<svg aria-hidden=\"true\" focusable=\"false\"\n  class=\"lucide lucide-chart-no-axes-combined\"\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"24\"\n  height=\"24\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M12 16v5\" />\n  <path d=\"M16 14v7\" />\n  <path d=\"M20 10v11\" />\n  <path d=\"m22 3-8.646 8.646a.5.5 0 0 1-.708 0L9.354 8.354a.5.5 0 0 0-.707 0L2 15\" />\n  <path d=\"M4 18v3\" />\n  <path d=\"M8 14v7\" />\n</svg>\n","flag":"<!-- @license lucide-static v0.468.0 - ISC -->\n<svg aria-hidden=\"true\" focusable=\"false\"\n  class=\"lucide lucide-flag\"\n  xmlns=\"http://www.w3.org/2000/svg\"\n  width=\"24\"\n  height=\"24\"\n  viewBox=\"0 0 24 24\"\n  fill=\"none\"\n  stroke=\"currentColor\"\n  stroke-width=\"2\"\n  stroke-linecap=\"round\"\n  stroke-linejoin=\"round\"\n>\n  <path d=\"M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z\" />\n  <line x1=\"4\" x2=\"4\" y1=\"22\" y2=\"15\" />\n</svg>\n"};
function renderMasterNav(){
 if(!st.started){$('masterNav')?.remove();return}
 let nav=$('masterNav');if(!nav){nav=document.createElement('nav');nav.id='masterNav';nav.className='masterNav';nav.setAttribute('aria-label','Hauptnavigation');document.body.appendChild(nav)}
 const item=(id,label,icon)=>{let b=$(id);if(!b){b=document.createElement('button');b.id=id;b.type='button'}b.className='masterNavButton'+(id==='matchPlanLive'?' pacerEntry '+livePacer().status:'');b.innerHTML=MASTER_ICONS[icon]+`<span>${label}</span>`;nav.appendChild(b);return b};
 const go=fn=>{if(editorGuard&&!editorGuard())return;editorGuard=null;fn()};
 item('navLive','Live','radio').onclick=()=>go(()=>{closeModal();view='live';tab='rally';render()});item('navLineup','Aufstellung','users-round').onclick=()=>go(()=>matchTactics(st.rot,'receive',false));item('matchTactics','Taktik','volleyball').onclick=()=>go(()=>matchTactics());item('turnaroundReport','Analyse','chart-no-axes-combined').onclick=()=>go(()=>analysisPanel());item('matchPlanLive','Matchplan','flag').onclick=()=>go(()=>matchPlanPanel());
}

document.addEventListener('keydown',e=>{if($('modal').classList.contains('hidden'))return;if(e.key==='Escape'){e.preventDefault();closeModal();return}if(e.key!=='Tab')return;const nodes=[...$('modalBox').querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')].filter(n=>n.getClientRects().length);if(!nodes.length)return;const i=nodes.indexOf(document.activeElement);if(e.shiftKey&&(i<=0)){e.preventDefault();nodes.at(-1).focus()}else if(!e.shiftKey&&(i===nodes.length-1||i===-1)){e.preventDefault();nodes[0].focus()}});
function prepareTeamForRally(){if(st.teamControl?.EVV)return;const current=st.liberoActive?{id:st.liberoOnCourt,replaces:st.liberoReplacedId}:null;st.teamControl=st.teamControl||{};st.teamControl.EVV={history:[],last:current?st.rallies.length:-1,auto:st.liberoAutoEnabled!==false,unavailable:[],active:current};if(!current){st.liberoOnCourt='';st.liberoReplacedId=''}}
function legacySketchImport(rotation=st.rot,kind='defense-IV'){
 const archive={...(st.sixPresets||{}),...(st.sixBoards||{})},keys=Object.keys(archive).filter(k=>/^(EVV|Gegner)_(IV|III|II)$/.test(k));
 modal(`<h2>Ältere Skizzen übernehmen</h2><p class="small">Alte Daten bleiben unverändert im Backup. Die Vorschau öffnet den gemeinsamen Editor; erst Speichern übernimmt Ziele als Anpassung. Einzelne Zielmarkierungen werden nicht als Ballwege erfunden.</p><label>Alte Vorlage<select id="legacySource">${keys.map(k=>`<option>${esc(k)}</option>`).join('')}</select></label><p>${keys.length?'Gespeicherte Altvorlagen: '+keys.length:'Keine alten Skizzen vorhanden.'}</p><div class="grid2"><button id="legacyPreview" ${keys.length?'':'disabled'}>Im gemeinsamen Feld prüfen</button><button id="legacyClose">Schließen</button></div>`);
 $('legacyClose').onclick=closeModal;$('legacyPreview').onclick=()=>{const key=$('legacySource').value,board=archive[key],which=key.startsWith('EVV')?'own':'opponent',lane=key.split('_')[1],f=formationFor(rotation,'defense-'+lane),target=which==='own'?f:(f.opponents=f.opponents||{},f.opponents[cockpitOpponent().rotation||1]=f.opponents[cockpitOpponent().rotation||1]||opponentFormation(cockpitOpponent().rotation||1,'defense-'+lane));target.assignment='positions';for(const [p,xy]of Object.entries(board.players||{}))if([1,2,3,4,5,6].includes(Number(p)))target.targets[p]=clone(xy);formationEditor(rotation,'defense-'+lane,'tactical',cockpitOpponent().rotation||1,f);toast('Altvorlage als ungespeicherte Vorschau geladen')};
}
function opponentCourt(){
 const count=Object.fromEntries(Array.from({length:9},(_,i)=>[i+1,0]));for(const r of allRallies())if(r.targetZone&&r.winner==='EVV')count[r.targetZone]++;
 modal(`<h2>${esc(opponent.name)} · Zielzonen und Aufstellung</h2><div class="zone9">${Array.from({length:9},(_,i)=>`<button data-opp-zone="${i+1}"><b>${i+1}</b><small>${count[i+1]} dokumentierte Punkte</small></button>`).join('')}</div><div id="oppCanonicalCourt">${boardView()}</div><div class="grid3"><button id="oppModeMove">Gemeinsamer Trainer-Editor</button><button id="oppEditPlayers">Nummern und Rollen</button><button id="oppClose">Schließen</button></div>`);bindBoardPlayers($('oppCanonicalCourt'));$('oppModeMove').onclick=()=>formationEditor();$('oppEditPlayers').onclick=masterOpponentLineup;$('oppClose').onclick=closeModal;
}

const restored=loadLocal();if(restoredRuntime){draft=restoredRuntime.draft;draftHistory=restoredRuntime.draftHistory||[];pendingMark=restoredRuntime.pendingMark||null;liveMode=restoredRuntime.liveMode==="quick"?"quick":"detail";tab=["rally","opponent","coach","stats"].includes(restoredRuntime.tab)?restoredRuntime.tab:"rally";view=restoredRuntime.view||"live"}document.title=`EVV QuickScout V${APP_VERSION}`;if($("buildLabel"))$("buildLabel").textContent=`V${APP_VERSION}`;if($("setupVersion"))$("setupVersion").textContent=`V${APP_VERSION}`;setupUI();if(restored&&st.started){$("setup").classList.add("hidden")}render();if(pendingMark)nineZonePicker(pendingMark.data?.serve==="ACE"?"ACE":"KILL",pendingMark);
window.EVV_QS_TEST={legacySketchImport,boardView,boardProject,boardFrame,masterPlayerMenu,masterLiberoPanel,masterOpponentLineup,masterOwnLineup,masterOpponentSub,validFormation,teamState,laeufer,builtinK1,opponentSetPlayer,opponentSub,ensureOpponentTeam,applyLibero,undoTeamAction,saveTeamDefault,opponentFormation,middlePacer,formationArrows,validArrows,planDefaults,currentPlan,saveMatchPlan,validatePlan,pacerAt,livePacer,receptionCategory,setterAnalysis,freeBallAnalysis,freeChanceRecords,markFreeChance,openingCoaching,matchPlanPanel,setterPanel,freeBallPanel,capturePanel,builtinDefense,defenseStandard,saveDefenseStandard,formationSource,defenseShadow,validBaseFormation,cockpitMetrics,cockpitFilter,rotationSignal,cockpitFormation,cockpitOpponent,matchTactics,rotationCoaching,activeFormation,validateMatch,turnaroundAnalysis,formationFor,saveFormation,formationPlayers,formationEditor,saveLineupPreset,saveHybridFormation,hybridFormation,turnaroundMetrics,hybridAction,hybridMode,editOpponentJerseys,jersey,newMatch,liberoPlanner,opponentCourt,configureLiberos,configureLiberoSlots,liberoRoster,checkEnd,setWins,timeoutCount,timeoutSummary,saveSixPresets,loadSixPresets,opponentPlayerStats,trendPanel,tacticalPreset,importData,action,commit,applySub,undoLast,start,setView:v=>{view=v},getDraft:()=>clone(draft),setLineup:(ids,roles,rot,lib)=>{st.lineup=ids.slice();st.roles=Object.assign({},roles);st.rot=rot||1;if(lib)Object.assign(st,lib)},begin:(serv,rot)=>{st.started=true;st.serving=serv;st.rot=rot||st.rot;st.setStart={rot:st.rot,serving:serv,lineup:clone(st.lineup),roles:clone(st.roles)}},target,isSetWin,rotNext:r=>ROT_NEXT[r],fresh,state:()=>clone(st),courtPos,rotationMatrix,liberoEligible,syncLiberoRotation,currentServerId,front,receivers,attackOptions,attackRoutesFor,roleBaseRoute,roleOf,readLineupEditor,ralliesForSet,marksForSet,opponentReceivers,version:APP_VERSION};
})();
