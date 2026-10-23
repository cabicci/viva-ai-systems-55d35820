import worker
r,t=worker.validate()
assert len(r['units'])==7 and r['maximumTTSCalls']==0 and not worker.OUT.exists()
for u in r['units']:
 try:worker.imported.reject_imported_tts(u['id'])
 except AssertionError:pass
 else:raise AssertionError('Imported TTS accepted')
print('PASS exact seven original imports; all new TTS rejected; zero calls')
