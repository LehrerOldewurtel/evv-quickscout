const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
function app({render=true,storage}={}) {
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'http://127.0.0.1:4173',runScripts:'outside-only'});
 if(storage)dom.window.localStorage.setItem('evvQuickScoutV77',typeof storage==='string'?storage:JSON.stringify(storage));
 dom.window.eval(fs.readFileSync(path.join(root,'version.js'),'utf8'));
 // Test-only instrumentation of the complete source. No copied game functions.
 const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
 const extra=`
 window.QA={reset:(serv=false,rot=1)=>{st=fresh();draft={};draftHistory=[];pendingMark=null;tab='rally';view='live';st.started=true;st.rot=rot;st.serving=serv;st.setStart={rot,serving:serv,lineup:clone(st.lineup),roles:clone(st.roles)};syncLiberoRotation()},persist:saveLocal,stats:statRowsFrom,rotationStats,parseVoice,executeVoice,attackContext,disableRender:()=>{render=()=>{}},render:()=>render()};
 `;
 dom.window.eval(source.replace(/\}\)\(\);\s*$/,extra+'})();'));
 if(!render)dom.window.QA.disableRender();
 return {dom,w:dom.window,api:dom.window.EVV_QS_TEST,qa:dom.window.QA,close:()=>dom.window.close()};
}
module.exports={app};
