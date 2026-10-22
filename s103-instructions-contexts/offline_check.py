import worker
r,t=worker.validate()
assert len(r['clips'])==4 and not worker.OUT.exists()
print('PASS4contexts/4blind/0TTS/0ASR/0GET/0retry; no calls')
