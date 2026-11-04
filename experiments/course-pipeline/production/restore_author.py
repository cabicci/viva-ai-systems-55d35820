"""Restore a complete reviewed package before resuming missing work."""
import argparse,shutil,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
import pipeline as p

def accepted(folder,lid):
    try:
        r=p.read(folder/'authoring-receipt.json')
        if r.get('status')!='authored-and-automatically-checked' or r.get('arEGNarrationStyle')!='egyptian-validated':return False
        if r.get('canonicalNarrationHash')!=p.digest(p.read(ROOT/'blueprints.json')[lid]):return False
        if r.get('canonicalActivityHash')!=p.digest(p.read(ROOT/'activities.json')[lid]):return False
        if r.get('sourceHash')!=p.read(ROOT.parent/'planning/curriculum-map.json')['source']['sha256']:return False
        return set(r['locales'])=={'en','ar-EG','it','de'} and all(p.digest(p.read(folder/(loc+'.json')))==v['contentHash'] for loc,v in r['locales'].items())
    except (OSError,KeyError,ValueError):return False

def restore(source,lid):
    target=ROOT/'output'/lid
    if accepted(target,lid):return True
    if not accepted(source,lid):return False
    target.mkdir(parents=True,exist_ok=True)
    for name in ['authoring-receipt.json','en.json','ar-EG.json','it.json','de.json']:
        shutil.copy2(source/name,target/name)
    return True

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--from-folder',type=Path,required=True);ap.add_argument('--lesson',required=True);a=ap.parse_args()
    print('Complete package restored:',restore(a.from_folder,a.lesson))
