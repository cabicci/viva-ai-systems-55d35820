import worker
r,t=worker.validate()
assert len(r['clips'])==119 and not worker.OUT.exists()
print('PASS119 exact unchangedPCM extra diagnostics;0 provider calls')
