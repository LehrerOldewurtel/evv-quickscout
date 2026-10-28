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

test('Touch-Schließen aktiviert keine darunterliegende Punktkorrektur',()=>{
 const h=app();try{
  h.qa.reset();h.api.formationEditor();const doc=h.w.document,button=doc.getElementById('formClose'),modal=doc.getElementById('modal');
  const event=new h.w.Event('pointerup',{bubbles:true,cancelable:true});Object.defineProperty(event,'pointerType',{value:'touch'});// JSDOM does not dispatch the onpointerup IDL property; invoke the registered handler.
  button.onpointerup?.(event);
  // WebKit retargets the subsequent compatibility click if pointerup hid the
  // original target. The control below it must never receive this one gesture.
  (modal.classList.contains('hidden')?doc.getElementById('scoreFix'):button).dispatchEvent(new h.w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));
  assert(modal.classList.contains('hidden'),'One close gesture must leave the dialog closed');assert.equal(h.api.state().e,0);
 }finally{h.close()}
});

test('Touch-Speichern nach Drag: kein verlorener oder doppelter Save; nächste Eingabe bleibt frei',()=>{
 const h=app();try{
  h.qa.reset();h.api.formationEditor();const doc=h.w.document,b=doc.getElementById('formSave');let writes=0;
  const set=h.w.Storage.prototype.setItem;h.w.Storage.prototype.setItem=function(...args){writes++;return set.apply(this,args)};
  const touch=new h.w.Event('pointerup',{bubbles:true,cancelable:true});Object.defineProperty(touch,'pointerType',{value:'touch'});b.onpointerup?.(touch);
  assert.equal(writes,1,'Pointer completion must save even if the browser omits click after drag');
  b.dispatchEvent(new h.w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));assert.equal(writes,1,'Compatibility click is the same gesture');
  b.click();assert.equal(writes,2,'Keyboard/programmatic activation must work immediately');
  const down=new h.w.Event('pointerdown',{bubbles:true});b.dispatchEvent(down);b.dispatchEvent(new h.w.MouseEvent('click',{bubbles:true,cancelable:true,detail:1}));
  assert.equal(writes,3,'A new physical input must not be blocked');
 }finally{h.close()}
});
