import worker
r,t=worker.validate()
assert len(r['clips'])==4 and not worker.OUT.exists()
print('PASS4boundedcontexts/0calls')
