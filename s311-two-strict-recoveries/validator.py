import json,math
def validate(text,duration):
 def failconstant(x):raise ValueError('Nonfinite JSON value')
 d=json.loads(text,parse_constant=failconstant)
 assert type(d)is dict
 assert set(d)=={'transcript','findings','uncertainWords','overall','limitations'}
 assert type(d['transcript'])is str and d['transcript'].strip()
 assert type(d['limitations'])is str and d['limitations'].strip()
 assert type(d['uncertainWords'])is list and all(type(w)is str for w in d['uncertainWords'])
 assert type(d['findings'])is list
 assert d['overall']in ['no_defect_detected','uncertain','needs_review']
 for f in d['findings']:
  assert type(f)is dict and set(f)=={'startSeconds','endSeconds','heardText','issueType','observation','certainty'}
  assert all(type(f[k])in [int,float]and math.isfinite(f[k])for k in ['startSeconds','endSeconds'])
  assert 0<=f['startSeconds']<f['endSeconds']<=duration
  assert all(type(f[k])is str for k in ['heardText','issueType','observation'])
  assert f['certainty']in ['low','medium','high']
 return d
