from pathlib import Path
import hashlib,json
p=Path(__file__).resolve().parent
files=['.gitignore', 'README.en.txt', 'freeze_package.py', 'offline_check.py', 'owner-authority.json', 'cumulative-attempt-ledger.json', 'cache-live-audit.json', 'expected-criteria.NOT-FOR-MODEL.json', 'provenance/worker-derivation.json', 'request.json', 'runtime.json', 'vendor/course/manifest.json', 'vendor/pipeline-engine.py', 'worker.py', 'provenance/narration-de.json', 'thin_artifacts.py', 'import-plan.json', 'original-request.json', 'original-worker.py', 'inputs/original-de-complete.zip', 'inputs/S2-02-de-R01-r1-audio.zip', 'inputs/S2-02-de-R02-r1-audio.zip', 'inputs/S2-02-de-R03-r1-audio.zip', 'imported_audio_support.py']
p.joinpath('freeze.json').write_text(json.dumps({'sha256':{f:hashlib.sha256(p.joinpath(f).read_bytes()).hexdigest()for f in files}},indent=2)+'\n','utf-8')
