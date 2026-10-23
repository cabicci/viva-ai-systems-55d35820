import worker
r,t=worker.validate()
assert len(r['clips'])==9 and not worker.OUT.exists()
print('PASS9boundedcontexts/0calls')
