import worker
r,t=worker.validate()
assert not worker.OUT.exists()
print('PASS: one6sec context,1review/0TTS/0ASR/0GET/0retry; no newcalls')
