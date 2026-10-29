#!/usr/bin/env python3
"""Compile the supplied seed into independently authored legal receiving proposals."""
import json,hashlib,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent

def receiving(pos):
 front=[4,3,2];back=[5,6,1]
 aa_front=next(pos[r] for r in ['AA1','AA2'] if pos[r] in front)
 rec_back=sorted([pos[r] for r in ['AA1','AA2','MB1','MB2'] if pos[r] in back],key=back.index)
 xs={};ix=front.index(aa_front)
 for i,p in enumerate(front):xs[p]=.5 if i==ix else (.12+.15*i if i<ix else .72+.18*(i-ix-1))
 for i,p in enumerate(back):xs[p]=.18 if p==rec_back[0] else .82 if p==rec_back[1] else .06 if i==0 else .94 if i==2 else .65
 ys={p:.56 if p==aa_front else .18 for p in front}
 for p in back:ys[p]=.82 if p in rec_back else max(.48,ys[{5:4,6:3,1:2}[p]]+.12)
 return {r:{'x':round(xs[p],3),'y':round(ys[p],3)} for r,p in pos.items()}

def main():
 seed=json.loads((ROOT/'data/formationen_5_1.seed.json').read_text());seed['schema']='evv-quickscout-formation-library/v2';seed['source_seed_sha256']=hashlib.sha256((ROOT/'data/formationen_5_1.seed.json').read_bytes()).hexdigest();seed['provenance']='Eigenständig ausgearbeitete Trainer-Vorschläge aus dem gelieferten Seed; keine Bildrekonstruktion.'
 for f in seed['formations']:
  p=f['role_to_rule_position'];pre=receiving(p);targets={}
  for r,pos in p.items():targets[r]={'x':.70,'y':.18} if r=='Z' else {'x':.15,'y':.20} if r.startswith('AA') and pos in [2,3,4] else {'x':.28,'y':.75} if r.startswith('AA') else {'x':.50,'y':.12} if r.startswith('MB') and pos in [2,3,4] else {'x':.55,'y':.82} if r.startswith('MB') else {'x':.86,'y':.20 if pos in [2,3,4] else .75}
  f['reception_pre_serve']=pre;f['receivers']=[r for r in p if r.startswith('AA') or r.startswith('MB') and p[r] in [1,5,6]]
  f['reception_tactical_overlay'].update(coordinates=targets,setter_run=[pre['Z'],targets['Z']],note='Drei Annahmespieler: beide AA und tatsächlich aktiver Hinterfeld-MB bzw. dessen tatsächlich eingesetzter Libero. Vorschlag; keine automatische Libero-Ersetzung.')
  f['validation']={'symbol_center_overlap':True,'front_back_pairs':True,'receivers':3,'reference_images_verified':False}
  coords={v:pre[r] for r,v in p.items()};assert all(coords[a]['x']<coords[b]['x'] for a,b in [(4,3),(3,2),(5,6),(6,1)]);assert all(coords[a]['y']<coords[b]['y'] for a,b in [(4,5),(3,6),(2,1)])
 target=ROOT/'data/formationen_5_1.json';rendered=json.dumps(seed,ensure_ascii=False,indent=2)+'\n';app=ROOT/'app.js';source=app.read_text();begin=source.index('// MASTER_LIBRARY_BEGIN');end=source.index('// MASTER_LIBRARY_END',begin)+len('// MASTER_LIBRARY_END');compiled='// MASTER_LIBRARY_BEGIN\nconst MASTER_FORMATIONS='+json.dumps(seed,ensure_ascii=False,separators=(',',':'))+';\n// MASTER_LIBRARY_END'
 if '--check' in sys.argv:
  assert target.read_text()==rendered,'JSON library is stale';assert source[begin:end]==compiled,'Embedded library is stale';print('Seed, completed JSON and offline runtime agree')
 else:
  target.write_text(rendered);app.write_text(source[:begin]+compiled+source[end:])
if __name__=='__main__':main()
