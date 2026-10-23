import worker
r,t=worker.validate()
assert len(r['units'])==24 and r['stepId']=='S2-15'and all(len(v)==6 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS24currentfullS215gatedgroups/4fixed6unitlanes/0calls')
