import worker
r,t=worker.validate()
assert len(r['clips'])==5 and not worker.OUT.exists()
print('PASS5boundedcontexts/0calls')
