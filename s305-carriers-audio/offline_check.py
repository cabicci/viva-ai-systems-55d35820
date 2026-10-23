import worker
r,t=worker.validate()
assert len(r['units'])==8 and r['stepId']=='S3-05'and all(len(v)==2 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS8currentfullS305independentgroups/4fixed2unitlanes/0calls')
