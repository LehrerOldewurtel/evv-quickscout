from pathlib import Path
s=Path('app.js').read_text()
checks={
'Rotation R5→R6→R1':'const ROT_NEXT={5:6,6:1,1:2,2:3,3:4,4:5}' in s,
'Front row is P2/P3/P4':'[2,3,4].includes(courtPos(id))' in s,
'No-libero reception not hard-coded':'function receivers()' in s and 'role!=="Z"' in s,
'Opponent libero included in reception':'function opponentReceivers()' in s and 'opponent.libero' in s,
'Attack routes derive from court position':'4:"IV",3:"III",2:"II",6:"PIPE"' in s,
'Continue does not commit a point':'draft.step="oppDefense";tab="opponent"' in s,
'EVV defense has quality D3-D0':'["D3","D2","D1","D0"]' in s,
'EVV set target exists':'EVV · Zuspiel wohin?' in s,
'Opponent defense continues rally':'draft.step="oppSet"' in s,
'Opponent A0 ends as EVV point':'if(a[2]==="A0")commit("EVV"' in s,
'Nine-zone orientation explicit':'1–3 netznah · 4–6 Mitte · 7–9 grundliniennah' in s,
'Atomic marked-rally snapshot':'p=pendingMark,pre=snapshot()' in s and 'commit(p.w,p.data,pre)' in s,
'Detailed stats active':'function fullStatsFrom' in s and 'Angriff / Block' in s,
'Set 5 to 15':'return set===5?15:25' in s,
'Undo restores complete snapshot':'restore(x);draft={};render()' in s,
}
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' | '+k)
raise SystemExit(0 if all(checks.values()) else 1)
