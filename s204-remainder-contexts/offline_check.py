import worker
r,t=worker.validate()
assert len(r['clips'])==8 and not worker.OUT.exists()
print('PASS8boundedcontexts/0calls')
