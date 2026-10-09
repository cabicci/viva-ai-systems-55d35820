"""Source-bound repair of one short heading; preserve all other audio bytes."""
import base64
from dataclasses import asdict
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.request

import course_media as media
from media_plan import ROOT, digest
from recover_media import acceptable, matching_receipt, restore_audio

LESSON='AC-BUS-M03-L03'
LOCALE='ar-EG'
BASE='bf9883b0871462ea923d45843dcfadc157b660d2d171d20f5dbea5d2640244e3'
SOURCE='b519a65249af8578d6fbf0f22b83c1dde1cdd610b1fdfdecdf1cd563142cdc33'
SCENE='case-step-5-1'
LABEL='تعديل النموذج:'
TTS_INPUT='تعديل النموذج.'
FOCUS='Preserve meaning and all numbers; natural academic teaching.'
SHORT_PREFIX='اقرأ العنوان التالي فقط مرة واحدة بعامية مصرية قاهرية طبيعية، دون شرح أو تكرار. لا تقرأ تعليمات النطق.\nالنص:\n'
MAX_ATTEMPTS=4


def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def words(text):
    return re.findall(r'[^\W_]+',re.sub(r'[\u064B-\u065F\u0670\u0640]','',text),re.UNICODE)


def api_json(method,url,key,payload=None):
    data=json.dumps(payload).encode() if payload is not None else None
    request=urllib.request.Request(url,data=data,method=method,
        headers={'x-goog-api-key':key,'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(request,timeout=90) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'Audio verification HTTP{error.code}; no provider body/key logged') from None
    except Exception as error:
        raise RuntimeError('Audio verification transport failed: '+type(error).__name__) from None


def select_asr(key):
    available=api_json('GET','https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',key)
    allowed={m['name'].removeprefix('models/') for m in available.get('models',[])
             if 'generateContent' in m.get('supportedGenerationMethods',[])}
    for name in ['gemini-2.5-flash','gemini-3.8-flash']:
        if name in allowed:return name
    raise RuntimeError('No supported bounded audio transcription model available')


def transcribe(path,key,model):
    # The expected heading is deliberately absent from the ASR prompt.
    prompt='Transcribe every word actually spoken in this Arabic audio, verbatim, including repetitions or instructions. Do not correct, complete, translate or add words. Return JSON with only the string field transcript.'
    payload={'contents':[{'parts':[{'text':prompt},{'inlineData':{
        'mimeType':'audio/wav','data':base64.b64encode(path.read_bytes()).decode()}}]}],
        'generationConfig':{'temperature':0,'responseMimeType':'application/json'}}
    result=api_json('POST',f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',key,payload)
    candidates=result.get('candidates',[])
    if len(candidates)!=1 or candidates[0].get('finishReason')!='STOP':
        raise RuntimeError('Audio transcription did not complete; no bypass')
    text=''.join(p.get('text','') for p in candidates[0].get('content',{}).get('parts',[]) if not p.get('thought'))
    value=json.loads(text)
    if set(value)!={'transcript'} or not isinstance(value['transcript'],str):
        raise ValueError('Invalid transcription record')
    return value['transcript']


def pcm_parts(result):
    candidates=result.get('candidates',[])
    if len(candidates)!=1 or candidates[0].get('finishReason')!='STOP':
        raise RuntimeError('Short heading synthesis incomplete/rejected; no editorial bypass')
    audio=[]
    for part in candidates[0].get('content',{}).get('parts',[]):
        inline=part.get('inlineData')
        if inline is None:continue
        mime=[x.strip() for x in inline.get('mimeType','').lower().split(';')]
        params=dict(x.split('=',1) for x in mime[1:] if '=' in x)
        if (mime[0] not in ('audio/pcm','audio/l16') or params.get('rate')!='24000'
                or params.get('channels','1')!='1' or params.get('codec','pcm')!='pcm'):
            raise ValueError('Unexpected heading PCM format; no conversion bypass')
        audio.append(base64.b64decode(inline['data'],validate=True))
    if not audio or any(not a or len(a)%2 for a in audio):raise ValueError('Missing/invalid heading PCM')
    return b''.join(audio),{'audioParts':len(audio),'pcmBytes':[len(a) for a in audio]}


def synthesize_label(tts,short_policy,candidate,keys,attempt):
    if words(TTS_INPUT)!=words(LABEL):raise ValueError('Heading words changed')
    rewritten,prefix=tts.prepare_narration(TTS_INPUT,None,short_policy)
    if words(rewritten)!=words(LABEL):raise ValueError('Narration rewrite changed heading words')
    tts._throttle_before_request('Charon',f'key#{(attempt-1)%len(keys)+1}')
    payload={'contents':[{'parts':[{'text':prefix+rewritten}]}],
        'generationConfig':{'responseModalities':['AUDIO'],
            'speechConfig':{'voiceConfig':{'prebuiltVoiceConfig':{'voiceName':'Charon'}}}}}
    result=api_json('POST',f'https://generativelanguage.googleapis.com/v1beta/models/{tts.MODEL}:generateContent',keys[(attempt-1)%len(keys)],payload)
    pcm,stats=pcm_parts(result)
    candidate.write_bytes(tts._pcm_to_wav(pcm))
    return stats


def repair_label(tts,short_policy,target,keys,asr_model,audit,work,recognize=transcribe,generate=synthesize_label):
    original=sha(target)
    archive=work/'preserved-invalid-label.wav'
    target.replace(archive)
    audit['originalInvalidSha256']=original
    for attempt in range(1,MAX_ATTEMPTS+1):
        candidate=work/f'short-label-attempt-{attempt}.wav'
        response_stats=generate(tts,short_policy,candidate,keys,attempt)
        seconds=tts._duration_s(str(candidate))
        item={'attempt':attempt,'sha256':sha(candidate),'durationSeconds':seconds,
              'durationValid':acceptable(LABEL,seconds),'transcript':None,'wordsMatch':False,
              'responseStats':response_stats}
        audit['attempts'].append(item)
        if item['durationValid']:
            item['transcript']=recognize(candidate,keys[0],asr_model)
            item['wordsMatch']=words(item['transcript'])==words(LABEL)
        media.write_json(work/'short-label-audit.json',audit)
        print(f'Exact short heading attempt{attempt}: duration={item["durationValid"]}, words={item["wordsMatch"]}',flush=True)
        if item['durationValid'] and item['wordsMatch']:
            # Promote only proven audio; its changed request is explicitly audited.
            target.write_bytes(candidate.read_bytes())
            audit['acceptedSha256']=sha(target)
            media.write_json(work/'short-label-audit.json',audit)
            return
    raise ValueError('Bounded short heading repair did not meet unchanged duration/verbatim gates')


def validated_plan():
    plan,base=media.production_plan(LESSON,LOCALE)
    if base!=BASE or plan['sourceSha256']!=SOURCE:raise ValueError('Exact production source/fingerprint changed')
    labels=[(i,s) for i,s in enumerate(plan['scenes']) if s['id']==SCENE]
    if len(labels)!=1 or labels[0][1]['spoken']!=LABEL:raise ValueError('Exact heading changed')
    return plan,labels[0][0]


def run(retained):
    plan,label_index=validated_plan()
    original_receipt=matching_receipt(retained/'receipt',LESSON,LOCALE,plan,BASE)
    sys.path.insert(0,str(ROOT/'experiments/academic/media'))
    from policy import POLICY
    import gemini_tts as tts
    short_policy=tts.NarrationPolicy('academic-egyptian-short-heading-v1',SHORT_PREFIX,())
    recipe={'schemaVersion':1,'baseProductionFingerprint':BASE,'sourceSha256':SOURCE,
        'sceneId':SCENE,'spoken':LABEL,'ttsInput':TTS_INPUT,'punctuationOnlyChange':True,
        'audioResponseHandling':'allPCMpartsInOriginalOrder','voice':'Charon','ttsModel':tts.MODEL,
        'shortPolicy':asdict(short_policy),'shortFocus':'','durationGateWpm':[35,300],
        'maxAttempts':MAX_ATTEMPTS,'verbatimAsrRequired':True,'executorSha256':sha(Path(__file__))}
    fingerprint=digest(recipe)
    work=ROOT/f'tmp/academic-course-media/{LESSON}/{LOCALE}/{fingerprint}'
    work.mkdir(parents=True,exist_ok=True)
    receipt_path=work/'receipt.json'
    receipt={'lessonId':LESSON,'locale':LOCALE,'sourceSha256':SOURCE,'fingerprint':fingerprint,
        'baseProductionFingerprint':BASE,'repairRecipe':recipe,'originalSourceRun':37451264552,
        'retainedAudioRun':37903717527,'commit':os.environ.get('GITHUB_SHA'),
        'pilotVoiceAccepted':True,'outputListening':'pending','generated':False,'uploaded':False,
        'playbackReady':False,'productionActivated':False}
    media.write_json(receipt_path,receipt)
    bunny=media.Bunny()
    if bunny.library!='670679':raise ValueError('Unexpected video library')
    title=f'academic-course-{LESSON}-{LOCALE}-{fingerprint}'
    # Preserve any previously uploaded original identity, including processing/errors.
    old=bunny.find(f'academic-course-{LESSON}-{LOCALE}-{BASE}')
    if old is not None:raise ValueError('Original provider identity now exists; reconcile without regeneration')
    existing=bunny.find(title)
    if media.reusable(existing):
        receipt.update(videoId=existing['guid'],uploaded=True,reusedExisting=True)
        media.ready(bunny,existing['guid'],receipt,receipt_path)
        return
    names=[tts.segment_cache_name(i,'Charon',s['spoken'],FOCUS,POLICY) for i,s in enumerate(plan['scenes'])]
    restored=restore_audio(retained/'audio',work/'audio',names)
    if restored!=len(names):raise ValueError('Missing retained audio; full regeneration refused')
    paths=[work/'audio'/name for name in names]
    invalid=[i for i,(s,p) in enumerate(zip(plan['scenes'],paths)) if not acceptable(s['spoken'],tts._duration_s(str(p)))]
    if invalid!=[label_index]:raise ValueError('Audio repair identity drift; expected only the one short heading')
    retained_hashes={s['id']:sha(p) for i,(s,p) in enumerate(zip(plan['scenes'],paths)) if i!=label_index}
    keys=tts._collect_api_keys();asr_model=select_asr(keys[0])
    audit={'recipe':recipe,'fingerprint':fingerprint,'retained':retained_hashes,'restoredSegments':restored,
        'attempts':[],'asrModel':asr_model,'asrIsListeningAcceptance':False,'outputListening':'pending'}
    media.write_json(work/'short-label-audit.json',audit)
    repair_label(tts,short_policy,paths[label_index],keys,asr_model,audit,work)
    receipt.update(media.render(plan,fingerprint,work))
    for i,(s,p) in enumerate(zip(plan['scenes'],paths)):
        if i!=label_index and sha(p)!=retained_hashes[s['id']]:raise ValueError('Retained valid audio changed')
    receipt['recoveryAuditSha256']=sha(work/'short-label-audit.json')
    media.write_json(receipt_path,receipt)
    existing=bunny.find(title)
    if media.reusable(existing):guid=existing['guid'];receipt['reusedExisting']=True
    else:
        guid=bunny.request('POST',data={'title':title})['guid']
        receipt['videoId']=guid;media.write_json(receipt_path,receipt)
        bunny.request('PUT','/'+guid,(work/'lesson.mp4').read_bytes(),binary=True)
    receipt.update(videoId=guid,uploaded=True,providerTitle=title)
    media.write_json(receipt_path,receipt)
    media.ready(bunny,guid,receipt,receipt_path)


if __name__=='__main__':run(Path(sys.argv[1]))
