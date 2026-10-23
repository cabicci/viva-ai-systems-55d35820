import worker
r,t=worker.validate()
assert [c['id']for c in r['clips']]==['C02','C09'] and r['maximumReviewCalls']==2
assert not worker.OUT.exists()
print('PASS exact2 validity-recovery source PCM payloads/0calls')
