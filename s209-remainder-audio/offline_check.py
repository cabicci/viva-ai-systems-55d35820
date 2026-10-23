import worker
r,t=worker.validate()
assert len(r['units'])==36 and r['stepId']=='S2-09'and all(len(v)==9 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS36currentfullS209remainder/4fixed9unitlanes/0calls')
