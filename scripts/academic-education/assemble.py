"""Assemble only complete generated locale sets. Keeps editorial acceptance OPEN."""
import argparse, hashlib, json
from pathlib import Path
from expand_lessons import validate,LOCALES
ROOT=Path(__file__).resolve().parents[2]
p=argparse.ArgumentParser();p.add_argument('input',type=Path);a=p.parse_args()
briefs=json.loads((ROOT/'experiments/academic/course/authored-briefs.json').read_text())
expected=[b['id'] for b in briefs]
out=ROOT/'experiments/academic/course/expanded';out.mkdir(parents=True,exist_ok=True)
assembled={}
report={'editorialAcceptance':'PENDING','learnerTiming':'UNVERIFIED','locales':{},'duplicateSections':[]}
for locale in LOCALES:
 packages=[];texts={}
 for id in expected:
  matches=list(a.input.glob(f'**/{locale}/{id}.json'))
  if len(matches)!=1:raise ValueError(f'Expected one package: {locale}/{id}, found {len(matches)}')
  d=validate(json.loads(matches[0].read_text()),id,locale)
  for section in d['sections']:
   digest=hashlib.sha256(' '.join(section['text'].split()).encode()).hexdigest()
   if digest in texts:report['duplicateSections'].append([locale,texts[digest],id])
   texts[digest]=id
  packages.append(d)
 if report['duplicateSections']:raise ValueError('Duplicated explanations require editorial correction')
 assembled[locale]=packages
 report['locales'][locale]={'lessons':len(packages),'sections':sum(len(d['sections']) for d in packages),'quizQuestions':sum(len(d['quiz']) for d in packages),'readingVisuals':sum(len(d['readingVisuals']) for d in packages),'readingWords':sum(len(s['text'].split()) for d in packages for s in d['sections'])}
for locale,packages in assembled.items():
 (out/f'{locale}.json').write_text(json.dumps(packages,ensure_ascii=False,indent=2)+'\n')
(ROOT/'docs/academic/EXPANSION_VALIDATION.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
