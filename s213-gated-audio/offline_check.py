import worker
r,t=worker.validate()
assert len(r['units'])==12 and all(len(v)==3 for v in r['fixedLocaleLanes'].values())
assert all(u['assessmentSolutionsIncluded']is True and not u['quizOrWrittenKeysIncluded']for u in r['units'])
assert not worker.OUT.exists()
print('PASS12truthfulgatedworkedmodels/4fixed3unitlanes/0calls')
