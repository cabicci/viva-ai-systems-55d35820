import worker
r,t=worker.validate()
assert len(r['units'])==20 and r['stepId']=='S2-07'and all(len(v)==5 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS20currentfullS207lab/4fixed5unitlanes/0calls')
