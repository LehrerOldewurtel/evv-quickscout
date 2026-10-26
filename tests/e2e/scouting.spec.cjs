const {test,expect}=require('@playwright/test');
let taps;
async function tap(page,selector){await page.locator(selector).tap();taps++}
async function act(page,value){await tap(page,`[data-act="${value}"]`)}
async function state(page){return page.evaluate(()=>EVV_QS_TEST.state())}
async function setup(page,rotation,serve=false){
 await page.goto('/');await page.locator('#startRotation').selectOption(`R${rotation}`);
 for(let i=1;i<=4;i++)await page.locator(`#oppR${i}`).fill(String(i+20));
 await page.locator('#oppName').fill('QA SYNTHETISCH');await tap(page,serve?'#startServe':'#startReceive');taps=0;
}
async function attack(page,result='KILL'){
 await act(page,'b2|SET');await page.locator('[data-act^="es|"]').first().tap();taps++;
 await page.locator('[data-act^="att|"]').first().tap();taps++;
 await act(page,`fin|${result}`);if(result==='KILL')await tap(page,'[data-zone="5"]');
}
async function reception(page,q='A3'){
 await page.locator(`[data-act^="rec|"][data-act$="|${q}"]`).first().tap();taps++;
}
async function defense(page){await page.locator('[data-act^="ed|"][data-act$="|D3"]').first().tap();taps++}
async function opponentAttack(page,result='DEFENSE'){
 await act(page,'ob2|SET');await act(page,'os|IV');await act(page,`of|${result}`);
}
test.beforeEach(async({page})=>{
 taps=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));page.qaErrors=errors;
 // Fresh Playwright context per test; allow only the local synthetic app.
 await page.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
});
test.afterEach(async({page},info)=>{
 expect(page.qaErrors).toEqual([]);
 await info.attach('touch-inputs',{body:JSON.stringify({taps,setupExcluded:true,viewport:'820x1180',touch:true}),contentType:'application/json'});
});
for(let r=1;r<=6;r++){
 test(`R${r} K1 Angriffspunkt + Zielzone + Undo`,async({page})=>{
  await setup(page,r);const before=await state(page);await reception(page);await attack(page);
  const s=await state(page);expect(s.e).toBe(1);expect(s.rot).toBe(r%6+1);expect(s.rallies[0].phase).toBe('K1');expect(s.marks).toHaveLength(1);expect(taps).toBe(6);
  await tap(page,'#undo');expect(await state(page)).toEqual(before);
 });
 test(`R${r} K2 Aufschlag und Blockpunkt`,async({page})=>{
  await setup(page,r,true);await act(page,'serve|IN');await act(page,'or|#21|A3');await opponentAttack(page,'BLOCK');
  await page.locator('[data-act^="ebc|"]').first().tap();taps++;await act(page,'ebr|POINT');
  const s=await state(page);expect(s.e).toBe(1);expect(s.rot).toBe(r);expect(s.rallies[0].phase).toBe('K2');expect(taps).toBe(7);
 });
 test(`R${r} lange Rallye mit zwei Transitions`,async({page})=>{
  await setup(page,r);await reception(page);await attack(page,'CONTINUE');expect((await state(page)).e).toBe(0);
  for(let i=0;i<2;i++){
   await act(page,'od|D3');await opponentAttack(page);await defense(page);await attack(page,i===0?'CONTINUE':'KILL');
   if(i===0)expect((await state(page)).rallies).toHaveLength(0);
  }
  const s=await state(page);expect(s.rallies).toHaveLength(1);expect(s.e).toBe(1);const chain=s.rallies[0].chain;
  expect(chain.filter(x=>x.type==='Attack'&&x.side==='EVV')).toHaveLength(3);expect(chain.filter(x=>x.type==='Defense'&&x.side==='EVV')).toHaveLength(2);expect(s.rallies[0].phase).toBe('K1');expect(taps).toBe(24);
 });
 test(`R${r} A0 und D0 beider Seiten`,async({page})=>{
  await setup(page,r);await reception(page,'A0');expect((await state(page)).o).toBe(1);
  await reception(page);await attack(page,'CONTINUE');await act(page,'od|D0');expect((await state(page)).e).toBe(1);
  await act(page,'serve|IN');await act(page,'or|#21|A0');expect((await state(page)).e).toBe(2);
  await act(page,'serve|IN');await act(page,'or|#21|A3');await opponentAttack(page);await page.locator('[data-act^="ed|"][data-act$="|D0"]').first().tap();taps++;
  const s=await state(page);expect(s.o).toBe(2);expect(s.rallies).toHaveLength(4);expect(s.rallies.at(-1).chain.at(-1).quality).toBe('D0');
 });
 test(`R${r} Spielerwechsel und Rückwechsel`,async({page})=>{
  await setup(page,r);await tap(page,'#substitute');await page.locator('#subOut').selectOption('michael');await page.locator('#subIn').selectOption('lion');await tap(page,'#doSub');
  expect((await state(page)).lineup).toContain('lion');expect((await state(page)).roles.lion).toBe('AA1');
  await tap(page,'#substitute');await page.locator('#subOut').selectOption('lion');await page.locator('#subIn').selectOption('michael');await tap(page,'#doSub');
  expect((await state(page)).subCount).toBe(2);expect((await state(page)).events.at(-1).return).toBe(true);
 });
 test(`R${r} Satzwechsel, Archiv und Reload`,async({page})=>{
  await setup(page,r); // Accelerated scoring uses production action API; set transition uses real UI.
  await page.evaluate(()=>{for(let i=0;i<25;i++)EVV_QS_TEST.action('quick|EVV')});
  const old=await state(page);expect(old.setEnded).toBe(true);
  await tap(page,'#prep');await page.locator('#nsRot').selectOption(String(r));await tap(page,'#nsRec');
  const s=await state(page);expect(s.set).toBe(2);expect(s.e+s.o).toBe(0);expect(s.sets[0].rallies).toHaveLength(25);expect(s.rallies).toHaveLength(0);expect(s.subCount).toBe(0);
  await page.reload();expect(await state(page)).toEqual(s);
 });
}
