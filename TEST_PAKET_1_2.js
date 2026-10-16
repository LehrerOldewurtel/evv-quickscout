const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(__dirname+'/app.js','utf8');
const names=['fresh','rotationSteps','courtPos','playerAtPos','rotationMatrix','liberoEligible','active','front','attackContext','attackRoutesFor','attackOptions','attackers','roleBaseRoute','target','isSetWin'];
function extract(n){let a=code.indexOf('function '+n+'(');assert(a>=0,n);let b=code.indexOf('{',a),d=0;for(let i=b;i<code.length;i++){if(code[i]==='{')d++;else if(code[i]==='}'&&!--d)return code.slice(a,i+1)}throw Error(n)}
const prefix=code.slice(code.indexOf('const ROT_NEXT='),code.indexOf('let opponent='));
const ctx={};vm.createContext(ctx);
vm.runInContext(prefix+';const clone=x=>JSON.parse(JSON.stringify(x));let st;let draft={};'+names.map(extract).join('\n')+';st=fresh();this.api={set:(x)=>{st=x},fresh,rotationMatrix,front,attackOptions,liberoEligible,courtPos,isSetWin,ROT_NEXT};',ctx);
const a=ctx.api,results=[];
function test(name,fn){try{fn();results.push(true);console.log('PASS',name)}catch(e){results.push(false);console.error('FAIL',name,e.message)}}
test('JS syntax',()=>new vm.Script(code));
test('Set ending 25 / 15',()=>{assert(a.isSetWin(25,23,1));assert(!a.isSetWin(25,24,1));assert(a.isSetWin(15,13,5));assert(!a.isSetWin(15,14,5))});
test('Rotation sequence',()=>{assert.equal(a.ROT_NEXT[5],6);assert.equal(a.ROT_NEXT[6],1)});
test('Six unique positions for all rotations',()=>{for(let r=1;r<=6;r++){let st=a.fresh();st.rot=r;st.setStart={rot:5};a.set(st);let m=a.rotationMatrix();assert.equal(m.length,6);assert.equal(new Set(m.map(x=>x.player)).size,6);assert.equal(m.filter(x=>x.row==='front').length,3)}});
test('Front P2 P3 P4 exactly',()=>{let st=a.fresh();st.setStart={rot:1};a.set(st);assert.equal(a.front().length,3);assert(a.front().every(x=>[2,3,4].includes(a.courtPos(x))))});
test('No setter or libero normal attack',()=>{let st=a.fresh();st.setStart={rot:1};a.set(st);assert(!a.attackOptions().some(x=>['johann','amar','alex'].includes(x.id)))});
test('Libero rejects front-row MB',()=>{let st=a.fresh();st.setStart={rot:1};st.liberoOnCourt='amar';st.liberoReplacedId='janik';a.set(st);assert.equal(a.liberoEligible(),false)});
test('Libero accepts back-row MB',()=>{let st=a.fresh();st.setStart={rot:1};st.liberoOnCourt='amar';st.liberoReplacedId='dirk';a.set(st);assert.equal(a.liberoEligible(),true)});
test('Attack click checks allowed lane',()=>assert(code.includes('attackOptions().some(x=>x.id===a[1]&&x.zone===a[2])')));
test('A0 direct point',()=>assert(code.includes('if(a[2]==="A0")return commit("Gegner"')&&code.includes('if(a[2]==="A0")return commit("EVV"')));
test('Undo includes marks',()=>assert(code.includes('rallies:st.rallies,marks:st.marks')));
test('Two liberos both teams',()=>assert(code.includes('liberoIds:["amar","alex"]')&&code.includes('liberos:["#","#"]')));
test('Single version',()=>assert(fs.readFileSync(__dirname+'/version.js','utf8').includes(globalThis.__V||'7.9.2')));
console.log(`RESULT ${results.filter(Boolean).length}/${results.length}`);process.exit(results.every(Boolean)?0:1);
