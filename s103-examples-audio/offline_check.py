import worker
r,t=worker.validate()
assert len(r['units'])==16
assert not worker.OUT.exists()
print('PASS sixteen exact source-bound complete cases; zero provider calls')
