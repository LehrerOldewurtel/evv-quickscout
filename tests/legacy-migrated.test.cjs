const {test}=require('node:test'),assert=require('node:assert/strict');const {app}=require('./harness.cjs');
const check=(name,fn)=>test(name,()=>{const h=app();try{fn(h)}finally{h.close()}});
check('Migration V7.4–7.6: Gegner A0, vollständiges Undo, Empfang ohne Libero',({api:a,qa})=>{
 qa.reset(true);const before=a.state();a.action('serve|IN');a.action('or|#11|A0');assert.equal(a.state().e,1);assert.equal(a.state().rallies.length,1);a.undoLast();assert.deepEqual(a.state(),before);
 qa.reset(false);const s=a.state();a.setLineup(s.lineup,s.roles,1,{liberoIds:[],liberoAutoEnabled:false});a.syncLiberoRotation();assert.equal(a.receivers().length,4);assert(!a.receivers().includes('amar'));assert(a.receivers().every(id=>s.lineup.includes(id)));
});
check('Migration V7.7: Zurück, Tabs, zweite Bälle und Blockabpraller bleiben ausführbar',({api:a,qa,w})=>{
 qa.reset(false);a.action('rec|michael|A3');const draft=a.getDraft();w.document.querySelector('[data-tab="stats"]').click();assert.deepEqual(a.getDraft(),draft);w.document.querySelector('[data-tab="rally"]').click();a.action('b2|OVER');a.action('b2p|michael');a.action('b2r|ERROR');assert.equal(a.state().o,1);assert.equal(qa.stats(a.state().rallies).find(x=>x.id==='michael').second,1);
 qa.reset(false);a.action('rec|michael|A3');a.action('b2|SET');a.action('back');assert.equal(a.getDraft().step,'evvBall2');a.action('b2|SET');const o=a.attackOptions()[0];a.action(`es|${o.zone}`);a.action(`att|${o.id}|${o.zone}`);a.action('fin|BLOCK_CONTINUE');assert.equal(a.state().e+a.state().o,0);assert.equal(a.getDraft().step,'evvDefense');a.action('ed|michael|D3');assert.equal(a.turnaroundMetrics(a.getDraft().chain).transitions,1);
});
check('Migration Wechsel V7.9.1: zwei Paare, Protokoll und Paarbindung in vollständiger App',({api:a,qa})=>{
 qa.reset();assert(a.applySub('michael','lion'));assert(!a.applySub('lion','david'));assert(a.applySub('lion','michael'));assert(!a.applySub('michael','lion'));assert(a.applySub('arthur','felix'));assert(a.applySub('felix','arthur'));assert.equal(a.state().subCount,4);assert.equal(a.state().events.length,4);assert.deepEqual(Array.from(a.state().events,x=>x.return),[false,true,false,true]);
});
check('Migration Satzwechsel: neue Sechs, Rollen, Rotation, Historie, Libero und Live',({api:a,qa,w})=>{
 qa.reset();for(let i=0;i<25;i++)a.action('quick|EVV');const archive=a.state().rallies;w.document.getElementById('prep').click();w.document.getElementById('nsP4').value='maksym';w.document.getElementById('nsRot').value='4';w.document.getElementById('nsRec').click();const s=a.state();assert.equal(s.set,2);assert.equal(s.rot,4);assert.equal(s.serving,false);assert.equal(s.lineup[4],'maksym');assert.equal(s.roles.maksym,'AA2');assert.deepEqual(s.sets[0].rallies,archive);assert.equal(s.rallies.length,0);assert.equal(s.subCount,0);assert(s.liberoActive);assert.equal(w.document.querySelector('[data-view="live"]').className,'primary');
});
check('Migration Versionsannahmen: geladene Version und sichtbare Anzeige stimmen überein',({api:a,w})=>{assert.equal(a.version,w.EVV_VERSION);assert(w.document.getElementById('buildLabel').textContent.includes(w.EVV_VERSION));assert(w.document.getElementById('setupVersion').textContent.includes(w.EVV_VERSION))});
