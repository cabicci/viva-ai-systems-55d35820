"""Deterministic review-only packaging; answer keys must stay server-side in production."""
from pathlib import Path
import json
HERE=Path(__file__).parent
ROOT=HERE.parents[2]
rows=json.loads((HERE/'authored-briefs.json').read_text())
contexts={
'ar-EG':{'start':'اقرأ الفكرة، وبعدها جرّب التطبيق على مشروعك.','practice':'طبّق بنفسك','check':'راجع فهمك','reflect':'إيه الدليل اللي بنيت عليه قرارك؟ وإيه اللي لسه محتاج تتأكد منه؟','fiction':'الحالة دي افتراضية للتعلّم؛ أرقامها مش بيانات سوق حقيقية.'},
'ar-MSA':{'start':'اقرأ المفهوم ثم طبّقه على مشروع تختاره.','practice':'التطبيق العملي','check':'تحقق من فهمك','reflect':'ما الدليل الذي يدعم قرارك؟ وما المعلومات التي ما زالت تحتاج إلى تحقق؟','fiction':'هذه حالة تعليمية افتراضية، وليست بيانات سوق فعلية.'},
'ar-Gulf':{'start':'اقرأ الفكرة، وبعدها جرّب تطبقها على مشروعك.','practice':'جرّب التطبيق','check':'تأكد من فهمك','reflect':'وش الدليل اللي اعتمدت عليه؟ ووش اللي باقي تحتاج تتأكد منه؟','fiction':'هذي حالة افتراضية للتعلّم، وأرقامها مو بيانات سوق فعلية.'},
'en':{'start':'Read the concept, then apply it to a project you choose.','practice':'Apply it','check':'Check your understanding','reflect':'What evidence supports your decision, and what still needs verification?','fiction':'This is a fictional teaching case, not actual market data.'}}
for locale,context in contexts.items():
 language='en' if locale=='en' else 'ar'
 packages=[]
 for index,r in enumerate(rows):
  item={k:r[k][language] for k in ['title','concept','case','task','question','correct','wrong']}
  item.update(id=r['id'],locale=locale,context=context,status='AUTHORED_DRAFT',video=None,studyMinutes={'readingAndExamples':10,'application':30,'assessmentAndReflection':10},timingStatus='UNVERIFIED_PLANNING_ESTIMATE')
  packages.append(item)
 (HERE/f'{locale}.json').write_text(json.dumps(packages,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'docs/academic/curriculum-proposal.json'
course=json.loads(p.read_text())
byid={r['id']:r for r in rows}
for module in course['modules']:
 existing={l['id']:l for l in module['lessons']}
 ids=[r['id'] for r in rows if r['id'].startswith(module['id']+'-')]
 if module['id']=='AC-BUS-M01': ids.insert(0,'AC-BUS-M01-L01')
 module['lessons']=[]
 for id in ids:
  title=byid[id]['title']['ar'] if id in byid else existing[id]['title']
  title_en=byid[id]['title']['en'] if id in byid else 'How a business creates customer value'
  module['lessons'].append({'id':id,'title':title,'titleEn':title_en,'minutes':{'video':0,'readingAndExamples':10,'application':30,'assessmentAndReflection':10},'contentStatus':'AUTHORED_DRAFT','videoRequired':False})
course.update(status='WRITTEN_DRAFT_REVIEW_REQUIRED',courseId='AC-BUS',cataloguePosition=1,totalMinutes=2000,outlinedLessonCount=40,authoredLessonCount=40)
course['ownerRequirement'].update(studyTimeIncludes=['readingAndExamples','application','assessmentAndReflection'],note='40 lesson drafts, 2000 planned non-video minutes (33h20). Video is optional and excluded. Not learner-timing evidence or accredited equivalence.')
course['reviewStatus']={'academicReview':'PENDING','contextualLocaleReview':'PENDING','learnerTiming':'UNVERIFIED','videoCompletionBlocksWrittenRelease':False}
p.write_text(json.dumps(course,ensure_ascii=False,indent=2)+'\n')
