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
    blocked={x['hash'] for x in p.read(ROOT/'editorial-review.json')['rejectedContentHashes']}
    for spec in PLAN['lessons']:
        lid=spec['id']
        if lid=='SOIL-U1-L03':
            records.append({'id':lid,'order':spec['order'],'unit':int(str(spec['unit']).replace('U','')),'type':spec['type'],'reusedPilot':True,'ready':True,
                            'title':{loc:p.content(loc)['subtitle'] for loc in LANG}})
            continue
        folder=ROOT/'output'/lid
        if not (folder/'authoring-receipt.json').exists():continue
        receipt=p.read(folder/'authoring-receipt.json')
        if receipt.get('status')!='authored-and-automatically-checked':continue
        if any(c['contentHash'] in blocked for c in receipt['locales'].values()):continue
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
            p.write(course/(loc+'.json'),authored)
            p.write(CAT/lid/(loc+'.json'),authored)
            titles[loc]=authored['subtitle']
        visuals=p.read(folder/'en.json')['visuals']
        assert len(visuals)==3
        vp=p.read(ROOT.parent/'course/visuals.json')
        vp['assets']=[{'id':lid.lower()+'-'+a['id'],'scenes':a['scenes'],'subject':a['subject']} for a in visuals]
        contract={'version':1,'reviewModel':'gemini-2.5-flash','maxRepairsPerAsset':1,
                  'global':p.read(ROOT.parent/'course/visual-contract.json')['global'],
                  'assets':{lid.lower()+'-'+a['id']:[{'id':'condition-'+str(i),'requirement':s} for i,s in enumerate(a['checks'])] for a in visuals}}
        p.write(course/'visuals.json',vp);p.write(course/'visual-contract.json',contract)
        p.write(pkg/'authoring-receipt.json',receipt)
        records.append({'id':lid,'order':spec['order'],'unit':spec['unit'],'type':spec['type'],'reusedPilot':False,
                        'ready':True,'title':titles,'sourcePages':base['source']['physicalPages'],'media':{}})
    index={'courseId':'SOIL','locales':list(LANG),'lessons':records,'expected':34,'generated':len(records),'published':False}
    p.write(CAT/'index.json',index)
    print(json.dumps({'completeLessons':len(records),'expected':34}))
if __name__=='__main__':build()
