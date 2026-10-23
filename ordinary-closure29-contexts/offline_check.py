import worker
r,t=worker.validate()
assert len(r['clips'])==29 and not worker.OUT.exists()
print('PASS29boundedcontexts/0calls')
