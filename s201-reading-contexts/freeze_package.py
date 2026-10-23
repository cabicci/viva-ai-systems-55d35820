from pathlib import Path
import json,hashlib
p=Path(__file__).resolve().parent
files=['README.en.txt', 'request.json', 'runtime.json', 'attempt-ledger.json', 'owner-authority.json', 'prompts/blind.txt', 'provenance/model-availability.json', 'provenance/context-proof.json', 'worker.py', 'offline_check.py', 'freeze_package.py', 'inputs/C01.wav', 'inputs/C02.wav', 'inputs/C03.wav', 'inputs/C04.wav', 'inputs/C05.wav', 'inputs/C06.wav', 'inputs/C07.wav']
p.joinpath('freeze.json').write_text(json.dumps({'sha256':{f:hashlib.sha256(p.joinpath(f).read_bytes()).hexdigest()for f in files}},indent=2)+'\n','utf-8')
