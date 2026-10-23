import worker
r,t=worker.validate()
assert len(r['clips'])==15 and not worker.OUT.exists()
print('PASS15boundedcontexts/0calls')
