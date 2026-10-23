import worker
r,t=worker.validate()
assert len(r['units'])==28 and r['stepId']=='S2-09'and all(len(v)==7 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS28currentfullS209readings/4fixed7unitlanes/0calls')
