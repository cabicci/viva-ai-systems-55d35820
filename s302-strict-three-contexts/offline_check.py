import worker
r,t=worker.validate()
assert [c['id']for c in r['clips']]==['C02','C09','C10']and r['maximumReviewCalls']==3
assert not worker.OUT.exists()
print('PASS exact3 reviewed payloads/sourcePCM/strictobject/0calls')
