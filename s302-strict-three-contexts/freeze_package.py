from pathlib import Path
import json,hashlib
p=Path(__file__).resolve().parent
f=['README.en.txt', 'request.json', 'runtime.json', 'attempt-ledger.json', 'owner-authority.json', 'prompts/blind.txt', 'provenance/model-availability.json', 'provenance/context-proof.json', 'worker.py', 'offline_check.py', 'freeze_package.py', 'inputs/C02.wav', 'payloads/C02.json', 'inputs/C09.wav', 'payloads/C09.json', 'inputs/C10.wav', 'payloads/C10.json', 'validator.py', 'required-output-schema.json']
p.joinpath('freeze.json').write_text(json.dumps({'sha256':{n:hashlib.sha256(p.joinpath(n).read_bytes()).hexdigest()for n in f}},indent=2)+'\n','utf8')
