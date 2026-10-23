import worker
r,t=worker.validate()
assert len(r['units'])==40 and r['stepId']=='S3-14'and all(len(v)==10 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS40currentfullS314readings/4fixed10unitlanes/0calls')
