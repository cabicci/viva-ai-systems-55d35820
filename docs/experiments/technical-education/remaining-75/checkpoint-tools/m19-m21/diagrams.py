from author import *
def arrow(x,y,xx,yy,c='teal'):
 import math
 a=math.atan2(yy-y,xx-x);s=7
 return [line(x,y,xx,yy,c,3),path(f'M{xx-s*math.cos(a-.5):.1f} {yy-s*math.sin(a-.5):.1f} L{xx} {yy} L{xx-s*math.cos(a+.5):.1f} {yy-s*math.sin(a+.5):.1f}',stroke=c,width=3)]
def footer(ar,en):return text(200,252,ar,en,12)
def shelf(x,y,w):return rect(x,y,w,9,'mint')
# Guest/service overlay around the bed and luggage unit.
diagram('new-M19-L01-operation',[
 rect(35,35,330,175,'none'),rect(62,55,110,115,'mint'),rect(68,62,45,25,'white'),rect(120,62,45,25,'white'),rect(190,50,140,30,'pale'),rect(295,132,40,30,'purple'),
 *arrow(70,190,245,190),*arrow(245,190,245,100),*arrow(347,190,347,100,'danger'),text(117,120,'سرير','Bed'),text(263,72,'أمتعة','Luggage',13),text(245,228,'ضيف','Guest',13),text(345,228,'خدمة','Service',13),footer('اختبر الفتح ومسار العربة','Test opening and trolley path')])
diagram('new-M19-L01-replace',[
 rect(55,65,115,125,'pale'),shelf(55,90,115),rect(188,65,15,125,'mint'),rect(259,65,70,125,'mint'),circle(195,100,4,'purple'),circle(195,155,4,'purple'),*arrow(208,127,250,127),text(112,222,'جسم','Carcass',14),text(288,222,'واجهة بديلة','Replaceable front',14),footer('الربط ظاهر ويمكن الوصول له','Keep connectors accessible')])
diagram('new-M19-L01-batch',[
 *[rect(40+i*90,48+j*45,70,32,'mint' if (i+j)%2==0 else 'pale') for j in range(3) for i in range(4)],text(200,31,'غرف التمرين','Exercise rooms',14),text(200,215,'12 × 2 = 24','12 × 2 = 24',22),footer('العينة ضمن الإجمالي','Reference units included')])
# Restaurant operating case: occupied tables and staff path.
diagram('new-M19-L02-flows',[
 rect(25,30,350,180,'none'),rect(50,60,85,48,'mint'),rect(230,60,85,48,'mint'),rect(50,144,85,38,'mint'),rect(305,150,48,35,'purple'),
 *[rect(x,y,24,18,'pale') for x,y in [(60,37),(102,37),(60,114),(102,114),(242,37),(283,37),(242,114),(283,114)]],
 *arrow(30,192,183,192),*arrow(183,192,183,50),*arrow(305,164,200,164,'danger'),circle(183,164,10,'none'),text(104,232,'جلوس مستخدم','Occupied seating',13),text(301,232,'خدمة','Service',13),footer('التقاطع يحتاج مراجعة','Review simultaneous crossing')])
diagram('new-M19-L02-interface',[
 rect(40,80,195,17,'mint'),rect(60,97,20,106,'purple'),rect(185,97,18,106,'purple'),rect(250,148,90,15,'pale'),line(265,163,265,211),line(326,163,326,211),circle(300,61,16),path('M300 80 L290 132 L212 135 L225 190',stroke='teal',width=6),line(235,43,235,220,'danger'),text(198,35,'سطح + قاعدة + مستخدم','Top + base + user',14),footer('راجع الركبة والاقتراب','Check knees and approach')])
diagram('new-M19-L02-care',[
 rect(35,40,180,28,'mint'),rect(55,68,18,112,'purple'),rect(178,68,18,112,'purple'),rect(257,110,90,22,'pale'),rect(257,60,15,50,'pale'),line(267,132,260,188),line(331,132,343,188),circle(50,55,15,'none'),*arrow(34,180,115,180),text(128,219,'6 × 4 = 24','6 × 4 = 24',18),text(300,219,'وصول تنظيف','Cleaning access',12),footer('الخامة مرتبطة بدليل العناية','Link finish to product care')])
# Reception route, counter task, protected rear-service zone.
diagram('new-M19-L03-arrival',[
 rect(30,35,335,170,'none'),rect(58,55,126,44,'mint'),rect(269,63,68,24,'pale'),rect(269,113,68,24,'pale'),rect(269,163,68,24,'pale'),
 *arrow(45,192,220,192),*arrow(220,192,220,78),*arrow(212,112,188,83),text(119,83,'تواصل','Contact',14),text(302,230,'انتظار','Waiting',14),text(150,230,'مسار واضح','Clear route',14),footer('افصل الطابور عن المخرج','Keep queue clear of exit')])
diagram('new-M19-L03-counter',[
 rect(145,78,85,15,'mint'),rect(230,116,101,15,'pale'),rect(214,78,16,129,'purple'),rect(315,131,16,76,'purple'),rect(55,137,77,14,'pale'),line(65,151,65,201),line(123,151,123,201),circle(95,57,17),path('M95 76 L95 128 L155 128 L155 190 M98 100 L152 98',width=5),rect(238,66,55,37,'purple'),line(266,103,266,116),*arrow(56,180,133,180),text(100,231,'زائر','Visitor',14),text(265,231,'موظف','Staff',14),footer('السطح والاقتراب والمهمة','Surface, approach and task')])
diagram('new-M19-L03-privacy',[
 rect(50,48,170,115,'mint'),rect(100,89,55,18,'purple'),rect(64,178,63,27,'pale'),rect(169,178,63,27,'pale'),path('M95 178 L110 105 M200 178 L150 105',stroke='danger'),rect(280,50,62,145,'pale'),rect(282,113,58,55,'none'),path('M313 69 V108 H239 V158',stroke='teal',width=4),text(112,33,'زاوية الشاشة','Screen angle',13),text(311,225,'غطاء خدمة','Service cover',13),footer('افحص الرؤية والوصول الخلفي','Check views and rear access')])
# Bespoke specification and evidence.
diagram('new-M20-L01-brief',[
 rect(30,35,340,180,'pale'),line(30,81,370,81),line(30,126,370,126),line(30,170,370,170),line(200,35,200,215),
 text(112,65,'طلب المستخدم','User need',15),text(285,65,'دليل قبول','Acceptance evidence',14),text(112,110,'استرجاع ملف','Retrieve file',14),text(285,110,'تجربة وصول','Reach trial',14),text(112,155,'نقل القطعة','Delivery',14),text(285,155,'رفع الفتحة','Opening survey',14),text(112,198,'شكل وتشطيب','Form / finish',14),text(285,198,'عينة مرجعية','Reference sample',14),footer('ميّز المؤكد والمقترح والمعلق','Mark known, proposed and open')])
diagram('new-M20-L01-alternatives',[
 rect(38,55,133,130,'mint'),line(38,104,171,104),line(38,152,171,152),path('M235 55 Q365 18 365 115 Q365 205 235 185Z','mint'),path('M235 104 Q310 80 365 110 M235 152 Q310 179 359 157'),
 text(105,224,'مستقيم','Straight',15),text(300,224,'منحني','Curved',15),footer('نفس الوظيفة؛ تفاصيل مختلفة','Same function, different details')])
diagram('new-M20-L01-prototype',[
 rect(47,45,150,155,'pale'),rect(50,93,145,16,'mint'),rect(191,93,90,16,'mint'),path('M198 70 Q225 80 226 140',stroke='danger',width=4),circle(222,105,19,'none'),*arrow(291,105,350,105),text(115,232,'نموذج حركة','Motion mock-up',14),text(311,153,'تعارض','Collision',14),footer('السؤال: هل يفتح الدرج؟','Question: does the drawer open?')])
# Geometry: sections, construction strategies and handed assembly.
diagram('new-M20-L02-profiles',[
 path('M34 115 Q65 26 155 46 Q220 65 171 139 Q95 182 34 115Z','mint'),line(61,40,61,169,'danger'),line(138,30,138,166,'danger'),text(61,200,'A','A',15),text(138,200,'B','B',15),
 path('M237 175 V86 Q260 60 285 88 V175Z','pale'),path('M310 175 V50 Q345 28 372 70 V175Z','purple'),text(259,211,'A','A',15),text(341,211,'B','B',15),footer('موقع القطاع يشرح تغير العمق','Section location explains depth')])
diagram('new-M20-L02-build',[
 path('M37 179V80Q82 37 126 80V179Z','mint'),
 *[path(f'M{x} 179V{85-(i%2)*14}Q{x+14} 48 {x+29} 81V179Z','pale') for i,x in enumerate([164,191,218])],path('M163 80 Q204 31 247 80',stroke='purple',width=8),
 *[rect(282,55+i*23,73,18,'mint' if i%2 else 'pale') for i in range(6)],text(82,214,'كتلة','Solid',14),text(204,214,'أضلاع وقشرة','Ribs + skin',13),text(319,214,'قطاعات','Sections',14),footer('راجع الدعم والحافة والخدمة','Review support, edge and service')])
diagram('new-M20-L02-assembly',[
 path('M40 170V48H92V105H145V170Z','mint'),path('M253 170V105H306V48H359V170Z','purple'),line(200,35,200,194,'danger'),
 *arrow(100,125,175,125),*arrow(300,125,225,125),text(90,221,'A','A',20),text(309,221,'B','B',20),footer('تناظر لا تكرار في نفس الاتجاه','Mirrored, not same-handed copies')])
# Material interfaces with coordinated service and thickness.
diagram('new-M20-L03-layers',[
 rect(44,61,290,19,'mint'),rect(44,80,290,35,'pale'),rect(44,115,290,10,'purple'),path('M64 125V188H91V153H305V188H334V125Z','none'),circle(84,140,6,'purple'),circle(315,140,6,'purple'),
 text(184,40,'طبقات السطح','Surface layers',15),text(188,215,'إطار وربط','Frame + connection',15),footer('حدد المورد ومرجع كل لقاء','Assign each interface and supplier')])
diagram('new-M20-L03-light',[
 rect(35,38,330,25,'mint'),rect(44,63,15,135,'pale'),rect(341,63,15,135,'pale'),rect(103,66,175,12,'purple'),path('M278 73 H317 V125 H265',stroke='teal',width=3),rect(241,120,71,40,'pale'),rect(225,182,105,13,'purple'),*arrow(276,199,276,226),text(190,113,'وحدة إضاءة','Light unit',14),text(143,162,'حيز تغذية','Supply zone',14),footer('غطاء مستقل ومسار استبدال','Separate cover and replacement path')])
diagram('new-M20-L03-stack',[
 rect(62,45,270,160,'none'),rect(62,45,270,72,'pale'),rect(62,117,270,24,'mint'),rect(62,141,270,8,'purple'),line(43,45,43,205),line(37,45,49,45),line(37,205,49,205),line(332,145,350,145),
 text(197,89,'18','18',18),text(197,135,'6','6',13),text(360,150,'2','2',13),text(197,183,'14','14',16),text(22,131,'40','40',16),text(200,231,'40 − 18 − 6 − 2 = 14','40 − 18 − 6 − 2 = 14',15),footer('فرض حسابي وليس سماحية تركيب','Exercise, not a fitting allowance')])
# Compact multi-function configuration.
diagram('new-M20-L04-states',[
 rect(42,43,20,153,'purple'),rect(62,53,40,139,'mint'),rect(230,43,20,153,'purple'),rect(250,124,110,20,'mint'),line(338,144,338,196),text(78,223,'350','350',17),text(302,223,'950','950',17),text(125,82,'مقفل','Closed',14),text(302,83,'مفتوح','Open',14),footer('950 − 350 = 600','950 − 350 = 600')])
diagram('new-M20-L04-concurrent',[
 rect(45,41,303,170,'none'),rect(55,51,279,34,'purple'),rect(173,85,19,123,'mint'),rect(67,132,100,17,'pale'),circle(118,116,13),*arrow(309,166,208,166,'danger'),circle(188,166,17,'none'),text(276,124,'تخزين','Storage',14),text(114,188,'عمل','Work',14),footer('فتح الوظيفة قد يحجب الأخرى','One open function can block another')])
diagram('new-M20-L04-trial',[
 rect(32,36,336,183,'pale'),line(32,83,368,83),line(32,127,368,127),line(32,173,368,173),line(173,36,173,219),
 text(100,65,'المهمة','Task',15),text(270,65,'الملاحظة','Observation',15),text(100,111,'تجهيز','Set up',14),text(270,111,'أشياء منقولة','Objects moved',14),text(100,155,'استرجاع','Retrieve',14),text(270,155,'وصول متعذر','Blocked reach',14),text(100,202,'إعادة الوضع','Restore',14),text(270,202,'مساعدة؟','Assistance?',14),footer('كرر نفس المهمة بعد التعديل','Repeat the same task after revision')])
# Capstone brief anchors, dependency graph and hold point planning.
diagram('new-M21-L01-scope',[
 rect(33,40,334,161,'none'),rect(48,54,134,48,'mint'),rect(225,57,54,118,'pale'),rect(293,57,54,118,'pale'),
 *[shelf(x,y,50) for x in [227,295] for y in [86,116,146]],text(113,84,'استقبال','Reception',14),text(251,228,'C-A','C-A',15),text(320,228,'C-B','C-B',15),footer('وحدتان؛ 3 أرفف بكل وحدة مبدئياً','Two units, initially 3 shelves each')])
diagram('new-M21-L01-evidence',[
 rect(30,42,150,48,'mint'),rect(221,42,150,48,'pale'),rect(30,126,150,48,'mint'),rect(221,126,150,48,'pale'),*arrow(183,66,216,66),*arrow(183,150,216,150),
 text(104,72,'استرجاع محتوى','Retrieve contents',13),text(295,72,'تجربة وصول','Reach trial',13),text(104,155,'خدمة كابلات','Cable service',13),text(295,155,'تفصيل غطاء','Cover detail',13),text(200,218,'مالك + دليل + قرار','Owner + evidence + decision',15),footer('كل متطلب له دليل من المشروع','Every requirement has project evidence')])
diagram('new-M21-L01-plan',[
 rect(35,35,143,47,'mint'),rect(223,35,143,47,'pale'),*arrow(180,59,220,59),rect(35,129,143,47,'purple'),rect(223,129,143,47,'mint'),*arrow(294,86,294,122),*arrow(219,151,184,151),
 text(107,63,'رفع الموقع','Survey',15),text(293,63,'توزيع','Layout',15),text(294,157,'تفاصيل','Details',15),text(108,157,'إصدار معلق','Release held',14),path('M106 83 V112 H294',stroke='danger',width=3),text(165,216,'بيان ناقص له مسؤول','Missing input has an owner',14),footer('التطوير لا يساوي تصريح تنفيذ','Development is not execution release')])
# Coordinated package: document-level identity, shelf change and issue status.
diagram('new-M21-L02-identity',[
 rect(40,43,122,140,'pale'),shelf(43,89,116),shelf(43,130,116),text(103,72,'C-A','C-A',16),rect(217,43,151,140,'mint'),line(217,84,368,84),line(217,128,368,128),
 text(292,69,'C-A','C-A',16),text(292,112,'جزء / لوح','Part / panel',14),text(292,157,'أكسسوار','Hardware',14),*arrow(166,113,210,113),footer('وحدة توريد ≠ جزء تصنيع','Supplied unit ≠ fabrication part')])
diagram('new-M21-L02-change',[
 rect(42,37,113,155,'pale'),rect(242,37,113,155,'mint'),*[shelf(46,y,105) for y in [77,116,155]],*[shelf(246,y,105) for y in [67,99,131,163]],*arrow(165,116,232,116),text(100,221,'2 × 3 = 6','2 × 3 = 6',16),text(298,221,'2 × 4 = 8','2 × 4 = 8',16),footer('8 − 6 = 2','8 − 6 = 2')])
diagram('new-M21-L02-issue',[
 rect(36,35,325,183,'pale'),line(36,78,361,78),line(36,126,361,126),line(36,172,361,172),line(206,35,206,218),text(118,62,'مستند / إصدار','Document / revision',13),text(283,62,'حالة','Status',14),text(118,109,'رسم','Drawing',15),text(283,109,'مراجع','Reviewed',14),text(118,155,'قائمة أجزاء','Part list',14),text(283,155,'مطابقة','Reconciled',14),text(118,201,'تثبيت','Fixing',14),text(283,201,'معلق','Open',14),footer('الغرض: مراجعة لا تصنيع','Purpose: review, not fabrication')])
# Review loop: exact defect, before/after clearance, evidence completion.
diagram('new-M21-L03-snag',[
 rect(43,46,225,140,'pale'),rect(47,103,139,34,'mint'),rect(186,111,46,13,'purple'),rect(226,103,24,25,'purple'),*arrow(156,121,219,121,'danger'),circle(240,112,27,'none'),text(322,113,'C-A','C-A',18),text(174,223,'حالة فتح محددة','Defined opening state',15),footer('حدد المكان والأثر والدليل','Locate consequence and evidence')])
diagram('new-M21-L03-recheck',[
 rect(28,40,145,145,'pale'),rect(229,40,145,145,'pale'),rect(37,100,110,22,'mint'),rect(238,100,110,22,'mint'),rect(144,106,33,10,'purple'),rect(345,88,10,14,'purple'),circle(172,111,16,'none'),path('M188 80 L203 95 L216 70',stroke='teal',width=3),text(102,222,'قبل','Before',15),text(302,222,'بعد + إعادة فحص','After + reinspection',14),footer('راجع المسك والحركة والقائمة','Recheck grip, motion and schedule')])
diagram('new-M21-L03-portfolio',[
 *[rect(41+i*65,67,52,90,'mint' if i<3 else 'pale') for i in range(5)],
 *[path(f'M{53+i*65} 110 L{63+i*65} 122 L{81+i*65} 94',stroke='teal',width=3) for i in range(3)],
 *[text(67+i*65,120,'؟','?',23) for i in [3,4]],text(200,41,'سجل المراجعة','Review register',16),text(200,205,'5 − 3 = 2','5 − 3 = 2',22),footer('أدلة واضحة ومراجعة بشرية','Explicit evidence and human review')])
save_diagrams()
print('Added',len(D),'distinct concept definitions')
