const fs=require('fs'),vm=require('vm'),assert=require('assert');
const code=fs.readFileSync(__dirname+'/app.js','utf8');
function extract(n){let a=code.indexOf('function '+n+'('),b=code.indexOf('{',a),depth=0;assert(a>=0);for(let i=b;i<code.length;i++){if(code[i]==='{')depth++;else if(code[i]==='}'&&!--depth)return code.slice(a,i+1)}}
const starters=['johann','michael','dirk','jonas','felix','jens'];
const st={started:true,setEnded:false,lineup:[...starters],set:3,e:5,o:2,subCount:0,subPairs:{},subUsed:[],events:[],receiveIds:[],setStart:{lineup:[...starters]}};
const roster=[...starters,'janik','maksym'].map(id=>({id,role:'AA'}));
const ctx={st,roster,view:'live',draft:{},byId:id=>roster.find(p=>p.id===id),nm:id=>id,toast:()=>{},render:()=>{}};vm.createContext(ctx);vm.runInContext(extract('validateSub')+'\n'+extract('applySub'),ctx);
assert.equal(ctx.applySub('dirk','janik'),true);assert(st.lineup.includes('janik'));assert(!st.lineup.includes('dirk'));
assert.equal(ctx.validateSub('maksym','janik')!==null,true);
assert.equal(ctx.applySub('janik','dirk'),true);assert(st.lineup.includes('dirk'));
assert(ctx.validateSub('dirk','janik'));assert.equal(st.subCount,2);assert.equal(st.events.length,2);assert.equal(st.events[1].return,true);
assert.equal(ctx.applySub('felix','maksym'),true);assert.equal(ctx.applySub('maksym','felix'),true);assert(ctx.validateSub('dirk','maksym'));
console.log('PASS Wechsel: Einwechselung, Rückwechsel, Wiedereintritt gesperrt, Paarbindung, Ereignisprotokoll');
