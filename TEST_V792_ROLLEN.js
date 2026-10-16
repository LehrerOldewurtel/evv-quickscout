const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(__dirname+'/app.js','utf8');
function extract(n){let a=code.indexOf('function '+n+'('),b=code.indexOf('{',a),d=0;assert(a>=0,n);for(let i=b;i<code.length;i++){if(code[i]==='{')d++;else if(code[i]==='}'&&!--d)return code.slice(a,i+1)}}
const names=['johann','michael','janik','jonas','maksym','dirk'];
const roster=[...names,'jens','felix','amar'].map(id=>({id,role:id==='amar'?'L':id==='johann'?'Z':id==='janik'||id==='dirk'?'MB1':'AA1'}));
let st={lineup:names,roles:{johann:'Z',michael:'AA2',janik:'MB1',jonas:'D',maksym:'AA1',dirk:'MB2'},rot:1,setStart:{rot:1},liberoActive:false,liberoIds:['amar']};
let values={};names.forEach((id,i)=>{values['xP'+i]={value:id};values['xR'+i]={value:st.roles[id]}});
const ctx={ROLES:["Z","D","AA1","AA2","MB1","MB2"],st,roster,$:id=>values[id],byId:id=>roster.find(x=>x.id===id),toast:()=>{},esc:x=>x,ROT_NEXT:{5:6,6:1,1:2,2:3,3:4,4:5}};
vm.createContext(ctx);
vm.runInContext(['roleOf','roleOptions','lineupEditor','readLineupEditor','rotationSteps','courtPos','roleBaseRoute','attackRoutesFor','liberoEligible'].map(extract).join('\n'),ctx);
assert.equal(ctx.roleOf('michael'),'AA2');assert.equal(ctx.roleBaseRoute('michael'),'IV');assert.equal(ctx.roleBaseRoute('jonas'),'II');
assert.equal(ctx.readLineupEditor('x').roles.michael,'AA2');
values.xR1.value='AA1';assert.equal(ctx.readLineupEditor('x'),null,'doppelte Rolle muss abgelehnt werden');values.xR1.value='AA2';
values.xP1.value='johann';assert.equal(ctx.readLineupEditor('x'),null,'doppelter Spieler muss abgelehnt werden');values.xP1.value='michael';
assert.equal(ctx.courtPos('johann'),1);
st.liberoActive=true;st.liberoOnCourt='amar';st.liberoReplacedId='dirk';assert.equal(ctx.liberoEligible(),true,'MB2 hinten erlaubt');
st.liberoReplacedId='michael';assert.equal(ctx.liberoEligible(),false,'AA darf nicht als MB gelten');
console.log('PASS V7.9.2 Rollen: freie Rollen, Doppelprüfung, Angriffsweg, Libero-MB');
