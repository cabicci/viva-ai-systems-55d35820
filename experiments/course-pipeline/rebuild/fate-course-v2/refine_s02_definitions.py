from pathlib import Path
import json,hashlib,re,shutil,datetime,sys
R=Path(sys.argv[1]);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest();now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def save(p,v):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
L=R/'lessons/FATE2-S02/lesson.public.json';assert sha(L)=='881d4f0c5f199d40590be1efbcce2cab06f83c6cfa33f91abb716da3b4a65ed1'
H=R/'history/before-s02-definition-completion';H.mkdir(exist_ok=False);before={}
rels=['lessons/FATE2-S02/lesson.public.json','lessons/FATE2-S02/lesson.ar.md','lessons/FATE2-S02/lesson.en.md','preview/index.html','media-plan/FATE2-S02/spoken-draft.en.json','media-plan/FATE2-S02/script.ar.md','media-plan/FATE2-S02/script.en.md','media-plan/FATE2-S02/scene-plan.en.json','media-plan/FATE2-S02/interaction-contract.en.json']
for rel in rels:
 p=R/rel;before[rel]=sha(p);d=H/rel;d.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,d)
x=load(L);old={}
arabic='الحدّ الأقصى لمتبقّيات المبيدات، MRL، في تعريف كودكس هو أعلى تركيز لمتبقّي مبيد توصي هيئة الدستور الغذائي بالسماح القانوني بوجوده في الغذاء أو العلف أو عليه. هو مرتبط بسلعة وتعريف متبقّي محدَّدين، ومبني على بيانات الممارسات الزراعية الجيدة مع التقييم العلمي. ده يوضح وظيفته، لكنه مش جرعة شخصيّة؛ والحدّ الساري في سوق معيّن لازم يتراجع من نظامه المعني.'
arabic2='المدخول اليومي المقبول، ADI، يخصّ كمية المادة اللي يمكن تناولها يوميًّا طول العمر، ويبدو إنها لا تحمل مخاطرة صحية يُعتدّ بيها حسب المعلومات المعروفة وقت التقييم. بيتعبّر عنه بالنسبة لوزن الجسم؛ وفي حساب المدخول اليومي بنوضّح كمان أساس اليوم. ده مرجع لتقييم التعرض طويل المدى، مش حدّ تركيز لعينة غذاء، ومش ضمانًا مطلقًا لكل حالة. المرجع التفسيري هنا هو قاموس Codex؛ القيمة الفعلية لازم تتجاب للمادة والحالة المعنيتين.'
english='In Codex, an MRL is the maximum pesticide-residue concentration that the Codex Alimentarius Commission recommends should be legally permitted in or on food commodities or animal feed. It refers to a particular commodity and residue definition and is based on good-agricultural-practice residue data and scientific assessment. This regulatory function does not make it an individual dose; the operative limit in a particular market must be checked in its applicable system.'
english2='An ADI concerns the amount of a chemical that may be taken in daily over an entire lifetime and appears to be without appreciable health risk on the evidence known at the evaluation. It is expressed relative to body weight; the daily-intake calculation also makes the daily time basis explicit. It is a chronic-exposure reference, not a food-sample concentration limit or an absolute guarantee for every situation. These meanings follow the Codex glossary; retrieve the actual value for the substance and assessment concerned.'
for lang,paras in [('ar',[arabic,arabic2]),('en',[english,english2])]:
 sec=x[lang]['sections'][0];assert sec['id']=='two-denominators' and len(sec['paragraphs'])==2
 old[lang]=sec['paragraphs'][1];sec['paragraphs']=sec['paragraphs'][:1]+paras
save(L,x)
for lang,paras in [('ar',[arabic,arabic2]),('en',[english,english2])]:
 p=R/f'lessons/FATE2-S02/lesson.{lang}.md';s=p.read_text(encoding='utf8');assert s.count(old[lang])==1;text(p,s.replace(old[lang],'\n\n'.join(paras)))
d=load(R/'media-plan/FATE2-S02/spoken-draft.en.json')
for p in d['parts']:
 p['sourceLessonSHA256']=sha(L)
 if p['sectionID']=='two-denominators':
  if p['locale']=='ar-EG':
   p['spokenText']='في الخطوة اللي فاتت حسبنا كتلة متبقّي في حصّة أكل. دلوقتي قدّامنا رقم بوحدة ملِّيجرام لكلّ كيلوجرام غذاء، ورقم تاني بوحدة ملِّيجرام لكلّ كيلوجرام من وزن الجسم في اليوم. هل نقارنهم على طول؟ لأ. أوّل مقام يخصّ الغذاء، والتاني يخصّ وزن الجسم ومعاه أساس زمني. في كودكس، الحدّ الأقصى للمتبقّيات، إم آر إل، هو أعلى تركيز توصي هيئة الدستور الغذائي بالسماح القانوني بوجوده في الغذاء أو العلف أو عليه، لسلعة وتعريف متبقّي محدَّدين. ده مش جرعة شخصيّة. أمّا المدخول اليومي المقبول، إيه دي آي، فبيخصّ كمية المادة اللي ممكن تتاخد يوميًّا طول العمر، ويبدو إنها من غير مخاطرة صحّيّة يُعتدّ بيها، حسب الدليل المعروف وقت التقييم. بيتنسب لوزن الجسم، ونوضّح أساس اليوم في حسابنا. ده مرجع لتقييم طويل المدى، مش حدّ تركيز لعيّنة، ولا ضمان مطلق. والقيمة الفعليّة والحدّ الساري لازم نرجع فيهم للمادة والحالة والنظام المعني.'
  else:
   p['spokenText']='The previous step calculated residue mass in a food portion. Now compare the units of two figures: milligrams per kilogram of food, and milligrams per kilogram of body weight per day. The first denominator is food mass; the second includes body mass and a time basis. In Codex, an MRL is the maximum pesticide-residue concentration recommended to be legally permitted in or on a food commodity or animal feed, for the specified commodity and residue definition. It is not an individual dose. An ADI concerns daily intake over an entire lifetime that appears to be without appreciable health risk on the evidence known at evaluation. It is expressed relative to body weight, with the daily basis explicit in our calculation. This chronic-exposure reference is not a food-sample concentration limit or an absolute guarantee. Retrieve actual values and operative limits for the substance, situation and applicable system.'
  p['textSHA256']=hashlib.sha256(p['spokenText'].encode()).hexdigest()
d['updatedUTC']=now;d['definitionCompletion']='Codex ADI lifetime/appreciable-risk qualifiers and MRL recommended legally-permitted function explicitly included before TTS.';save(R/'media-plan/FATE2-S02/spoken-draft.en.json',d)
for locale,code in [('ar-EG','ar'),('en','en')]:text(R/f'media-plan/FATE2-S02/script.{code}.md','# '+x[code]['title']+'\n\n'+'\n\n'.join('## '+p['voice']+' · '+p['sectionID']+'\n\n'+p['spokenText'] for p in d['parts'] if p['locale']==locale)+'\n')
for rel in ['media-plan/FATE2-S02/scene-plan.en.json','media-plan/FATE2-S02/interaction-contract.en.json']:
 p=R/rel;j=load(p)
 if 'sourceLessonSHA256' in j:j['sourceLessonSHA256']=sha(L)
 if 'sourceSHA256' in j:j['sourceSHA256']=sha(L)
 if 'spokenRequestSHA256' in j:j['spokenRequestSHA256']=sha(R/'media-plan/FATE2-S02/spoken-draft.en.json')
 save(p,j)
html=(R/'preview/index.html').read_text(encoding='utf8');m=re.search(r'(<script[^>]*id="public-data"[^>]*>)(.*?)(</script>)',html,re.S);assert m;data=json.loads(m[2]);visuals=data['lessons']['FATE2-S02'].get('visuals');data['lessons']['FATE2-S02']=x
if visuals:data['lessons']['FATE2-S02']['visuals']=visuals
text(R/'preview/index.html',html[:m.start(2)]+json.dumps(data,ensure_ascii=False,separators=(',',':'))+html[m.end(2):])
save(R/'media-plan/FATE2-S02/definition-review.en.json',{'utc':now,'reviewer':'Same author assistant, source-bound semantic review; no independent native/subject certification.','finding':'Earlier text distinguished dimensions but abbreviated the defining regulatory/lifetime meaning of MRL/ADI. Complete the main teaching meaning before speech generation.','primaryEvidence':[{'url':'https://codex.fao.org/codex-texts/codex-online-databases/pesticides-residues/glossary','locator':'ADI definition and MRL definition/derivation, actual page reopened26Oct2026','checked':'Lifetime and without-appreciable-risk knowledge qualifier; maximum recommended legally-permitted commodity concentration; scientific/GAP basis.'},{'url':'https://www.epa.gov/laws-regulations/summary-food-quality-protection-act','locator':'Tolerances/FQPA requirements, actual page reopened26Oct2026','checked':'Aggregate exposure from one pesticide across sources; cumulative common-mechanism scope, retained contextual teaching.'}],'beforeHashes':before,'afterLessonSHA256':sha(L),'afterSpokenSHA256':sha(R/'media-plan/FATE2-S02/spoken-draft.en.json'),'affectedConsumers':['Arabic/English reading','Arabic/English spoken first passage','Embedded learner reading','Scene/source identities','Interaction source identity'],'notChanged':['Numerical cases','Private assessment keys','Existing accepted audio/video','Other steps','Original PDF'],'audioGenerated':False,'timings':'Pending actual future recording; existing accepted first-step clocks unaffected.'})
print(json.dumps({'lessonSHA256':sha(L),'spokenSHA256':sha(R/'media-plan/FATE2-S02/spoken-draft.en.json'),'consumersReconciled':True}))
