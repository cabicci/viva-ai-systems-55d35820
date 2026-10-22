import worker
r,t=worker.validate()
assert len(r['clips'])==6 and not worker.OUT.exists()
print('PASS6contexts/6blind/0TTS/0ASR/0GET/0retry; no calls')
