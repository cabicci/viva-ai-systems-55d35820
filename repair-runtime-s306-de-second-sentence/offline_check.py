import worker
r,t=worker.validate()
assert len(r['units'])==1 and r['units'][0]['locale']=='de'and not worker.OUT.exists()
print('PASS_ONE_DE_SECOND_SENTENCE_ZERO_CALLS')
