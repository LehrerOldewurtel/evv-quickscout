(function(){
"use strict";
const $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
const APP_VERSION=globalThis.EVV_VERSION||"7.19.0-k1-auto-mb";
const ROT_NEXT={5:6,6:1,1:2,2:3,3:4,4:5}; // confirmed live-test convention: R5→R6→R1
let roster=[
{id:"johann",name:"Johann",role:"Z"},{id:"michael",name:"Michael",role:"AA1"},{id:"janik",name:"Janik",role:"MB1"},
{id:"jonas",name:"Jonas",role:"D"},{id:"maksym",name:"Maxim",role:"AA2"},{id:"dirk",name:"Dirk",role:"MB2"},
{id:"niklas",name:"Niklas",role:"MB1"},{id:"arthur",name:"Arthur",role:"AA"},{id:"lion",name:"Lion",role:"AA"},{id:"david",name:"David",role:"AA"},{id:"reinhold",name:"Reinhold",role:"Z"},{id:"felix",name:"Felix",role:"AA"},{id:"jens",name:"Jens",role:"D/AA"},{id:"amar",name:"Anmol",role:"L"},{id:"alex",name:"Sascha",role:"L"}];
const JERSEY={niklas:"5",johann:"6",michael:"16",janik:"15",jonas:"12",maksym:"1",dirk:"4",arthur:"14",felix:"?",jens:"?",amar:"?",alex:"?"};
function jersey(id){if(id==="niklas"&&!st.jerseyNumbers?.niklas&&Object.entries(st.jerseyNumbers||{}).some(([other,n])=>other!==id&&n==="5"))return "?";return st.jerseyNumbers?.[id]||JERSEY[id]||"?"}
const ROLES=["Z","D","AA1","AA2","MB1","MB2"];
const defaultRoles=()=>({johann:"Z",jens:"D",michael:"AA1",arthur:"AA2",janik:"MB1",dirk:"MB2"});
function roleOf(id){return (st.roles||{})[id]||(byId(id)||{}).role||""}
function roleOptions(selected){return ROLES.map(r=>`<option value="${r}" ${selected===r?"selected":""}>${r}</option>`).join("")}
function lineupEditor(prefix,ids){return ids.map((id,i)=>`<label>Startplatz P${i+1}<select id="${prefix}P${i}">${roster.filter(p=>p.role!=="L").map(p=>`<option value="${p.id}" ${p.id===id?"selected":""}>${esc(p.name)} #${jersey(p.id)}</option>`).join("")}</select><select aria-label="Rolle für Startplatz ${i+1}" id="${prefix}R${i}">${roleOptions(roleOf(id))}</select></label>`).join("")}
function readLineupEditor(prefix){const ids=[0,1,2,3,4,5].map(i=>$(prefix+"P"+i).value),roles=[0,1,2,3,4,5].map(i=>$(prefix+"R"+i).value);if(st.started&&ids.some(id=>st.liberoIds.includes(id))){toast("Gemeldeter Libero darf nicht als Feldspieler aufgestellt werden");return null}if(new Set(ids).size!==6||new Set(roles).size!==6||!ROLES.every(r=>roles.includes(r))){toast("Sechs verschiedene Spieler und jede Rolle genau einmal wählen");return null}return {ids,roles:Object.fromEntries(ids.map((id,i)=>[id,roles[i]]))}}
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
function modal(html){$("modalBox").classList.remove("presentation");$("modalBox").innerHTML=html;$("modalBox").scrollTop=0;$("modal").classList.remove("hidden")}
let editorGuard=null;
window.addEventListener("beforeunload",e=>{if(editorGuard&&!editorGuard.peek()){e.preventDefault();e.returnValue=""}});
function closeModal(){if(editorGuard&&!editorGuard())return;editorGuard=null;$("modalBox").classList.remove("presentation");$("modal").classList.add("hidden");$("modalBox").innerHTML=""}
$("modal").addEventListener("click",e=>{if(e.target===$("modal"))closeModal()});
function target(set=st.set){return set===5?15:25}
function isSetWin(e=st.e,o=st.o,set=st.set){return (e>=target(set)||o>=target(set))&&Math.abs(e-o)>=2}
function setWins(team){let w=st.sets.filter(s=>(team==="EVV"?s.e>s.o:s.o>s.e)).length;if(st.setEnded&&(team==="EVV"?st.e>st.o:st.o>st.e))w++;return w}
function checkEnd(){st.setEnded=isSetWin();st.matchEnded=false;if(st.setEnded){const w=st.e>st.o?"EVV":"Gegner";st.matchEnded=setWins(w)>=3}}
function snapshot(){return clone({coachNotes:st.coachNotes,e:st.e,o:st.o,rot:st.rot,serving:st.serving,setEnded:st.setEnded,matchEnded:st.matchEnded,rallies:st.rallies,marks:st.marks,events:st.events,subPairs:st.subPairs,subCount:st.subCount,subUsed:st.subUsed,lineup:st.lineup,roles:st.roles,receiveIds:st.receiveIds,receivePlans:st.receivePlans,tacticPositions:st.tacticPositions,opponentPositions:st.opponentPositions,sixBoards:st.sixBoards,liberoOnCourt:st.liberoOnCourt,liberoReplacedId:st.liberoReplacedId,liberoActive:st.liberoActive,liberoAutoEnabled:st.liberoAutoEnabled,liberoPreferredId:st.liberoPreferredId,liberoPreferredMB:st.liberoPreferredMB})}
function restore(x){Object.assign(st,clone(x))}
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
function syncLiberoRotation(){
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
 const rally=r=>{if(!obj(r)||!['EVV','Gegner'].includes(r.winner)||r.chain&&!Array.isArray(r.chain))fail();if(r.chain?.some(c=>!obj(c)||!['EVV','Gegner'].includes(c.side)||typeof c.type!=='string'))fail()};
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
 map(m.formationBook,validFormation);
 map(m.defenseStandards,f=>f===null||validFormation(f)&&Object.keys(f.targets).length===6&&!f.base&&!f.opponents);if(m.defenseStandards&&Object.keys(m.defenseStandards).some(k=>!DEFENSE_KINDS.includes(k)))fail();
 map(m.formationTemplates,t=>obj(t)&&Number.isInteger(t.rotation)&&t.rotation>=1&&t.rotation<=6&&Number.isInteger(t.opponentRotation)&&t.opponentRotation>=1&&t.opponentRotation<=6&&FORMATION_KINDS.includes(t.kind)&&['base','tactical'].includes(t.stance)&&(t.scope===undefined||['rotation','standard'].includes(t.scope))&&validFormation(t.formation));
 map(m.sixBoards,b=>obj(b)&&obj(b.players)&&Array.isArray(b.pins)&&Object.values(b.players).every(xy)&&b.pins.every(xy));
 map(m.receivePlans,ids=>Array.isArray(ids)&&ids.every(id=>!!byId(id)));
 // Undo snapshots become live state. Validate their contents as strictly as the
 // enclosing match before accepting an import or restoring local storage.
 for(const u of m.rallyUndo){
  if(!obj(u)||Object.prototype.hasOwnProperty.call(u,'rallyUndo')||![u.e,u.o].every(n=>Number.isInteger(n)&&n>=0)||!Array.isArray(u.lineup)||u.lineup.length!==6||new Set(u.lineup).size!==6||u.lineup.some(id=>!byId(id)))fail();
  validateMatch({...m,...u,rallyUndo:[]});
 }
 for(const mark of m.marks)if(!obj(mark)||![mark.x,mark.y].every(n=>Number.isFinite(n)&&n>=0&&n<=1))fail();
 map(m.startPresets,p=>obj(p)&&Array.isArray(p.lineup)&&p.lineup.length===6&&new Set(p.lineup).size===6&&p.lineup.every(id=>!!byId(id))&&obj(p.roles)&&p.lineup.every(id=>ROLES.includes(p.roles[id]))&&Array.isArray(p.liberoIds)&&p.liberoIds.every(id=>!!byId(id)));
 const visit=(v,depth=0)=>{if(depth>80)fail();if(v&&typeof v==='object'){for(const k of Object.keys(v)){if(['__proto__','prototype','constructor'].includes(k))fail();visit(v[k],depth+1)}}};visit(m);
 return true;
}
function validateOpponent(o){if(o&&Object.keys(o).some(k=>['__proto__','prototype','constructor'].includes(k)))throw Error('Ungültige Gegnerdaten');if(!o||typeof o.name!=='string'||!Array.isArray(o.receivers)||o.receivers.some(x=>typeof x!=='string')||(o.liberos&&(!Array.isArray(o.liberos)||o.liberos.some(x=>typeof x!=='string'))))throw Error('Ungültige Gegnerdaten');if(o.courtAnchor){const a=o.courtAnchor;if(!Number.isInteger(a.set)||a.set<1||a.set>5||!Number.isInteger(a.rotation)||a.rotation<1||a.rotation>6||!Number.isInteger(a.sideouts)||a.sideouts<0||!a.positions||Object.keys(a.positions).length!==6||![1,2,3,4,5,6].every(p=>typeof a.positions[p]==='string'&&/^\d{1,5}$/.test(a.positions[p]))||new Set(Object.values(a.positions)).size!==6||typeof a.libero!=='string'||!/^\d{0,5}$/.test(a.libero)||!Number.isInteger(a.replaces)||a.replaces<0||a.replaces>6||!!a.libero!==!!a.replaces||a.libero&&Object.values(a.positions).includes(a.libero))throw Error('Ungültige Gegneraufstellung')}}
function validateRuntime(r){
 if(!r)return;
 const checkDraft=d=>{if(!d||typeof d!=='object'||Array.isArray(d)||d.chain&&(!Array.isArray(d.chain)||d.chain.some(x=>!x||typeof x.type!=='string'||!['EVV','Gegner'].includes(x.side))))throw Error('Ungültiger Rallyeentwurf')};
 checkDraft(r.draft);if(r.draftHistory&&(!Array.isArray(r.draftHistory)||r.draftHistory.length>30))throw Error('Ungültiger Entwurfsverlauf');for(const h of r.draftHistory||[])checkDraft(h.draft);
 if(r.pendingMark&&(!['EVV','Gegner'].includes(r.pendingMark.w)||!r.pendingMark.data||typeof r.pendingMark.data!=='object'||Array.isArray(r.pendingMark.data)))throw Error('Ungültiger Zielpunkt');
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
let cockpitPreferences={theme:'auto',thresholds:clone(cockpitDefaults)};
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
function analysisPanel(initial={}){modal('<button id="analysisClose" class="dialogClose" aria-label="Analyse schließen">×</button><div id="analysisHost"></div>');cockpitDashboard($('analysisHost'),'analysis',initial);$('analysisClose').onclick=closeModal}
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
function hasOwnTactics(f){return !!(Object.keys(f?.targets||{}).length||Object.keys(f?.routes||{}).length||f?.ballPaths?.length||Object.keys(f?.attacks||{}).length)}
function formationSource(rotation,kind){const f=st.formationBook?.[`${rotation}:${kind}`];return hasOwnTactics(f)?'rotation':defenseStandard(kind)?'standard':'neutral'}
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
function cockpitOpponent(previewRotation=0){
 const a=opponent.courtAnchor,liveSteps=a&&a.set===st.set?opponentSideouts()-a.sideouts:0,configured=!!a&&a.set===st.set&&liveSteps>=0,steps=configured&&previewRotation?(previewRotation-a.rotation+6)%6:liveSteps;
 return {configured,rotation:configured?(a.rotation-1+steps)%6+1:null,players:[1,2,3,4,5,6].map(slot=>{let pos=slot;if(configured)for(let i=0;i<steps%6;i++)pos=pos===1?6:pos-1;const lib=configured&&a.libero&&a.replaces===slot&&[1,5,6].includes(pos)&&!(pos===1&&!st.serving);return {slot,pos,number:configured?(lib?a.libero:a.positions[slot]):'',libero:!!lib}})};
}
function matchTactics(rotation=st.rot,kind=st.serving?'defense-IV':'receive',initialTactical=true,initialOpponent=0){
 let selectedRotation=rotation,selectedKind=kind,tactical=initialTactical,follow=rotation===st.rot,opponentPreview=initialOpponent,showTasks=false;
 modal(`<div class="matchTactics"><div class="cockpitHeading"><div><span class="eyebrow">TAKTIK</span><h2>Spielbetrieb</h2></div><button id="tacticsPresent">Vergrößern</button><button id="tacticsClose">Schließen</button></div><div class="scopeTabs"><button id="tacticsFollow">Live folgen</button><label>Rotationsvorschau<select id="tacticsRotation">${[1,2,3,4,5,6].map(r=>`<option>${r}</option>`).join('')}</select></label></div><label class="opponentPreview">Gegnerrotation<select id="tacticsOpponentRotation"><option value="0">Live folgen</option>${[1,2,3,4,5,6].map(r=>`<option value="${r}">Vorschau R${r}</option>`).join('')}</select></label><nav class="formationTabs">${FORMATION_KINDS.map(k=>[k,formationLabel(k)]).map(([k,l])=>`<button data-formation-kind="${k}">${l}</button>`).join('')}</nav><div class="scopeTabs"><button id="tacticsBase">Ausgangsstellung</button><button id="tacticsTarget">Taktische Stellung</button></div><button id="tacticsTasks" aria-pressed="false">Aufgaben &amp; Abwehrbereiche</button><p id="tacticsContext"></p><div id="tacticsLegend"></div><div id="matchCourt"></div><div class="tacticsFooter"><button id="tacticsEdit">Trainer-Editor</button><button id="tacticsOpponent">Gegner aufstellen</button><button id="tacticsOwnNumbers">EVV-Nummern</button><button id="tacticsLegacy">Weitere Skizzen</button></div></div>`);
 function draw(){const b=cockpitFormation(selectedRotation,selectedKind),opp=cockpitOpponent(opponentPreview),defaults=formationDefaults;const own=tactical?b.data:b.data.base||emptyFormation(),enemyRoot=b.data.opponents?.[opp.rotation],enemy=(tactical?enemyRoot:enemyRoot?.base)||emptyFormation();$('tacticsOpponentRotation').value=opponentPreview;
 $('tacticsRotation').value=selectedRotation;$('tacticsFollow').setAttribute('aria-pressed',String(follow));$('tacticsBase').setAttribute('aria-pressed',String(!tactical));$('tacticsTarget').setAttribute('aria-pressed',String(tactical));document.querySelectorAll('[data-formation-kind]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.formationKind===selectedKind)));
 $('tacticsContext').textContent=`${follow?'LIVE':'VORSCHAU'} · EVV R${selectedRotation} · ${selectedKind==='receive'?'K1 · Annahme':formationLabel(selectedKind)} · ${b.source==='standard'?'EVV-Standard · ':b.source==='rotation'?'Rotationsanpassung'+(b.data.assignment==='roles'?' · ':' · positionsgebunden · '):''}${b.data.proposal?'Editierbare Vorschlagswerte · ':''}${b.assignmentNote?b.assignmentNote+' · ':''}${tactical?(b.configured?Object.keys(b.data.targets).length===6?(b.source==='standard'?'gemeinsame Grundordnung':'Gespeicherte Formation'):'Teilformation · '+Object.keys(b.data.targets).length+'/6 Ziele':'Nicht eingerichtet · Regelpositionen angezeigt'):'Regelpositionen'}${opp.configured?' · Gegner '+(opponentPreview?'Vorschau ':'Live ')+'R'+opp.rotation:' · Gegner nicht eingerichtet'}`;
 $('tacticsLegend').innerHTML=showTasks&&tactical&&DEFENSE_KINDS.includes(selectedKind)?`<div class="defenseLegend">${b.players.slice().sort((a,b)=>a.tacticalPosition-b.tacticalPosition).map(p=>`<span><b>Zone P${p.tacticalPosition} · ${esc(DEFENSE_TASK_LABELS[p.task])}</b><small>#${esc(p.number)} ${esc(p.name)} · Regel-P${p.rulePosition} · ${esc(p.role)}</small></span>`).join('')}</div>`:'';
 const paths=(f,which)=>{const xy=([x,y])=>which==='own'?[x,50+y/2]:[100-x,(100-y)/2],points=path=>path.map(p=>xy(p).join(',')).join(' ');return Object.entries(f.routes).filter(([,p])=>p.length>1).map(([slot,p])=>`<polyline points="${points(p)}" class="runPath"/>`).join('')+Object.values(f.attacks||{}).filter(p=>p.length>1).map(p=>`<polyline points="${points(p)}" class="attackPath"/>`).join('')+f.ballPaths.filter(p=>p.length>1).map(p=>`<polyline points="${p.map(p=>p.join(',')).join(' ')}" class="ballPath"/>`).join('')};
 $('matchCourt').innerHTML=`<div class="sharedCourt" aria-label="Gemeinsames Feld · nur ansehen"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M0 33.33H100 M0 66.67H100" class="courtLine"/><path d="M0 50H100" class="courtNet"/>${showTasks&&tactical&&DEFENSE_KINDS.includes(selectedKind)?`<polygon class="blockShadow" points="${defenseShadow(own,selectedKind).map(p=>p.join(',')).join(' ')}"/>${b.players.filter(p=>p.task!=='block').map(p=>{const xy=p.xy||defaults[p.tacticalPosition];return `<ellipse class="defenseZone" cx="${xy[0]}" cy="${50+xy[1]/2}" rx="8" ry="4"/>`}).join('')}<circle class="attackOrigin" cx="${(own.attackOrigin||builtinDefense(selectedKind).attackOrigin)[0]}" cy="${(own.attackOrigin||builtinDefense(selectedKind).attackOrigin)[1]}" r="1.5"/>`: ''}${paths(own,'own')}${paths(enemy,'opponent')}</svg><span class="courtTeam opponentTeam">${esc(opponent.name)} · ${opp.configured?'R'+opp.rotation:'Aufstellung fehlt'}</span>${opp.players.map(p=>{const xy=enemy.targets[p.pos]||defaults[p.pos];return `<div class="courtAthlete opponentAthlete ${p.libero?'isLibero':''} ${xy[1]<20?'deepAthlete':''}" data-opponent-slot="${p.slot}" data-position="${p.pos}" style="left:${100-xy[0]}%;top:${(100-xy[1])/2}%"><b>${p.number?'#'+esc(p.number):'?'}</b><div class="athleteLabels"><small>${p.libero?'L · ':''}P${p.pos}</small></div></div>`}).join('')}${b.players.map(p=>{const xy=own.targets[tactical?p.tacticalPosition:p.pos]||defaults[tactical?p.tacticalPosition:p.pos];return `<div class="courtAthlete evvAthlete ${p.libero?'isLibero':''} ${xy[1]>75?'deepAthlete':''} ${xy[0]>60?'farRightAthlete':''} ${xy[0]<15?'edgeLeftAthlete':xy[0]>85?'edgeRightAthlete':''} ${showTasks&&p.task==='block'?'blockAthlete':''}" data-court-player="${p.id}" data-position="${p.pos}" data-tactical-position="${p.tacticalPosition}" data-defense-task="${p.task}" data-player-role="${esc(p.role)}" style="left:${xy[0]}%;top:${50+xy[1]/2}%"><b>#${esc(p.number)}${p.libero?' · L':''}</b><div class="athleteLabels"><span>${esc(p.name)}</span><small>P${tactical?p.tacticalPosition:p.pos}${tactical&&b.data.assignment==='roles'?' · Regel P'+p.rulePosition:''}${!own.targets[tactical?p.tacticalPosition:p.pos]?' · Basis':''}</small></div></div>`}).join('')}</div><p class="courtCaption">EVV · ${follow?'Live':'Vorschau'} R${selectedRotation} · Laufwege blau, Ballwege gestrichelt, Angriffsanläufe violett</p>`;

 }
 $('tacticsTasks').onclick=()=>{showTasks=!showTasks;$('tacticsTasks').setAttribute('aria-pressed',String(showTasks));draw()};$('tacticsOpponentRotation').onchange=()=>{opponentPreview=Number($('tacticsOpponentRotation').value);draw()};$('tacticsFollow').onclick=()=>{follow=true;selectedRotation=st.rot;draw()};$('tacticsRotation').onchange=()=>{selectedRotation=Number($('tacticsRotation').value);follow=false;draw()};document.querySelectorAll('[data-formation-kind]').forEach(b=>b.onclick=()=>{selectedKind=b.dataset.formationKind;draw()});$('tacticsBase').onclick=()=>{tactical=false;draw()};$('tacticsTarget').onclick=()=>{tactical=true;draw()};$('tacticsEdit').onclick=()=>formationEditor(selectedRotation,selectedKind,tactical?'tactical':'base',cockpitOpponent(opponentPreview).rotation||1);$('tacticsOpponent').onclick=editOpponentJerseys;$('tacticsOwnNumbers').onclick=editOwnNumbers;$('tacticsLegacy').onclick=()=>{modal(`<h2>Trainer-Editor · bisherige Skizzen</h2>${tacticalBoard()}<button id="legacyClose">Schließen</button>`);bindTactic();$('legacyClose').onclick=closeModal};$('tacticsPresent').onclick=()=>{const on=$('modalBox').classList.toggle('presentation');$('tacticsPresent').textContent=on?'Verkleinern':'Vergrößern'};$('tacticsClose').onclick=closeModal;draw();
}
cockpitTheme();

const formationDefaults={1:[80,80],2:[80,25],3:[50,25],4:[20,25],5:[20,80],6:[50,80]};
function activeFormation(){const step=String(draft.step||''),defending=(!step&&st.serving)||step.startsWith('opp')||['evvDefense','evvBlockChoice','evvBlockResult'].includes(step);const lane=['IV','III','II','I'].includes(draft.setterTarget)?draft.setterTarget:'IV',kind=defending?'defense-'+lane:'receive';return {rotation:st.rot,kind,data:formationFor(st.rot,kind)}}
function formationFor(rotation,kind='receive'){
 const saved=st.formationBook?.[`${rotation}:${kind}`];if(hasOwnTactics(saved))return clone(saved);
 const standard=defenseStandard(kind);if(standard){const extra=clone(saved||{});for(const key of ['targets','routes','ballPaths','attacks','assignment','proposal','attackOrigin'])delete extra[key];return {...standard,...extra}}if(saved)return clone(saved);
 const result={targets:{},routes:{},ballPaths:[]};
 if(kind==='receive'){const old=hybridFormation(rotation);for(const p of formationPlayers(rotation)){if(old.targets[p.id])result.targets[p.pos]=old.targets[p.id];if(old.routes[p.id])result.routes[p.pos]=old.routes[p.id]}}
 return clone(result);
}
function emptyFormation(){return {targets:{},routes:{},ballPaths:[]}}
function validBaseFormation(targets){
 const t=Object.fromEntries([1,2,3,4,5,6].map(p=>[p,targets[p]||formationDefaults[p]]));
 return t[4][0]<t[3][0]&&t[3][0]<t[2][0]&&t[5][0]<t[6][0]&&t[6][0]<t[1][0]&&t[4][1]<t[5][1]&&t[3][1]<t[6][1]&&t[2][1]<t[1][1];
}
function validFormation(f,depth=0){
 const obj=x=>x&&typeof x==='object'&&!Array.isArray(x),point=p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&n>=0&&n<=100),path=p=>Array.isArray(p)&&p.every(point),slots=(x,check)=>obj(x)&&Object.entries(x).every(([k,v])=>['1','2','3','4','5','6'].includes(k)&&check(v));
 if(depth>2||!obj(f)||Object.keys(f).some(k=>!['targets','routes','ballPaths','attacks','base','opponents','proposal','attackOrigin','assignment'].includes(k))||!slots(f.targets,point)||!slots(f.routes,path)||!Array.isArray(f.ballPaths)||!f.ballPaths.every(path)||f.attacks!==undefined&&!slots(f.attacks,path))return false;
 if(f.proposal!==undefined&&typeof f.proposal!=='boolean'||f.assignment!==undefined&&!['roles','positions'].includes(f.assignment)||f.attackOrigin!==undefined&&(!point(f.attackOrigin)||f.attackOrigin[1]>=50))return false;
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
function formationPlayers(rotation,serving=st.serving){
 const steps=rotationSteps(st.rot,rotation),players=st.lineup.map(id=>{let pos=courtPos(id);for(let i=0;i<steps;i++)pos=pos===1?6:pos-1;return {id,pos}});
 const eligible=players.filter(p=>/^MB/.test(roleOf(p.id))&&[1,5,6].includes(p.pos));
 const mb=eligible.find(p=>p.id===st.liberoReplacedId)||eligible.find(p=>p.id===st.liberoPreferredMB)||eligible[0],lib=st.liberoPreferredId||st.liberoOnCourt||st.liberoIds[0];
 if(mb&&lib&&st.liberoIds.includes(lib)&&!st.lineup.includes(lib)&&st.liberoAutoEnabled!==false&&!(mb.pos===1&&serving))mb.id=lib;
 return players;
}
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
function formationEditor(rotation=st.rot,kind='receive',stance='tactical',opponentRotation=cockpitOpponent().rotation||1,loaded=null,scope='rotation'){
 if(!DEFENSE_KINDS.includes(kind))scope='rotation';if(scope==='standard')stance='tactical';
 const baseline=()=>scope==='standard'?(defenseStandard(kind)||{...emptyFormation(),assignment:'roles',proposal:true,attackOrigin:builtinDefense(kind).attackOrigin}):formationFor(rotation,kind);
 let working=clone(loaded||baseline()),selected=1,team='own',gesture=null,resetPending=false;
 const initial=()=>JSON.stringify(working);let saved=JSON.stringify(baseline());
 const dirty=()=>initial()!==saved;
 const leave=fn=>{if(dirty()&&!confirm('Ungespeicherte Änderungen verwerfen? Abbrechen und Speichern wählen, um sie zu behalten.'))return false;editorGuard=null;fn();return true};
 editorGuard=()=>!dirty()||confirm('Ungespeicherte Änderungen verwerfen? Abbrechen und Speichern wählen, um sie zu behalten.');
 editorGuard.peek=()=>!dirty();
 const layer=(which=team)=>{let f=working;if(which==='opponent'){f.opponents=f.opponents||{};f=f.opponents[opponentRotation]=f.opponents[opponentRotation]||emptyFormation()}if(stance==='base')f=f.base=f.base||emptyFormation();return f};
 const readLayer=which=>{const f=which==='own'?working:working.opponents?.[opponentRotation];return (stance==='base'?f?.base:f)||emptyFormation()};
 const playerList=()=>tacticalPlayers(rotation,kind,stance==='base'?{}:working).players.map(p=>({...p,pos:stance==='base'?p.rulePosition:p.tacticalPosition})),opp=cockpitOpponent(opponentRotation);
 modal(`<h2>Formationseditor · beide Mannschaften</h2><label>Speicherbereich<select id="formScope"><option value="rotation">Individuell · diese Rotation</option>${DEFENSE_KINDS.includes(kind)?'<option value="standard">EVV-Standard · alle Rotationen</option>':''}</select></label><p class="small">Rotationsanpassung hat Vorrang vor EVV-Standard. Ältere positionsbezogene Bilder bleiben unverändert. Im Standardbereich werden nur eigene taktische Ziele gespeichert.</p><div class="grid2"><label>EVV Rotation<select id="formRotation">${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label><label>Gegnerrotation<select id="formOpponentRotation">${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label><label>Formation<select id="formKind"><option value="receive">Annahme</option><option value="defense-IV">Abwehr IV</option><option value="defense-III">Abwehr III</option><option value="defense-II">Abwehr II</option><option value="defense-I">Abwehr Hinterfeld I</option></select></label><label>Stellung<select id="formStance"><option value="tactical">Taktische Stellung</option><option value="base">Ausgangsstellung · Reihenfolge prüfen</option></select></label></div><label>Werkzeug<select id="formTool"><option value="move">Spieler verschieben</option><option value="route">Laufweg des gewählten Spielers</option><option value="ball">Ballweg</option><option value="attack">Angriffsroute</option></select></label><p class="small">Beide Teams ziehen oder Spieler auswählen → Ziel antippen. Ausgangsstellungen werden auf P4–P3–P2, P5–P6–P1 und Vorder-/Hinterreihe geprüft. Gegner ${opp.configured?'konfiguriert':'nicht eingerichtet: zunächst Trikotnummern im Spielbetrieb eintragen'}.</p><div id="defenseOptions" ${DEFENSE_KINDS.includes(kind)?'':'hidden'}><label><input type="checkbox" id="formProposed"> Koordinaten sind noch editierbare Vorschlagswerte</label><div class="grid2"><label>Angriffsort · links / rechts<input id="formAttackX" type="range" min="0" max="100"></label><label>Angriffstiefe · Grundlinie / Netz<input id="formAttackY" type="range" min="0" max="49"></label></div><p class="small">Angriffsort und drei Hinterfeldziele für den tatsächlich beobachteten Winkel anpassen. Die Regelrotation bleibt unverändert.</p><button id="formUseStandard">EVV-Standard verwenden · eigene Anpassung lösen</button><button id="formStandardOff">EVV-Standard deaktivieren</button></div><p id="formStatus" role="status"></p><svg id="formationSvg" viewBox="0 0 900 1800" role="img" aria-label="Volleyballfeld 9 mal 18 Meter"></svg><div class="grid3"><button id="formSave" class="primary">Speichern</button><button id="formReset">Zurücksetzen</button><button id="formUndo">Letzten Pfeil löschen</button></div><div class="grid2"><label>Vorlagenname<input id="formName" maxlength="50" placeholder="z. B. Tiefe Abwehr"></label><button id="formSaveAs">Speichern unter</button><label>Gespeicherte Vorlage<select id="formTemplate"><option value="">Vorlage wählen</option>${Object.keys(st.formationTemplates||{}).map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('')}</select></label><button id="formLoad">Vorlage laden</button></div><div class="grid2"><label>Kopieren nach<select id="formCopyRot">${[1,2,3,4,5,6].map(n=>`<option value="${n}">R${n}</option>`).join('')}</select></label><button id="formCopy">Kopie speichern</button></div><div class="grid2"><button id="formView">Spielbetrieb anzeigen</button><button id="formClose">Schließen</button></div>`);
 $('formRotation').value=rotation;$('formKind').value=kind;$('formStance').value=stance;$('formOpponentRotation').value=opponentRotation;$('formScope').value=scope;for(const id of ['formRotation','formOpponentRotation','formStance','formCopyRot','formCopy'])$(id).disabled=scope==='standard';$('formSave').textContent=scope==='standard'?'EVV-Standard speichern':'Speichern';$('formReset').textContent=scope==='standard'?'EVV-Vorschlag laden':'Zurücksetzen';$('formUseStandard').hidden=scope==='standard'||!DEFENSE_KINDS.includes(kind)||stance==='base';$('formStandardOff').hidden=scope!=='standard';
 const svg=$('formationSvg');
 const toFull=(xy,which)=>which==='own'?[xy[0],50+xy[1]/2]:[100-xy[0],(100-xy[1])/2];
 const toLocal=(xy,which)=>which==='own'?[xy[0],(xy[1]-50)*2]:[100-xy[0],100-xy[1]*2];
 const clamp=p=>p.map(v=>Math.max(7,Math.min(93,v)));
 const draw=()=>{
 const origin=working.attackOrigin||builtinDefense(kind)?.attackOrigin||[50,25];$('formProposed').checked=!!working.proposal;$('formAttackX').value=origin[0];$('formAttackY').value=origin[1];
 $('formStatus').textContent=(dirty()?'Ungespeichert':'Gespeichert / unverändert')+` · ${scope==='standard'?'EVV-Standard · alle Rotationen':'Rotationsanpassung'} · EVV R${rotation} · Gegner R${opponentRotation} · ${kind} · ${stance==='base'?'Ausgangsstellung':'Taktische Stellung'}`;
 svg.innerHTML=`<defs><marker id="formArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="currentColor"/></marker></defs><rect x="0" y="0" width="900" height="1800" fill="#eaf1f6" stroke="#fff" stroke-width="14"/><path d="M0 600H900 M0 1200H900" stroke="#fff" stroke-width="8"/><path d="M0 900H900" stroke="#23374b" stroke-width="16"/>`;
 for(const which of ['own','opponent']){const f=readLayer(which),pathPoints=path=>path.map(xy=>{const [x,y]=toFull(xy,which);return `${x*9},${y*18}`}).join(' ');
 for(const [slot,path] of Object.entries(f.routes))if(path.length>1)svg.innerHTML+=`<polyline ${which==='own'?`data-route="${slot}"`: 'data-opponent-route'} points="${pathPoints(path)}" fill="none" stroke="#0066cc" stroke-width="9" marker-end="url(#formArrow)"/>`;
 for(const path of Object.values(f.attacks||{}))if(path.length>1)svg.innerHTML+=`<polyline data-attack-route points="${pathPoints(path)}" fill="none" stroke="#a63d91" stroke-width="9" marker-end="url(#formArrow)"/>`;
 for(const path of f.ballPaths)if(path.length>1)svg.innerHTML+=`<polyline points="${path.map(([x,y])=>`${x*9},${y*18}`).join(' ')}" fill="none" stroke="#ae2929" stroke-width="9" stroke-dasharray="20 12" marker-end="url(#formArrow)"/>`;
 const list=which==='own'?playerList():opp.players;
 for(const p of list){const xy=toFull(f.targets[p.pos]||formationDefaults[p.pos],which),id=which==='own'?p.id:null,lib=which==='own'?st.liberoIds.includes(id):p.libero,number=which==='own'?jersey(id):p.number||'?',sel=team===which&&selected===p.pos;
 svg.innerHTML+=`<g ${which==='own'?`data-form-slot="${p.pos}" data-rule-position="${p.rulePosition}" data-player-id="${p.id}"`:''} data-form-team="${which}" data-form-position="${p.pos}" transform="translate(${xy[0]*9},${xy[1]*18})"><circle r="57" fill="${which==='own'?'#126ad5':'#ac3b50'}" stroke="${sel?'#f0b323':lib?'#fff':'#263a52'}" stroke-width="8"/><text text-anchor="middle" y="12" font-size="36" fill="white">#${esc(number)}</text>${which==='own'?`<text text-anchor="middle" y="91" font-size="30" fill="#17334f">${esc(nm(id))}${lib?' · L':''}</text>`:`<text text-anchor="middle" y="88" font-size="25" fill="#17334f">${lib?'L · ':''}P${p.pos}</text>`}</g>`}
 }
 };
 const coords=e=>{const r=svg.getBoundingClientRect();return [(e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100]};
 const moveTarget=e=>{resetPending=false;const p=coords(e),g=gesture;layer().targets[selected]=clamp(toLocal([p[0]-g.offset[0],p[1]-g.offset[1]],team))};
 svg.onpointerdown=e=>{if(!e.isPrimary||e.button!==0)return;const node=e.target.closest('[data-form-team]'),tool=$('formTool').value;if(node){team=node.dataset.formTeam;selected=Number(node.dataset.formPosition)}if(team==='opponent'&&scope==='standard')return toast('EVV-Standard speichert nur eigene Ziele');if(team==='opponent'&&!opp.configured)return toast('Zuerst sechs Gegnernummern eintragen');e.preventDefault();const start=coords(e),xy=toFull(readLayer(team).targets[selected]||formationDefaults[selected],team);gesture={id:e.pointerId,tool,start,before:clone(working),onPlayer:!!node,moved:false,client:[e.clientX,e.clientY],offset:node?[start[0]-xy[0],start[1]-xy[1]]:[0,0]};svg.setPointerCapture(e.pointerId);draw()};
 svg.onpointermove=e=>{if(!gesture||gesture.id!==e.pointerId)return;e.preventDefault();if(Math.hypot(e.clientX-gesture.client[0],e.clientY-gesture.client[1])>=4)gesture.moved=true;if(gesture.tool==='move'&&gesture.moved){moveTarget(e);draw()}};
 svg.onpointerup=e=>{if(!gesture||gesture.id!==e.pointerId)return;const g=gesture,end=coords(e);if(g.tool!=='move')resetPending=false;if(g.tool==='move'&&(g.moved||!g.onPlayer))moveTarget(e);if(g.tool==='route')layer().routes[selected]=[clamp(toLocal(g.start,team)),clamp(toLocal(end,team))];if(g.tool==='attack'){const f=layer();f.attacks=f.attacks||{};f.attacks[selected]=[clamp(toLocal(g.start,team)),clamp(toLocal(end,team))]}if(g.tool==='ball')layer().ballPaths.push([g.start,end].map(p=>p.map(v=>Math.max(0,Math.min(100,v)))));gesture=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);draw()};
 const cancel=e=>{if(gesture)working=gesture.before;gesture=null;if(svg.hasPointerCapture(e.pointerId))svg.releasePointerCapture(e.pointerId);draw()};svg.onpointercancel=cancel;svg.onlostpointercapture=e=>{if(gesture)cancel(e)};
 const switchTo=(r,k,s,o,nextScope=scope)=>{if(!leave(()=>formationEditor(r,k,s,o,null,nextScope))){$('formRotation').value=rotation;$('formKind').value=kind;$('formStance').value=stance;$('formOpponentRotation').value=opponentRotation;$('formScope').value=scope}};
 $('formScope').onchange=()=>switchTo(rotation,kind,stance,opponentRotation,$('formScope').value);$('formProposed').onchange=()=>{working.proposal=$('formProposed').checked;draw()};for(const id of ['formAttackX','formAttackY'])$(id).oninput=()=>{working.attackOrigin=[Number($('formAttackX').value),Number($('formAttackY').value)];draw()};
 $('formRotation').onchange=()=>switchTo(Number($('formRotation').value),kind,stance,opponentRotation);$('formKind').onchange=()=>switchTo(rotation,$('formKind').value,stance,opponentRotation);$('formStance').onchange=()=>switchTo(rotation,kind,$('formStance').value,opponentRotation);$('formOpponentRotation').onchange=()=>switchTo(rotation,kind,stance,Number($('formOpponentRotation').value));
 const confirmFormation=()=>{if(scope==='standard')working.assignment='roles';if(resetPending)return working;for(const which of ['own',...(opp.configured&&scope!=='standard'?['opponent']:[])]){const f=layer(which);f.targets=Object.fromEntries([1,2,3,4,5,6].map(pos=>[pos,clone(f.targets[pos]||formationDefaults[pos])]));if(stance==='base'&&!validBaseFormation(f.targets))throw Error((which==='own'?'EVV':'Gegner')+': ungültige Ausgangsstellung. Reihenfolge P4–P3–P2, P5–P6–P1 und Vorder-/Hinterreihe prüfen.')}return working};
 const persist=(target=rotation)=>{try{const f=confirmFormation();if(scope==='standard')saveDefenseStandard(kind,f);else saveFormation(target,kind,f);if(target===rotation)saved=initial();draw();toast('Formation gespeichert');return true}catch(e){toast(e.message);$('formStatus').textContent=e.message;return false}};
 touchButton('formSave',()=>persist());touchButton('formCopy',()=>persist(Number($('formCopyRot').value)));
 touchButton('formSaveAs',()=>{const name=$('formName').value.trim();if(!name||['__proto__','prototype','constructor'].includes(name))return toast('Vorlagenname angeben');if(st.formationTemplates?.[name]&&!confirm('Vorlage überschreiben?'))return;if(!persist())return;st.formationTemplates=st.formationTemplates||{};const previous=st.formationTemplates[name];st.formationTemplates[name]={rotation,opponentRotation,kind,stance,scope,formation:clone(working)};if(!saveLocal()){if(previous)st.formationTemplates[name]=previous;else delete st.formationTemplates[name];return}const option=document.createElement('option');option.value=name;option.textContent=name;if(![...$('formTemplate').options].some(o=>o.value===name))$('formTemplate').appendChild(option);$('formTemplate').value=name;toast('Vorlage gespeichert')});
 touchButton('formLoad',()=>{const t=st.formationTemplates?.[$('formTemplate').value];if(!t)return toast('Vorlage wählen');if(dirty()&&!confirm('Ungespeicherte Änderungen durch Vorlage ersetzen?'))return;editorGuard=null;formationEditor(t.rotation,t.kind,t.stance,t.opponentRotation,t.formation,t.scope||'rotation');toast('Vorlage geladen · Speichern zum Übernehmen')});
 touchButton('formReset',()=>{if(scope==='standard'){working=builtinDefense(kind);resetPending=false;draw();return}resetPending=true;const f=layer();f.targets={};f.routes={};f.ballPaths=[];delete f.attacks;draw()});
 touchButton('formUseStandard',()=>{if(dirty()&&!confirm('Ungespeicherte Änderungen verwerfen?'))return;if(!confirm('Eigene taktische Rotationsanpassung lösen? Ausgangsstellung und Gegnerbilder bleiben erhalten.'))return;const f=formationFor(rotation,kind);f.targets={};f.routes={};f.ballPaths=[];delete f.attacks;delete f.assignment;delete f.proposal;delete f.attackOrigin;try{saveFormation(rotation,kind,f);editorGuard=null;formationEditor(rotation,kind,stance,opponentRotation)}catch(e){toast(e.message)}});touchButton('formStandardOff',()=>{if(dirty()&&!confirm('Ungespeicherte Änderungen verwerfen?'))return;if(!confirm('Gemeinsamen Standard deaktivieren? Individuelle Rotationsanpassungen bleiben erhalten.'))return;try{saveDefenseStandard(kind,null);editorGuard=null;matchTactics(rotation,kind)}catch(e){toast(e.message)}});
 touchButton('formUndo',()=>{const f=layer();if(f.ballPaths.length)f.ballPaths.pop();else if(f.attacks?.[selected])delete f.attacks[selected];else delete f.routes[selected];draw()});
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
 const hint=state.waiting?'Rallye läuft weiter · nächste kontrollierte Abwehr als Transition erfassen':pending?'Spieler für die gewählte Aktion wählen':choosing?'Abwehr kontrolliert · Angreifer wählen':state.transition&&selected?`${nm(selected)} · Angriffsergebnis wählen`:'Spieler oder Aktion wählen';
 $("flow").innerHTML=`<h2>Schnellmodus</h2><p id="activeFormation">R${formation.rotation} · ${esc(formation.kind==="receive"?"Annahme":"Abwehr "+formation.kind.replace("defense-",""))} · ${Object.keys(formation.data.targets).length} Taktikziele</p><p id="quickHint" role="status">${esc(hint)}</p><div class="quickArena"><div class="liveCourt" aria-label="Regeltechnische Feldpositionen"><span class="liveNet">NETZ</span>${rotationMatrix().map(x=>{const [left,top]=coords[x.position];return `<button class="livePlayer" data-quick-player="${x.player}" aria-pressed="${selected===x.player}" style="left:${left}%;top:${top}%" ${!eligible.includes(x.player)?"disabled":""}>${esc(nm(x.player))}<small>#${esc(jersey(x.player))} · P${x.position} · ${st.liberoIds.includes(x.player)?"L":esc(roleOf(x.player))}</small></button>`}).join("")}</div><div class="quickActions">${[["kill","Angriffspunkt"],["continue","Angriff verteidigt"],["error","Angriffsfehler"],["block","Blockpunkt"],["opponentError","Gegnerfehler"],["d0","D0 · Abwehrfehler"],["ace","Ass"],["a0","A0 · Annahmefehler"]].map(([k,label])=>`<button class="${['kill','ace','block','opponentError'].includes(k)?'good':['error','a0','d0'].includes(k)?'bad':'blue'}" data-quick="${k}" ${(k==="ace"&&!st.serving||state.waiting&&['kill','error','continue'].includes(k))?"disabled":""}>${label}</button>`).join("")}</div></div><p id="quickMetrics" aria-live="polite">Aktuelle Rallye · eigene Angriffe: ${metrics.attacks} · Transition-Chancen: ${metrics.transitions}</p><div class="quickFooter"><button class="transitionButton primary" id="quickTransition">Abwehr gewonnen / Transition</button><button id="quickUndo">↶ Undo</button></div>`;
 const rev=quickRevision;
 document.querySelectorAll('[data-quick]').forEach(b=>b.onclick=()=>hybridAction(b.dataset.quick,selected,rev));
 document.querySelectorAll('[data-quick-player]').forEach(b=>b.onclick=()=>{if(pending)hybridAction(pending,b.dataset.quickPlayer,rev);else{selectedQuickPlayer=b.dataset.quickPlayer;if(state.transition)draft.quickAttacker=b.dataset.quickPlayer;quickRevision++;render()}});
 $('quickTransition').onclick=()=>hybridAction('transition',null,rev);$('quickUndo').onclick=undoLast;
}

function commit(w,data={},preSnapshot=null){
 if(w!=="EVV"&&w!=="Gegner")throw new Error("Ungültiger Rallye-Sieger");
 if(st.setEnded||st.matchEnded)return toast("Satz ist beendet");
 st.rallyUndo.push(preSnapshot?clone(preSnapshot):snapshot());
 const before=`${st.e}:${st.o}`,rb=st.rot,sb=st.serving;
 if(w==="EVV"){st.e++;if(!st.serving){st.serving=true;rotate()}}
 else{st.o++;if(st.serving)st.serving=false}
 syncLiberoRotation();
 data=Object.assign({},data,{winner:w,before,after:`${st.e}:${st.o}`,rotation:rb,servingBefore:sb,phase:data.phase||(sb?"K2":"K1"),set:st.set});
 data.turnaround=turnaroundMetrics(data.chain);
 data.observationComplete=data.observationComplete??!!data.chain?.some(c=>c.side==="EVV"&&["Serve","Reception"].includes(c.type));
 st.rallies.push(data);draft={};quickPending=null;selectedQuickPlayer=null;quickRevision++;clearDraftHistory();tab="rally";view="live";checkEnd();render();toast(`${w} ${before} → ${st.e}:${st.o}`)
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
   /^(MB|AA)/.test(roleOf(st.liberoReplacedId))&&
   [1,5,6].includes(courtPos(st.liberoReplacedId)));
}
function playerAtPos(pos){return active().find(id=>courtPos(id)===pos)||null}
function front(){return active().filter(id=>[2,3,4].includes(courtPos(id)))}
function receivers(){
 if(st.started)syncLiberoRotation();
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
 st.liberoActive=!!(st.liberoOnCourt&&st.liberoReplacedId);
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
function start(serv){if(!readSetup())return;const planning={jerseyNumbers:st.jerseyNumbers,startPresets:st.startPresets,formationBook:st.formationBook,defenseStandards:st.defenseStandards,formationTemplates:st.formationTemplates,hybridFormations:st.hybridFormations};const keep=clone(st.lineup),keepRoles=clone(st.roles),keepRec=clone(st.receiveIds),keepLibs=clone(st.liberoIds),keepLibOn=st.liberoOnCourt,keepLibRep=st.liberoReplacedId,keepLibActive=st.liberoActive,keepPreferred=st.liberoPreferredId,keepMB=st.liberoPreferredMB;st=fresh();Object.assign(st,planning);st.lineup=keep;st.roles=keepRoles;st.receiveIds=keepRec;st.liberoIds=keepLibs;st.liberoOnCourt=keepLibOn;st.liberoReplacedId=keepLibRep;st.liberoActive=keepLibActive;st.liberoPreferredId=keepPreferred;st.liberoPreferredMB=keepMB;st.rot=parseInt($("startRotation").value.slice(1),10)||1;st.serving=serv;st.started=true;st.setStart={rot:st.rot,serving:serv,lineup:clone(keep),roles:clone(keepRoles)};syncLiberoRotation();$("setup").classList.add("hidden");render()}
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
   st.set=next;st.e=0;st.o=0;st.setEnded=false;st.rallies=[];st.rallyUndo=[];st.marks=[];st.subPairs={};st.subCount=0;st.subUsed=[];st.setStart={rot:st.rot,serving,lineup:clone(ids),roles:clone(st.roles)};syncLiberoRotation();draft={};clearDraftHistory();view="live";closeModal();render();toast(`Satz ${next} gestartet`)
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
function liberoPlanner(){
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

function opponentCourt(){
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
 modal(`<h2>EVV · Trikotnummern</h2><p class="small">Fehlende Nummern bleiben als ? sichtbar. Nur bekannte Nummern eintragen; sie gelten auch für eingewechselte Spieler.</p><div class="grid3">${roster.map(p=>`<label>${esc(nm(p.id))}<input id="jersey-${p.id}" inputmode="numeric" maxlength="5" ${jersey(p.id)!=='?'?'readonly':''} value="${jersey(p.id)==='?'?'':esc(jersey(p.id))}"></label>`).join('')}</div><div class="grid2"><button id="ownNumbersCancel">Abbrechen</button><button id="ownNumbersSave" class="primary">Speichern</button></div>`);
 $('ownNumbersCancel').onclick=closeModal;$('ownNumbersSave').onclick=()=>{const values=Object.fromEntries(roster.map(p=>[p.id,$('jersey-'+p.id).value.trim().replace(/[^0-9]/g,'').slice(0,5)]).filter(([,n])=>n)),effective=roster.map(p=>values[p.id]||jersey(p.id)).filter(n=>n&&n!=='?');if(new Set(effective).size!==effective.length)return toast('Trikotnummern müssen eindeutig sein');st.jerseyNumbers={...st.jerseyNumbers,...values};closeModal();render();matchTactics()};
}
function editOpponentJerseys(){
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
 st.lineup[i]=inn;st.roles=st.roles||{};st.roles[inn]=st.roles[out]||(byId(out)||{}).role;delete st.roles[out];st.receiveIds=st.receiveIds.map(x=>x===out?inn:x);st.subCount++;syncLiberoRotation();
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
 let wizardLib={liberoAutoEnabled:st.liberoAutoEnabled,liberoPreferredId:st.liberoPreferredId,liberoPreferredMB:st.liberoPreferredMB,liberoIds:clone(st.liberoIds)};
 const options=(selected)=>roster.filter(p=>p.role!=="L").map(p=>`<option value="${p.id}" ${selected===p.id?"selected":""}>${esc(p.name)} · ${esc(p.role)}</option>`).join("");
 modal(`<h2>Satz ${next} · neue Startaufstellung</h2><p class="small">Jede Position frei wählen. Die bisherige Aufstellung ist vorausgewählt.</p><label>Startvorlage<select id="nsPreset"><option value="">Letzte Aufstellung übernehmen</option>${Object.keys(st.startPresets||{}).map(name=>`<option value="${esc(name)}">${esc(name)}</option>`).join('')}</select></label><button id="nsSavePreset">Letzte Aufstellung als Vorlage speichern</button><label><input type="checkbox" id="nsKeepLib" checked> Libero-Konfiguration übernehmen</label><p>Gespeicherte Annahme-/Abwehrformationen werden nach Rotation geladen. Erst K1/K2 starten bestätigt die Aufstellung.</p><div class="grid2">${lineupEditor("ns",st.lineup)}</div><label>Startrotation<select id="nsRot">${[1,2,3,4,5,6].map(n=>`<option value="${n}" ${n===st.rot?"selected":""}>R${n}</option>`).join("")}</select></label><p class="small">Aufstellung und Libero vor dem Start kontrollieren. Taktische Ziele bleiben getrennt von Regelpositionen.</p><div class="grid2"><button id="nsRec">Gegner-Aufschlag · K1</button><button id="nsSrv" class="primary">EVV-Aufschlag · K2</button></div><button id="nsCancel">Abbrechen</button>`);
 $('nsPreset').onchange=()=>{const p=st.startPresets?.[$('nsPreset').value]||{lineup:st.lineup,roles:st.roles,...wizardLib};p.lineup.forEach((id,i)=>{$('nsP'+i).value=id;$('nsR'+i).value=p.roles[id]});wizardLib=clone(p)};
 $('nsSavePreset').onclick=()=>{saveLineupPreset('Gespeicherte Startaufstellung');prepareNextSet()};
 const go=serv=>{
  const picked=readLineupEditor("ns");if(!picked)return;const ids=picked.ids;
  const newRot=Number($("nsRot").value);
  st.sets.push({set:st.set,e:st.e,o:st.o,rallies:clone(st.rallies),marks:clone(st.marks),start:clone(st.setStart),lineup:clone(st.lineup),roles:clone(st.roles),events:clone(st.events.filter(x=>x.set===st.set))});
  st.set=next;st.e=0;st.o=0;st.lineup=ids;st.roles=picked.roles;st.rot=newRot;st.serving=serv;st.setEnded=false;st.matchEnded=false;
  const keepLib=$('nsKeepLib').checked;
  st.liberoActive=false;st.liberoOnCourt="";st.liberoReplacedId="";
  if(keepLib){st.liberoIds=clone(wizardLib.liberoIds);st.liberoAutoEnabled=wizardLib.liberoAutoEnabled;st.liberoPreferredId=wizardLib.liberoPreferredId||"";st.liberoPreferredMB=wizardLib.liberoPreferredMB||""}else{st.liberoAutoEnabled=false;st.liberoPreferredId="";st.liberoPreferredMB=""}
  st.receivePlans={};st.tacticPositions={};st.sixBoards={};
  st.rallies=[];st.rallyUndo=[];st.marks=[];st.subPairs={};st.subCount=0;st.subUsed=[];st.setStart={rot:newRot,serving:serv,lineup:clone(ids),roles:clone(st.roles)};syncLiberoRotation();
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
 $("nmConfirm").onclick=()=>{const planning={jerseyNumbers:st.jerseyNumbers,startPresets:st.startPresets,formationBook:st.formationBook,defenseStandards:st.defenseStandards,formationTemplates:st.formationTemplates,hybridFormations:st.hybridFormations};storageLoadFailed=false;st=fresh();Object.assign(st,planning);opponent={name:"Gegner",setter:"#",liberos:["#","#"],receivers:["#","#","#","#"]};draft={};draftHistory=[];pendingMark=null;tab="rally";view="live";closeModal();$("setup").classList.remove("hidden");setupUI();$("oppName").value="Gegner";["oppSetter","oppLibero1","oppLibero2","oppR1","oppR2","oppR3","oppR4"].forEach(id=>{if($(id))$(id).value=""});render();toast("Neues Spiel einrichten")};
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
 document.body.classList.toggle("cockpitView",tab==="coach");
 document.body.classList.toggle("quickLive",liveMode==="quick"&&st.started&&view==="live"&&["rally","opponent"].includes(tab));
 saveLocal();
 if(!$("hybridModes")){const nav=document.createElement("section");nav.id="hybridModes";nav.className="card hybridModes";$("flow").before(nav)}
 $("hybridModes").innerHTML=`<button id="modeQuick" aria-pressed="${liveMode==='quick'}">Schnellmodus</button><button id="modeDetail" aria-pressed="${liveMode==='detail'}">Detailmodus</button>`;$("modeQuick").onclick=()=>hybridMode("quick");$("modeDetail").onclick=()=>hybridMode("detail");
 $("hybridModes").insertAdjacentHTML("beforeend",`<button id="matchTactics">Taktik</button><button id="formationEditor">Editor</button><button id="turnaroundReport">Analyse</button>`);$("matchTactics").onclick=()=>matchTactics();$("formationEditor").onclick=()=>formationEditor();$("turnaroundReport").onclick=analysisPanel;
 renderHeader();renderNav();document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 if(liveMode==="quick"&&(tab==="rally"||tab==="opponent"))rally();else if(tab==="rally")rally();else if(tab==="opponent")opponentTab();else if(tab==="coach")coach();else stats();recent();if($("finishedNew"))$("finishedNew").onclick=newMatch;
 $("nextSet").disabled=!st.setEnded||st.matchEnded;$("substitute").disabled=!st.started||view!=="live"||!!draft.step
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render()});
$("startReceive").onclick=()=>start(false);$("startServe").onclick=()=>start(true);
function undoLast(){if(view!=="live")return toast("Undo nur LIVE");let x=st.rallyUndo.pop();if(!x)return toast("Keine Rally zum Undo");restore(x);draft={};clearDraftHistory();pendingMark=null;quickPending=null;selectedQuickPlayer=null;quickRevision++;closeModal();render();toast("Letzte Rally vollständig zurückgesetzt")}
$("undo").onclick=undoLast;$("newMatch").onclick=newMatch;
$("exportData").onclick=exportData;$("importData").onclick=importData;$("printReport").onclick=printReport;$("scoreFix").onclick=scoreFix;$("substitute").onclick=substitute;$("timeout").onclick=()=>{
 if(!st.started||view!=="live")return toast("Auszeit nur im laufenden Satz");
 modal(`<h2>Auszeit erfassen</h2><p class="small">${timeoutSummary()}</p><p class="small">Spielstand ${st.e}:${st.o} · S${st.set} · R${st.rot}</p><div class="grid2"><button id="toEVV" class="primary">EVV-Auszeit</button><button id="toOpp">${esc(opponent.name)}-Auszeit</button></div><button id="toCancel">Abbrechen</button>`);
 $("toEVV").onclick=()=>{if(timeoutCount("EVV")>=2)return toast("EVV: zwei Auszeiten verbraucht");st.events.push({type:"timeout",team:"EVV",set:st.set,score:`${st.e}:${st.o}`,rot:st.rot});closeModal();tab="coach";saveLocal();render();toast("EVV-Auszeit gespeichert")};
 $("toOpp").onclick=()=>{if(timeoutCount("Gegner")>=2)return toast("Gegner: zwei Auszeiten verbraucht");st.events.push({type:"timeout",team:"Gegner",set:st.set,score:`${st.e}:${st.o}`,rot:st.rot});closeModal();tab="coach";saveLocal();render();toast("Gegner-Auszeit gespeichert")};
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

const restored=loadLocal();if(restoredRuntime){draft=restoredRuntime.draft;draftHistory=restoredRuntime.draftHistory||[];pendingMark=restoredRuntime.pendingMark||null;liveMode=restoredRuntime.liveMode==="quick"?"quick":"detail";tab=["rally","opponent","coach","stats"].includes(restoredRuntime.tab)?restoredRuntime.tab:"rally";view=restoredRuntime.view||"live"}document.title=`EVV QuickScout V${APP_VERSION}`;if($("buildLabel"))$("buildLabel").textContent=`V${APP_VERSION}`;if($("setupVersion"))$("setupVersion").textContent=`V${APP_VERSION}`;setupUI();if(restored&&st.started){$("setup").classList.add("hidden")}render();if(pendingMark)nineZonePicker(pendingMark.data?.serve==="ACE"?"ACE":"KILL",pendingMark);
window.EVV_QS_TEST={builtinDefense,defenseStandard,saveDefenseStandard,formationSource,defenseShadow,validBaseFormation,cockpitMetrics,cockpitFilter,rotationSignal,cockpitFormation,cockpitOpponent,matchTactics,rotationCoaching,activeFormation,validateMatch,turnaroundAnalysis,formationFor,saveFormation,formationPlayers,formationEditor,saveLineupPreset,saveHybridFormation,hybridFormation,turnaroundMetrics,hybridAction,hybridMode,editOpponentJerseys,jersey,newMatch,liberoPlanner,opponentCourt,configureLiberos,configureLiberoSlots,liberoRoster,checkEnd,setWins,timeoutCount,timeoutSummary,saveSixPresets,loadSixPresets,opponentPlayerStats,trendPanel,tacticalPreset,importData,action,commit,applySub,undoLast,start,setView:v=>{view=v},getDraft:()=>clone(draft),setLineup:(ids,roles,rot,lib)=>{st.lineup=ids.slice();st.roles=Object.assign({},roles);st.rot=rot||1;if(lib)Object.assign(st,lib)},begin:(serv,rot)=>{st.started=true;st.serving=serv;st.rot=rot||st.rot;st.setStart={rot:st.rot,serving:serv,lineup:clone(st.lineup),roles:clone(st.roles)}},target,isSetWin,rotNext:r=>ROT_NEXT[r],fresh,state:()=>clone(st),courtPos,rotationMatrix,liberoEligible,syncLiberoRotation,currentServerId,front,receivers,attackOptions,attackRoutesFor,roleBaseRoute,roleOf,readLineupEditor,ralliesForSet,marksForSet,opponentReceivers,version:APP_VERSION};
})();
