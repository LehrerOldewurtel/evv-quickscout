const {test}=require('node:test');
const assert=require('node:assert/strict');
const {app}=require('./harness.cjs');
const copy=x=>JSON.parse(JSON.stringify(x));

test('Import prüft verschachtelte Undo-Historie vor Mutation und bewahrt Rohdaten',()=>{
 const h=app();
 try {
  h.qa.reset();h.api.action('quick|EVV');
  const saved=JSON.parse(h.w.localStorage.getItem('evvQuickScoutV77'));
  const original=copy(h.api.state());
  for(const patch of [{rallyUndo:null},{rallies:null},{events:null},{marks:[null]},{rot:99},{serving:'false'},{roles:{johann:'invalid'}},{lineup:Array(6).fill('johann')}]) {
   const bad=copy(saved);Object.assign(bad.st.rallyUndo[0],patch);
   assert.throws(()=>h.api.validateMatch(bad.st),JSON.stringify(patch));
   assert.deepEqual(copy(h.api.state()),original);
   const raw=JSON.stringify(bad),n=app({storage:raw});
   try {assert(n.w.document.getElementById('storageWarning'));assert.equal(n.w.localStorage.getItem('evvQuickScoutV77'),raw)}finally{n.close()}
  }
 }finally{h.close()}
});
