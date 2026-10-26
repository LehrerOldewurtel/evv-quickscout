const {test}=require('node:test');
const assert=require('node:assert/strict');
const {app}=require('./harness.cjs');
function check(name,fn){test(name,()=>{const h=app({render:false});try{fn(h)}finally{h.close()}})}
check('Satzgrenzen: 25/15, zwei Punkte Abstand',({api:a})=>{
 for(const [e,o,s,w] of [[25,23,1,true],[25,24,1,false],[26,24,1,true],[15,13,5,true],[15,14,5,false],[24,26,2,true],[14,14,5,false]])assert.equal(a.isSetWin(e,o,s),w);
});
check('Rotationen und erlaubte Angreifer in allen sechs Aufstellungen',({api:a,qa})=>{
 for(let r=1;r<=6;r++){qa.reset(false,r);a.begin(false,1); // fixed starting rotation
 for(let i=1;i<r;i++){a.commit('EVV');a.commit('Gegner')}
 const matrix=a.rotationMatrix();assert.equal(new Set(matrix.map(x=>x.player)).size,6);
 assert.equal(a.front().length,3);
 for(const o of a.attackOptions()){assert(!['johann','amar','alex'].includes(o.id));assert([1,2,3,4,6].includes(o.pos));}
 }
 assert.equal(a.rotNext(5),6);assert.equal(a.rotNext(6),1);
});
check('Sideout rotiert einmal; eigener Punkt und eigener Fehler nicht',({api:a,qa})=>{
 qa.reset(false,5);a.commit('EVV');assert.equal(a.state().rot,6);assert(a.state().serving);
 a.commit('EVV');assert.equal(a.state().rot,6);a.commit('Gegner');assert.equal(a.state().rot,6);assert(!a.state().serving);
});
check('Ungültiger Sieger und beendeter Satz verändern keine Rallyes',({api:a,qa})=>{
 qa.reset();assert.throws(()=>a.commit('unknown'));for(let i=0;i<25;i++)a.commit('EVV');
 const before=a.state();a.commit('Gegner');assert.deepEqual(a.state(),before);
});
check('Wechsel/Rückwechsel, Paarbindung und Wiederverwendung',({api:a,qa})=>{
 qa.reset();assert(a.applySub('michael','lion'));assert.equal(a.roleOf('lion'),'AA1');assert(a.applySub('lion','michael'));assert(!a.applySub('michael','lion'));assert.equal(a.state().subCount,2);
});
check('Registrierter Libero darf nicht regulär eingewechselt werden',({api:a,qa})=>{
 qa.reset();a.configureLiberoSlots(['lion','alex'],['','']);assert.equal(a.applySub('michael','lion'),false);
});
check('A0 beendet unmittelbar mit Gegnerpunkt',({api:a,qa})=>{
 qa.reset();a.action('rec|michael|A0');assert.equal(a.state().o,1);assert.equal(a.state().rallies.length,1);assert.equal(Object.keys(a.getDraft()).length,0);
});
check('D0 beider Teams beendet die Rallye unmittelbar',({api:a,qa})=>{
 qa.reset();a.action('ed|michael|D0');assert.equal(a.state().o,1);assert.equal(a.state().rallies[0].chain[0].quality,'D0');
 qa.reset();a.action('od|D0');assert.equal(a.state().e,1);assert.equal(Object.keys(a.getDraft()).length,0);
});
check('Markierter Punkt und Undo sind atomar',({api:a,qa,w})=>{
 qa.reset(true);const before=a.state();a.action('serve|ACE');w.document.querySelector('[data-zone="5"]').click();assert.equal(a.state().marks.length,1);a.undoLast();assert.deepEqual(a.state(),before);
});
check('Undo und explizites Speichern enthalten den aktuellen Spielstand',({api:a,qa,w})=>{
 qa.reset();a.commit('EVV');const saved=JSON.parse(w.localStorage.getItem('evvQuickScoutV77'));assert.equal(saved.st.e,0); // render disabled, explicitly persist
 w.EVV_QS_TEST.saveSixPresets();assert.equal(JSON.parse(w.localStorage.getItem('evvQuickScoutV77')).st.e,1);
 a.undoLast();assert.equal(a.state().e,0);
});
