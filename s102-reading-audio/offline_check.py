import worker
r,t=worker.validate()
assert len(r['units'])==24 and r['stepId']=='S1-02'and all(len(v)==6 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS24newS102readingpassages/4fixed6unitlanes/samethinpackaging/0calls')
