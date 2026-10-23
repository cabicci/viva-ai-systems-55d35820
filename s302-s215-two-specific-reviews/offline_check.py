import worker
r,t=worker.validate()
assert len(r['clips'])==2 and not worker.OUT.exists()
print('PASS2boundedcontexts/0calls')
