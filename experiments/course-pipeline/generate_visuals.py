"""Generate text-free course artwork through Gemini, with immutable cache receipts."""
from __future__ import annotations
import argparse
import base64
import hashlib
import io
import os
from pathlib import Path
import time
from PIL import Image
import pipeline as p

ROOT=Path(__file__).resolve().parent

def plan_hash(plan):
    return p.digest(plan)

def asset_key(plan, asset):
    return p.digest({'model':plan['model'],'apiVersion':plan['apiVersion'],'size':plan['imageSize'],
                     'ratio':plan['aspectRatio'],'style':plan['style'],'subject':asset['subject']})

def validate(plan):
    assert plan['provider']=='gemini' and plan['apiVersion']=='v1'
    assert plan['model']=='gemini-nano-banana-2.1', 'No implicit model changes'
    assert len(plan['assets'])==5, 'The owner authorized five shared visual assets for one lesson'
    assert len({a['id'] for a in plan['assets']})==5
    assert all(a['subject'] and a['scenes'] for a in plan['assets'])

def generate(plan, asset, key, dest):
    fingerprint=asset_key(plan,asset)
    cached=dest/'cache'/f'{fingerprint}.png'
    if cached.exists():
        with Image.open(cached) as im: im.verify()
        status='reused'
    else:
        prompt=plan['style']+'\n\nSUBJECT: '+asset['subject']
        body={'contents':[{'role':'user','parts':[{'text':prompt}]}],
              'generationConfig':{'responseModalities':['TEXT','IMAGE'],
                                  'responseFormat':{'image':{'aspectRatio':plan['aspectRatio'],'imageSize':plan['imageSize']}}}}
        for attempt in range(3):
            try:
                result=p.request_json(f'https://generativelanguage.googleapis.com/v1/models/{plan["model"]}:generateContent',key,body)
                break
            except p.ProviderError as error:
                if error.status not in (429,500,502,503,504) or attempt==2: raise
                time.sleep(30*(attempt+1))
        parts=((result.get('candidates') or [{}])[0].get('content') or {}).get('parts',[])
        data=next((x['inlineData'] for x in parts if 'inlineData' in x and not x.get('thought')),None)
        assert data and data.get('mimeType','').startswith('image/'), 'No final image returned; do not substitute another generator'
        raw=base64.b64decode(data['data'],validate=True)
        cached.parent.mkdir(parents=True,exist_ok=True)
        with Image.open(io.BytesIO(raw)) as im:
            assert im.width>=1500 and im.height>=800, 'Image is below requested review resolution'
            im.convert('RGB').save(cached,format='PNG')
        status='generated'
    target=dest/f'{asset["id"]}.png'
    target.write_bytes(cached.read_bytes())
    with Image.open(target) as im: width,height=im.size
    return {'id':asset['id'],'scenes':asset['scenes'],'status':status,'key':fingerprint,'width':width,'height':height,
            'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'filename':target.name,'visuallyReviewed':False}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('command',choices=['request','generate'])
    parser.add_argument('--batch-id')
    args=parser.parse_args()
    plan=p.read(ROOT/'course/visuals.json')
    validate(plan)
    script_hash=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    if args.command=='request':
        assert args.batch_id
        p.write(ROOT/'visual-request.json',{'batchId':args.batch_id,'lessonId':'SOIL-PILOT-01','action':'generate-visuals-only',
                                           'planHash':plan_hash(plan),'scriptHash':script_hash})
        print('Bounded five-asset visual request ready.')
        return
    request=p.read(ROOT/'visual-request.json')
    assert request['planHash']==plan_hash(plan) and request['scriptHash']==script_hash, 'Stale visual request'
    assert request['action']=='generate-visuals-only' and request['lessonId']=='SOIL-PILOT-01'
    key=next((os.environ.get(k) for k in ['GEMINI_API_KEY','GEMINI_API_KEY_1','GEMINI_API_KEY_2','GEMINI_API_KEY_3'] if os.environ.get(k)),None)
    assert key, 'Gemini credential is required'
    available=p.request_json('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',key)
    names=[m['name'] for m in available.get('models',[]) if 'image' in m['name'].lower() or 'banana' in m['name'].lower()]
    print('Available image model names: '+', '.join(names),flush=True)
    model=p.request_json(f'https://generativelanguage.googleapis.com/v1/models/{plan["model"]}',key)
    assert 'generateContent' in model.get('supportedGenerationMethods',[])
    dest=ROOT/'output/visuals'
    dest.mkdir(parents=True,exist_ok=True)
    receipt={'provider':'gemini','model':plan['model'],'planHash':plan_hash(plan),'assets':[],
             'style':'cartoon 3D with realistic materials','ownerAccepted':False,'generated':False}
    try:
        for asset in plan['assets']:
            entry=generate(plan,asset,key,dest)
            receipt['assets'].append(entry)
            p.write(dest/'receipt.json',receipt)
            print(f'{asset["id"]}: {entry["status"]}',flush=True)
            time.sleep(5)
        receipt['generated']=True
    except Exception as error:
        receipt['error']=str(error)[:300]
        raise
    finally:
        p.write(dest/'receipt.json',receipt)

if __name__=='__main__': main()
