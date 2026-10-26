const {test}=require('node:test');const assert=require('node:assert/strict');const {app}=require('./harness.cjs');
test('Transition: Rallyequote 2/3, Chancenverwertung 2/6, Killquote 1/6; keine Doppelzählung',()=>{
 const h=app();try{const T={side:'EVV',type:'TransitionChance'},A={side:'EVV',type:'Attack',result:'CONTINUE'};
 const rr=[{winner:'EVV',event:'Attack',observationComplete:true,chain:[T,A,T,{...A,result:'KILL'}]}, {winner:'EVV',event:'OpponentAttack',result:'ERROR',observationComplete:true,chain:[T]}, {winner:'Gegner',observationComplete:true,chain:[T,A,T,A,T]}, {winner:'EVV',event:'Quick',chain:[]}];
 const x=h.api.turnaroundAnalysis(rr);assert.equal(x.transitionRallies,3);assert.equal(x.transitionPoints,2);assert.equal(x.chances,6);assert.equal(x.transitionPointRate,200/3);assert.equal(x.transitionConversionRate,100/3);assert.equal(x.transitionKillRate,100/6);assert.equal(x.incomplete,1);
 const empty=h.api.turnaroundAnalysis([]);assert.equal(empty.transitionPointRate,null);assert.equal(empty.transitionConversionRate,null);
 }finally{h.close()}
});
test('Gegnerfehler: Annahme, Abwehr, zweiter Ball und Angriff getrennt von Block/Kill',()=>{
 const h=app();try{const rr=[['OpponentReception','DIRECT_ERROR'],['OpponentDefense','DIRECT_ERROR'],['OpponentSecondBall','ERROR'],['OpponentAttack','ERROR']].map(([event,result])=>({winner:'EVV',event,result,chain:[]}));
 assert.equal(h.api.turnaroundAnalysis(rr).opponentErrors,4);
 }finally{h.close()}
});
test('Satzassistent lädt Libero vor der ersten Rallye auch im Schnellmodus',()=>{
 const h=app();try{h.qa.reset(false);h.api.hybridMode('quick');for(let i=0;i<25;i++)h.api.action('quick|EVV');h.w.document.getElementById('prep').click();h.w.document.getElementById('nsRot').value='1';h.w.document.getElementById('nsRec').click();const s=h.api.state();assert.equal(s.liberoActive,true);assert.equal(s.liberoReplacedId,'dirk');assert.equal(h.api.rotationMatrix().find(p=>p.position===6).player,s.liberoIds[0]);}finally{h.close()}
});
test('Neustart in Mehrfach-Transition: neue Kontakt-IDs kollidieren nicht mit gespeichertem Entwurf',()=>{
 const h=app();let n;try{h.qa.reset();h.api.hybridAction('transition');h.api.hybridAction('continue',h.api.attackOptions()[0].id);h.api.hybridAction('transition');n=app({storage:h.w.localStorage.getItem('evvQuickScoutV77')});n.api.hybridAction('kill',n.api.attackOptions()[0].id);const r=n.api.state().rallies[0];assert.equal(r.turnaround.attacks,2);assert.equal(r.turnaround.transitions,2);assert.equal(n.api.turnaroundAnalysis([r]).kills,1);assert.equal(new Set(r.chain.map(c=>c.id)).size,r.chain.length)}finally{h.close();n?.close()}
});
