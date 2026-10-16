"""Agent's visual-source observations. These are audit notes, not lesson edits."""
import worker as w

def literal_evidence(step,path):
 field=w.fields()[step+':'+path]
 quote=next(iter(w.anchors(field['text'],'proof').values()))['text']
 return {'fieldId':step+':'+path,'quote':quote,**{k:field[k] for k in ['step','path','role']}}

def supplement():
 item={'itemId':'V018-PPE-COMPARISON','page':18,'kind':'diagram','requirementEN':'Interpret the source PPE flowchart contrasting soil sampling with liquid-fertilizer application, including the specific protection listed for both tasks.','requirementAR':'قراءة مقارنة مهمات الوقاية في رسم الأصل بين أخذ عينة تربة وإضافة سماد سائل، مع تفاصيل المعدات المذكورة لكل مهمة.','quote':'PPE for different tasks','visualCheckNeeded':True,'visualSourceTranscriptionEN':'Soil sample: nitrile gloves, safety glasses, steel-toe boots, dust mask (N99). Liquid fertilizer: chemical-resistant suit, full-face respirator, chemical-resistant gloves, rubber boots with steel toe.','status':'partial','reasonAR':'الشرح يعلّم اختيار الوقاية بحسب المهمة وتقييم المخاطر وبيانات السلامة، ويذكر بعض المعدات. لكنه لا ينقل مقارنة الرسم وقائمتي المعدات بالتفاصيل الواردة في الأصل.','gapAR':'مقارنة المهمتين وقوائم الرسم المحددة، ومنها N99 وجهاز التنفس كامل الوجه. تعميم هذه القوائم يحتاج توثيقًا ومراجعة؛ تركها خارج المحتوى ليس إثباتًا أنها غُطيت.','deviationAR':'الشرح يعتمد الاختيار بحسب تقييم الخطر وبيانات السلامة بدل القائمتين المحددتين في رسم الأصل.','evidence':[literal_evidence('SOIL-U1-L01','/scenes/2/explanation'),literal_evidence('SOIL-U1-L01','/scenes/2/narration')],'globalSearchPerformed':True,'sourceDifferenceNeedsDisposition':True,'manualAgentReviewed':True,'humanReviewed':False,'locales':[]}
 for loc in ['ar-EG','it','de']:
  text=w.pointer(w.p.read(w.PRIVATE/'snapshot/SOIL-U1-L01'/(loc+'.json')),'/scenes/2/explanation')
  quote=next(iter(w.anchors(text,'proof').values()))['text']
  item['locales'].append({'itemId':item['itemId'],'locale':loc,'status':'aligned','reasonAR':'النسخة المقابلة تحفظ معنى الاختيار العام ومراعاة المهمة وبيانات السلامة؛ لا تعوّض التفاصيل الناقصة من رسم الأصل.','evidence':[{'text':quote,'locale':loc,'step':'SOIL-U1-L01','path':'/scenes/2/explanation'}],'humanReviewed':False,'manualAgentReviewed':True})
 return item

def annotate(rows):
 for row in rows:
  if row['itemId']=='P021-32c4ec96b0':
   row['manualAgentReviewed']=True
   row['visualSourceTranscriptionEN']='Heat exhaustion: heavy sweating; cool, pale, clammy skin; nausea/dizziness; headache/weakness. Source response: shaded area; sip water; loosen clothing; cool wet cloths. Heatstroke: high body temperature; hot red dry skin; rapid pulse; confusion/unconsciousness. Source response: emergency services; cool area; rapid cooling; continue until help arrives.'
   row['reasonAR']='الرسم الأصلي يفرّق بين حالتين ويعرض أعراضًا وإجراءات لكل واحدة. النص الموجود يذكر علامات عامة وإيقاف الشغل وطلب المساعدة، ولا يعلّم المقارنة التفصيلية.'
   row['gapAR']='تفاصيل المقارنة بين الإجهاد الحراري وضربة الحرارة، وعلامات وإجراءات كل حالة كما وردت في رسم الأصل. السلامة الطبية تحتاج مراجعة مناسبة قبل اعتماد أي صياغة إصلاح.'
   # Retain absence of the requested comparison. Generic related text is context,
   # not a claim that the required distinction was taught.
   row['relatedContextEvidence']=[literal_evidence('SOIL-U1-L02','/scenes/3/explanation')]
   row['requirementAR']='قراءة الرسم الذي يقارن الإجهاد الحراري بضربة الحرارة وفهم الفروق بينهما.'
  if row['itemId']=='P080-23ea134a21':
   row['manualAgentReviewed']=True
   row['visualSourceTranscriptionEN']='Table columns: Sample ID, Measurement, Units, Flags. * = Below Detection Limit; ^ = Above Reference Range. Example A003: <0.5 mg/L (*). Other units shown: micrograms/L and mg/kg.'
   row['rootReviewNoteAR']='فحص الرسم أظهر مفتاح علامتين وحد كشف، وليس مجرد جدول بأرقام ووحدات. لم يُعثر على تفسير حد الكشف أو مفتاح العلامتين في نصوص المحتوى المجمدة.'
   if row['status']=='covered':
    row['status']='partial';row['statusAR']='مغطّى جزئيًا'
   row['gapAR']='تفسير * أقل من حد الكشف و^ أعلى من المجال المرجعي، وطريقة قراءة نتيجة من نوع <0.5 مع وحدتها. '+row.get('gapAR','')
  if row['itemId']=='P119-71b794de17':
   row['manualAgentReviewed']=True
   row['visualSourceTranscriptionEN']='The original triangle shows the full named texture-class regions, percentages, boundary lines and Loam in the center.'
   row['rootReviewNoteAR']='فحص قالب الرسم الفعلي TextureTriangle.tsx وtexture-model.js أظهر شبكة مثلثية ومثال 40/40/20 ونقطة Loam؛ لا توجد مناطق التصنيف الاثنتا عشرة وحدودها وأسماؤها كما في مثلث الأصل. هذا دليل على شكل المعاينة، وليس تحققًا من كل MP4.'
   row['assetEvidence']=[{'path':str(w.ROOT.parent/'src/TextureTriangle.tsx'),'findingAR':'التسميات للرمل والغرين والطين وLoam والمثال 40/40/20 فقط.'},{'path':str(w.ROOT/'graphics/texture-model.js'),'findingAR':'شبكة وخطوط المثال؛ لا يُنشئ مناطق فئات USDA.'}]
   if row['status']=='covered':row['status']='partial';row['statusAR']='مغطّى جزئيًا'
   row['gapAR']='رسم تصنيفي كامل يتيح قراءة الفئات وحدودها، بدل عرض مثال نقطة واحدة فقط. '+row.get('gapAR','')
  if row['page']==31 and 'within 6 hours' in row['requirementEN']:
   row['sourceContextAR']='الست ساعات واردة داخل مثال لفقرة تقرير، وليست قاعدة عامة مستقلة لكل أنواع التحليل. يُراجع الحفاظ على المثال أو توثيق استبداله.'
   row['kind']='worked_example';row['kindAR']='مثال محلول'
   row['requirementAR']='الحفاظ على تفصيل نقل العينة خلال ٦ ساعات الوارد في مثال التقرير أو توثيق اختلاف المثال المنتج عنه.'
  if 'clay loam' in row['requirementEN'].lower() and 'sandy clay loam' not in row['requirementEN'].lower():
   row['requirementAR']=row['requirementAR'].replace('طينية رملية','لوم طيني (مزيجية طينية)')
 return rows

SOURCE_QUALITY_NOTES=[
 {'page':13,'relatedPages':[16,142],'noteAR':'جداول تصنيف الشريط لا تستخدم نفس ربط الفئة بالطول في كل المواضع. يجب تسجيل قرار المعالجة بدل جمعها كقاعدة واحدة.'},
 {'page':47,'noteAR':'الرسم الأصلي يحتوي تسميات وأرقام محور غير متسقة بصريًا. مطلوب توثيق مصدر أي رسم بديل؛ المطابقة لا تعتمد صلاحية الرسم علميًا.'},
 {'page':71,'noteAR':'الصفحة تسمي المثال 55% رمل و30% غرين و15% طين Sandy Clay Loam. يُراجع هذا التصنيف مقابل المرجع العلمي المستخدم ويسجل أي تصحيح؛ الحساب نفسه 55+30+15=100 صحيح.'},
 {'page':105,'noteAR':'الرسم يحتوي تسمية Magnesium (K) بينما K للبوتاسيوم في نص الصفحة نفسه. هذا تعارض داخلي واضح يُوثّق عند معالجة الرسم.'},
 {'page':130,'noteAR':'مواصفات المعدة وأرقام السرعة والاستهلاك والكتلة بالأصل تختلف عن الموديل المحدد لاحقًا بإذن المستخدم. لا تُنقل مواصفات موديل إلى آخر تلقائيًا.'},
 {'page':130,'noteAR':'إضافة غير مثبتة في مثال SOIL-U3-L10: سُمّي 65 سم عرض عمل للعزّاق، وادّعى مثال آخر أن دليل FQ650 يحدد 30 سم كأضيق شفرات. الدليل الرسمي، صفحة PDF 70 (المطبوعة 68)، يذكر Width 650 mm ضمن الأبعاد الخارجية؛ لم يثبت فيه الادعاء الخاص بأضيق شفرات 30 سم. الأرقام دي محتاجة تحقق قبل اعتماد الدرس، ونص الفيديو الحالي لا يحتويها.','supplementarySourceUrl':'https://cf.hondappsv.com/files/OM/OM001314PHL/42YX4G01_web.pdf','supplementaryPdfPage':70,'actualLessonFields':['SOIL-U3-L10:/scenes/0/example','SOIL-U3-L10:/scenes/5/example']},
]
