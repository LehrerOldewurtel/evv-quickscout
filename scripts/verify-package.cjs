// Verify the actual ZIP, extract to a fresh directory and launch its own starter.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
const {spawn,execFileSync}=require('node:child_process');
const engines=require('@playwright/test');
const browserNames=(process.env.EVV_QA_BROWSERS||'chromium').split(',');
const zip=path.resolve(process.argv[2]||'artifacts/EVV-QuickScout-V8-RC.zip');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'evv-verify-zip-'));
const root=path.join(tmp,'EVV-QuickScout-V8-RC');
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const assert=(ok,message)=>{if(!ok)throw Error(message)};
let server,browser;
async function startServer(){
 let output='',errors='';server=spawn('python3',['TEST_START.py','--port','0'],{cwd:root,stdio:['ignore','pipe','pipe']});
 server.stderr.on('data',c=>errors+=c);
 return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Starter timeout: '+errors)),15000);server.on('error',reject);server.on('exit',code=>{clearTimeout(timeout);reject(Error('Starter exited '+code+': '+errors))});const read=c=>{output+=c;const m=output.match(/Mac: (http:\/\/127\.0\.0\.1:\d+\/)/);if(m){clearTimeout(timeout);server.stdout.removeListener('data',read);resolve(m[1])}};server.stdout.on('data',read)});
}
async function stopServer(){if(server){const child=server;server=null;if(child.exitCode===null&&child.signalCode===null){child.kill('SIGTERM');await new Promise(r=>child.once('exit',r))}}}
(async()=>{
 assert(fs.statSync(zip).size>0,'ZIP missing/empty');
 execFileSync('python3',['-m','zipfile','-e',zip,tmp]);
 const required=['index.html','app.js','compact.js','styles.css','version.js','sw.js','manifest.webmanifest','TEST_START.py','ANLEITUNG.txt','BUILD.json','TESTBERICHT.md','TESTBERICHT.json','KNOWN_LIMITATIONS.txt','CHECKSUMS.sha256','RELEASE_ABNAHME.md'];
 for(const file of required)assert(fs.statSync(path.join(root,file)).isFile(),`Missing ${file}`);
 const verify=()=>{for(const row of fs.readFileSync(path.join(root,'CHECKSUMS.sha256'),'utf8').trim().split('\n')){const [expected,file]=row.split('  ');assert(file&&!file.includes('/')&&!file.includes('..'),'Unsafe manifest path');assert(hash(path.join(root,file))===expected,'Checksum mismatch '+file)}};
 verify();
 let origin=await startServer();
 const contexts=[];
 for(const browserName of browserNames){
 assert(['chromium','firefox','webkit'].includes(browserName),'Unknown engine '+browserName);
 let options=browserName==='chromium'?{executablePath:process.env.CHROMIUM_PATH||(process.env.CI?undefined:'/usr/bin/chromium'),args:['--no-sandbox']}:{};
 if(browserName==='webkit'&&process.env.EVV_BROWSER_LIBS){
 // Supported executablePath/env override preserves the official binary and
 // supplies verified rootless OS libraries. The vendor wrapper replaces LD_LIBRARY_PATH.
 const mini=path.join(path.dirname(engines.webkit.executablePath()),'minibrowser-wpe');
 options={executablePath:path.join(mini,'bin/MiniBrowser'),env:{...process.env,WEBKIT_EXEC_PATH:path.join(mini,'bin'),WEBKIT_INJECTED_BUNDLE_PATH:path.join(mini,'lib'),WEBKIT_INSPECTOR_RESOURCES_PATH:path.join(mini,'share'),LD_LIBRARY_PATH:[process.env.EVV_BROWSER_LIBS,path.join(mini,'lib'),path.join(mini,'sys/lib')].join(':')}};
 }
 browser=await engines[browserName].launch({...options,timeout:20000});
 const inputMethod=browserName==='firefox'?'click':'tap';
 for(const [width,height] of [[390,1180],[820,1180],[1024,768],[1440,1180]]){
  if(!server)origin=await startServer();
  const context=await browser.newContext({viewport:{width,height},hasTouch:browserName!=='firefox'});const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  if(process.env.EVV_DEBUG_TOUCH)await page.addInitScript(()=>{window.evvEvents=[];for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>window.evvEvents.push({type,id:e.target.id,button:e.target.closest('button')?.id,pointer:e.pointerType,detail:e.detail,modal:document.querySelector('#modalBox h2')?.textContent}),true)});
  await page.addInitScript(()=>localStorage.setItem('evvQuickScoutV77','synthetic-production-sentinel'));
  assert((await page.goto(origin)).status()===200,'HTTP readiness');
  assert(await page.getByText('V8 RELEASE-KANDIDAT · TESTBETRIEB',{exact:false}).isVisible(),'Test banner missing');
  for(const file of required.slice(0,7))assert((await page.request.get(origin+file)).status()===200,'Asset '+file);
  assert((await page.request.get(origin+'BUILD.json')).status()===404,'Private file exposed');
  await page.locator('#oppName').fill('TEST ZIP '+width);await page.locator('#startReceive')[inputMethod]();await page.locator('#modeQuick')[inputMethod]();
  assert(await page.locator('[data-quick-player]').count()===6,'Six players');
  await page.locator('#quickTransition')[inputMethod]();await page.locator('[data-quick-player]:not([disabled])').first()[inputMethod]();
  if(width>=768){await page.evaluate(()=>scrollTo(0,0));const dock=await page.locator('.bottom').boundingBox();for(const selector of ['[data-quick]','[data-quick-player]','#quickTransition','#quickUndo'])for(const el of await page.locator(selector).all()){const box=await el.boundingBox();assert(box.y>=0&&box.y+box.height<=dock.y,`Packaged action clipped at ${width}x${height}: ${selector}`)}}
  await page.locator('[data-quick="kill"]')[inputMethod]();
  const scored=await page.evaluate(()=>EVV_QS_TEST.state());assert(scored.e===1&&scored.rot===2,'Point/rotation');assert(scored.rallies[0].turnaround.attacks===1&&scored.rallies[0].turnaround.transitions===1,'Turnaround');
  await page.locator('#modeDetail')[inputMethod]();assert(await page.locator('#modeDetail').getAttribute('aria-pressed')==='true','Detail mode');
  await page.locator('#formationEditor')[inputMethod]();assert(await page.locator('[data-form-slot]').count()===6,'Tactics');await page.locator('#formRotation').selectOption('2');await page.locator('#formSave')[inputMethod]();await page.locator('#formClose')[inputMethod]();
  if(process.env.EVV_DEBUG_TOUCH)console.log(JSON.stringify({browserName,width,modal:await page.locator('#modal').getAttribute('class'),events:await page.evaluate(()=>window.evvEvents)}));
  await page.locator('#turnaroundReport')[inputMethod]();assert((await page.locator('#analysisResults').innerText()).includes('Transition-Chancen 1'),'Analysis');await page.locator('#analysisClose')[inputMethod]();
  await page.locator('[data-tab="stats"]')[inputMethod]();assert((await page.locator('#flow').innerText()).length>100,'Statistics');await page.reload();
  const persisted=await page.evaluate(()=>({s:EVV_QS_TEST.state(),prod:localStorage.getItem('evvQuickScoutV77'),test:localStorage.getItem('evvQuickScout_FINAL_RC_TEST')}));assert(persisted.s.e===1&&persisted.test&&persisted.prod==='synthetic-production-sentinel','Storage isolation/persistence');
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}))});
  const keys=await page.evaluate(()=>caches.keys());assert(keys.some(k=>k.startsWith('evv-quickscout-final-rc-test-v')),'Cache isolation');
  if(browserName==='webkit')await stopServer();else await context.setOffline(true);await page.reload();assert((await page.evaluate(()=>EVV_QS_TEST.state())).e===1,'Offline persistence');
  assert(errors.length===0,JSON.stringify(errors));contexts.push({browser:browserName,inputMethod,offlineMethod:browserName==='webkit'?'actual server termination':'Playwright offline switch',width,height,passed:true,checks:['quick','detail','tactics','analysis','statistics','test storage','service worker','offline reload','checksums']});await context.close();
 }
 await browser.close();browser=null;
 }
 verify();
 const result={generatedAt:new Date().toISOString(),zip,sha256:hash(zip),extractedTo:root,requiredFiles:required.length,manifestFiles:fs.readFileSync(path.join(root,'CHECKSUMS.sha256'),'utf8').trim().split('\n').length,contexts,passed:true};
 fs.writeFileSync(zip.replace(/\.zip$/,'.verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{await browser?.close();await stopServer();fs.rmSync(tmp,{recursive:true,force:true})});
