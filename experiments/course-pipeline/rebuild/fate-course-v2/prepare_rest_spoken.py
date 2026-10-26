from pathlib import Path
import json,hashlib,sys,re,shutil,datetime
R=Path(sys.argv[1]);B=Path(__file__).parent;now=datetime.datetime.now(datetime.timezone.utc).isoformat();sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
def load(p):return json.loads(p.read_text(encoding='utf8'))
def save(p,v):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
def text(p,s):
 with p.open('w',encoding='utf8',newline='\n') as f:f.write(s)
work=[]
for i in range(3,12):
 d=R/f'media-plan/FATE2-S{i:02}';m=load(d/'spoken-draft.en.json');L=R/f'lessons/FATE2-S{i:02}/lesson.public.json';j=load(L)
 assert [s['id'] for s in j['ar']['sections']]==[s['id'] for s in j['en']['sections']]
 for p in m['parts']:
  assert p['sourceLessonSHA256']==sha(L),(i,p['id'],'stale source binding')
  assert p['textSHA256']==hashlib.sha256(p['spokenText'].encode()).hexdigest()
 work.append((i,d,m,j,L))
H=R/'history/before-remaining-spoken';H.mkdir(exist_ok=False)
lex={'USDA-FSIS':'يو إس دي إيه، إف إس آي إس','FQPA':'إف كيو بي إيه','FFDCA':'إف إف دي سي إيه','FIFRA':'فيفرا','CCPR':'سي سي بي آر','JMPR':'جَي إم بي آر','CAC':'سي إيه سي','FDA':'إف دي إيه','EPA':'إي بي إيه','FAO':'فاو','Codex':'كودكس','EMRL':'إي إم آر إل','Delaney':'ديلاني','IUPAC':'آيوباك','LOD':'إل أو دي','LOQ':'إل أو كيو','EEC':'إي إي سي','OECD 305':'أو إي سي دي، تلاتميّة وخمسة','USACE':'يو إس إيه سي إي','BSAF':'بي إس إيه إف','BCF':'بي سي إف','BAF':'بي إيه إف','BMF':'بي إم إف','logKow':'اللوغاريتم العشري لمعامل توزيع الأوكتانول والمَيّه','LogKow':'اللوغاريتم العشري لمعامل توزيع الأوكتانول والمَيّه','Kow':'معامل توزيع الأوكتانول والمَيّه','LC50':'إل سي خمسين','NOEC':'نو إيك','LOEC':'لو إيك','MATC':'إم إيه تي سي','ACR':'إيه سي آر','CMC':'سي إم سي','CCC':'سي سي سي','NPIC':'إن بي آي سي','n-octanol':'نورمال أوكتانول','pH':'الرقم الهيدروجيني','QSAR':'كيو إس إيه آر','PHI':'بي إتش آي','DT50':'دي تي خمسين','mPa':'مِلِّي باسكال','mmHg':'ملّيمتر زئبق','N/m²':'نيوتن لكلّ متر مربّع','Pa':'باسكال','L/kg/day':'لتر لكلّ كيلوجرام في اليوم','L/kg':'لتر لكلّ كيلوجرام','mg/kg':'ملِّيجرام لكلّ كيلوجرام','mg/L':'ملِّيجرام لكلّ لتر','1/day':'واحد على اليوم','0.005':'صفر فاصلة صفر صفر خمسة','0.05':'صفر فاصلة صفر خمسة','0.001':'صفر فاصلة صفر صفر واحد'}
gemination={'المادة':'المادّة','مادة':'مادّة','المواد':'الموادّ','للمادة':'للمادّة','بالمادة':'بالمادّة','للمواد':'للموادّ','الميه':'المَيّه','ميه':'مَيّه','التعرض':'التعرّض','بالتعرض':'بالتعرّض','لتعرضه':'لتعرّضه','محدد':'محدَّد','محددة':'محدَّدة','محددين':'محدَّدين','المحددة':'المحدَّدة','السمية':'السُمِّيّة','سمية':'سُمِّيّة','يحدد':'يحدّد','تحدد':'تحدّد','نفرق':'نفرّق','نقسم':'نقسم','يغير':'يغيّر','تغير':'تغيّر','تتغير':'تتغيّر','كل':'كلّ','الكل':'الكلّ','بيقدموا':'بيقدّموا','التراكيز':'التراكيز'}
manual={
(7,'ratios'):'الصفحتين خمستاشر وستّاشر بيعرضوا عامل التركيز الحيوي، وعامل التراكم الحيوي، وعامل التراكم بين الكائن والرواسب، وعلاقة بخاصية التوزيع بين الأوكتانول والمَيّه. نبدأ بالبسط والمقام، مش بحفظ الاختصارات. لو تركيز المادّة في الكائن ملِّيجرام لكلّ كيلوجرام، وتركيز المَيّه ملِّيجرام لكلّ لتر، القسمة تدي لتر لكلّ كيلوجرام. النتيجة مش من غير وحدة، ومش نسبة مئويّة. نسبة الكائن للمَيّه في تصميم دخول مائي مناسب ممكن تساعد تقدير عامل التركيز الحيوي، بي سي إف. ومع أكتر من طريق تعرّض، يبقى سؤال عامل التراكم، بي إيه إف، أوسع. أمّا عامل التضخّم، بي إم إف، فنسبة بين الكائن وغذائه، على أساس وزن متوافق وتصميم يبرّر المقارنة. كِبَر الرقم مش في حدّ ذاته نسبة موت ولا جرعة آمنة.',
(7,'kinetic'):'الحركة مذكورة كعنوان في المصدر، وإحنا بنضيف نموذجًا تعليميًّا محدودًا. نفترض حجرة واحدة، وتركيز مَيّه ثابت، ودخولًا مائيًّا بس، ومعاملات ثابتة، ومن غير حدّ منفصل للنموّ أو الأيض. صافي معدّل تغيّر تركيز الجسم بيساوي معدّل الدخول ناقص معدّل الفقد. معدّل الدخول هو معامل الدخول مضروب في تركيز المَيّه، ومعدّل الفقد هو معامل الفقد مضروب في تركيز الجسم. وحدة معامل الدخول لتر لكلّ كيلوجرام في اليوم، ووحدة معامل الفقد واحد على اليوم. لو الصافي بقى صفرًا، تركيز الجسم ممكن يثبت مع استمرار الدخول والخروج. دي حالة مستقرّة حركيًّا؛ مش معناها إنّ الجزيئات بطّلت تتحرّك، ولا إنّنا أثبتنا اتزانًا ترموديناميكيًّا. تحت الافتراضات دي، نسبة تركيز الجسم المستقرّ لتركيز المَيّه بتساوي معامل الدخول مقسومًا على معامل الفقد. لو المَيّه بتتغيّر، أو النموّ مهمّ، أو ملاءمة النموذج ضعيفة، ما نطبّقش النتيجة من غير مراجعة.',
(11,'sequence'):'مخطّط يانج في صفحة اتنين وعشرين بيبدأ بتكوين قطرات الرشّ، وبعده النقل للهدف، والاصطدام، وتكوُّن الترسيب، والحركة على النبات أو داخله، وبعدين الأثر الحيوي. ستّ مراحل مختلفة، وترتيبهم مهمّ. وصول القطرة مش هو بقاؤها، ولا دخول المادّة للنبات، ولا حدوث الأثر. ده مخطّط عمليات، مش ميزانيّة كتل قسناها. السهم ما يحدّدش كفاءة أو زمنًا أو جرعة، ومش معناه إنّ كلّ المادّة هتوصل للآخر. هنستخدمه عشان ننظّم الأسئلة، ونحافظ على فروع الفقد والتغيّر اللي موجودة فيه.',
(11,'before'):'قبل الوصول، المخطّط بيعرض الانجراف والتبخّر. وعند السطح بنراجع الارتداد والاحتفاظ. اصطدام قطرة بورقة مش ضمان إنّها هتفضل عليها كلّها؛ جزء ممكن يرتدّ، وفرع الفقد لازم يفضل ظاهر. حجم القطرات والتشغيل والتركيبة والجوّ ممكن يأثّروا على السيناريو. لكن الرسم ما فيهوش قيم تشغيل نقدر نحوّلها لوصفة. ما نختارش منه ضغطًا أو فونية أو جرعة حقيقيّة. نسمّي العامل، ونقول إيه الدليل اللي محتاجينه، بدل ما نخترع إعدادًا.',
(11,'deposit'):'بعد الاصطدام، نميّز الانتشار الديناميكي المرتبط بحركة القطرة، عن الانتشار الساكن اللي بيتحدّد بحالة السائل والسطح. المخطّط فيه كمان التجفيف، وإعادة التوزيع وتأثير الطقس، والدخول، والنشاط السطحي، والفقد. التجفيف مش اختفاء المادّة. ممكن يفضل ترسيب، وبعدها يتحرّك، أو ينشط على السطح، أو يحصل له فقد. الحركة على النبات غير الدخول داخله؛ والدخول لوحده ما يثبتش الأثر الحيوي المطلوب. عشان كده المشهد لازم يفرّق موضع المادّة وهويتها وحالتها عن دليل الاستجابة. لقطة مبهرة بتخلّي كلّ القطرة تدخل فورًا ممكن تعلّم علاقة غلط.',
(11,'influences'):'تسميات جنب المخطّط فيها خمس مجموعات: التشغيل والتركيبة؛ والجوّ والتشغيل؛ وخواص الرشّ والسطح؛ والجوّ؛ وحالة الترسيب والسطح. هنحافظ على المجموعات ومكان تأثيرها، من غير ما نحوّل العامل لنسبة فقد معلومة. موضع التسمية مش علاقة عدديّة. في التقرير النهائي، اختار مرحلة، وحدّد ملاحظة ممكن تتقاس، وفرع فقد محتمل، والظروف اللي محتاج تعرفها. مع غياب القياس، نفضل نقول محتمل. وبعدها اربط التسلسل بالتعرّض والخواص والتحوّل من الخطوات اللي فاتت؛ مش ستّ صور منفصلة وخلاص.'}
receipt=[]
for i,d,m,j,L in work:
 before={}
 for n in ['spoken-draft.en.json','script.ar.md','script.en.md']:
  f=d/n;dst=H/f.relative_to(R);dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,dst);before[n]=sha(f)
 for p in m['parts']:
  s=p['spokenText']
  if p['locale']=='ar-EG':
   if (i,p['sectionID']) in manual:s=manual[(i,p['sectionID'])]
   else:
    for a,b in sorted(lex.items(),key=lambda t:-len(t[0])):s=re.sub(r'(?<![A-Za-z0-9])'+re.escape(a)+r'(?![A-Za-z0-9])',lambda _:b,s)
    for a,b in gemination.items():s=re.sub(r'(?<![\w\u064b-\u065f])'+re.escape(a)+r'(?![\w\u064b-\u065f])',lambda _:b,s)
   if i==7 and p['sectionID']=='prediction':s=s.replace('a وb','المعامل أ والمعامل ب').replace('log','اللوغاريتم')
   if i==9 and p['sectionID']=='vapour':s=s.replace('0.001','صفر فاصلة صفر صفر واحد')
  else:
   if i==5:s=s.replace('0.005','zero point zero zero five')
   if i==7:s=s.replace('Net concentration change equals uptake the uptake coefficient times water concentration minus loss the loss coefficient times body concentration.','Net concentration change is the uptake rate minus the loss rate. The uptake rate is the uptake coefficient multiplied by water concentration; the loss rate is the loss coefficient multiplied by body concentration.').replace('five percent is 0.05','five percent is zero point zero five')
   if i==8:s=s.replace('the square root of NOEC multiplied by LOEC','the square root of the product of NOEC and LOEC')
   if i==9:s=s.replace('ten squared is one hundred and ten cubed is one thousand.','ten to the power of two equals one hundred. Ten to the power of three equals one thousand.').replace('one mPa equals 0.001 Pa, while Pa equals N/m²','one millipascal equals zero point zero zero one pascals, while a pascal is one newton per square metre')
  p['spokenText']=s;p['textSHA256']=hashlib.sha256(s.encode()).hexdigest();p['disclosure']='ordinary_public_explanation_or_already_public_worked_example; no private assessment keys';p['timing']='unknown_until_actual_recording'
 m['status']='spoken_request_reviewed_ready_for_funded_originals';m['updatedUTC']=now;m['reviewLimits']='Same-author semantic/terminology and spoken-number review; no actual/native acoustic certification before recording.';save(d/'spoken-draft.en.json',m)
 for locale,code in [('ar-EG','ar'),('en','en')]:text(d/f'script.{code}.md','# '+j[code]['title']+'\n\n'+'\n\n'.join('## '+p['voice']+' · '+p['sectionID']+'\n\n'+p['spokenText'] for p in m['parts'] if p['locale']==locale)+'\n')
 receipt.append({'step':j['id'] if 'id' in j else f'FATE2-S{i:02}','before':before,'afterSpokenSHA256':sha(d/'spoken-draft.en.json'),'sourceLessonSHA256':sha(L),'parts':len(m['parts'])})
save(R/'media-plan/remaining-spoken-review.en.json',{'utc':now,'reviewer':'Same author assistant; actual spoken Arabic and English passages read, scientific distinctions retained; no independent or native reviewer invented.','scope':'Steps03–11 spoken adaptation only; S02 has separate exact review.','changes':['Selective shadda and spoken scientific acronyms/units, not blanket qaf-to-hamza substitution.','S07 English rate wording de-duplicated and two flux terms made explicit; same model and dimensions.','S08 English square root explicitly scopes the full NOEC×LOEC product.','S09 English adjacent powers made separate sentences to avoid an audible110 interpretation.','S11 Egyptian adaptation retains six main stages, eleven side-process terms and five condition groups.'],'sourceAndPrivateAnswersChanged':False,'receipts':receipt,'next':'Generate originals on Actions with finite allocation, preserve before actual acoustic reviews; derive actual clocks only after qualification.'})
print(json.dumps({'steps':len(work),'parts':sum(len(x[2]['parts']) for x in work),'scope':'spoken only; no original PDF or existing accepted recording changed'}))
