"""Offline curriculum, locale, numeric and speech-policy gates."""
from pathlib import Path
import json, sys, re
ROOT=Path(__file__).resolve().parents[2]
HERE=Path(__file__).parent
locales=['ar-EG','ar-MSA','ar-Gulf','en']
expected=['customer','value','system','money','decision','evidence']
for locale in locales:
    d=json.loads((HERE/f'content/{locale}.json').read_text())
    assert d['locale']==locale and d['id']=='AC-BUS-M01-L01'
    assert [s['id'] for s in d['sections']]==expected
    assert sum(d['workloadMinutes'].values())==60
    assert len(d['goals'])==4 and len(d['quiz'])==6
    assert len({q['id'] for q in d['quiz']})==6
    for q in d['quiz']:assert 0<=q['correct']<len(q['options']) and q['explanation']
    f=d['caseFacts']; assert f['orders']*f['pricePerOrder']==f['revenue']
    assert f['orders']*f['variableCostPerOrder']==f['totalVariableCost']
    assert f['revenue']-f['totalVariableCost']-f['otherPeriodCosts']==f['illustrativeResult']==300
    assert f['revenue']-f['unpaidRevenue']==f['cashCollected']==2400
    assert f['orders']*(f['pricePerOrder']-10)-f['totalVariableCost']-f['otherPeriodCosts']==100
    raw=json.dumps(d,ensure_ascii=False).lower()
    for prohibited in ['openstax','ocw.mit','جامعة القاهرة','edu4arab','https://','معتمد عالميًا']:
        assert prohibited not in raw, (locale,prohibited)
    assert d['media']['videoId'] is None # authored source must not invent delivery
    if locale=='en': assert not any('\u0600'<=c<='\u06ff' for c in d['title']+d['intro']+''.join(s['text'] for s in d['sections']))
sys.path.insert(0,str(HERE/'media'))
from policy import POLICY
from gemini_tts import prepare_narration, segment_cache_name
text='قيمة قرار قانون قرآن مشروع تكلفة ربح تجهيز قطعة'
spoken,prompt=prepare_narration(text,narration_policy=POLICY)
assert spoken==text # context guidance without blanket rewriting
assert 'ق=همزة' not in prompt and 'ورش' not in prompt
assert segment_cache_name(0,'Charon',text,'focus',POLICY)!=segment_cache_name(0,'Charon',text+' جديد','focus',POLICY)
for locale in ['ar-MSA','ar-Gulf','en']:
    try:prepare_narration(text,locale,narration_policy=POLICY)
    except ValueError:pass
    else:raise AssertionError('Egyptian policy must reject other locales')
course=json.loads((ROOT/'docs/academic/curriculum-proposal.json').read_text())
lessons=[l for m in course['modules'] for l in m['lessons']]
assert len(lessons)==30 and len({l['id'] for l in lessons})==30
assert sum(sum(l['minutes'].values()) for l in lessons)==1800
print('PASS: four locale packages; aligned outcomes/sections; quiz integrity; arithmetic; brand-only output; 1800-minute curriculum; context-only Egyptian policy/cache/locale isolation.')

manifest=json.loads((HERE/'media-manifest.json').read_text())
assert set(manifest)==set(locales)
for locale, item in manifest.items():
    if item['playbackReady']:
        assert re.fullmatch(r'https://iframe\.mediadelivery\.net/embed/\d+/[a-f0-9-]+\?autoplay=false&preload=false',item['embedUrl'])
        assert item['durationSeconds'] > 0
    else: assert item['embedUrl'] is None
assert '_soften_text' not in (HERE/'media/vendor/gemini_tts.py').read_text()
print('PASS: bounded Bunny manifest and unchanged narration source.')
