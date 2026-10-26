// Execute unchanged historical scripts against current sources in an isolated copy.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'evv-legacy-'));
try{for(const file of ['app.js','index.html','styles.css','sw.js','version.js'])fs.copyFileSync(path.join(root,file),path.join(dir,file));const results=[];
for(const file of fs.readdirSync(__dirname).filter(f=>/^LOOPTEST.*py$|^TEST_.*js$/.test(f)).concat('TEST_V792_ROLLEN.js')){fs.copyFileSync(path.join(file==='TEST_V792_ROLLEN.js'?root:__dirname,file),path.join(dir,file));const r=spawnSync(file.endsWith('.py')?'python3':process.execPath,[file],{cwd:dir,encoding:'utf8'});results.push({file,exitCode:r.status,output:(r.stdout+r.stderr).replaceAll(dir,'<isolated-legacy>')})}
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/legacy-audit.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
// Historical incompatibilities remain failures, deliberately not part of the app release gate.
process.exitCode=results.some(x=>x.exitCode!==0)?1:0;
}finally{fs.rmSync(dir,{recursive:true,force:true})}
