import worker
r,t=worker.validate()
assert len(r['units'])==16 and r['stepId']=='S3-10'and all(len(v)==4 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS16currentfullS310gatedcases/4fixed4unitlanes/0calls')
