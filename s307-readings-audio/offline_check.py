import worker
r,t=worker.validate()
assert len(r['units'])==40 and r['stepId']=='S3-07'and all(len(v)==10 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS40currentfullS307readings/4fixed6unitlanes/0calls')
