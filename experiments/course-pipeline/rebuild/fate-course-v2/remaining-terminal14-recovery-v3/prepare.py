from pathlib import Path
import json,runpy,sys
R=Path(__file__).parent;M=json.loads((R/'request.json').read_text());C=next(p for p in M['parts'] if p['id']==sys.argv[1])
runpy.run_path(str(R/('prepare_saved_timing.py' if 'sourceTiming' in C else 'prepare_saved_semantic.py')),run_name='__main__')
