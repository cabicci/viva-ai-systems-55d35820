import worker
r,t=worker.validate()
assert len(r['clips'])==11 and not worker.OUT.exists()
print('PASS11boundedcontexts/0calls')
