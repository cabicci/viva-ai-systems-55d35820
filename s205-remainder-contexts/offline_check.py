import worker
r,t=worker.validate()
assert len(r['clips'])==3 and not worker.OUT.exists()
print('PASS3boundedcontexts/0calls')
