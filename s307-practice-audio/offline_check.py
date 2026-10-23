import worker
r,t=worker.validate()
assert len(r['units'])==8 and r['stepId']=='S3-07'and all(len(v)==2 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS8currentfullS307independentgroups/4fixed4unitlanes/0calls')
