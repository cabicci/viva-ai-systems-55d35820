import worker
r,t=worker.validate()
assert len(r['units'])==16 and r['stepId']=='S3-16' and all(len(v)==4 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS exact 16 initial S3-16 cases,4 fixed 4-unit lanes,0 calls')
