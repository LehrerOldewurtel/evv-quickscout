from pathlib import Path
base=Path('.')
app=(base/'app.js').read_text(); html=(base/'index.html').read_text(); css=(base/'styles.css').read_text(); ver=(base/'version.js').read_text(); sw=(base/'sw.js').read_text()
checks={
'version 7.7.1':'EVV_VERSION="7.7.1"' in ver and 'globalThis.EVV_VERSION' in app,
'cache bust':'styles.css?v=771' in html and 'app.js?v=771' in html and 'sw.js?v=771' in html,
'sw version':'globalThis.EVV_VERSION' in sw,
'dual opponent liberos':'oppLibero1' in html and 'oppLibero2' in html,
'evv dual liberos':'amar' in app and 'alex' in app and 'evvLiberoOnCourt' in html,
'back':'draftBack' in app and '← Zurück' in app,
'rot attack':'attackOptions' in app and 'courtPos' in app,
'ball2':'2. Ball rüber' in app,
'block continue':'BLOCKTOUCH' in app,
'player stats':'fullStatsFrom' in app,
'rotation stats':'Rotationen · K1/K2' in app,
'timeout capture':'Auszeit erfassen' in app and 'type:"timeout"' in app,
'apple ui':'backdrop-filter' in css and 'linear-gradient' in css and 'border-radius:24px' in css,
'preserve v77 store':'const STORE_KEY="evvQuickScoutV77"' in app,
}
for k,v in checks.items(): print(('PASS' if v else 'FAIL'),k)
print(f"{sum(checks.values())}/{len(checks)} PASS")
raise SystemExit(0 if all(checks.values()) else 1)
