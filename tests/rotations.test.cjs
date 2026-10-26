const {test}=require('node:test');
const assert=require('node:assert/strict');
const {app}=require('./harness.cjs');
const ids=['johann','michael','janik','jens','arthur','dirk'];
const roles=['Z','AA1','MB1','D','AA2','MB2'];
for(let start=1;start<=6;start++)test(`R${start}: sechs Positionen, Vorderreihe, Libero, Aufschläger, Angriffswege und Sideout`,()=>{
 const h=app({render:false});const {api:a,qa}=h;
 try{
 qa.reset(false,start);
 for(let turn=0;turn<6;turn++){
  const s=a.state(),expectedPositions=ids.map((id,i)=>({id,pos:((i-turn+6)%6)+1,role:roles[i]}));
  for(const x of expectedPositions)assert.equal(a.courtPos(x.id),x.pos,`${x.id} turn ${turn}`);
  const backMB=expectedPositions.find(x=>/^MB/.test(x.role)&&[1,5,6].includes(x.pos));
  assert.equal(s.liberoReplacedId,backMB.id);assert.equal(s.liberoActive,!(s.serving&&backMB.pos===1));
  assert.equal(a.courtPos(s.liberoOnCourt),backMB.pos);
  const active=expectedPositions.map(x=>({...x,id:s.liberoActive&&x.id===backMB.id?s.liberoOnCourt:x.id}));
  assert.deepEqual(Array.from(a.front()).sort(),active.filter(x=>[2,3,4].includes(x.pos)).map(x=>x.id).sort());
  assert.equal(a.currentServerId(),expectedPositions.find(x=>x.pos===1).id);
  assert.equal(new Set(a.receivers()).size,4);
  const expected=active.filter(x=>x.role!=='Z'&&!s.liberoIds.includes(x.id)&&x.pos!==5).map(x=>({id:x.id,zone:x.pos===1?'I':x.pos===6?'PIPE':x.role.startsWith('AA')?'IV':x.role.startsWith('MB')?'III':'II'}));
  assert.deepEqual(JSON.parse(JSON.stringify(a.attackOptions().map(({id,zone})=>({id,zone})))),expected);
  a.commit('EVV');assert.equal(a.state().rot,((start+turn)%6)+1);
  const rot=a.state().rot;a.commit('EVV');assert.equal(a.state().rot,rot);a.commit('Gegner');assert.equal(a.state().rot,rot);
 }
 }finally{h.close()}
});
