from pathlib import Path
b=Path(__file__).parent
a=(b/'app.js').read_text(); h=(b/'index.html').read_text(); sw=(b/'sw.js').read_text(); v=(b/'version.js').read_text()
checks={
'version':'7.7.2' in a and 'V7.7.2' in v,
'own blockout':'fin|BLOCK_OUT' in a and 'result:"BLOCK_OUT"' in a,
'opponent blockout':'ebr|TOOLED' in a and 'BLOCK-OUT / ANGESCHLAGEN' in a,
'blocktouch continues':'ebr|EVV' in a and 'ebr|OPP' in a and 'fin|BLOCK_CONTINUE' in a,
'backrow P1 own':'1:"I"' in a,
'backrow P1 opponent':'["IV","III","II","PIPE","I"]' in a,
'freeball own':'b2|FREE' in a and 'type:"FreeBall"' in a,
'cutball own':'b2|CUT' in a,
'freeball opponent':'ob2|FREE' in a and 'ob2|CUT' in a,
'back navigation':'data-act="back"' in a,
'cache bust':'v=772' in h,
}
for k,x in checks.items(): print(('PASS' if x else 'FAIL'),k)
assert all(checks.values())
print(f"PASS {len(checks)}/{len(checks)}")
