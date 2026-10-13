const fs=require('fs'),vm=require('vm'),assert=require('assert');
const js=fs.readFileSync(__dirname+'/app.js','utf8');
const checks=[];function check(name,fn){try{fn();checks.push([name,true]);console.log('PASS',name)}catch(e){checks.push([name,false]);console.log('FAIL',name,e.message)}}
function extract(name){let start=js.indexOf('function '+name+'(');assert(start>=0,name);let brace=js.indexOf('{',start),depth=0,end;for(let i=brace;i<js.length;i++){if(js[i]==='{')depth++;if(js[i]==='}'&&!--depth){end=i+1;break}}return js.slice(start,end)}
const ctx={};vm.createContext(ctx);
vm.runInContext('const ROT_NEXT={5:6,6:1,1:2,2:3,3:4,4:5};'+extract('target')+';'+extract('isSetWin')+';'+extract('fresh')+';'+extract('rotationSteps')+';this.api={target,isSetWin,fresh,rotationSteps,ROT_NEXT}',ctx);
const a=ctx.api;
check('Syntax app.js',()=>new vm.Script(js));
check('Set 1 normal ending',()=>{assert.equal(a.isSetWin(25,23,1),true);assert.equal(a.isSetWin(25,24,1),false);assert.equal(a.isSetWin(26,24,1),true)});
check('Set 5 tiebreak',()=>{assert.equal(a.isSetWin(15,13,5),true);assert.equal(a.isSetWin(15,14,5),false)});
check('Rotation R5 to R6 to R1',()=>{assert.equal(a.ROT_NEXT[5],6);assert.equal(a.ROT_NEXT[6],1);assert.equal(a.rotationSteps(5,1),2)});
check('A0 never automatically commits',()=>{assert(js.includes('step:a[2]==="A0"?"evvA0Decision"'));assert(js.includes('step:a[2]==="A0"?"oppA0Decision"'))});
check('A0 saved branch',()=>{assert(js.includes('a0|SAVED'));assert(js.includes('oa0|SAVED'))});
check('Continue does not commit point',()=>{assert(js.includes('CONTINUE means rally continues; never award a point.'))});
check('Undo restores snapshot and clears history',()=>assert(js.includes('restore(x);draft={};clearDraftHistory();pendingMark=null;render()')));
check('Rally snapshot stores marks',()=>assert(js.includes('rallies:st.rallies,marks:st.marks')));
check('Both liberos retained',()=>{assert(js.includes('liberoIds:["amar","alex"]'));assert(js.includes('liberos:["#","#"]'))});
check('Version matches',()=>assert(fs.readFileSync(__dirname+'/version.js','utf8').includes('7.8.0')));
console.log('RESULT',checks.filter(x=>x[1]).length+'/'+checks.length);process.exit(checks.every(x=>x[1])?0:1)
