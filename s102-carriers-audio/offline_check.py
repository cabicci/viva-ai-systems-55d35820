import worker
r,t=worker.validate()
assert len(r['units'])==8 and r['stepId']=='S1-02'and all(len(v)==2 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS8sourceboundS102carriers/4fixed2unitlanes/0calls')
