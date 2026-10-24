import worker
r,t=worker.validate()
assert len(r['clips'])==1 and not worker.OUT.exists()
print('PASS exact1 protected source-free contexts;zero calls')
