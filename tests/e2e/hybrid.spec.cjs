const {test,expect}=require('@playwright/test');
for(const width of [390,820])for(const [kind,limit] of [['ace',1],['a0',2],['d0',2],['kill',2],['transition',1],['transitionKill',3]])test(`${width}px ${kind}: höchstens ${limit} Eingaben`,async({page},info)=>{
 await page.setViewportSize({width,height:1180});await page.goto('/');await page.locator(kind==='ace'?'#startServe':'#startReceive').tap();await page.locator('#modeQuick').tap();
 let taps=0;async function tap(selector){await page.locator(selector).tap();taps++}
 await expect(page.locator('[data-quick-player]')).toHaveCount(6);
 if(kind.startsWith('transition'))await tap('#quickTransition');
 if(kind!=='transition'){
 await tap(`[data-quick="${kind==='transitionKill'?'kill':kind}"]`);if(kind!=='ace')await tap('[data-quick-player]:not([disabled]) >> nth=0');
 }
 expect(taps).toBeLessThanOrEqual(limit);
 const s=await page.evaluate(()=>EVV_QS_TEST.state());
 if(kind==='transition'){expect(s.rallies).toHaveLength(0);await page.locator('#modeDetail').tap();expect(await page.evaluate(()=>EVV_QS_TEST.getDraft().chain[0].type)).toBe('TransitionChance');await page.locator('#modeQuick').tap()}
 else{expect(s.rallies).toHaveLength(1);expect(s.rallies[0].turnaround.attacks).toBe(['kill','transitionKill'].includes(kind)?1:0);expect(s.rallies[0].turnaround.transitions).toBe(kind==='transitionKill'?1:0);await tap('#quickUndo');expect((await page.evaluate(()=>EVV_QS_TEST.state())).rallies).toHaveLength(0)}
 await info.attach('inputs',{body:JSON.stringify({kind,width,inputs:kind==='transition'?taps:taps-1,limit}),contentType:'application/json'});
});
