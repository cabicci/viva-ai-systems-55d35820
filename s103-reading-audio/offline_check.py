import worker
r,t=worker.validate()
assert len(r['units'])==20
assert not worker.OUT.exists()
print('PASS: exact frozen twenty source-bound coherent sections; zero provider calls')
