import worker
r,t=worker.validate()
assert len(r['clips'])==23 and not worker.OUT.exists()
print('PASS23boundedcontexts/0calls')
