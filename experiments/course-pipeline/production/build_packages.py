"""Materialize reviewed drafts into isolated packages; exclude private assessment keys."""
import copy,json,sys,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent))
import pipeline as p
PLAN=p.read(ROOT.parent/'planning/curriculum-map.json')
OUT=ROOT/'packages'
CAT=ROOT.parent/'public/curriculum'
LANG={'en':'English','ar-EG':'مصري','it':'Italiano','de':'Deutsch'}
GEN={
 'en':{'learn':'Learn','practice':'Apply','check':'Check understanding','field':'With your trainer','assistant':'Course assistant','protocol':'Your task','review':'Course review','minutes':'min','revisit':'Explain the key decision tomorrow, then apply it to a new example next week.'},
 'ar-EG':{'learn':'اتعلم','practice':'طبّق','check':'اختبر فهمك','field':'مع المدرب','assistant':'مساعد المنهج','protocol':'مهمتك','review':'مراجعة المنهج','minutes':'دقيقة','revisit':'بكرة اشرح القرار الأساسي من ذاكرتك، وبعد أسبوع طبّقه على مثال جديد.'},
 'it':{'learn':'Impara','practice':'Applica','check':'Verifica','field':'Con il formatore','assistant':'Assistente del corso','protocol':'Il tuo compito','review':'Revisione del corso','minutes':'min','revisit':'Domani spiega a memoria la decisione chiave; la prossima settimana applicala a un esempio nuovo.'},
 'de':{'learn':'Lernen','practice':'Anwenden','check':'Verständnis prüfen','field':'Mit der Lehrkraft','assistant':'Kursassistent','protocol':'Deine Aufgabe','review':'Kursprüfung','minutes':'Min.','revisit':'Erkläre morgen die zentrale Entscheidung aus dem Gedächtnis und wende sie nächste Woche auf ein neues Beispiel an.'}}
def build():
    CAT.mkdir(parents=True,exist_ok=True);records=[]
    blueprints=p.read(ROOT/'blueprints.json');activities=p.read(ROOT/'activities.json')
    blocked={x['hash'] for x in p.read(ROOT/'editorial-review.json')['rejectedContentHashes']}
    for spec in PLAN['lessons']:
        lid=spec['id']
        if lid=='SOIL-U1-L03':
            records.append({'id':lid,'order':spec['order'],'unit':int(str(spec['unit']).replace('U','')),'type':spec['type'],'reusedPilot':True,'ready':True,
                            'title':{loc:p.content(loc)['subtitle'] for loc in LANG}})
            continue
        pending={'id':lid,'order':spec['order'],'unit':int(str(spec['unit']).replace('U','')),'type':spec['type'],'ready':False,'title':{'en':spec['en'],'ar-EG':spec['title']}}
        folder=ROOT/'output'/lid
        if not (folder/'authoring-receipt.json').exists():
            records.append(pending);continue
        receipt=p.read(folder/'authoring-receipt.json')
        if receipt.get('status')!='authored-and-automatically-checked':
            records.append(pending);continue
        if receipt.get('canonicalActivityHash')!=p.digest(activities[lid]) or receipt.get('canonicalNarrationHash')!=p.digest(blueprints[lid]) or any(c['contentHash'] in blocked for c in receipt['locales'].values()):
            records.append(pending);continue
        pkg=OUT/lid;course=pkg/'course';course.mkdir(parents=True,exist_ok=True)
        base=p.read(ROOT.parent/'course/manifest.json')
        base.update(lessonId=lid,scope='full-course-authorized-isolated-preview',scenario={'simulated':True,'context':spec['en']})
        base['source']['physicalPages']=[n for a,b in spec['pageRanges'] for n in range(a,b+1)]
        p.write(course/'manifest.json',base)
        titles={}
        for loc in LANG:
            authored=p.read(folder/(loc+'.json'))
            assert receipt['locales'][loc]['contentHash']==p.digest(authored),'Authored data no longer matches review'
            private=authored.pop('trainerAssessment')
            p.write(ROOT/'private/assessments'/lid/(loc+'.json'),private)
            authored.pop('visuals')
            ui=p.read(ROOT.parent/'course'/(loc+'.json'))['ui'];ui.update(GEN[loc])
            ui['protocolText']=authored['activity']['task']
            ui['minutes']=str(spec['onlineMinutes'][0])+'–'+str(spec['onlineMinutes'][1])+' '+GEN[loc]['minutes']
            ui['revisit']=authored['retrieval']['tomorrow']+' '+authored['retrieval']['week']
            authored.update(name=LANG[loc],dir='rtl' if loc=='ar-EG' else 'ltr',ui=ui,
                            eyebrow='MASAARAT · SOIL',sourcePages=base['source']['physicalPages'],
                            status='automatically-checked-draft',institutionallyApproved=False)
            authored['references']=[{'title':r['title'],'url':r['url']} for r in PLAN['references']]
            authored['references'] += [{'title':r['organization'],'url':r['url']} for r in p.read(ROOT/'primary-reference-notes.json') if lid in r['lessons']]
            if lid in ['SOIL-U3-L10','SOIL-U3-L11','SOIL-U3-L12']:
                authored['references'].append({'title':'Honda FQ650 owner manual','url':p.read(ROOT/'machine-reference.json')['manualUrl']})
            p.write(course/(loc+'.json'),authored)
            p.write(CAT/lid/(loc+'.json'),authored)
            titles[loc]=authored['subtitle']
        controlled=p.read(ROOT/'visual-blueprints.json')
        visuals=[{'id':'v'+str(i+1),'scenes':['s'+str(i*2+1).zfill(2),'s'+str(i*2+2).zfill(2)],'subject':subject,'checks':['Depicts the intended objects in their stated conditions: '+subject]} for i,subject in enumerate(controlled[lid])] if lid in controlled else p.read(folder/'en.json')['visuals']
        assert len(visuals)==3
        vp=p.read(ROOT.parent/'course/visuals.json')
        vp['assets']=[{'id':lid.lower()+'-'+a['id'],'scenes':a['scenes'],'subject':a['subject']} for a in visuals]
        contract={'version':1,'reviewModel':'gemini-2.5-flash','maxRepairsPerAsset':1,
                  'global':p.read(ROOT.parent/'course/visual-contract.json')['global'],
                  'assets':{lid.lower()+'-'+a['id']:[{'id':'condition-'+str(i),'requirement':s} for i,s in enumerate(a['checks'])] for a in visuals}}
        p.write(course/'visuals.json',vp);p.write(course/'visual-contract.json',contract)
        p.write(pkg/'authoring-receipt.json',receipt)
        records.append({'id':lid,'order':spec['order'],'unit':spec['unit'],'type':spec['type'],'reusedPilot':False,
                        'ready':True,'revision':receipt['locales']['en']['contentHash'],'title':titles,'sourcePages':base['source']['physicalPages'],'media':{}})
    for record in records:
        if record.get('reusedPilot') or not record.get('ready'):continue
        lid=record['id'];pkg=OUT/lid
        record['media']={}
        vr=pkg/'output/visuals/receipt.json'
        if vr.exists() and p.read(vr).get('qualityPassed'):
            record['images']=True;record['visualFiles']={}
            for asset in p.read(vr)['assets']:
                target=CAT/'media'/lid/'visuals'/asset['filename'];target.parent.mkdir(parents=True,exist_ok=True)
                shutil.copyfile(pkg/'output/visuals'/asset['filename'],target)
                for scene in asset['scenes']:record['visualFiles'][scene]=asset['filename']
        for loc in LANG:
            media=pkg/'output'/loc;rp=media/'receipt.json'
            if not rp.exists():continue
            r=p.read(rp)
            if not r.get('generated') or not r.get('automatedAudioReview',{}).get('passed'):continue
            for name in ['lesson.mp4','master.wav','captions.vtt','transcript.txt']:
                target=CAT/'media'/lid/loc/name;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(media/name,target)
            record['media'][loc]={'generated':True,'sha256':r['verification']['sha256'],'duration':r['verification']['durationSeconds']}
    index={'courseId':'SOIL','locales':list(LANG),'lessons':records,'expected':34,'generated':sum(bool(r.get('ready')) for r in records),'published':False}
    p.write(CAT/'index.json',index)
    print(json.dumps({'completeLessons':sum(bool(r.get('ready')) for r in records),'expected':34}))
if __name__=='__main__':build()
