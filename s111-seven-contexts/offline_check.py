import worker
r,t=worker.validate()
assert len(r['clips'])==7 and not worker.OUT.exists()
print('PASS7boundedcontexts/0calls')
