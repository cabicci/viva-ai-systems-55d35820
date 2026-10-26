from pathlib import Path
import os,sys,subprocess,hashlib
R=Path(__file__).parent;f=R/'runtime-review-request.json';env=dict(os.environ,REVIEW_REQUEST_FILE=f.name,EXPECTED_REQUEST_SHA256=hashlib.sha256(f.read_bytes()).hexdigest());raise SystemExit(subprocess.run([sys.executable,str(R/'review_worker.py'),sys.argv[1]],env=env).returncode)
