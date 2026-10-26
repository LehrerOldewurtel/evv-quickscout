const {test}=require('node:test');
const assert=require('node:assert/strict');
const {app}=require('./harness.cjs');
const plain=x=>JSON.parse(JSON.stringify(x));
function check(name,fn){test(name,()=>{const h=app();try{fn(h)}finally{h.close()}})}
for(const name of ['v7.9.2','pre-pr-main'])test(`${name}: Update erhält Sätze, Punkte, Aufstellung, Wechsel, Marken und Undo`,()=>{
 const {payload}=require(`./fixtures/${name}-storage.json`),h=app({storage:payload});
 try{
 for(const key of ['set','e','o','rot','serving','lineup','roles','sets','rallies','rallyUndo','events','marks','subCount','subPairs','subUsed'])assert.deepEqual(plain(h.api.state()[key]),payload.st[key],key);
 if(!payload.st.liberoOnCourt)assert.equal(h.api.state().liberoActive,false,'Update aktiviert keinen vorher ungenutzten Libero');
 const expected=payload.st.rallyUndo.at(-1);h.api.undoLast();
 for(const key of ['e','o','rot','serving','lineup','roles','rallies','events','marks','subCount'])assert.deepEqual(plain(h.api.state()[key]),expected[key],`Undo ${key}`);
 h.api.action('quick|EVV');assert.equal(h.api.state().e,expected.e+1);
 }finally{h.close()}
});
check('Undo schließt ausstehende Zielzone und verhindert verwaiste Bestätigung',({api:a,qa,w})=>{
 qa.reset(true);qa.render();a.action('serve|ERR');a.action('quick|EVV');a.action('serve|ACE');
 assert(!w.document.getElementById('modal').classList.contains('hidden'));a.undoLast();
 assert(w.document.getElementById('modal').classList.contains('hidden'));assert.equal(w.document.querySelector('[data-zone]'),null);
});
check('Sprach-Undo respektiert historische READ-ONLY-Ansicht',({api:a,qa})=>{
 qa.reset();a.action('quick|EVV');a.setView(1);const before=plain(a.state());qa.executeVoice({type:'undo'});assert.deepEqual(plain(a.state()),before);
});
check('Sprach-Annahme A3 setzt denselben Ballaufbau und dieselbe Aktionskette wie Touch',({api:a,qa})=>{
 qa.reset();const player=a.receivers()[0];qa.executeVoice({type:'reception',player,q:'A3',raw:'QA Annahme A3'});
 assert.equal(a.getDraft().step,'evvBall2');assert.equal(a.getDraft().chain[0].type,'Reception');assert.equal(qa.attackContext(),'K1');
 a.action('b2|SET');const option=a.attackOptions()[0];a.action(`es|${option.zone}`);a.action(`att|${option.id}|${option.zone}`);a.action('fin|ERROR');
 const stats=qa.stats(a.state().rallies).find(x=>x.id===player);assert.equal(stats.rec,1);assert.equal(stats.a3,1);
});
check('Libero ausdrücklich ausschalten bleibt nach Rallye und Reload ausgeschaltet',({api:a,qa,w})=>{
 qa.reset();qa.render();a.liberoPlanner();
 w.document.getElementById('lpLib').value='';w.document.getElementById('lpMB').value='';w.document.getElementById('lpSave').click();
 assert.equal(a.state().liberoActive,false);a.action('quick|Gegner');assert.equal(a.state().liberoActive,false);
 const saved=JSON.parse(w.localStorage.getItem('evvQuickScoutV77'));const next=app({storage:saved});try{assert.equal(next.api.state().liberoActive,false)}finally{next.close()}
});
check('Libero-Aufschlagsverbot und Wiedereintritt in allen sechs Rotationen',({api:a,qa})=>{
 for(let start=1;start<=6;start++){
 qa.reset(false,start);for(let i=0;i<6;i++){
  a.action('quick|EVV');let s=a.state();const pos=a.courtPos(s.liberoReplacedId);
  assert.equal(s.liberoActive,pos!==1);assert(!s.liberoIds.includes(a.currentServerId()));
  a.action('quick|Gegner');s=a.state();assert(s.liberoActive);assert([1,5,6].includes(a.courtPos(s.liberoOnCourt)));
 }
 }
});

for(const raw of ['{"st":', 'null'])test('Unlesbarer Speicher bleibt unverändert bis explizites Neues-Spiel-Bestätigen: '+raw,()=>{
 const h=app({storage:raw});try{
 assert.equal(h.w.localStorage.getItem('evvQuickScoutV77'),raw);
 h.api.newMatch();h.w.document.getElementById('nmCancel').click();assert.equal(h.w.localStorage.getItem('evvQuickScoutV77'),raw);
 h.api.newMatch();h.w.document.getElementById('nmConfirm').click();assert.equal(JSON.parse(h.w.localStorage.getItem('evvQuickScoutV77')).st.started,false);
 }finally{h.close()}
});
