(function(){
"use strict";
const $=id=>document.getElementById(id), clone=x=>JSON.parse(JSON.stringify(x));
const ROT_NEXT={5:1,1:6,6:5,4:3,3:2,2:4}; // confirmed project convention: R5→R1→R6
const roster=[
{id:"johann",name:"Johann",role:"Z"},{id:"michael",name:"Michael",role:"AA1"},{id:"janik",name:"Janik",role:"MB1"},
{id:"jonas",name:"Jonas",role:"D"},{id:"maksym",name:"Maksym",role:"AA2"},{id:"dirk",name:"Dirk",role:"MB2"},
{id:"felix",name:"Felix",role:"AA"},{id:"jens",name:"Jens",role:"D/AA"},{id:"amar",name:"Amar",role:"L"},{id:"alex",name:"Alexandra",role:"L"}];
const byId=id=>roster.find(p=>p.id===id), nm=id=>(byId(id)||{name:id}).name;
let opponent={name:"Gegner",setter:"#",libero:"#",receivers:["#","#","#","#"]};
let tab="rally",view="live",draft={},pendingMark=null;
let st=fresh();
function fresh(){return{started:false,set:1,e:0,o:0,rot:1,serving:true,setEnded:false,matchEnded:false,
lineup:["johann","michael","janik","jonas","maksym","dirk"],receiveIds:["michael","jonas","maksym"],liberoId:"amar",
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
function rotate(){st.rot=ROT_NEXT[st.rot]||st.rot}
function commit(w,data={}){
 if(st.setEnded||st.matchEnded)return toast("Satz ist beendet");
 st.rallyUndo.push(snapshot());
 const before=`${st.e}:${st.o}`,rb=st.rot,sb=st.serving;
 if(w==="EVV"){st.e++;if(!st.serving){st.serving=true;rotate()}}
 else{st.o++;if(st.serving)st.serving=false}
 data=Object.assign({},data,{winner:w,before,after:`${st.e}:${st.o}`,rotation:rb,servingBefore:sb,set:st.set});
 st.rallies.push(data);draft={};checkEnd();render();toast(`${w} ${before} → ${st.e}:${st.o}`)
}
function allRallies(){return st.sets.flatMap(s=>s.rallies).concat(st.rallies)}
function allMarks(){return st.sets.flatMap(s=>s.marks||[]).concat(st.marks)}
function active(){return st.lineup.slice()}
function front(){return active().slice(0,3)}
function receivers(){return st.receiveIds.filter(id=>active().includes(id)||id===st.liberoId)}
function attackers(){return active().filter(id=>id!==st.liberoId)}
function setupUI(){
 $("startSix").innerHTML=st.lineup.map((id,i)=>`<label>Pos ${i+1}<select id="ss${i}">${roster.filter(p=>p.role!=="L").map(p=>`<option value="${p.id}" ${p.id===id?"selected":""}>${esc(p.name)} · ${esc(p.role)}</option>`).join("")}</select></label>`).join("")
}
function readSetup(){
 const ids=[0,1,2,3,4,5].map(i=>$("ss"+i).value);
 if(new Set(ids).size!==6){toast("Start-Sechs enthält doppelte Spieler");return false}
 st.lineup=ids; opponent.name=$("oppName").value.trim()||"Gegner";opponent.setter="#"+($("oppSetter").value.trim()||"?");opponent.libero="#"+($("oppLibero").value.trim()||"?");
 opponent.receivers=[1,2,3,4].map(i=>"#"+($("oppR"+i).value.trim()||"?"));
 st.rot=parseInt($("startRotation").value.slice(1),10)||1; return true
}
function start(serv){if(!readSetup())return;const keep=clone(st.lineup);st=fresh();st.lineup=keep;st.rot=parseInt($("startRotation").value.slice(1),10)||1;st.serving=serv;st.started=true;st.setStart={rot:st.rot,serving:serv};$("setup").classList.add("hidden");render()}
function renderHeader(){
 $("homeScore").textContent=st.e;$("oppScore").textContent=st.o;$("oppNameHead").textContent=opponent.name;$("setBadge").textContent=`S${st.set}${st.set===5?" · TB":""}`;$("rotationBadge").textContent=`R${st.rot}`;
 $("phase").textContent=st.serving?"K2":"K1";$("serveText").textContent=st.serving?"EVV Aufschlag":"Gegner Aufschlag";
 $("lineups").innerHTML=`<div class="lineup"><b>EVV · aktive Sechs</b><div class="chips">${active().map(id=>`<span class="chip">${esc(nm(id))}</span>`).join("")}</div></div><div class="lineup"><b>${esc(opponent.name)}</b><div class="chips"><span class="chip">Z ${esc(opponent.setter)}</span><span class="chip">L ${esc(opponent.libero)}</span>${opponent.receivers.map(x=>`<span class="chip">${esc(x)}</span>`).join("")}</div></div>`
}
function renderNav(){
 const nums=[...st.sets.map(s=>s.set),st.set].filter((v,i,a)=>a.indexOf(v)===i);
 $("setNav").innerHTML=nums.map(n=>`<button data-view="${n}" class="${view===n?"primary":""}">S${n}</button>`).join("")+`<button data-view="live" class="${view==="live"?"primary":""}">LIVE</button><button data-view="match" class="${view==="match"?"primary":""}">MATCH</button>`;
 document.querySelectorAll("[data-view]").forEach(b=>b.onclick=()=>{view=b.dataset.view==="live"||b.dataset.view==="match"?b.dataset.view:+b.dataset.view;render()})
}
function B(label,act,cls=""){return `<button class="${cls}" data-act="${esc(act)}">${label}</button>`}
function bindActs(){document.querySelectorAll("[data-act]").forEach(b=>b.onclick=()=>action(b.dataset.act))}
function action(s){
 const a=s.split("|");
 if(a[0]==="rec"){if(a[2]==="A0")commit("Gegner",{event:"Reception",receiver:a[1],reception:a[2]});else{draft={step:2,receiver:a[1],reception:a[2]};render()}}
 else if(a[0]==="att"){draft.attacker=a[1];draft.zone=a[2];draft.step=3;render()}
 else if(a[0]==="fin"){let d=Object.assign({},draft,{event:"Attack",result:a[1]});if(a[1]==="KILL"){pendingMark={w:a[2],data:d};courtPicker();return}commit(a[2],d)}
 else if(a[0]==="quick")commit(a[1],{event:"Quick"})
 else if(a[0]==="serve"){if(a[1]==="ACE")commit("EVV",{event:"Serve",serve:"ACE"});else if(a[1]==="ERR")commit("Gegner",{event:"Serve",serve:"ERROR"});else{draft={step:2,event:"Serve",serve:"IN"};render()}}
 else if(a[0]==="k2"){draft.player=a[1];draft.action=a[2];draft.step=3;render()}
 else if(a[0]==="k2f")commit(a[1],Object.assign({},draft,{event:draft.action||"K2"}))
 else if(a[0]==="or"){draft={step:2,event:"OpponentReception",receiver:a[1],reception:a[2]};render()}
 else if(a[0]==="os"){draft.setterTarget=a[1];draft.step=3;render()}
 else if(a[0]==="of"){commit(a[2],Object.assign({},draft,{event:"OpponentAttack",result:a[1]}))}
}
function rally(){
 if(!st.started)return $("flow").innerHTML="<h2>Bereit</h2><p>Spiel einrichten und starten.</p>";
 if(view!=="live")return historical();
 if(st.matchEnded)return $("flow").innerHTML=`<div class="banner">MATCH BEENDET</div>${summary(allRallies())}`;
 if(st.setEnded){$("flow").innerHTML=`<div class="banner">SATZ ${st.set} BEENDET · ${st.e}:${st.o}</div>${summary(st.rallies)}<button id="prep" class="primary">Nächsten Satz vorbereiten</button>`;$("prep").onclick=prepareNextSet;return}
 if(!st.serving){
  if(!draft.step){let h="<h2>K1 · Annahme</h2>";receivers().forEach(id=>{h+=`<div class="row"><b>${esc(nm(id))}</b>${["A3","A2","A1","A0"].map(q=>B(q,`rec|${id}|${q}`,q==="A3"?"good":q==="A0"?"bad":"")).join("")}</div>`});$("flow").innerHTML=h+`<div class="grid3">${B("Gegner AF","quick|EVV","good")}${B("Quick EVV","quick|EVV")}${B("Quick Gegner","quick|Gegner")}</div>`}
  else if(draft.step===2){$("flow").innerHTML=`<h2>K1 · Angriff</h2><div class="grid2">${attackers().flatMap(id=>["IV","III","II","HF"].map(z=>B(`${esc(nm(id))} · ${z}`,`att|${id}|${z}`))).join("")}</div>`}
  else $("flow").innerHTML=`<h2>K1 · Ergebnis</h2><div class="grid2">${B("KILL","fin|KILL|EVV","good")}${B("BLOCK","fin|BLOCK|Gegner","bad")}${B("FEHLER","fin|FEHLER|Gegner","bad")}${B("WEITER +","fin|WEITER+|EVV","blue")}${B("WEITER −","fin|WEITER-|Gegner")}</div>`
 } else {
  if(!draft.step)$("flow").innerHTML=`<h2>K2 · Aufschlag</h2><div class="grid2">${B("ASS","serve|ACE","good")}${B("FEHLER","serve|ERR","bad")}${B("IM SPIEL","serve|IN","blue")}${B("Quick EVV","quick|EVV")}${B("Quick Gegner","quick|Gegner")}</div>`;
  else if(draft.step===2){let h="<h2>K2 · Aktion</h2><div class='grid2'>";active().forEach(id=>{["ABWEHR","ANGRIFF","FREEBALL"].forEach(x=>h+=B(`${esc(nm(id))} · ${x}`,`k2|${id}|${x}`));if(front().includes(id))h+=B(`${esc(nm(id))} · BLOCK`,`k2|${id}|BLOCK`)});$("flow").innerHTML=h+"</div>"}
  else $("flow").innerHTML=`<h2>K2 · Ergebnis</h2><div class="grid2">${B("EVV Punkt","k2f|EVV","good")}${B("Gegner Punkt","k2f|Gegner","bad")}</div>`
 }
 bindActs()
}
function opponentTab(){
 if(!st.started)return $("flow").innerHTML="<h2>Gegner</h2><p>Gegnerdaten im Setup festlegen.</p>";
 if(view!=="live")return historical();
 if(!draft.step){$("flow").innerHTML=`<h2>Gegner · Annahme</h2>${opponent.receivers.map(r=>`<div class="row"><b>${esc(r)}</b>${["A3","A2","A1","A0"].map(q=>B(q,`or|${r}|${q}`,q==="A0"?"bad":"")).join("")}</div>`).join("")}`}
 else if(draft.step===2)$("flow").innerHTML=`<h2>${esc(opponent.setter)} · Zuspiel wohin?</h2><div class="grid4">${["IV","III","II","PIPE"].map(z=>B(z,`os|${z}`)).join("")}</div>`;
 else $("flow").innerHTML=`<h2>Gegnerangriff ${esc(draft.setterTarget||"")}</h2><div class="grid2">${B("KILL Gegner","of|KILL|Gegner","bad")}${B("EVV Block","of|BLOCK|EVV","good")}${B("Fehler Gegner","of|FEHLER|EVV","good")}${B("EVV Abwehr/Punkt","of|ABWEHR|EVV","good")}</div>`;
 bindActs()
}
function pct(a,n){return n?Math.round(a/n*100)+"%":"–"}
function summary(r){let rec=r.filter(x=>x.event==="Reception"),pos=rec.filter(x=>["A2","A3"].includes(x.reception)).length,k=r.filter(x=>x.event==="Attack"&&x.result==="KILL").length,ace=r.filter(x=>x.event==="Serve"&&x.serve==="ACE").length,af=r.filter(x=>x.event==="Serve"&&x.serve==="ERROR").length;return `<div class="grid4"><div><b>${r.length}</b><div class="tiny">Rallyes</div></div><div><b>${pct(pos,rec.length)}</b><div class="tiny">Annahme+ ${pos}/${rec.length}</div></div><div><b>${k}</b><div class="tiny">Kills</div></div><div><b>${ace}/${af}</b><div class="tiny">Ace/AF</div></div></div>`}
function historical(){let r=view==="match"?allRallies():(st.sets.find(s=>s.set===view)?.rallies||(view===st.set?st.rallies:[]));$("flow").innerHTML=`<div class="banner">${view==="match"?"MATCH":"Satz "+view} · READ ONLY</div>${summary(r)}`}
function coach(){
 const r=allRallies(),last=r.slice(-5),rec=r.filter(x=>x.event==="Reception"),pos=rec.filter(x=>["A2","A3"].includes(x.reception)).length;
 const ors={};r.filter(x=>x.event==="OpponentReception").forEach(x=>{let v=ors[x.receiver]||(ors[x.receiver]={n:0,p:0});v.n++;if(["A2","A3"].includes(x.reception))v.p++});
 let weak=Object.entries(ors).filter(([,v])=>v.n>=3).sort((a,b)=>a[1].p/a[1].n-b[1].p/b[1].n)[0];
 const dist={IV:0,III:0,II:0,PIPE:0};let dn=0;r.forEach(x=>{if(x.setterTarget&&dist[x.setterTarget]!=null){dist[x.setterTarget]++;dn++}});
 $("flow").innerHTML=`<h2>Coach · Auszeit</h2><div class="coachline"><b>Letzte 5:</b> ${last.map(x=>x.winner==="EVV"?"✓":"×").join(" ")} · ${last.filter(x=>x.winner==="EVV").length}:${last.filter(x=>x.winner!=="EVV").length}</div><div class="coachline"><b>EVV Annahme+:</b> ${pct(pos,rec.length)} · ${pos}/${rec.length}</div><div class="coachline"><b>Aufschlagziel:</b> ${weak?`${esc(weak[0])} · ${pct(weak[1].p,weak[1].n)} positiv (${weak[1].p}/${weak[1].n})`:"noch keine belastbare Stichprobe (min. 3)"}</div><div class="coachline"><b>${esc(opponent.setter)} Zuspiel:</b> ${dn?Object.keys(dist).map(k=>`${k} ${Math.round(100*dist[k]/dn)}% (${dist[k]}/${dn})`).join(" · "):"noch keine Daten"}</div>`
}
function stats(){let r=view==="match"?allRallies():view==="live"?allRallies():(st.sets.find(s=>s.set===view)?.rallies||st.rallies);$("flow").innerHTML=`<h2>Auswertung</h2>${summary(r)}<h3>EVV Kill-/Punktkarte</h3><div id="statCourt" class="court"><div class="courtHint">Landepunkte</div></div>`;setTimeout(()=>{let marks=view==="match"||view==="live"?allMarks():(st.sets.find(s=>s.set===view)?.marks||st.marks);marks.forEach(m=>{let d=document.createElement("span");d.className="mark";d.style.left=m.x*100+"%";d.style.top=m.y*100+"%";$("statCourt").appendChild(d)})},0)}
function courtPicker(){modal(`<h2>Kill im Gegnerfeld markieren</h2><p class="small">Optional. Ein Tap speichert den exakten Landepunkt.</p><div id="pickCourt" class="court"><div class="courtHint">Gegnerfeld antippen</div></div><button id="skipMark">Überspringen</button>`);$("pickCourt").onclick=e=>{let r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;pendingMark.data.court={x,y};st.marks.push({x,y,set:st.set,player:pendingMark.data.attacker||null});let p=pendingMark;pendingMark=null;closeModal();commit(p.w,p.data)};$("skipMark").onclick=()=>{let p=pendingMark;pendingMark=null;closeModal();commit(p.w,p.data)}}
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
function recent(){let r=allRallies().slice(-3).reverse();$("recent").innerHTML=`<h3>Letzte Rallys</h3><div class="history">${r.length?r.map(x=>`S${x.set} · ${esc(x.after)} · ${esc(x.event||"Rally")} · ${esc(x.winner)}`).join("<br>"):"Noch keine Rally"}</div>`}
function render(){
 renderHeader();renderNav();document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
 if(tab==="rally")rally();else if(tab==="opponent")opponentTab();else if(tab==="coach")coach();else stats();recent();
 $("nextSet").disabled=!st.setEnded||st.matchEnded;$("substitute").disabled=!st.started||view!=="live"||!!draft.step
}
document.querySelectorAll("[data-tab]").forEach(b=>b.onclick=()=>{tab=b.dataset.tab;draft={};render()});
$("startReceive").onclick=()=>start(false);$("startServe").onclick=()=>start(true);
$("undo").onclick=()=>{if(view!=="live")return toast("Undo nur LIVE");let x=st.rallyUndo.pop();if(!x)return toast("Keine Rally zum Undo");restore(x);draft={};render();toast("Letzte Rally vollständig zurückgesetzt")};
$("scoreFix").onclick=scoreFix;$("substitute").onclick=substitute;$("timeout").onclick=()=>{tab="coach";view="live";render()};$("nextSet").onclick=prepareNextSet;
setupUI();render();
window.EVV_QS_TEST={target,isSetWin,rotNext:r=>ROT_NEXT[r],fresh};
})();