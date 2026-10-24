from pathlib import Path
import json,hashlib
p=Path(__file__).resolve().parent
files=['README.en.txt', 'request.json', 'runtime.json', 'attempt-ledger.json', 'owner-authority.json', 'prompts/blind.txt', 'provenance/model-availability.json', 'provenance/context-proof.json', 'worker.py', 'offline_check.py', 'freeze_package.py', 'inputs/F001.wav']
p.joinpath('freeze.json').write_text(json.dumps({'sha256':{f:hashlib.sha256(p.joinpath(f).read_bytes()).hexdigest()for f in files}},indent=2)+'\n','utf-8')
