from pathlib import Path
import os,sys,subprocess,hashlib
R=Path(__file__).parent;f=R/'clock-request.json';env=dict(os.environ,EXPECTED_REQUEST_SHA256=hashlib.sha256(f.read_bytes()).hexdigest());raise SystemExit(subprocess.run([sys.executable,str(R/'observational_clock38.py'),sys.argv[1]],env=env).returncode)
