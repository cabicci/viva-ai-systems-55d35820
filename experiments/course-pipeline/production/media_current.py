"""Check delivered media against the current spoken and visible lesson content."""
import hashlib,json,sys
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
import pipeline as p

def current(package,locale):
    package=Path(package);folder=package/'output'/locale
    try:
        receipt=p.read(folder/'receipt.json')
        if not receipt.get('generated') or not receipt.get('automatedAudioReview',{}).get('passed'):return False
        lesson=p.read(package/'course'/(locale+'.json'));manifest=p.read(package/'course/manifest.json')
        expected=[{'scene':s['id'],'key':p.audio_key(s,locale,manifest['media'])} for s in lesson['scenes']]
        if [{'scene':a['scene'],'key':a['key']} for a in receipt['audio']]!=expected:return False
        props=p.read(folder/'props.json')
        if lesson.get('lessonId')=='SOIL-U2-L10' and props.get('graphicsVersion')!='texture-triangle-v1':return False
        for actual,source in zip(props['scenes'],lesson['scenes'],strict=True):
            if any(actual[k]!=source[k] for k in ('id','title','lead','labels')):return False
        visuals=p.read(package/'output/visuals/receipt.json')
        if not visuals.get('qualityPassed'):return False
        if visuals['planHash']!=p.digest(p.read(package/'course/visuals.json')):return False
        if visuals['qualityContractHash']!=p.digest(p.read(package/'course/visual-contract.json')):return False
        if receipt['visualAssetHashes']!={a['id']:a['sha256'] for a in visuals['assets']}:return False
        video=folder/'lesson.mp4'
        if hashlib.sha256(video.read_bytes()).hexdigest()!=receipt['verification']['sha256']:return False
        if hashlib.sha256((folder/'master.wav').read_bytes()).hexdigest()!=receipt['automatedAudioReview']['audioHash']:return False
        return True
    except (OSError,KeyError,ValueError,TypeError):return False
