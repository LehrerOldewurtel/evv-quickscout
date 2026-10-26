const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'./tests/e2e',workers:2,retries:0,timeout:30000,
 reporter:[['list'],['json',{outputFile:'artifacts/playwright.json'}]],
 use:{baseURL:'http://127.0.0.1:4173',browserName:'chromium',viewport:{width:820,height:1180},hasTouch:true,trace:'retain-on-failure',launchOptions:{executablePath:process.env.CHROMIUM_PATH||(process.env.CI?undefined:'/usr/bin/chromium'),args:['--no-sandbox']}},
 webServer:{command:'npm start',url:'http://127.0.0.1:4173',reuseExistingServer:false}
});
