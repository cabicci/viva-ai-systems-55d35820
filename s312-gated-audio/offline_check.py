import worker
r,t=worker.validate()
assert len(r['units'])==8 and r['stepId']=='S3-12' and all(len(v)==2 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS exact 8 initial S3-12 cases,4 fixed 2-unit lanes,0 calls')
