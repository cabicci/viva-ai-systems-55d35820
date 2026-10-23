import worker
r,t=worker.validate()
assert len(r['units'])==32 and r['stepId']=='S2-05'and all(len(v)==8 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS32currentfullS205remaininggroups/4fixed8unitlanes/0calls')
