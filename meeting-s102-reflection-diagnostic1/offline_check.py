import worker
r,t=worker.validate()
assert len(r['clips'])==1 and not worker.OUT.exists()
print('PASS1 exact full-currentPCM;zero calls')
