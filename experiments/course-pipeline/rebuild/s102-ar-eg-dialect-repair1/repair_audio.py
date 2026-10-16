"""Exactly one same-meaning dialect repair for each of five explicitly scoped Arabic cells."""
from pathlib import Path
import argparse,hashlib,json,shutil,sys,time
HERE=Path(__file__).resolve().parent;BASE=HERE.parent/'s102-narration-v1';sys.path.insert(0,str(BASE))
import audio_stage as legacy
p=legacy.p
TARGETS=['s102-reading-injury','s102-reading-heat','s102-example-dizzy','s102-example-ankle','s102-example-kit-match']
def sha(f):return hashlib.sha256(f.read_bytes()).hexdigest()
def fingerprint():
 paths=[HERE/'repair_audio.py',HERE/'repair-plan.json',BASE/'audio_stage.py',BASE/'speech_core.py',BASE/'course/manifest.json',BASE/'course/audio-contract.json',p.REPO/'.github/workflows/soil-s102-ar-eg-dialect-repair1.yml',*[HERE/f'prior/{s}.json' for s in TARGETS]]
 return {f.relative_to(p.REPO).as_posix():hashlib.sha256(f.read_text(encoding='utf-8').encode()).hexdigest() for f in paths}
def validate():
 r=p.read(HERE/'repair-plan.json');m=p.read(BASE/'course/manifest.json')['media'];assert r['locale']=='ar-EG' and r['maxAdditionalCallsPerScene']==1 and r['scientificMeaningChanged'] is False
 assert [s['id'] for s in r['scenes']]==TARGETS and r['sixOtherArabicCellsProtected'] and r['otherLocalesProtected']
 for s in r['scenes']:
  assert s['caption']==s['narration'] and s['newAudioKey']==p.audio_key(s,'ar-EG',m) and s['newAudioKey']!=s['priorAudioKey']
  prior=p.read(HERE/f'prior/{s["id"]}.json');assert sha(HERE/f'prior/{s["id"]}.json')==s['priorStateByteSha256'] and prior.get('accepted') and len(prior['attempts'])==s['priorAttemptCount']==1
  assert 1+s['priorAttemptCount']<=4
 return dict(status='passed five same-meaning Arabic repair cells; one call each, cumulative2of4maximum')
def authorize():
 validate();r=p.read(HERE/'media-request.json');assert r['action']=='S1-02-ar-EG-dialect-repair1-only' and r['fingerprint']==fingerprint(),'Stale repair request'
def produce():
 authorize();r=p.read(HERE/'repair-plan.json');m=p.read(BASE/'course/manifest.json')['media'];c=p.read(BASE/'course/audio-contract.json');key=legacy.credential([m['model'],c['reviewModel']]);folder=HERE/'output/ar-EG';receipt=dict(locale='ar-EG',allPassed=False,humanListeningReviewed=False,segments=[],failures=[],protectedArabicCells=6,protectedOtherLocaleCells=33)
 for s in r['scenes']:
  k=s['newAudioKey'];path=folder/'audio'/f'{k}.wav';statePath=folder/'attempts'/f'{s["id"]}.json';state=p.read(statePath) if statePath.exists() else dict(priorAttemptCount=s['priorAttemptCount'],priorAudioKey=s['priorAudioKey'],attempts=[])
  if state.get('accepted'):assert p.valid_wav(path) and sha(path)==state['accepted']['audioSha256'],'Changed accepted WAV; no regeneration'
  elif not state['attempts']:
   assert not path.exists(),'Untracked WAV requires investigation';attempt=dict(status='started',cumulativeAttempt=2);state['attempts'].append(attempt);p.write(statePath,state)
   try:
    attempt['generation']=p.synthesize(s,'ar-EG',m,key,path);q=legacy.quality(path,s,'ar-EG',c,key);attempt.update(status='reviewed',quality=q)
    if q['passed']:state['accepted']=q
   except Exception as e:attempt.update(status='error',error=str(e).replace(key,'[redacted]')[:350])
   p.write(statePath,state)
  if state.get('accepted'):receipt['segments'].append(dict(scene=s['id'],key=k,priorKey=s['priorAudioKey'],voice=p.resolved_voice(s,m),cumulativeAttempts=2,quality=state['accepted']));print(s['id']+': repair automated checks passed',flush=True)
  else:receipt['failures'].append(dict(scene=s['id'],state=statePath.relative_to(HERE/'output').as_posix()));print(s['id']+': exception retained; no second call in this request',flush=True)
  p.write(folder/'audio-review.json',receipt);time.sleep(5)
 receipt['allPassed']=len(receipt['segments'])==5 and not receipt['failures'];p.write(folder/'audio-review.json',receipt);assert receipt['allPassed'],'Repair exceptions retained; independent work continues'
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('command',choices=['validate','request','audio']);args=a.parse_args()
 if args.command=='validate':print(json.dumps(validate()))
 elif args.command=='request':
  validate();p.write(HERE/'media-request.json',dict(action='S1-02-ar-EG-dialect-repair1-only',fingerprint=fingerprint()));authorize();print('Five-cell Arabic dialect repair1 request prepared.')
 else:produce()
