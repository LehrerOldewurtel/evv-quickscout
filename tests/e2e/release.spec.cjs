const {test,expect}=require('@playwright/test');

for(const width of [390,820,1440])test(`Dialog ${width}px: ein Touch-Schließen löst keine Hintergrundaktion aus`,async({page})=>{
 await page.setViewportSize({width,height:1180});await page.goto('/');await page.locator('#startReceive').tap();await page.locator('#formationEditor').tap();
 await page.evaluate(()=>{window.accidentalActions=[];for(const id of ['scoreFix','voiceBtn','newMatch','nextSet','undo']){const b=document.getElementById(id),handler=b.onclick;b.onclick=function(e){window.accidentalActions.push(id);return handler?.call(this,e)}}});
 await page.locator('#formClose').tap();await expect(page.locator('#modal')).toBeHidden();
 // A subsequent deliberate action must work, rather than a global click mask.
 await page.locator('#turnaroundReport').tap();await expect(page.locator('#analysisResults')).toBeVisible();
 expect(await page.evaluate(()=>window.accidentalActions)).toEqual([]);
});

for(const width of [390,820,1024])test(`Release ${width}px: Touchziele, sichtbarer Stand, Undo mit einer Eingabe`,async({page},info)=>{
 await page.setViewportSize({width,height:1180});await page.goto('/');await page.locator('#startServe').tap();await page.locator('#modeQuick').tap();
 for(const selector of ['[data-quick]','[data-quick-player]','#quickTransition','#quickUndo','#modeQuick','#modeDetail']){
  for(const element of await page.locator(selector).all()){
   const box=await element.boundingBox();expect(box.width).toBeGreaterThanOrEqual(44);expect(box.height).toBeGreaterThanOrEqual(44);
  }
 }
 await page.locator('[data-quick="ace"]').tap();await expect(page.locator('#homeScore')).toHaveText('1');
 const dialogs=[];page.on('dialog',d=>{dialogs.push(d.message());d.dismiss()});
 await page.locator('#quickUndo').tap();await expect(page.locator('#homeScore')).toHaveText('0');await expect(page.locator('#rotationBadge')).toHaveText('R1');
 expect(dialogs).toEqual([]);await expect(page.locator('#modal')).toBeHidden();
 await info.attach('inputs',{body:JSON.stringify({kind:'undo',width,inputs:1,limit:1}),contentType:'application/json'});
});

test('Manipuliertes Undo im Import: keine Mutation; ursprünglicher Stand bleibt bedienbar',async({page})=>{
 await page.goto('/');await page.locator('#startServe').tap();await page.locator('#modeQuick').tap();await page.locator('[data-quick="ace"]').tap();
 const original=await page.evaluate(()=>EVV_QS_TEST.state()),raw=await page.evaluate(()=>localStorage.getItem('evvQuickScoutV77'));
 const payload=JSON.parse(raw);payload.match=payload.st;payload.schema='EVV-QuickScout-1';payload.match.rallyUndo[0].rallies=null;
 if(!await page.locator('#importData').isVisible())await page.locator('#moreActions').tap();
 const chooser=page.waitForEvent('filechooser');await page.locator('#importData').tap();
 await (await chooser).setFiles({name:'synthetic-corrupt-undo.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(payload))});
 await expect(page.locator('#toast')).toContainText('Import fehlgeschlagen');
 expect(await page.evaluate(()=>EVV_QS_TEST.state())).toEqual(original);expect(await page.evaluate(()=>localStorage.getItem('evvQuickScoutV77'))).toBe(raw);
 await page.locator('#quickUndo').tap();await expect(page.locator('#homeScore')).toHaveText('0');
});
