const {test,expect}=require('@playwright/test');
const state=page=>page.evaluate(()=>EVV_QS_TEST.state());
const fields=['set','e','o','rot','serving','lineup','roles','sets','rallies','rallyUndo','events','marks','subCount','subPairs','subUsed'];
test.beforeEach(async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.qaErrors=errors;
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
});
test.afterEach(async({page})=>expect(page.qaErrors).toEqual([]));
for(const version of ['v7.9.2','pre-pr-main'])test(`Update ${version}: alter Stand, Reload und Undo`,async({page})=>{
 const {payload}=require(`../fixtures/${version}-storage.json`);
 await page.addInitScript(payload=>{if(!localStorage.getItem('evvQuickScoutV77'))localStorage.setItem('evvQuickScoutV77',JSON.stringify(payload))},payload);
 await page.goto('/');let s=await state(page);
 for(const key of fields)expect(s[key],key).toEqual(payload.st[key]);
 if(!payload.st.liberoOnCourt)expect(s.liberoActive).toBe(false);
 await page.reload();expect(await state(page)).toEqual(s);
 await page.locator('#undo').tap();s=await state(page);
 for(const key of ['e','o','rot','serving','marks','events','lineup','roles'])expect(s[key],key).toEqual(payload.st.rallyUndo.at(-1)[key]);
});
test('Libero aus und wieder ein: UI und Reload',async({page})=>{
 await page.goto('/');await page.locator('#startReceive').tap();
 await page.locator('[data-act="liberoPlanner"]').tap();await page.locator('#lpLib').selectOption('');await page.locator('#lpMB').selectOption('');await page.locator('#lpSave').tap();
 expect((await state(page)).liberoActive).toBe(false);await page.reload();expect((await state(page)).liberoActive).toBe(false);
 await page.locator('[data-act="liberoPlanner"]').tap();await page.locator('#lpLib').selectOption('amar');await page.locator('#lpMB').selectOption('dirk');await page.locator('#lpSave').tap();expect((await state(page)).liberoActive).toBe(true);
});
test('Bestätigte Sprachannahme und READ-ONLY-Sprache (Speech-API simuliert)',async({page})=>{
 await page.addInitScript(()=>{window.qaTranscript='Michael Annahme A3';window.SpeechRecognition=class{start(){setTimeout(()=>this.onresult?.({results:[[{transcript:window.qaTranscript}]]}),0)}abort(){}}});
 await page.goto('/');await page.locator('#startReceive').tap();await page.locator('#voiceBtn').tap();await page.locator('#voiceYes').tap();
 await expect(page.locator('#flow')).toContainText('EVV · 2. Ball');
 await page.evaluate(()=>{EVV_QS_TEST.action('quick|EVV');EVV_QS_TEST.setView(1);window.qaTranscript='Undo'});
 const before=await state(page);await page.locator('#voiceBtn').tap();await page.locator('#voiceYes').tap();expect(await state(page)).toEqual(before);
 await page.evaluate(()=>window.qaTranscript='Punkt EVV');await page.locator('#voiceBtn').tap();await page.locator('#voiceYes').tap();expect(await state(page)).toEqual(before);
});
test('Undo ausstehender Zielzone entfernt den alten Dialog',async({page})=>{
 await page.goto('/');await page.locator('#startServe').tap();
 await page.evaluate(()=>{EVV_QS_TEST.action('quick|EVV');EVV_QS_TEST.action('serve|ACE');EVV_QS_TEST.undoLast()});
 await expect(page.locator('#modal')).toBeHidden();await expect(page.locator('[data-zone]')).toHaveCount(0);expect((await state(page)).e).toBe(0);
});
for(const raw of ['{"st":','null'])test(`Unlesbarer lokaler Inhalt bleibt beim Laden erhalten: ${raw}`,async({page})=>{
 await page.addInitScript(raw=>{if(!localStorage.getItem('evvQuickScoutV77'))localStorage.setItem('evvQuickScoutV77',raw)},raw);
 await page.goto('/');expect(await page.evaluate(()=>localStorage.getItem('evvQuickScoutV77'))).toBe(raw);
 await page.reload();expect(await page.evaluate(()=>localStorage.getItem('evvQuickScoutV77'))).toBe(raw);
});
for(const version of ['v7.9.2','pre-pr-main'])test(`Import ${version}: bestätigtes synthetisches Backup behält Spielstand`,async({page})=>{
 const {payload}=require(`../fixtures/${version}-storage.json`);
 await page.goto('/');await page.locator('#startReceive').tap();
 page.once('dialog',dialog=>dialog.accept());
 const chooser=page.waitForEvent('filechooser');await page.locator('#importData').tap();
 await (await chooser).setFiles({name:'qa-synthetic.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schema:'EVV-QuickScout-1',version,match:payload.st,opponent:payload.opponent,...(payload.roster?{roster:payload.roster}:{})}))});
 await expect.poll(async()=>(await state(page)).set).toBe(2);
 const s=await state(page);for(const key of fields)expect(s[key],key).toEqual(payload.st[key]);
 if(!payload.st.liberoOnCourt)expect(s.liberoActive).toBe(false);
 await page.reload();expect(await state(page)).toEqual(s);
});
