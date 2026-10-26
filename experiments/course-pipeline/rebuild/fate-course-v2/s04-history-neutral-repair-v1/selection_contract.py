"""Pure guards shared by the local request builder and the Actions assembler."""
from pathlib import Path,PurePosixPath
import re,hashlib,json
LOCALES={'ar-EG':'ar','en':'en'}
def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def step_id(value):
 s=value if str(value).startswith('FATE2-') else 'FATE2-'+str(value)
 if not re.fullmatch(r'FATE2-S(?:0[2-9]|1[01])',s):raise ValueError('Only existing rebuild steps02–11 are eligible')
 return s
def relative_file(value):
 if not isinstance(value,str) or not value or '\\' in value:raise ValueError('Use a nonempty portable relative slash path')
 p=PurePosixPath(value)
 if p.is_absolute() or '..' in p.parts or ':' in value:raise ValueError('Escaping or absolute path refused')
 return p
def beneath(root,value):
 root=Path(root).resolve();p=(root/str(relative_file(value))).resolve()
 if not p.is_relative_to(root):raise ValueError('Resolved path escapes authorized root')
 return p
def artifact_ref(ref):
 if not isinstance(ref,dict):raise ValueError('Missing artifact reference')
 if type(ref.get('run'))!=int or ref['run']<=0:raise ValueError('Actual positive Actions run ID required')
 if not re.fullmatch(r'[A-Za-z0-9_.-]+',str(ref.get('artifact',''))):raise ValueError('Invalid artifact name')
 relative_file(ref.get('file'))
 if not re.fullmatch(r'[0-9a-f]{64}',str(ref.get('sha256',''))):raise ValueError('Actual raw SHA256 required')
 return ref
def local_artifact(root,ref):
 artifact_ref(ref);p=beneath(root,ref.get('localPath',''))
 if not p.is_file() or sha(p)!=ref['sha256']:raise ValueError('Actual received file missing or hash changed: '+str(ref.get('localPath')))
 return p
def review_gate(gate,part,pcm_sha=None):
 if gate.get('status')!='clear' or gate.get('diagnosticStatus','clear')!='clear':raise ValueError('Unqualified audio cannot be assembled')
 checks={'sourceAudioSHA256':part['audio']['sha256'],'textSHA256':part['textSHA256'],'deliverySHA256':part['deliverySHA256'],'voice':part['voice'],'model':'gemini-3.8-flash-tts'}
 for k,v in checks.items():
  if gate.get(k)!=v:raise ValueError('Audio review binding mismatch: '+k)
 if pcm_sha is not None and gate.get('sourcePCM_SHA256')!=pcm_sha:raise ValueError('Actual PCM differs from reviewed recording')
 if gate.get('voiceObservation',{}).get('comparison')!='consistent':raise ValueError('Same-voice observation is unresolved')
 if gate.get('findings') or gate.get('uncertainties') or gate.get('previousUnresolved') or gate.get('failures'):raise ValueError('Review contains unresolved evidence')
 if gate.get('methodAlreadyOwnerAccepted') is not True:raise ValueError('Accepted speech-method evidence is missing')
 return True
def scene_bindings(part,timing,render):
 if render.get('sourceAudioSHA256')!=part['audio']['sha256'] or timing.get('audio',{}).get('sha256')!=part['audio']['sha256']:raise ValueError('Rendered/timed source audio mismatch')
 for k in ['textSHA256','deliverySHA256']:
  if timing.get(k)!=part[k]:raise ValueError('Timed speech request mismatch: '+k)
 frames=timing.get('frames');samples=timing.get('audioFrames')
 if type(frames)!=int or type(samples)!=int or frames<=0 or samples<=0:raise ValueError('Actual frame counts are required')
 if render.get('frames')!=frames or render.get('sourceAudioFrames')!=samples:raise ValueError('Renderer and clock frame counts differ')
 if not 0<=frames*800-samples<800:raise ValueError('Only sub-frame zero tail padding is allowed')
 if render.get('videoSHA256')!=part['selectedVideo']['sha256']:raise ValueError('Selected encoded video is not the reviewed renderer version')
 if not isinstance(timing.get('captions'),list) or not timing['captions']:raise ValueError('Actual recording-bound captions required')
 actions=timing.get('actions');actions=list(actions.values()) if isinstance(actions,dict) else actions
 if not isinstance(actions,list) or not actions:raise ValueError('Actual action clock required')
 duration=samples/24000
 for a in actions:
  if not isinstance(a.get('start'),(int,float)) or not isinstance(a.get('end'),(int,float)) or not 0<=a['start']<a['end']<=duration+.05:raise ValueError('Invalid actual action clock')
 prev=-1
 for c in timing['captions']:
  if not isinstance(c.get('text'),str) or not c['text'].strip() or not 0<=c['start']<c['end']<=duration+.05 or c['start']<prev-.05:raise ValueError('Invalid caption clock or order')
  prev=c['end']
 return True
