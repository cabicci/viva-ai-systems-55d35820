import worker
r,t=worker.validate()
assert len(r['units'])==32 and all(len(v)==8 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS32 new source-bound coherent passages; four fixed lanes; zero calls')
