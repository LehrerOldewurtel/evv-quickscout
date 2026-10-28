const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {app}=require('./harness.cjs');
function seeded(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296}}
// Independent oracle: only winner stream, initial service and volleyball rules.
// Does not call application scoring, rotation, set-win or statistics functions.
function verifySet(rallies,start,set){
 let score=[0,0],serv=start.serving,rot=start.rot;
 for(const [i,r] of rallies.entries()){
  assert.equal(r.before,score.join(':'));assert.equal(r.rotation,rot);assert.equal(r.servingBefore,serv);assert.equal(r.phase,serv?'K2':'K1');assert.equal(r.set,set);
  const home=r.winner==='EVV';assert(['EVV','Gegner'].includes(r.winner));score[home?0:1]++;
  if(home&&!serv)rot=rot===6?1:rot+1;
  serv=home;assert.equal(r.after,score.join(':'));
  if(i<rallies.length-1)assert(!(Math.max(...score)>=(set===5?15:25)&&Math.abs(score[0]-score[1])>=2));
 }
 return {score,rot,serv};
}
test('100 reproduzierbare vollständige Matches, unabhängige Prüfung jedes Punktes',()=>{
 const h=app({render:false}),{api:a,qa,w}=h;const results=[];
 try{for(let seed=1;seed<=100;seed++){
  const random=seeded(seed);qa.reset(seed%2===0,(seed%6)+1);const expectedWins=[0,0];let rallyCount=0;
  while(!a.state().matchEnded){
   let before=a.state();const winners=[];
   const deuce=(before.set===5?14:24)+Math.floor(random()*4);
   const winHome=seed%2===0?(before.set===5||before.set%2===1):seed%3!==0;
   while(!a.state().setEnded){
    // Seeded extended deuce, then an explicit winner: 50 three-set and 50 five-set matches.
    const s=a.state();
    const home=s.e<deuce||s.o<deuce?s.e<=s.o:winHome;
    winners.push(home?'EVV':'Gegner');a.action(home?'quick|EVV':'quick|Gegner');rallyCount++;
    assert(winners.length<500,'simulation must terminate');
   }
   const s=a.state(),oracle=verifySet(s.rallies,before.setStart,s.set);
   assert.deepEqual(Array.from(s.rallies,r=>r.winner),winners);
   assert(Math.max(...oracle.score)>=(s.set===5?15:25)&&Math.abs(oracle.score[0]-oracle.score[1])>=2);
   assert.deepEqual([s.e,s.o],oracle.score);assert.equal(s.rot,oracle.rot);assert.equal(s.serving,oracle.serv);
   expectedWins[s.e>s.o?0:1]++;assert.equal(s.matchEnded,Math.max(...expectedWins)===3);
   assert.equal(a.setWins('EVV'),expectedWins[0]);assert.equal(a.setWins('Gegner'),expectedWins[1]);
   if(!s.matchEnded){w.document.getElementById('nextSet').onclick();w.document.getElementById(seed%2?'nsRec':'nsSrv').click();const n=a.state();assert.equal(n.set,s.set+1);assert.equal(n.e+n.o,0);assert.equal(n.rallies.length,0);assert.equal(n.subCount,0);assert.equal(n.sets.at(-1).rallies.length,winners.length);}
  }
  const s=a.state();assert(s.set>=3&&s.set<=5);assert.equal(s.sets.length,s.set-1);
  results.push({seed,sets:s.set,wins:expectedWins,rallies:rallyCount,final:[s.e,s.o]});
 }
 fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/100-matches.json',JSON.stringify({generator:'lcg-1664525-1013904223',results},null,2));
 }finally{h.close()}
});
module.exports={seeded,verifySet};
