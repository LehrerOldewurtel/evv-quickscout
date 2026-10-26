const {test}=require('node:test');const assert=require('node:assert/strict');const {app}=require('./harness.cjs');
test('100 vollständige reproduzierbare Ereignisketten mit unabhängigem Kontaktmodell',()=>{
 const h=app({render:false}),results=[];try{for(let seed=1;seed<=100;seed++){
 h.qa.reset(false,seed%6+1);const a=h.api;let attacks=0,transitions=0;
 a.action('rec|michael|A3');
 const cycles=seed%6;
 for(let i=0;i<cycles;i++){
 const option=a.attackOptions()[0];a.action('b2|SET');a.action(`es|${option.zone}`);a.action(`att|${option.id}|${option.zone}`);a.action('fin|CONTINUE');attacks++;
 a.action('od|D3');a.action('ob2|SET');a.action('os|IV');a.action('of|DEFENSE');a.action('ed|michael|D3');transitions++;
 }
 const end=seed%4;
 if(end===0){a.hybridAction('kill',a.attackOptions()[0].id);attacks++}
 if(end===1){a.hybridAction('error',a.attackOptions()[0].id);attacks++}
 if(end===2)a.hybridAction('block',a.front()[0]);
 if(end===3)a.hybridAction('opponentError');
 const s=a.state(),r=s.rallies[0];assert.equal(s.rallies.length,1);assert.equal(r.turnaround.attacks,attacks);assert.equal(r.turnaround.transitions,transitions);assert.equal(r.winner,end===1?'Gegner':'EVV');
 results.push({seed,attacks,transitions,winner:r.winner,contacts:r.chain?.length||0});
 }require('fs').mkdirSync('artifacts',{recursive:true});require('fs').writeFileSync('artifacts/100-event-chains.json',JSON.stringify(results,null,2));}finally{h.close()}
});
test('Transition-Doppeltap, Ereignis-ID und alter Handler zählen nicht doppelt',()=>{const h=app({render:false});try{const a=h.api;h.qa.reset();a.hybridAction('transition');a.hybridAction('transition');assert.equal(a.turnaroundMetrics(a.getDraft().chain).transitions,1);assert.equal(a.turnaroundMetrics([{id:'x',side:'EVV',type:'Attack'},{id:'x',side:'EVV',type:'Attack'}]).attacks,1);const old=h.w.document.createElement('button');a.hybridAction('kill','michael',-1);assert.equal(a.state().e,0)}finally{h.close()}});
test('Taktische Formationen R1–R6 verändern keine Regelpositionen',()=>{const h=app();try{for(let r=1;r<=6;r++){const before=JSON.stringify(h.api.rotationMatrix());h.api.saveHybridFormation(r,{michael:[10+r,70]},{michael:[[10,70],[40,20]]});assert.equal(JSON.stringify(h.api.rotationMatrix()),before);assert.equal(h.api.hybridFormation(r).targets.michael[0],10+r)}assert.throws(()=>h.api.saveHybridFormation(7,{}));assert.throws(()=>h.api.saveHybridFormation(1,{michael:[101,0]}))}finally{h.close()}});
test('Detail-Angriff bleibt beim Moduswechsel ein Angriff; Formation überlebt Reload',()=>{const h=app();try{h.qa.reset();const a=h.api;a.action('rec|michael|A3');a.action('b2|SET');const o=a.attackOptions()[0];a.action(`es|${o.zone}`);a.action(`att|${o.id}|${o.zone}`);a.hybridMode('quick');a.hybridAction('kill',o.id);assert.equal(a.state().rallies[0].turnaround.attacks,1);a.saveHybridFormation(2,{michael:[20,30]});const next=app({storage:JSON.parse(h.w.localStorage.getItem('evvQuickScoutV77'))});try{assert.equal(next.api.hybridFormation(2).targets.michael[0],20)}finally{next.close()}}finally{h.close()}});
