import worker
r,t=worker.validate()
assert len(r['units'])==24 and r['stepId']=='S3-17'and all(len(v)==6 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS24currentfullS317readings/4fixed6unitlanes/0calls')
