import worker
r,t=worker.validate()
assert len(r['units'])==1 and not worker.OUT.exists()
print('PASS exact coherent repair candidate;zero calls')
