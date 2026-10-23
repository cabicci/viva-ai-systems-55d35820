import worker
r,t=worker.validate()
assert len(r['units'])==32 and r['stepId']=='S3-04'and all(len(v)==8 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS32currentfullS304readings/4fixed8unitlanes/0calls')
