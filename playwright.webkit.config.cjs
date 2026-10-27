// Focused WebKit coverage; run release.spec.cjs and hybrid.spec.cjs with this config.
const path=require('node:path');
const {defineConfig,webkit}=require('@playwright/test');
const base=require('./playwright.config.cjs');
let launchOptions={};
if(process.env.EVV_BROWSER_LIBS){
 const mini=path.join(path.dirname(webkit.executablePath()),'minibrowser-wpe');
 launchOptions={executablePath:path.join(mini,'bin/MiniBrowser'),env:{...process.env,WEBKIT_EXEC_PATH:path.join(mini,'bin'),WEBKIT_INJECTED_BUNDLE_PATH:path.join(mini,'lib'),WEBKIT_INSPECTOR_RESOURCES_PATH:path.join(mini,'share'),LD_LIBRARY_PATH:[process.env.EVV_BROWSER_LIBS,path.join(mini,'lib'),path.join(mini,'sys/lib')].join(':')}};
}
module.exports=defineConfig({...base,workers:1,reporter:[['list'],['json',{outputFile:'artifacts/webkit-focused.json'}]],use:{...base.use,browserName:'webkit',launchOptions}});
