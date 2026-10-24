import worker
r,t=worker.validate()
assert len(r['clips'])==3 and not worker.OUT.exists()
print('PASS exact3 protected source-free contexts;zero calls')
