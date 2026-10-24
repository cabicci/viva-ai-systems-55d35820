import worker
r,t=worker.validate()
assert len(r['clips'])==3 and not worker.OUT.exists()
print('PASS distinct3 diagnostics exactPCM,0 calls')
