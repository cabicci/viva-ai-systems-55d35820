import worker
r,t=worker.validate()
assert len(r['clips'])==14 and not worker.OUT.exists()
print('PASS14 distinct contexts, exact originalPCM, zero calls')
