import worker
r,t=worker.validate()
assert len(r['clips'])==12 and not worker.OUT.exists()
print('PASS12boundedcontexts/0calls')
