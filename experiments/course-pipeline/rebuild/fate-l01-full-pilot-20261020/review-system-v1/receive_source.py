import json,os,sys,re,hashlib,subprocess
from pathlib import Path
R=Path(__file__).parent;M=json.loads((R/'review-request.json').read_text(encoding='utf-8'))
assert M['id']!='EXAMPLE_ONLY_DO_NOT_REPLAY_COMPLETED_AUDIO','Prepare a new bounded request; never replay completed speech'
assert M['speechCalls']==0 and M['automaticRetries']==0 and 1<=len(M['scenes'])<=10
assert all(re.fullmatch(r'L01-S(?:0[1-9]|10)',s['id']) for s in M['scenes'])
assert type(M['sourceRun']) is int and M['sourceRun']>0 and re.fullmatch(r'[A-Za-z0-9_.-]+',M['sourceArtifact'])
assert M.get('sourceMode')=='generated_wav' and all(re.fullmatch('[0-9a-f]{64}',s['sourceAudioSHA256']) for s in M['scenes'])
subprocess.run(['gh','run','download',str(M['sourceRun']),'--repo',os.environ['GITHUB_REPOSITORY'],'--name',M['sourceArtifact'],'--dir',str(R/'source')],check=True)
