from pathlib import Path
p=Path(__file__).parent
js=(p/'app.js').read_text(); html=(p/'index.html').read_text(); css=(p/'styles.css').read_text(); sw=(p/'sw.js').read_text(); ver=(p/'version.js').read_text()
checks={
'version single source':'EVV_VERSION="7.7"' in ver and 'version.js' in html and "importScripts('./version.js')" in sw,
'dual opponent liberos':'oppLibero1' in html and 'oppLibero2' in html and 'opponent.liberos' in js,
'evv two libero roster':'id:"amar"' in js and 'id:"alex"' in js and 'evvLiberoOnCourt' in html,
'back within rally':'function draftBack()' in js and '← Zurück' in js,
'no tab draft reset':'b.dataset.tab;render()' in js and 'b.dataset.tab;draft={};render()' not in js,
'rotational attack exact':'function attackCandidates(target){return attackOptions().filter' in js,
'ball2 branch':'EVV · 2. Ball' in js and '2. BALL RÜBER' in js,
'opponent ball2':'oppBall2' in js and 'OpponentSecondBall' in js,
'opponent block point or rebound':'BLOCKPUNKT GEGNER' in js and 'BLOCKABPRALLER · EVV weiter' in js,
'evv block point or continue':'BLOCKTOUCH · Gegner weiter' in js and 'BLOCKTOUCH · EVV Abwehr' in js,
'apple glass ui':'backdrop-filter' in css and '#0071e3' in css and 'EVV QuickScout' in html,
'setup hidden after start':'$("setup").classList.add("hidden")' in js,
'full player stats':'Annahme je Spieler' in js and 'Angriff / Block' in js and 'Abwehr' in js,
'rotation stats':'Rotationen · K1/K2' in js,
'continue no point':'BLOCK_CONTINUE' in js and 'commit("Gegner"' not in js[js.find('if(a[1]==="BLOCK_CONTINUE")'):js.find('if(a[1]==="BLOCK_CONTINUE")')+250],
}
failed=[k for k,v in checks.items() if not v]
for k,v in checks.items(): print(('PASS' if v else 'FAIL'),k)
print(f'{len(checks)-len(failed)}/{len(checks)} PASS')
raise SystemExit(1 if failed else 0)
