import worker
r,t=worker.validate()
assert len(r['units'])==1 and r['units'][0]['locale']=='it' and not worker.OUT.exists()
print('PASS exact single source repair/no calls')
