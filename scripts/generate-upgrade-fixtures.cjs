// Explicit fixture regeneration only; normal test runs need no Git history/network.
const {execFileSync}=require('node:child_process');
const {JSDOM}=require('jsdom');
const fs=require('node:fs');
const crypto=require('node:crypto');
for(const [label,ref] of [['v7.9.2','d10c1b5'],['pre-pr-main','f6b316b']]){
 const commit=execFileSync('git',['rev-parse',ref],{encoding:'utf8'}).trim();
 const read=name=>execFileSync('git',['show',`${commit}:${name}`],{encoding:'utf8'});
 const dom=new JSDOM(read('index.html'),{url:'http://127.0.0.1:4173',runScripts:'outside-only'}),w=dom.window;
 try{
 const source=read('app.js');w.eval(read('version.js'));w.eval(source);
 w.document.getElementById('oppName').value='QA SYNTHETISCH';
 for(let i=1;i<=4;i++)w.document.getElementById(`oppR${i}`).value=String(20+i);
 w.document.getElementById('startRotation').value='R5';w.document.getElementById('startReceive').click();
 const a=w.EVV_QS_TEST;
 for(let i=0;i<25;i++)a.action('quick|EVV');
 w.document.getElementById('nextSet').click();w.document.getElementById('nsRot').value='2';w.document.getElementById('nsRec').click();
 a.applySub('michael','lion');a.action('quick|EVV');a.action('serve|ACE');w.document.querySelector('[data-zone="5"]').click();a.action('serve|ERR');
 const payload=JSON.parse(w.localStorage.getItem('evvQuickScoutV77'));
 fs.writeFileSync(`tests/fixtures/${label}-storage.json`,JSON.stringify({provenance:{commit,version:a.version,appSha256:crypto.createHash('sha256').update(source).digest('hex'),synthetic:true},payload},null,2)+'\n');
 }finally{w.close()}
}
