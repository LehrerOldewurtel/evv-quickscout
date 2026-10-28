const {test,expect}=require('@playwright/test');const fs=require('node:fs');
const state=p=>p.evaluate(()=>EVV_QS_TEST.state());
for(const width of [390,820,1024])test(`Generalprobe ${width}px: komplettes Match ausschließlich per Oberfläche`,async({page},info)=>{
 test.setTimeout(240000);await page.setViewportSize({width,height:1180});const errors=[];page.on('pageerror',e=>errors.push(e.message));let taps=0,selects=0,rot=1,serv=false,total=0;const perSet=[];
 const tap=async selector=>{await page.locator(selector).tap();taps++};const select=async(selector,value)=>{await page.locator(selector).selectOption(value);selects++};
 const act=async value=>tap(`[data-act="${value}"]`);
 const quick=async kind=>{await tap(`[data-quick="${kind}"]`);if(!['ace','opponentError'].includes(kind))await tap('[data-quick-player]:not([disabled]) >> nth=0')};
 await page.goto('/');await page.locator('#oppName').fill('QA Spieltag '+width);await page.locator('#oppR1').fill('11');if(width===1024)await select('#ssP4','maksym');await tap('#startReceive');await tap('#modeQuick');
 // Actual UI for libero configuration, no game mutations through evaluate.
 await tap('#modeDetail');await act('liberoPlanner');await select('#lpLib','alex');await select('#lpMB','dirk');await tap('#lpSave');expect((await state(page)).liberoOnCourt).toBe('alex');await tap('#modeQuick');
 await tap('#formationEditor');const node=page.locator('[data-form-slot="6"]');await node.scrollIntoViewIfNeeded();const box=await node.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2-20,box.y+box.height/2-25,{steps:4});await page.mouse.up();await tap('#formSave');await tap('#formClose');const formations=(await state(page)).formationBook;
 for(let set=1;set<=3;set++){
 let e=0,o=0,n=0;
 while(e<25){
 if(n===4||n===8){await tap('#substitute');await select('#subOut',n===4?'michael':'lion');await select('#subIn',n===4?'lion':'michael');await tap('#doSub');expect((await state(page)).subCount).toBe(n===4?1:2)}
 const home=o>=7||e<=o;
 if(n===0){
 await tap('#modeDetail');await page.locator('[data-act^="rec|"][data-act$="|A3"]').first().tap();taps++;await act('b2|SET');await page.locator('[data-act^="es|"]').first().tap();taps++;await page.locator('[data-act^="att|"]').first().tap();taps++;await act('fin|KILL');await tap('[data-zone="5"]');await tap('#modeQuick');
 }else if(n===3&&set===1){await tap('#quickTransition');await page.reload();expect(await page.evaluate(()=>EVV_QS_TEST.getDraft().chain.at(-1).type)).toBe('TransitionChance');await quick('d0')}
 else if(home){if(n%5===0)await tap('#quickTransition');await quick(n%7===0?'block':n%3===0?'opponentError':'kill')}
 else await quick('d0');
 if(n===5){await tap('#quickUndo');expect((await state(page)).rallies).toHaveLength(n);await quick(home?'kill':'d0')}
 if(home){e++;if(!serv)rot=rot%6+1}else o++;serv=home;n++;total++;
 const s=await state(page);expect([s.e,s.o,s.rot,s.serving,s.rallies.length]).toEqual([e,o,rot,serv,n]);await expect(page.locator('#homeScore')).toHaveText(String(e));await expect(page.locator('#rotationBadge')).toHaveText('R'+rot);expect(s.rallies.at(-1).after).toBe(`${e}:${o}`);
 }
 perSet.push({set,e,o,rallies:n});expect((await state(page)).setEnded).toBe(true);
 if(set<3){await tap('#prep');if(set===1)await tap('#nsSavePreset');await select('#nsPreset','Gespeicherte Startaufstellung');await select('#nsRot','1');await tap('#nsRec');rot=1;serv=false;expect((await state(page)).liberoOnCourt).toBe('alex');expect((await state(page)).formationBook).toEqual(formations)}
 }
 const completed=await state(page);expect(completed.matchEnded).toBe(true);await expect(page.locator('#flow')).toContainText('MATCH BEENDET');expect(completed.events.filter(x=>x.type==='sub')).toHaveLength(6);
 // Export then deliberately new synthetic match, import the downloaded original.
 if(!await page.locator('#exportData').isVisible())await tap('#moreActions');const download=page.waitForEvent('download');await tap('#exportData');const file=await download;const payload=JSON.parse(fs.readFileSync(await file.path(),'utf8'));expect(payload.match).toEqual(completed);
 await tap('#newMatch');await tap('#nmConfirm');expect((await state(page)).started).toBe(false);
 const chooser=page.waitForEvent('filechooser');await tap('#importData');page.once('dialog',d=>d.accept());await (await chooser).setFiles(await file.path());await expect(page.locator('#flow')).toContainText('MATCH BEENDET');expect(await state(page)).toEqual(completed);await page.reload();expect(await state(page)).toEqual(completed);expect(errors).toEqual([]);
 await info.attach('matchday',{body:JSON.stringify({width,sets:perSet,rallies:total,taps,selects,typedFields:2,dragGestures:1,notes:'Native selectOption zählt als Auswahlaktion, nicht als gemessene Menü-Taps; sämtliche Spielaktionen per UI.'}),contentType:'application/json'});
});
test('Coaching öffnet gewählte Rotation und Annahme/Abwehr ohne automatische Mutation',async({page})=>{
 await page.goto('/');await page.locator('#startReceive').tap();const before=await state(page);
 for(const kind of ['receive','defense-IV','defense-III','defense-II']){
 await page.locator('#turnaroundReport').tap();await page.locator('#analysisDetails summary').click();await expect(page.locator('#analysisFormation')).toBeDisabled();await page.locator('#analysisRot').selectOption('4');await page.locator('#analysisFormationKind').selectOption(kind);await page.locator('#analysisFormation').tap();await expect(page.locator('#formRotation')).toHaveValue('4');await expect(page.locator('#formKind')).toHaveValue(kind);expect(await state(page)).toEqual(before);await page.locator('#formClose').tap();
 }
});
test('Echter Chromium-Neustart: Mehrfach-Transition-Rallye und eindeutige Kontakte',async({playwright},info)=>{
 const os=require('node:os'),path=require('node:path'),profile=fs.mkdtempSync(path.join(os.tmpdir(),'evv-process-restart-'));let context;
 const launch=()=>playwright.chromium.launchPersistentContext(profile,{...info.project.use.launchOptions,hasTouch:true,viewport:{width:820,height:1180}});
 try{context=await launch();let page=await context.newPage();await page.goto('http://127.0.0.1:4173');await page.locator('#startReceive').tap();await page.locator('#modeQuick').tap();await page.locator('#quickTransition').tap();await page.locator('[data-quick-player="michael"]').tap();await page.locator('[data-quick="continue"]').tap();await page.locator('#quickTransition').tap();const draft=await page.evaluate(()=>EVV_QS_TEST.getDraft());expect(draft.chain).toHaveLength(3);
 await context.close();context=await launch();page=await context.newPage();await page.goto('http://127.0.0.1:4173');expect(await page.evaluate(()=>EVV_QS_TEST.getDraft())).toEqual(draft);await page.locator('[data-quick="kill"]').tap();await page.locator('[data-quick-player]:not([disabled])').first().tap();const s=await state(page);expect(s.e).toBe(1);expect(s.rallies[0].turnaround).toEqual({attacks:2,transitions:2});expect(new Set(s.rallies[0].chain.map(c=>c.id)).size).toBe(4);expect(s.rallies[0].observationComplete).toBe(false);await expect(page.locator('#recent')).toContainText('unvollständig');await context.close();context=null;
 }finally{await context?.close();fs.rmSync(profile,{recursive:true,force:true})}
});
