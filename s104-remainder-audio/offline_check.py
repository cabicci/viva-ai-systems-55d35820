import worker
r,t=worker.validate()
assert len(r['units'])==28 and all(len(v)==7 for v in r['fixedLocaleLanes'].values())
assert not worker.OUT.exists()
print('PASS28newS104passages/4fixed7unitlanes/thinpackaging/0calls')
