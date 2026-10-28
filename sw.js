importScripts('./version.js');
const PREFIX='evv-quickscout-v';
const CACHE=PREFIX+String(globalThis.EVV_VERSION||'7.19.0').replaceAll('.','-')+'-practice-2';
const CORE=['./','./index.html','./styles.css','./version.js','./app.js','./compact.js','./manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;
 e.respondWith(fetch(e.request).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)))}return r}).catch(async()=>{
 const c=await caches.open(CACHE),hit=await c.match(e.request,{ignoreSearch:true});
 return hit||(e.request.mode==='navigate'?await c.match('./index.html'):Response.error());
 }));
});
