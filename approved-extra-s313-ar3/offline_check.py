import worker
r,t=worker.validate()
assert len(r['units'])==3 and not worker.OUT.exists()
print('PASS exact finite candidate;zero calls')
