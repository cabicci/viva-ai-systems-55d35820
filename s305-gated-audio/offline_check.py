import worker
r,t=worker.validate()
assert len(r['units'])==12 and r['stepId']=='S3-05'and all(len(v)==3 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS12currentfullS305gatedcases/4fixed3unitlanes/0calls')
