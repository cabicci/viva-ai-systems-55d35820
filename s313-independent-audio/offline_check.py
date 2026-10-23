import worker
r,t=worker.validate()
assert len(r['units'])==12 and r['stepId']=='S3-13'and all(len(v)==3 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS12currentfullS313independentgroups/4fixed3unitlanes/0calls')
