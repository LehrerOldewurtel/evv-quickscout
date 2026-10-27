// Independent domain model: no app imports; outcomes and expected contacts are
// generated before executing any action. All counters derive from this ledger.
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const copy=x=>JSON.parse(JSON.stringify(x));
function positions(lineup,start,rot){const shift=(rot-start+6)%6;return lineup.map((id,i)=>({id,pos:(i-shift+6)%6+1}))}
function players(lineup,roles,start,rot,serv,lib){const p=positions(lineup,start,rot),mb=p.find(p=>roles[p.id].startsWith('MB')&&[1,5,6].includes(p.pos));return p.map(p=>({...p,id:mb&&p.id===mb.id&&!(serv&&p.pos===1)?lib:p.id}))}
function plan({lineup,roles,start,rot,serv,lib,home,variant,cycles}){
 const on=players(lineup,roles,start,rot,serv,lib),original=positions(lineup,start,rot),receiver=on.find(p=>roles[p.id]?.startsWith('AA')).id,defender=on.find(p=>p.pos===6).id;
 const attacker=on.find(p=>roles[p.id]&&roles[p.id]!=='Z'&&p.pos!==5),blocker=on.find(p=>[2,3,4].includes(p.pos)).id;
 const commands=[],chain=[];let attacks=0,chances=0;
 const add=(cmd,c)=>{commands.push(['action',cmd]);if(c)chain.push(c)};
 const contact=(side,type,extra={})=>({side,type,...extra});
 const attack=result=>{add('b2|SET');const route=attacker.pos===1?'I':attacker.pos===6?'PIPE':roles[attacker.id].startsWith('MB')?'III':roles[attacker.id].startsWith('AA')?'IV':'II';add(`es|${route}`,contact('EVV','Set',{target:route}));add(`att|${attacker.id}|${route}`,contact('EVV','Attack',{player:attacker.id,route,result}));attacks++;if(result==='KILL')commands.push(['hybrid','kill',attacker.id]);else add(`fin|${result}`,result==='CONTINUE'?contact('EVV','AttackResult',{result}):null)};
 const opponent=result=>{add('ob2|SET');const route=['IV','III','II'][variant%3];add(`os|${route}`,contact('Gegner','Set',{target:route}));add(`of|${result}`,contact('Gegner','Attack',{route,result}));if(result==='DEFENSE')chain.push(contact('Gegner','AttackResult',{result:'DEFENDED'}))};
 const defend=quality=>{add(`ed|${defender}|${quality}`,contact('EVV','Defense',{player:defender,quality}));if(quality==='D3')chances++};
 let ending;
 if(serv&&variant%7===0){
 const player=original.find(p=>p.pos===1).id,result=home?'ACE':'ERROR';
 if(home){commands.push(['hybrid','ace']);chain.push(contact('EVV','Serve',{player,result}))}
 else add('serve|ERR',contact('EVV','Serve',{player,result}));
 ending=home?'ace':'serveError';
 }
 else if(!serv&&home&&variant%11===0){
 // An opponent service error ends the rally before reception; no own attack.
 add('quick|EVV');ending='opponentServeError';
 }
 else if(!serv&&!home&&variant%3===0){add(`rec|${receiver}|A0`,contact('EVV','Reception',{player:receiver,quality:'A0'}));ending='A0'}
 else {
 if(serv){add('serve|IN',contact('EVV','Serve',{player:original.find(p=>p.pos===1).id,result:'IN'}));add('or|#11|A3',contact('Gegner','Reception',{player:'#11',quality:'A3'}));opponent('DEFENSE');defend('D3')}
 else add(`rec|${receiver}|A3`,contact('EVV','Reception',{player:receiver,quality:'A3'}));
 for(let i=0;i<cycles;i++){attack('CONTINUE');add('od|D3',contact('Gegner','Defense',{quality:'D3'}));opponent('DEFENSE');defend('D3')}
 if(home&&variant%3===0){attack('KILL');ending='kill'}
 else if(home){attack('CONTINUE');add('od|D3',contact('Gegner','Defense',{quality:'D3'}));if(variant%3===1){opponent('BLOCK');add(`ebc|${blocker}`);add('ebr|POINT',contact('EVV','Block',{player:blocker,result:'BLOCK'}));ending='block'}else{opponent('ERROR');ending='opponentError'}}
 else if(variant%2===0){attack('CONTINUE');add('od|D3',contact('Gegner','Defense',{quality:'D3'}));opponent('DEFENSE');defend('D0');ending='D0'}
 else {attack('ERROR');ending='attackError'}
 }
 return {commands,chain,attacks,chances,ending,winner:home?'EVV':'Gegner',rotation:rot,phase:serv?'K2':'K1',servingBefore:serv,observationComplete:ending!=='opponentServeError'};
}
function statistics(ledger){
 const result={observed:ledger.filter(r=>r.observationComplete).length,incomplete:ledger.filter(r=>!r.observationComplete).length,kills:0,attackingRallies:0,firstAttackKill:0,killByTwo:0,killByThree:0,chances:0,transitionRallies:0,transitionKills:0,transitionPoints:0,chancesWithoutAttack:0,multipleTransitions:0,blockPoints:0,opponentErrors:0,attacksToKill:[]};const rows={};
 for(const r of ledger){const x=result;const kill=r.ending==='kill';x.kills+=+kill;x.blockPoints+=+(r.ending==='block');x.opponentErrors+=+(r.ending==='opponentError');x.attackingRallies+=+(r.attacks>0);if(kill){x.attacksToKill.push(r.attacks);x.firstAttackKill+=+(r.attacks===1);x.killByTwo+=+(r.attacks<=2);x.killByThree+=+(r.attacks<=3)}x.chances+=r.chances;x.transitionRallies+=+(r.chances>0);x.transitionKills+=+(r.chances>0&&kill);x.transitionPoints+=+(r.chances>0&&r.winner==='EVV');x.multipleTransitions+=+(r.chances>1);
 // Every planned controlled defense is followed by an actual own attack.
 for(const c of r.chain){if(c.side!=='EVV'||!c.player)continue;const z=rows[c.player]??={rec:0,a3:0,a0:0,srv:0,ac:0,se:0,att:0,kill:0,ae:0,bl:0,def:0,d3:0,d0:0};if(c.type==='Reception'){z.rec++;z[c.quality.toLowerCase()]++}if(c.type==='Serve'){z.srv++;z.ac+=+(c.result==='ACE');z.se+=+(c.result==='ERROR')}if(c.type==='Attack'){z.att++;z.kill+=+(c.result==='KILL');z.ae+=+(c.result==='ERROR')}if(c.type==='Block')z.bl++;if(c.type==='Defense'){z.def++;z[c.quality.toLowerCase()]++}}
 }
 for(const [key,n,d] of [['firstAttackKillRate','firstAttackKill','attackingRallies'],['killByTwoRate','killByTwo','attackingRallies'],['killByThreeRate','killByThree','attackingRallies'],['transitionKillRate','transitionKills','chances'],['transitionPointRate','transitionPoints','transitionRallies'],['transitionConversionRate','transitionPoints','chances']])result[key]=result[d]?100*result[n]/result[d]:null;
 return {turnaround:result,rows};
}
module.exports={seeded,copy,positions,players,plan,statistics};
