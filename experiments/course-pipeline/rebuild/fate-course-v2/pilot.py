"""Author one new bilingual written pilot; no media/provider calls."""
from pathlib import Path
from datetime import datetime,timezone
import json,hashlib

P=next(p for p in Path(__file__).resolve().parents if (p/'HANDOVER.md').exists())
R=P/'rebuild-v2'
C=P.parent/'Masaarat — Temporary'
registry=json.loads((C/'PORTABLE-STATE/registry.json').read_text(encoding='utf8'))
state=json.loads((C/registry['storage_root']/'projects/82922e08-4caf-48f5-b72e-ab2e6a87c51c/state.json').read_text(encoding='utf8'))
assert not state.get('active_session') and not state.get('external_writer')
assert not (R/'lessons/FATE2-S01').exists(), 'Inspect an existing pilot rather than overwrite it'
def save(rel,value):
 p=R/rel;p.parent.mkdir(parents=True,exist_ok=True)
 with p.open('x',encoding='utf8',newline='\n') as f:f.write(value if isinstance(value,str) else json.dumps(value,ensure_ascii=False,indent=2)+'\n')

lesson={'id':'FATE2-S01','version':'written-pilot-v1','sourcePages':[3,4,5,6],
 'sourceItems':['SRC01-P03-T01','SRC01-P03-T02','SRC01-P03-T03','SRC01-P04-FIG01']+[f'SRC01-P{page:02}-TAB1-R{row:02}' for row,page in [(1,4),(2,4),(3,4),(4,4),(5,5),(6,5),(7,5),(8,5),(9,5),(10,5),(11,5),(12,5),(13,5),(15,5),(16,5),(17,6),(18,6),(19,6),(20,6)]],
 'status':'draft_for_owner_content_review_not_media_complete',
 'ar':{
 'title':'متبقي المبيد: من رقم التحليل لاستنتاج عليه دليل',
 'intro':'إزاي تقرأ نتيجة معمل، تحسب اللي في حصة أكل، وتعرف حدود الاستنتاج قبل ما تحكم على الضرر؟',
 'outcomes':['تميّز بين متبقي المبيد، والتعرّض، وقابلية إحداث الضرر، وتقدير المخاطر.','تحوّل كتلة الغذاء وتحسب كمية المتبقي في حصة، بوحدات واضحة وافتراضات معلنة.','تبني مسار تعرّض محتمل وتحدّد إيه اللي يحتاج قياسًا فعلًا.','تراجع صفًا من جدول علمي وتفصل هوية المادة عن ادعاءات تأثيرها.'],
 'sections':[
 {'id':'opening','title':'١. رقم صحيح ممكن يتبني عليه استنتاج غلط','paragraphs':[
 'تخيّل إن معاك تقرير بيقول إن عينة فلفل فيها متبقي مادة اسمها «ر». زميلك شاف اسم مبيد وقفز فورًا لاستنتاج عن صحة اللي أكلوا المحصول. المشكلة هنا إن التقرير بيجاوب سؤالًا عن المادة الموجودة في عينة؛ أمّا الاستنتاج عن أشخاص بعينهم فبيحتاج معلومات تانية. هدفنا مش إننا نهون من التلوث أو نهوّل فيه. هدفنا نعرف كل دليل يجاوب أنهي سؤال.',
 'هنمشي في سلسلة استدلال: نعرّف المادة والعينة، نفهم وحدة القياس، نحسب كمية في سيناريو محدد، وبعدها نسأل عن طريق التعرّض ودليل التأثير. لو حلقة ناقصة، بنسميها معلومة ناقصة. ما نكمّلهاش بتخمين.']},
 {'id':'residue','title':'٢. إيه اللي كلمة «متبقي» بتوصفه؟','paragraphs':[
 'المتبقي مادة محددة موجودة في أو على غذاء أو سلعة نتيجة استخدام مبيد. وتعريف المتبقي في طريقة تحليل أو تقييم ممكن يشمل المادة الأصلية ونواتج تحوّل أو أيض محددة لها أهمية سمّية. علشان كده، معرفة اسم المبيد وحده مش دايمًا كفاية: لازم نعرف التحليل قاس إيه بالضبط، وبأي تعريف.',
 'كمان «العينة» لها حدود: هل التحليل على الثمرة كلها ولا الجزء المأكول؟ على وزن طازج ولا جاف؟ وهل العينة ممثلة للكمية اللي بنتكلم عنها؟ في التدريب هنفترض بيانات واضحة ومتجانسة. في تقرير حقيقي، دي أسئلة لازم تتراجع قبل نقل الرقم لحصة أو لشحنة كاملة.',
 'وجود رقم تحليلي ما يحدّدش لوحده سبب وجود المادة: ممكن نحتاج سجلات الاستخدام أو بيانات بيئية علشان نميّز المصادر المحتملة. ووجود المتبقي مش تشخيص تسمم. برضه غياب اسم من تقرير محدود التحليل مش شهادة إن مفيش أي مادة أخرى.']},
 {'id':'dimensions','title':'٣. التركيز، والكمية، والجرعة: ثلاث أسئلة','paragraphs':[
 'التركيز في الغذاء بيقول لنا كمية مادة لكل كتلة غذاء، مثل `mg/kg food`. أمّا كمية المتبقي في حصة فبوحدة كتلة للمادة، مثل `mg`. عشان ننتقل من الأول للتاني، نحتاج كتلة الغذاء في الحصة. الوحدة اللي تحت الكسر جزء من معنى الرقم؛ حذفها بيغيّر السؤال.',
 'الكمية المبتلَعة في نموذج غذائي مش بالضرورة الكمية الممتصة للجسم. الامتصاص والتوزيع والتحول والإخراج موضوعات إضافية. ولو احتجنا مدخولًا بالنسبة لوزن الجسم، لازم نعرف وزن الجسم وأساس الزمن المناسب، ونصرّح بإن ده حساب مختلف. الخطوة التالية هتفصل المقياس ده عن حد التركيز في الغذاء.',
 'قبل الحساب اكتب: المعطى، المطلوب، التحويل، الافتراض، ثم الاستنتاج. نتيجة الحساب من غير الافتراض ممكن تبدو أدق من الدليل اللي بنيت عليه.']},
 {'id':'risk','title':'٤. نفصل دليل الضرر عن دليل التعرّض','paragraphs':[
 'قابلية إحداث الضرر، أو `hazard`، سؤال عن أنواع الآثار اللي ممكن المادة تسببها تحت ظروف معينة. التعرّض، أو `exposure`، سؤال عن مين اتلامس مع المادة، وبأي طريق، وكمية، وتكرار ومدة. تقدير المخاطر بيجمع أدلة الضرر والعلاقة بين الجرعة والاستجابة وأدلة التعرّض، مع حدود المعرفة.',
 'لذلك وصف أثر في تجربة ما بيتحوّلش تلقائيًا لحكم على كل مستهلك. والعكس: مجرد إن التعرض قليل لا يكفي للحكم من غير معرفة المادة ونوع الأثر. هنلتزم باستنتاج يناسب السيناريو، وهنكتب البيانات الناقصة بدل حكم مطلق.',
 'مثال استدلال: تقرير غذاء يدعم وجود متبقٍ وفق طريقة محددة. سجل استهلاك وكمية غذاء ممكن يدعم تقدير مدخول. دراسة مناسبة للتأثير مع بيانات التعرّض تدخل في تقييم المخاطر. كل خطوة أضافت نوعًا مختلفًا من الدليل؛ ما ينفعش نستبدلهم ببعض.']},
 {'id':'pathway','title':'٥. نقرأ رسم المسارات باعتباره أسئلة للقياس','paragraphs':[
 'رسم صفحة ٤ يربط المتبقيات بالإنسان، والنباتات والمياه والتربة، والحياة البرية والأسماك والطيور، والحشرات النافعة. نستخدمه كبداية لخريطة علاقات محتملة. السهم في الرسم ما فيهوش وحده تركيزًا، ولا جرعة، ولا قياس ضرر.',
 'خد مسارًا واحدًا: مصدر في الحقل، ثم جريان سطحي محتمل، ثم مياه مجرى، ثم تماس كائن مائي بالمادة. وجود المسار كفكرة ما يثبتش إنه حدث، وقياس المادة في المياه ما يثبتش وحده أثرًا في الكائن. نحتاج هوية المادة، وقياسًا في الوقت والمكان المناسبين، وبيانات تناسب سؤال التأثير.',
 'بنفس المنطق، وجود مادة في تربة أو غذاء ما يخلّيناش نفترض تلقائيًا إن كل الطيور أو النحل أو البشر اتعرضوا بنفس الطريقة. اختلاف الوسط والكائن والتوقيت بيغيّر البيانات المطلوبة.']},
 {'id':'critical-table','title':'٦. جدول الأضرار يتقرأ نقديًا، مش يتحفظ كأحكام نهائية','paragraphs':[
 'جدول الصفحات ٤–٦ بيجمع أسماء وصيغًا وآثارًا منسوبة للمبيدات. فيه ١٩ صفًا فعليًا، والترقيم بيقفز من ١٣ إلى ١٥. مش هنخترع مادة للرقم الناقص. وقبل تفسير أي أثر، نراجع إن الاسم والصيغة وهوية المادة متطابقين.',
 'في صف Methoxychlor، الصيغة المطبوعة تبدأ بـ `C6`، بينما المرجع الكيميائي الرسمي المستخدم في المراجعة يعطي `C16H15Cl3O2`. ده مثال على إن نقل الجدول حرفيًا ممكن ينقل خطأ. تصحيح الصيغة لا يثبت تلقائيًا صحة باقي ادعاءات الصف.',
 'بعد الهوية، اسأل عن الدراسة: النوع الحيوي، وطريق التعرّض، والكمية أو التركيز، والمدة، والأثر المقاس، والمجموعة المقارنة وعدم اليقين. عبارة واسعة مثل «يسبب ضررًا» من غير السياق ده لا تكفي لتقدير مخاطر حالة جديدة. إحنا هنا بنتعلّم نقد الدليل، مش بنقدّم تصنيفًا طبيًا أو قانونيًا لكل مادة في الجدول.']},
 {'id':'prevention','title':'٧. منع المشكلة يبدأ من الاستخدام المصرّح به','paragraphs':[
 'المصدر بيربط إنتاج الغذاء بالممارسات الزراعية الجيدة وبالتقييم العلمي. المعنى اللي نحتاجه هنا إن الاستخدام له شروط معتمدة تخص المنتج والمحصول والمكان، وإن إدارة المادة تمتد خلال دورة حياتها. الدرس ده مش وصفة رش، ولا تعليمات لتغيير الجرعة أو تقصير فترة قبل الحصاد.',
 'لو سؤالنا عن مطابقة غذاء لحد قانوني، نحتاج تعريف المتبقي والسلعة وأساس العينة والحد الساري للحالة. ولو السؤال عن مخاطر شخص، نحتاج تقييم تعرّض وأدلة سمّية مناسبة. في الخطوة الجاية هنفصل الحسابين ونعرف ليه رقم الحد في الغذاء مش هو رقم المدخول اليومي.']}
 ],
 'example':{'title':'مثال محلول: من التركيز لكمية في حصة','scenario':'بيانات افتراضية للتدريب فقط: تركيز متبقي «ر» في الفلفل 0.12 mg/kg food، وكتلة الحصة 250 g. نفترض صلاحية القياس، وتجانس الحصة، وإن التركيز المعلن يخص نفس الجزء وأساس الوزن. المطلوب كمية المتبقي في الحصة، مش الجرعة الممتصة ولا حكم على المأمونية.',
 'steps':[
 {'text':'نحوّل كتلة الغذاء لكيلوجرام علشان تتوافق مع مقام التركيز.','equation':'250 g / (1000 g/kg) = 0.250 kg food'},
 {'text':'نختار العلاقة ونكتب الوحدات قبل الضرب.','equation':'m_R = C_R * m_food'},
 {'text':'كتلة الغذاء في البسط والمقام بتختصر، فتتبقى كتلة المادة.','equation':'0.12 mg/kg food * 0.250 kg food = 0.030 mg'},
 {'text':'كفحص مستقل، نحول كمية المتبقي لوحدة أصغر.','equation':'0.030 mg = 30 microgram'}],
 'conclusion':'في النموذج والافتراضات المحددة، الحصة تحتوي على 0.030 mg من المتبقي «ر». ما حسبناش الامتصاص، ولا بقية الأغذية أو المياه أو التكرار، وما اتقارنش الرقم بحد مطابق. لذلك النتيجة لا تكفي لحكم على صحة شخص أو مطابقة شحنة.',
 'commonError':'الغلط الشائع إننا نضرب 0.12 في 250 من غير تحويل الجرام: الناتج بيكون أكبر ألف مرة، والوحدات لم تتوافق أصلًا.'},
 'guided':{'title':'تطبيق بإرشاد: الحساب وحدود الاستنتاج','scenario':'حالة افتراضية جديدة: تركيز 0.09 mg/kg food، وحصة 300 g. استخدم نفس افتراضات المثال. اكتب كتلة الغذاء بالكيلوجرام وكمية المتبقي بالملليجرام.','massLabel':'كتلة الغذاء بالكيلوجرام','amountLabel':'كمية المتبقي بالملليجرام','feedback':{'empty':'اكتب القيمتين كاملتين الأول. الخانة الفاضية مش صفر.','invalid':'اكتب رقمًا كاملًا، من غير وحدة أو نص في خانة الرقم.','mass':'راجع تحويل الجرام إلى كيلوجرام، وبعدين احسب الكمية.','amount':'التحويل صحيح. راجع ضرب التركيز في كتلة الغذاء، واختصار وحدة كتلة الغذاء.','unit':'المطلوب كمية المتبقي بوحدة mg. راجع الوحدة المختارة.','correct':'الحساب والوحدة صحيحان: 300 g = 0.300 kg، و0.09 × 0.300 = 0.027 mg. الخطوة الباقية في إجابتك: اشرح ليه ده مش قياسًا للكمية الممتصة ولا دليل ضرر.'}},
 'practice':['ارسم مسارًا محتملاً من استخدام مادة في حقل إلى كائن مائي. علّم على كل سهم: افتراض، ولا ملاحظة، ولا قياس؟','اكتب ملاحظة أو قياسًا ممكن يدعم التعرّض، وآخر يناسب سؤال التأثير. ما تخلطش وجود المادة بحدوث الأثر.','اكتب فقرة من أربع جمل للحالة: المعطى، والحساب، والاستنتاج المدعوم، ومعلومتان ناقصتان.'],
 'faq':[
 {'question':'هل وجود متبقي يساوي حدوث تسمم؟','answer':'وجود المادة وفق قياس محدد يثبت نتيجة تحليلية في نطاق الطريقة والعينة. الاستنتاج عن الضرر يحتاج أدلة تعرّض وتأثير مناسبة.'},
 {'question':'هل 0.030 mg هي نفس 0.12 mg/kg؟','answer':'لأ. الأول كمية مادة، والتاني تركيز بالنسبة لكتلة غذاء. الربط بينهم محتاج كتلة الغذاء والافتراضات المناسبة.'},
 {'question':'هل تصحيح صيغة مادة يكفي لاعتماد جدول الأضرار؟','answer':'لأ. هوية المادة شرط أول؛ ادعاءات التأثير نفسها تحتاج دراسة وسياقًا وأدلة مستقلة.'}],
 'summary':['ابدأ بالمادة والعينة وأساس القياس.','اكتب الوحدة والافتراض قبل الحساب.','فرّق بين وجود المتبقي والتعرّض والأثر وتقدير المخاطر.','انقل من المصدر معنى تدعمه أدلة، وسجّل ما لم يتحقق بعد.'],
 'next':'الخطوة التالية: حدود المتبقيات والمدخول اليومي، وليه الوحدات والسؤال مختلفان.'
 },
 'en':{
 'title':'Pesticide residues: from an analytical value to a supported conclusion',
 'intro':'Read a laboratory result, calculate the amount in a food portion, and identify what the evidence can establish.',
 'outcomes':['Distinguish a residue, exposure, hazard and risk characterisation.','Convert food mass and calculate residue amount using explicit units and assumptions.','Construct a possible exposure pathway and identify measurements still needed.','Critically examine chemical identity and effect claims in a source table.'],
 'sections':[
 {'id':'opening','title':'1. A correct measurement can support an incorrect inference','paragraphs':[
 'Imagine a laboratory report identifying residue R in a pepper sample. A colleague sees a pesticide name and immediately draws a conclusion about everyone who ate the crop. The report addresses a chemical quantity in a sample. A conclusion about particular people requires additional evidence. The task is to identify which question each piece of evidence can answer.',
 'Our reasoning sequence is to identify the substance and sample, interpret the units, calculate an amount under stated assumptions, and then ask about the exposure route and effect evidence. An unmeasured link remains an uncertainty; it must not be filled with a guess.']},
 {'id':'residue','title':'2. What does a residue describe?','paragraphs':[
 'A residue is a specified substance in or on a food or commodity resulting from pesticide use. Depending on the analytical or assessment purpose, the residue definition may include specified transformation products, metabolites or other substances of toxicological significance. A pesticide name alone therefore does not always identify precisely what the result measures.',
 'The sample also has a basis. Is the result for the whole commodity or the edible portion? Is it on a fresh- or dry-mass basis? Does the sample represent the material to which we want to apply the result? Training examples can state a uniform concentration. An actual report requires the sampling and measurement basis to be checked before extrapolating to a portion or an entire consignment.',
 'A concentration does not by itself establish the origin of the residue. Use records or environmental evidence may be needed. Detecting a residue is not a poisoning diagnosis; equally, a limited analytical report does not establish the absence of every unmeasured substance.']},
 {'id':'dimensions','title':'3. Concentration, amount and dose answer different questions','paragraphs':[
 'A food concentration, such as `mg/kg food`, expresses chemical mass relative to food mass. The amount in one portion is a chemical mass, such as `mg`. Connecting them requires the food mass. The denominator is part of the meaning of a measurement, not optional notation.',
 'An estimated ingested amount is not automatically an absorbed amount. Absorption, distribution, transformation and elimination require further information. An intake relative to body mass also requires body mass and a suitable time basis. The next step separates this calculation from comparison with a food concentration limit.',
 'Before calculating, list the given quantities, requested quantity, conversion, assumption and interpretation. A numerical result without its assumptions can imply greater certainty than the evidence provides.']},
 {'id':'risk','title':'4. Separate evidence of hazard from evidence of exposure','paragraphs':[
 'Hazard concerns potential adverse effects under specified conditions. Exposure concerns who encounters a substance, by which route, at what level and over what pattern of contact. Risk characterisation brings hazard, dose–response and exposure evidence together while acknowledging uncertainty.',
 'An effect reported in one experiment cannot automatically be assigned to every consumer. A small exposure estimate alone is also insufficient without relevant toxicity information. Conclusions must remain bounded by the evidence available for the stated scenario.',
 'An analytical food result can support a residue finding within its method and sample basis. A consumption record can contribute to an intake estimate. Suitable toxicity evidence and exposure information contribute to a risk assessment. These evidence types are not interchangeable.']},
 {'id':'pathway','title':'5. Read the pathway figure as a set of measurable questions','paragraphs':[
 'The source figure on page 4 links residues with people, plants, water, soil, wildlife, fish, birds and beneficial insects. It offers possible relationships, not measured concentrations or doses. An arrow does not quantify an adverse effect.',
 'Consider one route: a field source, possible runoff, a watercourse, then contact with an aquatic organism. A conceivable route does not prove that transfer occurred. Detecting a chemical in water does not by itself demonstrate a biological effect. Chemical identity, relevant time/place measurements and evidence suited to the endpoint are needed.',
 'A residue in soil or food therefore does not imply identical exposure in birds, bees and people. Different media, organisms and times change the observations needed.']},
 {'id':'critical-table','title':'6. Critically reading the source effects table','paragraphs':[
 'The table on pages 4–6 combines chemical names, formulas and attributed effects. It has 19 actual rows, with printed numbering jumping from 13 to 15. No missing compound should be invented. Check chemical identity before interpreting an effect claim.',
 'The printed Methoxychlor formula begins with `C6`; the official chemical reference inspected for this review gives `C16H15Cl3O2`. A copied table can carry a copied error. Correcting a formula does not independently validate the remaining effect claims in that row.',
 'Next ask for the study species, route, dose or concentration, duration, measured endpoint, comparison group and uncertainty. A broad effect label without those conditions is insufficient for a new scenario. This lesson teaches evidence appraisal, not a current clinical or regulatory classification of all nineteen substances.']},
 {'id':'prevention','title':'7. Prevention depends on authorised conditions of use','paragraphs':[
 'The handout connects food production with good agricultural practice and scientific assessment. Use conditions belong to a particular product, commodity and jurisdiction, within lifecycle management. This lesson supplies no spray recipe, dose adjustment or shortened harvest interval.',
 'A compliance question requires a matching residue definition, commodity, sample basis and applicable limit. A question about a person requires suitable exposure and toxicity evidence. The next step separates these purposes and explains why a food concentration limit and a daily intake value are different measures.']}
 ],
 'example':{'title':'Worked reasoning: concentration to amount in a portion','scenario':'Invented training data only: residue R concentration in peppers is 0.12 mg/kg food and the portion is 250 g. Assume valid measurement, a homogeneous portion, and the same commodity part and mass basis. Find residue amount, not absorbed dose or a safety classification.',
 'steps':[{'text':'Convert food mass to match the concentration denominator.','equation':'250 g / (1000 g/kg) = 0.250 kg food'},{'text':'Choose the relation and retain the units.','equation':'m_R = C_R * m_food'},{'text':'Food-mass units cancel, leaving chemical mass.','equation':'0.12 mg/kg food * 0.250 kg food = 0.030 mg'},{'text':'Cross-check the amount in a smaller mass unit.','equation':'0.030 mg = 30 microgram'}],
 'conclusion':'Under the stated model and assumptions, the portion contains 0.030 mg of residue R. Absorption, other foods/water and repeated exposure have not been assessed, and no matching limit was supplied. The result alone establishes neither a health outcome nor consignment compliance.',
 'commonError':'Multiplying 0.12 by 250 without converting grams gives a value one thousand times too large. The input dimensions did not match.'},
 'guided':{'title':'Guided application: calculation and interpretation','scenario':'New invented case: concentration 0.09 mg/kg food, portion 300 g. Use the worked example’s assumptions. Enter food mass in kilograms and residue amount in milligrams.','massLabel':'Food mass in kilograms','amountLabel':'Residue amount in milligrams','feedback':{'empty':'Enter both complete values. An empty field is not zero.','invalid':'Enter complete numbers without unit text in the numeric fields.','mass':'Review grams-to-kilograms conversion before calculating the amount.','amount':'The mass conversion is correct. Check concentration times food mass and unit cancellation.','unit':'The requested residue amount must be reported in mg. Check your selected unit.','correct':'The calculation and unit are correct: 300 g = 0.300 kg and 0.09 × 0.300 = 0.027 mg. Now explain why this is neither an absorbed-amount measurement nor proof of harm.'}},
 'practice':['Draw a possible field-to-aquatic-organism pathway. Label every link as assumed, observed or measured.','Specify one observation relevant to exposure and a separate observation relevant to an effect. Do not equate occurrence with biological harm.','Write four sentences for the case: what is given, calculation, supported inference, and two missing inputs.'],
 'faq':[{'question':'Does finding a residue establish poisoning?','answer':'It establishes an analytical finding within the method and sample basis. A health conclusion needs appropriate exposure and effect evidence.'},{'question':'Is 0.030 mg the same quantity as 0.12 mg/kg?','answer':'No. One is chemical mass and the other is concentration relative to food mass. Connecting them requires food mass and suitable assumptions.'},{'question':'Does correcting one formula validate the entire effects table?','answer':'No. Correct identity is a prerequisite. Effect claims still require their own evidence and study conditions.'}],
 'summary':['Identify the chemical, sample and measurement basis.','Keep units and assumptions visible throughout a calculation.','Distinguish occurrence, exposure, effect and risk characterisation.','State what the evidence supports and what remains unverified.'],
 'next':'Next: residue limits and daily intake, and why their dimensions and questions differ.'
 }}
save('lessons/FATE2-S01/lesson.public.json',lesson)

# Stable item IDs; options retain the same semantic order across locales.
questions=[
 ('D01','diagnostic','Which finding alone does a residue concentration establish?','نتيجة تركيز متبقي تثبت أنهي حاجة لوحدها؟',['A result on the specified sample/method basis','Poisoning in every consumer','Absorbed body amount','Compliance without a matching limit'],['نتيجة على أساس العينة والطريقة المحددين','تسمم كل المستهلكين','كمية ممتصة للجسم','المطابقة من غير حد مناسب'],0,'Identify the analytical scope and reject health or compliance extrapolation.'),
 ('D02','diagnostic','What additional input connects mg/kg food to mg in a portion?','إيه المعطى اللي يربط mg/kg food بكمية mg في حصة؟',['Food mass with compatible basis','The colour of the report','The number of table rows','An organism photograph'],['كتلة الغذاء على أساس متوافق','لون التقرير','عدد صفوف الجدول','صورة كائن'],0,'Food mass must cancel the concentration denominator.'),
 ('D03','diagnostic','Explain the difference between a possible route and a measured exposure.','اشرح الفرق بين مسار محتمل وتعرّض اتقاس فعلًا.',None,None,None,'Require a stated observation and a boundary on inference.'),
 ('P01','post','At 0.05 mg/kg food, how much residue is in a 400 g portion under a homogeneous-portion assumption?','عند تركيز 0.05 mg/kg food، كام كمية المتبقي في حصة 400 g مع افتراض التجانس؟',['0.020 mg','20 mg','0.125 mg','0.05 mg/kg food'],['0.020 mg','20 mg','0.125 mg','0.05 mg/kg food'],0,'Convert 400 g to 0.400 kg; multiply to obtain 0.020 mg. Reject concentration as the requested amount.'),
 ('P02','post','Which extra conclusion is justified by that calculation alone?','أنهي استنتاج إضافي يثبته الحساب ده لوحده؟',['No absorbed dose or health outcome has been established','Every consumer has the same absorbed dose','The consignment meets all legal limits','All routes have been assessed'],['لم تثبت جرعة ممتصة أو نتيجة صحية','كل المستهلكين عندهم نفس الجرعة الممتصة','الشحنة مطابقة لكل الحدود','اتقيّمت كل طرق التعرّض'],0,'Only a conditional amount calculation has been completed.'),
 ('P03','post','What should follow identification of a correct chemical formula in an effects table?','بعد التأكد من صيغة مادة في جدول الأضرار، نحتاج إيه؟',['Study conditions and effect evidence','Automatic acceptance of all row claims','A universal dose from the formula','No further checking'],['ظروف الدراسة وأدلة التأثير','اعتماد تلقائي لكل ادعاءات الصف','جرعة عامة من الصيغة','لا نحتاج مراجعة تانية'],0,'Formula identity does not validate effect, route, species or dose claims.'),
 ('P04','post','A field-to-water arrow and a positive water result are available. Name one supported statement, one unsupported effect claim and the next observation needed.','معاك سهم من الحقل للمياه ونتيجة إيجابية للمادة في المياه. اكتب استنتاجًا مدعومًا، وادعاء أثر غير مدعوم، والملاحظة التالية المطلوبة.',None,None,None,'Require distinction among conceptual route, chemical occurrence and biological effect.'),
 ('P05','post','For a concentration of 0.05 mg/kg food and a 400 g portion, state the conversion, calculation with units, two assumptions and two missing inputs for a health assessment.','في حالة تركيز 0.05 mg/kg food وحصة 400 g، اكتب التحويل والحساب بالوحدات، وافتراضين، ومعلومتين ناقصتين لتقييم الأثر الصحي.',None,None,None,'Critical: 0.400 kg and 0.020 mg; no absorbed-dose claim. Accept relevant sampling/method assumptions and route/duration/toxicity inputs.'),
 ('P06','post','A source row lists a disease without species, route, dose or duration. Write a four-sentence critique and explain why merely deleting the row would lose useful provenance.','صف في المصدر بيذكر مرضًا من غير نوع الكائن أو الطريق أو الجرعة أو المدة. اكتب نقدًا في أربع جمل، وفسّر ليه حذف الصف وخلاص يضيّع معلومات عن أصل الادعاء.',None,None,None,'Preserve original assertion as provenance while withholding unsupported teaching claims.'),
 ('B01','transfer','Two portions have the same concentration but different masses. Compare residue amounts without making a health claim.','حصتان لهما نفس التركيز وكتلتهما مختلفة. قارن كمية المتبقي من غير حكم صحي.',None,None,None,'Amount is proportional to food mass under the same concentration/basis; risk not established.'),
 ('B02','transfer','A fresh-mass result and a dry-mass result are supplied. What must be known before comparing them?','معاك نتيجة على وزن طازج ونتيجة على وزن جاف. إيه المطلوب قبل المقارنة؟',None,None,None,'Matching material/chemical and basis conversion data; do not compare raw numbers.'),
 ('B03','transfer','Design a minimal evidence table for a pesticide-residue claim: identify the sample, measurement, exposure and effect information separately.','صمّم جدول أدلة مختصر لادعاء عن متبقي مبيد: افصل العينة والقياس والتعرّض ومعلومات التأثير.',None,None,None,'Demand distinct evidence columns and explicitly unknown fields, not invented measurements.')
]
public=[];private=[]
for code,stage,en,ar,eo,ao,answer,criterion in questions:
 if eo:
  target={'D01':2,'D02':1,'P01':3,'P02':0,'P03':2}[code]
  eo=eo[-target:]+eo[:-target] if target else eo
  ao=ao[-target:]+ao[:-target] if target else ao
  answer=target
 q={'id':'FATE2-S01-'+code,'stage':stage,'type':'mcq' if eo else 'constructed','ar':{'question':ar},'en':{'question':en}}
 if eo:q['ar']['options']=ao;q['en']['options']=eo
 public.append(q);private.append({'id':q['id'],'answerIndex':answer,'reasoningCriterion':criterion,'critical':code in ['P01','P02','P05']})
save('lessons/FATE2-S01/assessment.public.json',{'items':public,'counts':{'diagnostic':3,'post':6,'additionalTransfer':3,'bankTotal':12},'policy':'The bank reuses these exact IDs; no duplicated awards. Independent/post keys are absent from the public payload. Before questions are diagnostic, not a pass/fail exam.'})
save('private/FATE2-S01-assessment-key.en.json',{'items':private,'suggestedReview':'All dimensional and inference-critical criteria must be correct; each constructed answer needs the stated evidence/reasoning, with revision and changed-case retry. No validated numeric pass threshold claimed.','sourceAnswerKey':'Not supplied; these are authored instructor criteria, not recovered teacher answers.'})

for lang in ['ar','en']:
 v=lesson[lang]
 text='# '+v['title']+'\n\n'+v['intro']+'\n\n'
 text+='## '+('نواتج التعلّم' if lang=='ar' else 'Outcomes')+'\n\n'+'\n'.join('- '+x for x in v['outcomes'])+'\n\n'
 for section in v['sections']:text+='## '+section['title']+'\n\n'+'\n\n'.join(section['paragraphs'])+'\n\n'
 e=v['example'];text+='## '+e['title']+'\n\n'+e['scenario']+'\n\n'
 for i,step in enumerate(e['steps'],1):text+=str(i)+'. '+step['text']+'\n\n   `'+step['equation']+'`\n\n'
 text+=e['conclusion']+'\n\n'+e['commonError']+'\n\n'
 text+='## '+('تطبيق مستقل' if lang=='ar' else 'Independent application')+'\n\n'+'\n'.join('- '+x for x in v['practice'])+'\n\n'
 text+='## '+('الخلاصة' if lang=='ar' else 'Take-away')+'\n\n'+'\n'.join('- '+x for x in v['summary'])+'\n\n'+v['next']+'\n'
 save('lessons/FATE2-S01/lesson.'+lang+'.md',text)
 worksheet='# '+('ورقة تطبيق: المتبقيات والتعرّض' if lang=='ar' else 'Worksheet: residues and exposure')+'\n\n'+v['example']['scenario']+'\n\n'
 worksheet+=('اكتب التحويل والحساب والافتراضات، ثم استنتاجًا محدودًا بالمعطيات.' if lang=='ar' else 'Show conversion, calculation and assumptions, then a bounded inference.')+'\n\n'+'\n'.join(['____________________________________________________________']*6)+'\n\n'
 worksheet+='\n\n'.join(x[lang]['question']+'\n\n'+'\n'.join(['____________________________________________________________']*4) for x in public if x['stage']=='post')+'\n'
 save('lessons/FATE2-S01/worksheet.'+lang+'.md',worksheet)

save('lessons/FATE2-S01/media-brief.en.md','''# S01 media and interaction brief — unproduced

The written pilot is the current review object. No spoken script, generated illustration, audio, timing, animation or video has been produced for v2. Existing v1 accepted audio is preserved; unchanged exact passages may later be considered by text/delivery/model/voice identity, not by filename alone.

1. Analytical report: independently reveal chemical, sample basis and unit; no diagnosis icon or hazard-to-poisoning jump.
2. Portion calculation: separate 250 g food mass, 0.250 kg conversion and 0.030 mg chemical amount; fixed exact overlay independent of locale direction. This is an invented pepper/R scenario, not a real dose or legal limit.
3. Pathway: separately move material through a possible field/runoff/water/organism route. Mark imagined versus measured states explicitly; do not animate harm as an established outcome.
4. Table appraisal: compare the printed Methoxychlor C6 prefix with the supported C16 formula; retain uncertainty for all unverified effect claims. No source-school branding or medical shock imagery.
5. Independent transfer: a distinct 400 g case uses its own identity; do not leak its key into the formative worked-example consumer.

Local guided practice may check the 300 g scenario (0.300 kg; 0.027 mg) with Arabic/Western digit support, complete numeric grammar, unit checks, reset and targeted feedback. This formative feedback may be visible after an attempt. Independent post/bank answers remain private. A browser calculation does not certify laboratory competence.

If commissioned later, use the actual approved realistic visual/Remotion pipeline, model/voices and finite provider budget. Create measured timings only after accepted actual speech. Preserve separate display/narration/caption assets and receive each finished scene on Actions. No preview still or written brief is a completed animated scene.
''')
save('lessons/FATE2-S01/trace.en.json',{'sourceIDs':lesson['sourceItems'],'coreSource':'SRC01 physical p3–6','authoredAdditions':[{'id':'EX-R-PEPPER-250','concentration':0.12,'concentrationUnit':'mg/kg food','foodMass':250,'foodMassUnit':'g','derivedAmount':0.030,'derivedUnit':'mg','hypothetical':True},{'id':'GUIDED-R-300','concentration':0.09,'foodMassGrams':300,'derivedAmountMg':0.027,'hypothetical':True},{'id':'TRANSFER-400','concentration':0.05,'foodMassGrams':400,'hypothetical':True,'privateCriterion':'../../private/FATE2-S01-assessment-key.en.json'}],
 'referenceClaims':[{'url':'https://codex.fao.org/codex-texts/codex-online-databases/pesticides-residues/glossary','scope':'Residue definition; introduced in the residue section, not a new commodity limit.'},{'url':'https://www.epa.gov/pesticide-science-and-assessing-pesticide-risks/assessing-human-health-risk-pesticides','scope':'One short hazard/exposure/risk-definition paragraph per locale; remaining source explanation and new worked reasoning are authored from the supplied source contract.'},{'url':'https://www.epa.gov/sites/production/files/2016-09/documents/methoxychlor.pdf','scope':'Physical properties formula only; historical health/regulatory claims not imported.'}],
 'deferredSourceDetails':['Unverified compound-specific health/ecological claims retained in private source inventory; not taught as established endpoints.','Historical demographic figures retained in source inventory but not used as current learning claims.','Detailed JMPR/CCPR/legal framework belongs to S03; MRL/ADI to S02.'],
 'coverageLimit':'Covers the first scoped reasoning step, not nineteen validated chemical monographs or all subsequent source pages.'})
print(json.dumps({'pilot':'FATE2-S01','learnerLocales':['ar','en'],'diagnostic':3,'post':6,'bank':12,'status':'written_draft_not_independently_reviewed','newMediaCalls':0}))
