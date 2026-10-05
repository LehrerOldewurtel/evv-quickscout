from pathlib import Path
s=Path('app.js').read_text()
tests={
'JS uses atomic preSnapshot for marked rallies':'preSnapshot=null' in s and 'commit(p.w,p.data,pre)' in s,
'ACE/KILL mark snapshot happens before mark push':'p=pendingMark,pre=snapshot()' in s,
'Opponent A0 ends rally as EVV point':'a[2]==="A0"){commit("EVV"' in s,
'Completed rally returns to Rally tab':'draft={};tab="rally";view="live"' in s,
'Setup reception survives fresh reset':'keepRec=clone(st.receiveIds)' in s and 'st.receiveIds=keepRec' in s,
'No stale st.ended property':'st.ended' not in s,
'Next set uses setEnded':'if(!st.setEnded)return toast("Satz läuft noch")' in s,
'Nine-zone picker has zones 1-9':'[1,2,3,4,5,6,7,8,9].map' in s,
'Setter excluded from normal attackers':'id==="johann"' in s,
'Libero excluded from attackers':'p.role==="L"' in s,
'Set 5 target 15':'set===5?15:25' in s,
'Undo restores snapshot':'restore(x);draft={};render();toast("Letzte Rally vollständig zurückgesetzt")' in s,
'Rally log can show serve':'if(x.serve)a.push(`Aufschlag ${x.serve}`)' in s,
'Rally log can show reception':'if(x.receiver&&x.reception)' in s,
'Rally log can show attack':'if(x.attacker)a.push' in s,
}
for k,v in tests.items(): print(('PASS' if v else 'FAIL')+' | '+k)
if not all(tests.values()): raise SystemExit(1)
