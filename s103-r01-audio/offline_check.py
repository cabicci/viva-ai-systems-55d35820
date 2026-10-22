import worker
r,t=worker.validate()
assert len(r['units'])==4
assert not worker.OUT.exists()
print('PASS: exact frozen source-bound four-locale package; zero provider calls')
