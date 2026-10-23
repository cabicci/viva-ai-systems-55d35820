import worker
r,t=worker.validate()
assert len(r['clips'])==10 and not worker.OUT.exists()
print('PASS10boundedcontexts/0calls')
