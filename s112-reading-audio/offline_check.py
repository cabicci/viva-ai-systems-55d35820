import worker
r,t=worker.validate()
assert len(r['units'])==20 and r['stepId']=='S1-12'and all(len(v)==5 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS20newS112readingpassages/4fixed5unitlanes/samethinpackaging/0calls')
