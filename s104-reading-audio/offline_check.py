import worker
r,t=worker.validate()
assert len(r['units'])==24 and r['stepId']=='S1-04'and all(len(v)==6 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS24 new S104readings/fourfixedsixunitlanes/0calls')
