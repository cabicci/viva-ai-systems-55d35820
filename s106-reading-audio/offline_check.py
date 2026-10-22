import worker
r,t=worker.validate()
assert len(r['units'])==24 and r['stepId']=='S1-06'and all(len(v)==6 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS24newS106readingpassages/4fixed6unitlanes/samethinpackaging/0calls')
