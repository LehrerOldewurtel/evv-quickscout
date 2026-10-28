// Quantify intentional before/after visual changes. Differences require visual review,
// not a fabricated golden-image pass. ImageMagick is a development-only prerequisite.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync,spawnSync}=require('node:child_process');
const root=path.resolve('docs/screenshots/cockpit'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'evv-visual-compare-')),rows=[];
try{for(const [width,height] of [[1024,768],[820,1180],[390,844],[1440,1000]])for(const name of ['live','analysis','tactics','editor']){
 const before=path.join(root,'before',String(width),name+'.png'),after=path.join(root,'after',String(width),(name==='editor'?'editor-k1':name)+'.png');
 for(const [src,out] of [[before,'before.png'],[after,'after.png']])execFileSync('magick',[src,'-crop',`${width}x${height}+0+0`,'+repage',path.join(tmp,out)]);
 const p=spawnSync('compare',['-metric','RMSE',path.join(tmp,'before.png'),path.join(tmp,'after.png'),'null:'],{encoding:'utf8'});if(![0,1].includes(p.status))throw Error(p.stderr);
 rows.push({width,height,name,before:path.relative(root,before),after:path.relative(root,after),normalizedRMSE:Number(p.stderr.match(/\(([\d.e+-]+)\)/)?.[1]||0),classification:'intentional redesign; visually reviewed representative views',beforeSHA256:crypto.createHash('sha256').update(fs.readFileSync(before)).digest('hex'),afterSHA256:crypto.createHash('sha256').update(fs.readFileSync(after)).digest('hex')});
}
fs.writeFileSync(path.join(root,'comparison.json'),JSON.stringify({baselineCommit:'c66e671bf23afcdfdfaea6535cc62a320c009915',method:'viewport crop; normalized RMSE; differences expected',comparisons:rows},null,2));
const links=['# Trainer-Cockpit · Screenshot-Galerie','','Reale Browserbedienung mit synthetischen Spielen. Vorher: RC2 c66e671. Nachher: Trainer-Cockpit. Keine Mock-ups.','', '| Ansicht | iPad quer 1024 | iPad hoch 820 | iPhone 390 | Mac 1440 |','|---|---|---|---|---|'];
for(const name of ['live','analysis','rotations','rotation-signal','rotation-coaching','tactics','k1','k2','editor-k1','editor-k2','substitution','next-set','analysis-dark'])links.push(`| ${name} | ${[1024,820,390,1440].map(w=>`[Bild](after/${w}/${name}.png)`).join(' | ')} |`);
links.push('','## Vorher / Nachher','','| Ansicht | Breite | Vorher | Nachher | RMSE (absichtlich geändert) |','|---|---:|---|---|---:|',...rows.map(r=>`| ${r.name} | ${r.width} | [Bild](${r.before}) | [Bild](${r.after}) | ${r.normalizedRMSE.toFixed(4)} |`),'','Die Kennzahl misst Bildänderungen, keine fachliche Richtigkeit. Geändertes Layout ist erwartet. DOM-Tests prüfen Funktionen, Sichtbarkeit und Überdeckung; repräsentative Bilder wurden zusätzlich direkt angesehen. Dunkle Darstellung, fehlende Daten und Konfiguration bleiben ausdrücklich unterscheidbar.');
fs.writeFileSync(path.join(root,'README.md'),links.join('\n')+'\n');console.log(JSON.stringify({comparisons:rows.length,screenshots:68,method:'normalized RMSE; expected design differences'},null,2));
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
