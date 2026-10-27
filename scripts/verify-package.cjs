// Verify the actual ZIP, extract to a fresh directory and launch its own starter.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const {chromium}=require('@playwright/test');
const zip=path.resolve(process.argv[2]||'artifacts/EVV-QuickScout-V8-RC.zip');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'evv-verify-zip-'));
const root=path.join(tmp,'EVV-QuickScout-V8-RC');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const assert=(ok,message)=>{if(!ok)throw Error(message)};
let server,browser,stdout='',stderr='';
(async()=>{
 assert(fs.statSync(zip).size>0,'ZIP missing/empty');
 execFileSync('python3',['-m','zipfile','-e',zip,tmp]);
 const required=['index.html','app.js','compact.js','styles.css','version.js','sw.js','manifest.webmanifest','TEST_START.py','ANLEITUNG.txt','BUILD.json','TESTBERICHT.md','TESTBERICHT.json','KNOWN_LIMITATIONS.txt','CHECKSUMS.sha256','RELEASE_ABNAHME.md'];
 for(const file of required)assert(fs.statSync(path.join(root,file)).isFile(),`Missing ${file}`);
 const verify=()=>{for(const row of fs.readFileSync(path.join(root,'CHECKSUMS.sha256'),'utf8').trim().split('\n')){const [expected,file]=row.split('  ');assert(file&&!file.includes('/')&&!file.includes('..'),'Unsafe manifest path');assert(hash(path.join(root,file))===expected,'Checksum mismatch '+file)}};
 verify();
 server=spawn('python3',['TEST_START.py','--port','0'],{cwd:root,stdio:['ignore','pipe','pipe']});
 server.stdout.on('data',c=>stdout+=c);server.stderr.on('data',c=>stderr+=c);
 const origin=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Starter timeout: '+stderr)),15000);server.on('error',reject);server.on('exit',code=>{clearTimeout(timeout);reject(Error('Starter exited '+code+': '+stderr))});const read=c=>{const m=stdout.match(/Mac: (http:\/\/127\.0\.0\.1:\d+\/)/);if(m){clearTimeout(timeout);server.stdout.removeListener('data',read);resolve(m[1])}};server.stdout.on('data',read)});
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(process.env.CI?undefined:'/usr/bin/chromium'),args:['--no-sandbox']});
 const contexts=[];
 for(const width of [390,820,1440]){
  const context=await browser.newContext({viewport:{width,height:1180},hasTouch:true});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>localStorage.setItem('evvQuickScoutV77','synthetic-production-sentinel'));
  assert((await page.goto(origin)).status()===200,'HTTP readiness');
  assert(await page.getByText('V8 RELEASE-KANDIDAT · TESTBETRIEB',{exact:false}).isVisible(),'Test banner missing');
  for(const file of required.slice(0,7))assert((await page.request.get(origin+file)).status()===200,'Asset '+file);
  assert((await page.request.get(origin+'BUILD.json')).status()===404,'Private file exposed');
  await page.locator('#oppName').fill('TEST ZIP '+width);await page.locator('#startReceive').tap();await page.locator('#modeQuick').tap();
  assert(await page.locator('[data-quick-player]').count()===6,'Six players');
  await page.locator('#quickTransition').tap();await page.locator('[data-quick="kill"]').tap();await page.locator('[data-quick-player]:not([disabled])').first().tap();
  const scored=await page.evaluate(()=>EVV_QS_TEST.state());assert(scored.e===1&&scored.rot===2,'Point/rotation');assert(scored.rallies[0].turnaround.attacks===1&&scored.rallies[0].turnaround.transitions===1,'Turnaround');
  await page.locator('#modeDetail').tap();assert(await page.locator('#modeDetail').getAttribute('aria-pressed')==='true','Detail mode');
  await page.locator('#formationEditor').tap();assert(await page.locator('[data-form-slot]').count()===6,'Tactics');await page.locator('#formRotation').selectOption('2');await page.locator('#formSave').tap();await page.locator('#formClose').tap();
  await page.locator('#turnaroundReport').tap();assert((await page.locator('#analysisResults').innerText()).includes('Transition-Chancen 1'),'Analysis');await page.locator('#analysisClose').tap();
  await page.locator('[data-tab="stats"]').tap();assert((await page.locator('#flow').innerText()).length>100,'Statistics');await page.reload();
  const persisted=await page.evaluate(()=>({s:EVV_QS_TEST.state(),prod:localStorage.getItem('evvQuickScoutV77'),test:localStorage.getItem('evvQuickScout_FINAL_RC_TEST')}));assert(persisted.s.e===1&&persisted.test&&persisted.prod==='synthetic-production-sentinel','Storage isolation/persistence');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}))});
  const keys=await page.evaluate(()=>caches.keys());assert(keys.some(k=>k.startsWith('evv-quickscout-final-rc-test-v')),'Cache isolation');
  await context.setOffline(true);await page.reload();assert((await page.evaluate(()=>EVV_QS_TEST.state())).e===1,'Offline persistence');
  assert(errors.length===0,JSON.stringify(errors));contexts.push({width,passed:true,checks:['quick','detail','tactics','analysis','statistics','test storage','service worker','offline reload','checksums']});await context.close();
 }
 verify();
 const result={generatedAt:new Date().toISOString(),zip,sha256:hash(zip),extractedTo:root,requiredFiles:required.length,manifestFiles:fs.readFileSync(path.join(root,'CHECKSUMS.sha256'),'utf8').trim().split('\n').length,contexts,passed:true};
 fs.writeFileSync(zip.replace(/\.zip$/,'.verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();if(server&&server.exitCode===null){server.kill('SIGTERM');await new Promise(r=>server.once('exit',r))}fs.rmSync(tmp,{recursive:true,force:true})});
