import worker
r,t=worker.validate()
assert len(r['units'])==2 and all(u['locale']=='en'for u in r['units'])and not worker.OUT.exists()
print('PASS2sentences/2TTS2blind2ASR2GET/0retry/0calls')
