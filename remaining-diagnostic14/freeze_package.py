from pathlib import Path
import json,hashlib
p=Path(__file__).resolve().parent
files=['README.en.txt', 'request.json', 'runtime.json', 'attempt-ledger.json', 'owner-authority.json', 'prompts/blind.txt', 'provenance/model-availability.json', 'provenance/context-proof.json', 'worker.py', 'offline_check.py', 'freeze_package.py', 'inputs/M001.wav', 'inputs/M002.wav', 'inputs/M003.wav', 'inputs/M004.wav', 'inputs/M005.wav', 'inputs/M006.wav', 'inputs/M007.wav', 'inputs/M008.wav', 'inputs/M009.wav', 'inputs/M010.wav', 'inputs/M011.wav', 'inputs/M012.wav', 'inputs/M013.wav', 'inputs/M014.wav']
p.joinpath('freeze.json').write_text(json.dumps({'sha256':{f:hashlib.sha256(p.joinpath(f).read_bytes()).hexdigest()for f in files}},indent=2)+'\n','utf-8')
