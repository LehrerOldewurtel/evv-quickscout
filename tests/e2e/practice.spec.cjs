const {test,expect}=require('@playwright/test');
async function quick(page){await page.goto('/');await page.locator('#startReceive').click();await page.locator('#modeQuick').click()}
test('Transition führt in drei Eingaben über den Spieler zum Kill; Historie und Analyse trennen Entwurf',async({page},info)=>{
 await quick(page);await page.locator('#quickTransition').click();
 await expect(page.locator('#quickHint')).toContainText('Angreifer wählen');
 expect(await page.evaluate(()=>EVV_QS_TEST.state().rallies.length)).toBe(0);
 await page.locator('#turnaroundReport').click();await expect(page.locator('[data-turn="chances"] b')).toHaveText('0');await expect(page.locator('#analysisDraft')).toContainText('Transition-Chancen 1');await page.locator('#analysisClose').click();
 const player=page.locator('[data-quick-player]:not([disabled])').first(),id=await player.getAttribute('data-quick-player');await player.click();await expect(page.locator('#quickHint')).toContainText('Angriffsergebnis');
 await page.locator('[data-quick="kill"]').click();const r=await page.evaluate(()=>EVV_QS_TEST.state().rallies[0]);
 expect(r.turnaround).toEqual({attacks:1,transitions:1});expect(r.chain.at(-1).player).toBe(id);expect(r.attacker).toBe(id);
 await expect(page.locator('#recent')).toContainText('Abgeschlossene Rallyes');await expect(page.locator('#recent')).toContainText('Transitions 1');
 await page.locator('#turnaroundReport').click();await expect(page.locator('[data-turn="chances"] b')).toHaveText('1');await expect(page.locator('[data-turn="kills"] b')).toHaveText('1');await expect(page.locator('#analysisDraft')).toContainText('Keine laufende Rallye');
 await info.attach('inputs',{body:JSON.stringify({kind:'transitionPlayerKill',width:820,inputs:3,limit:3,player:id,attacks:r.turnaround.attacks,chances:r.turnaround.transitions}),contentType:'application/json'});
});
test('Verteidigter Angriff bleibt offen; Doppelklick und Reload zählen keine zweite Aktion',async({page})=>{
 await quick(page);await page.locator('#quickTransition').dblclick();let p=page.locator('[data-quick-player]:not([disabled])').first();const id=await p.getAttribute('data-quick-player');await p.click();await page.locator('[data-quick="continue"]').dblclick();
 expect(await page.evaluate(()=>EVV_QS_TEST.state().rallies.length)).toBe(0);expect(await page.evaluate(()=>EVV_QS_TEST.turnaroundMetrics(EVV_QS_TEST.getDraft().chain))).toEqual({attacks:1,transitions:1});
 await expect(page.locator('#quickHint')).toContainText('Rallye läuft weiter');await page.reload();await expect(page.locator('[data-quick="kill"]')).toBeDisabled();
 await page.locator('#quickTransition').click();await page.locator(`[data-quick-player="${id}"]`).click();await page.locator('[data-quick="kill"]').dblclick();const s=await page.evaluate(()=>EVV_QS_TEST.state());expect(s.rallies).toHaveLength(1);expect(s.rallies[0].turnaround).toEqual({attacks:2,transitions:2});expect(s.e+s.o).toBe(1);
});
test.describe('Desktop ohne Touch-Hardware',()=>{test.use({hasTouch:false});
test('Taktik: Maus behält beim Greifen die Mitte und speichert Drag sowie Auswahl/Zielklick',async({page})=>{
 await quick(page);await page.locator('#matchTactics').click();await page.locator('#tacticsEdit').click();const court=page.locator('#formationSvg'),player=court.locator('[data-form-slot="4"]');await player.scrollIntoViewIfNeeded();const before=await player.locator('circle').boundingBox();await page.mouse.move(before.x+before.width/2,before.y+before.height/2);await page.mouse.down();const pressed=await player.locator('circle').boundingBox();expect(Math.abs(pressed.x-before.x)).toBeLessThan(2);expect(Math.abs(pressed.y-before.y)).toBeLessThan(2);await page.mouse.move(before.x+before.width/2+24,before.y+before.height/2+27,{steps:8});await page.mouse.up();const moved=await player.locator('circle').boundingBox();expect(moved.x-before.x).toBeCloseTo(24,0);expect(moved.y-before.y).toBeCloseTo(27,0);await player.click();const c=await court.boundingBox(),tx=Math.round(c.x+c.width*.5),ty=Math.round(c.y+c.height*.8);await page.mouse.click(tx,ty);const target=await player.locator('circle').boundingBox();expect(target.x+target.width/2).toBeCloseTo(tx,0);expect(target.y+target.height/2).toBeCloseTo(ty,0);await page.locator('#formSave').click();const saved=await page.evaluate(()=>EVV_QS_TEST.state().formationBook);await page.locator('#formClose').click();await page.reload();expect(await page.evaluate(()=>EVV_QS_TEST.state().formationBook)).toEqual(saved);
});
});
for(const [width,height] of [[820,1180],[768,1024],[1024,768],[1180,820]])test(`iPad ${width}x${height}: Live-Aktionen vollständig sichtbar ohne Scrollen`,async({page})=>{
 await page.setViewportSize({width,height});await quick(page);await page.evaluate(()=>scrollTo(0,0));
 const dock=await page.locator('.bottom').boundingBox();for(const selector of ['#homeScore','#quickTransition','#quickUndo','[data-quick]','[data-quick-player]'])for(const el of await page.locator(selector).all()){const b=await el.boundingBox();expect(b.y).toBeGreaterThanOrEqual(0);expect(b.y+b.height).toBeLessThanOrEqual(dock.y);if(selector!=='#homeScore'){expect(b.width).toBeGreaterThanOrEqual(44);expect(b.height).toBeGreaterThanOrEqual(44)}}
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
});
test.describe('Formationseditor ohne Touch-Hardware',()=>{test.use({hasTouch:false});
test('Formationseditor: außermittig greifen ohne Sprung, Auswahl/Zielklick und Maus-Speichern',async({page})=>{
 await quick(page);await page.locator('#formationEditor').click();const svg=page.locator('#formationSvg'),p=svg.locator('[data-form-slot="1"]');await p.scrollIntoViewIfNeeded();const a=await p.locator('circle').boundingBox();
 await page.mouse.move(a.x+a.width*.8,a.y+a.height/2);await page.mouse.down();await page.mouse.move(a.x+a.width*.8-26,a.y+a.height/2-28,{steps:6});await page.mouse.up();const b=await p.locator('circle').boundingBox();expect(Math.abs((b.x-a.x)+26)).toBeLessThan(2);expect(Math.abs((b.y-a.y)+28)).toBeLessThan(2);
 await p.click();const box=await svg.boundingBox();await svg.click({position:{x:box.width*.5,y:box.height*.78}});const t=await p.locator('circle').boundingBox();expect(Math.abs(t.x+t.width/2-(box.x+box.width*.5))).toBeLessThan(2);expect(Math.abs(t.y+t.height/2-(box.y+box.height*.78))).toBeLessThan(2);
 await page.locator('#formSave').click();await page.locator('#formClose').click();await page.reload();await page.locator('#formationEditor').click();const saved=await page.locator('[data-form-slot="1"]').getAttribute('transform');expect(saved).toMatch(/translate\(450/);
});
});
for(const serving of [false,true])for(let rotation=1;rotation<=6;rotation++)test(`Touch R${rotation} ${serving?'K2':'K1'}: drei Eingaben mit korrekter Spielerzuordnung`,async({page},info)=>{
 await page.goto('/');await page.locator('#startRotation').selectOption({label:'R'+rotation});await page.locator(serving?'#startServe':'#startReceive').tap();await page.locator('#modeQuick').tap();
 await page.locator('#quickTransition').tap();const player=page.locator('[data-quick-player]:not([disabled])').last(),id=await player.getAttribute('data-quick-player');await player.tap();await expect(page.locator(`[data-quick-player="${id}"]`)).toHaveAttribute('aria-pressed','true');await page.locator('[data-quick="kill"]').tap();
 const r=await page.evaluate(()=>EVV_QS_TEST.state().rallies[0]);expect(r.attacker).toBe(id);expect(r.chain.filter(c=>c.type==='Attack')).toEqual([expect.objectContaining({player:id,result:'KILL'})]);expect(r.turnaround).toEqual({attacks:1,transitions:1});expect(r.phase).toBe(serving?'K2':'K1');expect(r.rotation).toBe(rotation);
 await info.attach('inputs',{body:JSON.stringify({kind:`transitionPlayerKill-R${rotation}-${r.phase}`,width:820,inputs:3,limit:3,player:id}),contentType:'application/json'});
});
test('Abgebrochene Mausgeste im gemeinsamen Editor verwirft die Zwischenposition',async({page})=>{
 await quick(page);const before=await page.evaluate(()=>EVV_QS_TEST.state());await page.locator('#formationEditor').click();const player=page.locator('#formationSvg [data-form-slot="4"]');await player.scrollIntoViewIfNeeded();const original=await player.getAttribute('transform'),box=await player.locator('circle').boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+25,box.y+box.height/2+25,{steps:5});expect(await player.getAttribute('transform')).not.toBe(original);await page.locator('#formationSvg').dispatchEvent('pointercancel',{pointerId:1,isPrimary:true,pointerType:'mouse'});await page.mouse.up();expect(await player.getAttribute('transform')).toBe(original);await page.locator('#formClose').click();expect(await page.evaluate(()=>EVV_QS_TEST.state())).toEqual(before);
});
