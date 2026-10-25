from pathlib import Path
import json,hashlib,datetime
P=Path(__file__).resolve().parent
state=json.loads((P/'output/attempt-state.private.json').read_text())
audio=P/'output'/state['file'];assert hashlib.sha256(audio.read_bytes()).hexdigest()==state['sha256']and state['providerCalls']==1
reqpath=P/'diagnostic/request.json';req=json.loads(reqpath.read_text());req['clips'][0].update(sha256=state['sha256'],duration=state['audio']['durationSeconds']);reqpath.write_bytes((json.dumps(req,ensure_ascii=False,indent=2)+'\n').encode())
target=P/'diagnostic/output/B-input.private.json';target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((json.dumps({'relativeToPackage':'../output/'+state['file'],'sha256':state['sha256'],'audio':state['audio'],'exactLocalOutputValidated':True},indent=2)+'\n').encode())
