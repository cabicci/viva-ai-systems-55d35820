import worker
r,t=worker.validate()
assert len(r['units'])==36 and r['stepId']=='S1-06'and all(len(v)==9 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS36newS106remainingteachinggroups/4fixed9unitlanes/samethinpackaging/0calls')
