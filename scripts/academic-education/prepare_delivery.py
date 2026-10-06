"""Build a review-only private import bundle. This script never connects to a service."""
import argparse, hashlib, json
from pathlib import Path
from expand_lessons import validate, LOCALES
from media_registry import checked_media, load_registry
ROOT=Path(__file__).resolve().parents[2]

def canonical(value):
    return json.dumps(value,ensure_ascii=False,sort_keys=True,separators=(',',':'))

def prepare(pdf_root):
    media_registry=load_registry()
    course=json.loads((ROOT/'docs/academic/curriculum-proposal.json').read_text())
    order=[l['id'] for m in course['modules'] for l in m['lessons']]
    rows=[];assets=[];missing=[]
    for locale in LOCALES:
        packages=[json.loads((ROOT/f'experiments/academic/content/{locale}.json').read_text()),
            *json.loads((ROOT/f'experiments/academic/course/expanded/{locale}.json').read_text())]
        lookup={p['id']:p for p in packages}
        if len(lookup)!=40 or set(lookup)!=set(order):raise ValueError('Incomplete or duplicate course: '+locale)
        for index,id in enumerate(order):
            d=lookup[id]
            if d['locale']!=locale:raise ValueError('Locale mismatch')
            if index:validate(d,id,locale)
            digest=hashlib.sha256(canonical(d).encode()).hexdigest()
            media=checked_media(d,media_registry)
            rows.append({'course_id':'AC-BUS','lesson_id':id,'locale':locale,'position':index+1,
                'introductory':index==0,'approved':False,'payload':d,'source_sha256':digest,
                'video_guid':media['videoId'] if media else None,'video_ready':bool(media)})
            pdf=pdf_root/f'Lesson_Workbook_{id}_{locale}.pdf'
            if not pdf.exists():missing.append(str(pdf));continue
            assets.append({'path':f'AC-BUS/{id}/{locale}/workbook.pdf','course_id':'AC-BUS',
                'lesson_id':id,'locale':locale,'kind':'workbook','sha256':hashlib.sha256(pdf.read_bytes()).hexdigest(),
                'localFile':str(pdf.resolve())})
    return rows,assets,missing

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--pdf-root',type=Path,default=ROOT/'experiments/academic/review/pdf');a=p.parse_args()
    rows,assets,missing=prepare(a.pdf_root)
    out=ROOT/'tmp/academic-delivery';out.mkdir(parents=True,exist_ok=True)
    (out/'lesson-content.jsonl').write_text(''.join(canonical(r)+'\n' for r in rows))
    (out/'asset-manifest.json').write_text(json.dumps(assets,ensure_ascii=False,indent=2)+'\n')
    summary={'courseId':'AC-BUS','packages':len(rows),'privateWorkbooks':len(assets),'missingWorkbooks':missing,
        'contentApproval':False,'courseEnabled':False,'assistantEnabled':False,'uploaded':False,
        'mediaChanged':False,'requiresCentralIntegration':True}
    (out/'receipt.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary,indent=2))
    if missing:raise SystemExit('Review bundle incomplete: workbooks missing; no service was changed.')
