"""One-attempt, journaled transfer of accepted immutable masters; no course adoption."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

PLAN = Path('scripts/course-delivery/pesticides-hosting-plan.json')
JOURNAL = Path('pesticides-upload-journal')
SOURCE = Path('accepted-source')
BASE = 'https://video.bunnycdn.com/library/670679'
COLLECTION = '13b22b22-dad4-4e30-8736-753c961011c3'
FIELDS = ['videoLibraryId','guid','title','collectionId','status','originalHash','hasOriginal','length','width','height','encodeProgress','availableResolutions','storageSize','isPublic']


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise RuntimeError('No credential redirects')


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('phase',choices=['prepare','resolve','upload','status'])
    parser.add_argument('--key',required=True)
    args=parser.parse_args()
    assert os.environ.get('GITHUB_ACTIONS')=='true' and os.environ.get('GITHUB_RUN_ATTEMPT')=='1'
    assert os.environ.get('GITHUB_REPOSITORY')=='cabicci/viva-ai-systems-55d35820'
    assert os.environ.get('BUNNY_STREAM_LIBRARY_ID')=='670679'
    assert sha(PLAN)==os.environ['EXPECTED_PLAN_SHA256']
    plan=json.loads(PLAN.read_text(encoding='utf-8'))
    assert plan['collectionID']==COLLECTION and plan['adoptionAuthorized'] is False
    matches=[e for e in plan['entries'] if e['key']==args.key]
    assert len(matches)==1
    entry=matches[0]
    JOURNAL.mkdir(exist_ok=True)
    receipt_path=JOURNAL/'receipt.en.json'
    if receipt_path.exists():
        receipt=json.loads(receipt_path.read_text(encoding='utf-8'))
        assert receipt['runID']==os.environ['GITHUB_RUN_ID'] and receipt['entry']==entry
    else:
        assert args.phase=='prepare'
        receipt={'schema':'masaarat-pesticides-upload-receipt.v1','entry':entry,'planSHA256':sha(PLAN),'runID':os.environ['GITHUB_RUN_ID'],'intentID':str(uuid.uuid4()),'createdUTC':now(),'createCalls':0,'putCalls':0,'captionCalls':0,'platformAdopted':False,'nativePlaybackVerified':False,'requests':[]}
    opener=urllib.request.build_opener(NoRedirect)

    def save(state=None):
        if state: receipt['state']=state
        receipt['updatedUTC']=now()
        receipt_path.write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

    def durable(name):
        value=os.environ.get(name,'')
        assert value.isdigit(), 'Missing durable checkpoint artifact'
        receipt[name]=value

    def request(method,path,data=None,binary=None):
        assert path.startswith(('/videos','/collections/'+COLLECTION))
        headers={'AccessKey':os.environ['BUNNY_STREAM_API_KEY'],'Accept':'application/json'}
        if data is not None:
            headers['Content-Type']='application/json'
            data=json.dumps(data).encode('utf-8')
        if binary:
            headers['Content-Type']='application/octet-stream'
            headers['Content-Length']=str(binary.stat().st_size)
        log={'method':method,'path':path,'intentUTC':now()}
        receipt['requests'].append(log)
        save()
        try:
            if binary:
                with binary.open('rb') as stream:
                    req=urllib.request.Request(BASE+path,data=stream,headers=headers,method=method)
                    with opener.open(req,timeout=180) as response:
                        log['status']=response.status
                        result=json.loads(response.read(2_000_000))
            else:
                req=urllib.request.Request(BASE+path,data=data,headers=headers,method=method)
                with opener.open(req,timeout=40) as response:
                    log['status']=response.status
                    result=json.loads(response.read(2_000_000))
            save()
            return result
        except urllib.error.HTTPError as error:
            log['status']=error.code
            save('HELD_REQUEST_OUTCOME_REQUIRES_RECONCILIATION')
            raise RuntimeError('Bunny HTTP '+str(error.code)+'; no automatic retry') from None
        except Exception:
            log['outcome']='unknown'
            save('HELD_UNKNOWN_OUTCOME_NO_RETRY')
            raise RuntimeError('Bunny outcome unknown; no automatic retry') from None

    def exact(video):
        assert video['guid']==receipt['guid']
        assert video['videoLibraryId']==670679 and video['collectionId']==COLLECTION
        assert video['title']==entry['title']
        return {k:video.get(k) for k in FIELDS}

    def read_video():
        video=exact(request('GET','/videos/'+receipt['guid']))
        receipt['remote']=video
        save()
        return video

    def empty(video):
        # The GET metadata's hasOriginal=true also occurs on never-uploaded rows.
        # Require fresh storage proof and all independent empty-state checks.
        assert not video.get('originalHash') and video.get('status')==0
        assert all(video.get(k)==0 for k in ['length','width','height','encodeProgress','storageSize'])
        assert not video.get('availableResolutions')
        storage=request('GET','/videos/'+receipt['guid']+'/storage')
        assert storage.get('success') is True
        values=storage['data']
        assert values['encoded']=={}
        assert all(values.get(k)==0 for k in ['originals','thumbnails','previews','mp4Fallback','miscellaneous'])
        calculated=datetime.datetime.fromisoformat(values['calculatedAt'].replace('Z','+00:00'))
        assert abs((datetime.datetime.now(datetime.timezone.utc)-calculated).total_seconds())<120
        receipt['emptyStorageReadback']=storage
        save()

    video_path=SOURCE/entry['file']
    if args.phase=='prepare':
        assert not receipt.get('state')
        collection=request('GET','/collections/'+COLLECTION)
        assert collection.get('guid')==COLLECTION and collection.get('videoLibraryId')==670679
        assert collection.get('name')==plan['collectionName']
        SOURCE.mkdir()
        subprocess.run(['gh','run','download',str(entry['sourceRun']),'--repo',plan['repository'],'--name',entry['artifact'],'--dir',str(SOURCE)],check=True)
        assert video_path.is_file() and video_path.stat().st_size==entry['bytes']
        assert sha(video_path)==entry['sha256']
        assert sha(SOURCE/'assembly.en.json')==entry['assemblySHA256']
        assert sha(SOURCE/'timeline.en.json')==entry['timelineSHA256']
        receipt['sourceVerified']=True
        receipt['sourceFileSHA256']=sha(video_path)
        # Exact title matching is scoped to this one existing course collection.
        result=request('GET','/videos?'+urllib.parse.urlencode({'collection':COLLECTION,'page':1,'itemsPerPage':100}))
        assert result['totalItems']<=100 and len(result['items'])==result['totalItems']
        candidates=[v for v in result['items'] if v['title']==entry['title']]
        assert len(candidates)<=1, 'Duplicate title requires owner reconciliation'
        if entry['existing']:
            assert entry['existing']['putCallsAtPause']==0
            assert len(candidates)==1 and candidates[0]['guid']==entry['existing']['guid']
        if candidates:
            receipt['guid']=candidates[0]['guid']
            video=read_video()
            if video.get('originalHash'):
                assert video['originalHash'].lower()==entry['sha256']
                receipt['alreadyUploaded']=True
            else:
                empty(video)
                receipt['alreadyUploaded']=False
        else:
            assert entry['existing'] is None
            receipt['alreadyUploaded']=False
        save('SOURCE_VERIFIED_CREATE_OR_REUSE_INTENT')
    elif args.phase=='resolve':
        assert receipt['state']=='SOURCE_VERIFIED_CREATE_OR_REUSE_INTENT'
        durable('DURABLE_INTENT_ARTIFACT_ID')
        if not receipt.get('guid'):
            assert receipt['createCalls']==0
            receipt['createCalls']=1
            save('CREATE_REQUEST_INTENT_RECORDED')
            result=request('POST','/videos',data={'title':entry['title'],'collectionId':COLLECTION})
            guid=result['guid']
            assert str(uuid.UUID(guid))==guid
            receipt['guid']=guid
            save('GUID_RECEIVED')
        video=read_video()
        if video.get('originalHash'):
            assert video['originalHash'].lower()==entry['sha256']
            receipt['alreadyUploaded']=True
        else:
            empty(video)
        receipt['putIntent']={'guid':receipt['guid'],'sourceSHA256':entry['sha256'],'bytes':entry['bytes'],'maxAttempts':1,'automaticTranscription':False,'smartGeneration':False}
        save('GUID_AND_PUT_INTENT_READY_FOR_DURABLE_SAVE')
    elif args.phase=='upload':
        assert receipt['state']=='GUID_AND_PUT_INTENT_READY_FOR_DURABLE_SAVE'
        durable('DURABLE_GUID_ARTIFACT_ID')
        assert receipt['putCalls']==0 and sha(video_path)==entry['sha256']
        video=read_video()
        if video.get('originalHash'):
            assert video['originalHash'].lower()==entry['sha256']
            save('EXACT_SOURCE_ALREADY_PRESENT_NO_PUT')
        else:
            empty(video)
            receipt['putCalls']=1
            save('PUT_REQUEST_INTENT_RECORDED')
            query=urllib.parse.urlencode({k:'false' for k in ['transcribeEnabled','generateTitle','generateDescription','generateChapters','generateMoments']})
            try:
                result=request('PUT','/videos/'+receipt['guid']+'?'+query,binary=video_path)
                assert result.get('success') is True
                receipt['uploadAcknowledgement']={k:result.get(k) for k in ['success','statusCode','message']}
                save('UPLOAD_ACKNOWLEDGED_PENDING_PROCESSING')
            except RuntimeError:
                save('PUT_OUTCOME_UNKNOWN_READBACK_ONLY')
                # Next phase reconciles this one PUT without repeating it.
    else:
        assert receipt['state'] in ['EXACT_SOURCE_ALREADY_PRESENT_NO_PUT','UPLOAD_ACKNOWLEDGED_PENDING_PROCESSING','PUT_OUTCOME_UNKNOWN_READBACK_ONLY']
        for attempt in range(18):
            video=read_video()
            original=video.get('originalHash')
            if original:
                assert original.lower()==entry['sha256'], 'Original source mismatch'
                receipt['originalSourceVerified']=True
            if receipt.get('originalSourceVerified') and video['status']==4 and video['encodeProgress']==100 and video['length']>0 and video['width']>0 and video['height']>0:
                receipt['embedURL']='https://iframe.mediadelivery.net/embed/670679/'+receipt['guid']+'?autoplay=false&preload=false'
                save('SOURCE_HASH_VERIFIED_PROCESSED_READY_NATIVE_PLAYBACK_PENDING')
                break
            assert video['status'] not in [5,6,8], 'Provider processing failed; no retry'
            if attempt<17:
                time.sleep(10)
        else:
            save('TRANSFER_PROCESSING_HELD_READBACK_ONLY_NO_RETRY')
            raise RuntimeError('Not verified ready within bounded reads')
    print(json.dumps({'key':entry['key'],'state':receipt['state'],'guid':receipt.get('guid'),'createCalls':receipt['createCalls'],'putCalls':receipt['putCalls']}))


if __name__=='__main__':
    main()
