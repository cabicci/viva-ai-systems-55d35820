import worker
r,t=worker.validate()
assert len(r['clips'])==6 and not worker.OUT.exists()
print('PASS6boundedcontexts/0calls')
