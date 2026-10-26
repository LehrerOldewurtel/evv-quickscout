from pathlib import Path
s=Path('app.js').read_text()
checks={
'R5-R6-R1':'const ROT_NEXT={5:6,6:1,1:2,2:3,3:4,4:5}' in s,
'front=P2/P3/P4':'[2,3,4].includes(courtPos(id))' in s,
'attack by court position':'4:"IV",3:"III",2:"II",6:"PIPE"' in s,
'no-libero MB reception':'role!=="Z"&&p.role!=="L"' in s,
'libero survives start':'keepLibActive=st.liberoActive' in s and 'st.liberoActive=keepLibActive' in s,
'opponent libero reception':'function opponentReceivers()' in s,
'continue no point':'draft.step="oppDefense"' in s,
'EVV defense D3-D0':'["D3","D2","D1","D0"]' in s,
'blocker selection front row':'draft.step="evvBlock"' in s and 'front().map' in s,
'block player statistic':'x.type==="Block"&&x.player===id' in s,
'defense player statistic':'x.type==="Defense"&&x.player===id' in s,
'reception player statistic':'Annahme je Spieler' in s,
'attack player statistic':'Angriff / Block' in s,
'serve player statistic':'<h3>Aufschlag</h3>' in s,
'rotation K1/K2 statistic':'Rotationen · K1/K2' in s and 'function rotationStats' in s,
'atomic target undo':'pre=snapshot()' in s and 'commit(p.w,p.data,pre)' in s,
'A0 opponent ends EVV point':'if(a[2]==="A0")commit("EVV"' in s,
'set5=15':'return set===5?15:25' in s,
'local autosave':'localStorage.setItem(STORE_KEY' in s and 'loadLocal()' in s,
}
for k,v in checks.items(): print(('PASS' if v else 'FAIL')+' | '+k)
raise SystemExit(0 if all(checks.values()) else 1)
