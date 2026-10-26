const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const crypto=require('node:crypto');const {app}=require('./harness.cjs');const {seeded,copy,positions,players,plan,statistics}=require('./matchday-oracle.cjs');
const results=[];
for(let seed=501;seed<=520;seed++)test(`Spieltag Seed ${seed}: vollständiges Match mit Prüfung nach jeder Rallye`,()=>{
 const h=app({render:false}),a=h.api,w=h.w;const random=seeded(seed);const wins=[0,0],ledger=[],allEvents=[],rotations=new Set(),scenarios={};let undos=0,maxStoredChars=0;const lib=seed%2?'amar':'alex';
 const base=seed%2?['johann','michael','janik','jens','arthur','dirk']:['reinhold','michael','janik','jonas','maksym','dirk'];const rs=['Z','AA1','MB1','D','AA2','MB2'];let roles=Object.fromEntries(base.map((p,i)=>[p,rs[i]]));let lineup=base.slice(seed%6).concat(base.slice(0,seed%6));
 try{
 h.qa.reset(false,seed%6+1);a.setLineup(lineup,roles,seed%6+1,{liberoPreferredId:lib});a.begin(false,seed%6+1);a.syncLiberoRotation();
 for(let r=1;r<=6;r++)for(const kind of ['receive','defense-IV','defense-III','defense-II'])a.saveFormation(r,kind,{targets:{6:[r*10,70]},routes:{6:[[50,70],[r*10,70]]},ballPaths:[]});
 const library=copy(a.state().formationBook);a.saveLineupPreset('Spieltag');
 let set=1,rot=seed%6+1,serv=false,start=rot;
 while(Math.max(...wins)<3){
 let e=0,o=0,index=0;const setLedger=[];const setWin=seed%2===1||set%2===1;
 while(!(Math.max(e,o)>=(set===5?15:25)&&Math.abs(e-o)>=2)){
 if(index===5||index===10){const out=index===5?'michael':'lion',inn=index===5?'lion':'michael';assert.equal(a.applySub(out,inn),true);const pos=lineup.indexOf(out)+1;lineup[lineup.indexOf(out)]=inn;roles[inn]=roles[out];delete roles[out];allEvents.push({type:'sub',set,out,inn,score:`${e}:${o}`,pos,return:index===10});}
 const target=(set===5?15:25),home=index<2?false:Math.min(e,o)<target-3?e<=o:setWin,variant=index<2?index*2:Math.floor(random()*30),cycles=Math.floor(random()*4);
 const p=plan({lineup,roles,start,rot,serv,lib,home,variant,cycles});p.set=set;p.before=`${e}:${o}`;p.after=`${e+(home?1:0)}:${o+(home?0:1)}`;
 const run=()=>{for(const [kind,arg,id] of p.commands)kind==='action'?a.action(arg):a.hybridAction(arg,id)};
 const before=index%17===0?copy(a.state()):null;run();
 if(before){a.undoLast();assert.deepEqual(copy(a.state()),before,`Undo seed ${seed} set ${set} rally ${index}`);run();undos++}
 rotations.add(rot);scenarios[p.ending]=(scenarios[p.ending]||0)+1;ledger.push(p);setLedger.push(p);
 if(home){e++;if(!serv)rot=rot%6+1}else o++;serv=home;
 const s=a.state(),r=s.rallies.at(-1);assert.equal(s.e,e);assert.equal(s.o,o);assert.equal(s.rot,rot);assert.equal(s.serving,serv);assert.equal(s.rallies.length,index+1);assert.equal(s.rallyUndo.length,index+1);assert.equal(s.subCount,index>=10?2:index>=5?1:0);assert.deepEqual(copy(s.events),allEvents);
 for(const key of ['winner','rotation','phase','servingBefore','set','before','after','observationComplete'])assert.equal(r[key],p[key],`${key} seed ${seed} set ${set} rally ${index}`);
 const chain=copy(r.chain).map(({id,...c})=>c);assert.deepEqual(chain,p.chain);assert.deepEqual(copy(r.turnaround),{attacks:p.attacks,transitions:p.chances});
 // Compare complete history, not only latest contact, with independently generated ledger.
 assert.deepEqual(s.rallies.map(r=>`${r.before}>${r.winner}>${r.after}`).join('|'),setLedger.map(r=>`${r.before}>${r.winner}>${r.after}`).join('|'));
 const combined=s.sets.flatMap(s=>s.rallies).concat(s.rallies),expected=statistics(ledger);assert.deepEqual(copy(a.turnaroundAnalysis(combined)),expected.turnaround);
 for(const row of h.qa.stats(combined)){const wanted=expected.rows[row.id];if(wanted)for(const key of Object.keys(wanted))assert.equal(row[key],wanted[key],`${row.id}.${key}`);else assert.equal(row.rec+row.srv+row.att+row.bl+row.def,0)}
 for(const r of h.qa.rotationStats(combined)){const entries=ledger.filter(p=>p.rotation===r.rot),k1=entries.filter(p=>p.phase==='K1'),k2=entries.filter(p=>p.phase==='K2'),rate=l=>l.length?Math.round(100*l.filter(p=>p.winner==='EVV').length/l.length):0;assert.deepEqual(copy(r),{rot:r.rot,n:entries.length,k1:k1.length,k1p:rate(k1),k2:k2.length,k2p:rate(k2),saldo:entries.reduce((n,p)=>n+(p.winner==='EVV'?1:-1),0)})}
 assert.deepEqual(copy(a.rotationMatrix().map(({position,player})=>({id:player,pos:position}))).sort((a,b)=>a.pos-b.pos),players(lineup,roles,start,rot,serv,lib).sort((a,b)=>a.pos-b.pos));
 assert.deepEqual(copy(s.formationBook),library);assert.deepEqual(copy(a.activeFormation().data),library[`${rot}:${serv?'defense-IV':'receive'}`]);assert.equal(h.qa.persist(),true,'Autosave under JSDOM 5,000,000 code-unit quota');maxStoredChars=Math.max(maxStoredChars,w.localStorage.getItem('evvQuickScoutV77').length);index++;assert(index<100);
 }
 wins[e>o?0:1]++;assert.equal(a.state().setEnded,true);assert.equal(a.state().matchEnded,Math.max(...wins)===3);assert.equal(a.setWins('EVV'),wins[0]);assert.equal(a.setWins('Gegner'),wins[1]);
 if(Math.max(...wins)<3){w.document.getElementById('nextSet').onclick();w.document.getElementById('nsPreset').value='Spieltag';w.document.getElementById('nsPreset').onchange();start=(seed+set)%6+1;w.document.getElementById('nsRot').value=String(start);serv=set%2===0;w.document.getElementById(serv?'nsSrv':'nsRec').click();rot=start;set++;assert.equal(a.state().set,set);assert.equal(a.state().subCount,0);assert.equal(a.state().rallies.length,0);assert(a.state().liberoActive||positions(lineup,start,rot).some(p=>/^MB/.test(roles[p.id])&&p.pos===1&&serv));}
 }
 assert.equal(rotations.size,6);for(const key of ['A0','D0','kill','block','opponentError','attackError'])assert(scenarios[key]>0,key);
 const restored=app({storage:w.localStorage.getItem('evvQuickScoutV77')});try{const saved=copy(a.state());saved.sixBoards=saved.sixBoards||{};assert.deepEqual(copy(restored.api.state()),saved)}finally{restored.close()}
 results.push({seed,maxStoredChars,sets:set,rallies:ledger.length,wins,undos,substitutions:allEvents.length,rotations:[...rotations].sort(),scenarios,contacts:ledger.reduce((n,r)=>n+r.chain.length,0),transitions:ledger.reduce((n,r)=>n+r.chances,0),digest:crypto.createHash('sha256').update(JSON.stringify(ledger)).digest('hex')});
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/20-matchdays.json',JSON.stringify({generator:'LCG 1664525/1013904223',results},null,2));
 }finally{h.close()}
});
