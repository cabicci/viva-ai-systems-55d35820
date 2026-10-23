import worker
r,t=worker.validate()
assert len(r['units'])==6 and r['maximumTTSCalls']==3 and not worker.OUT.exists()
print('PASS exact mixed3import/3uncalled/0calls')
