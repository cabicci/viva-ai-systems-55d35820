"""Read-only verification that an original WAV's PCM is unchanged at a known frame offset."""
from pathlib import Path
import argparse,wave,hashlib,json

def load(p):
    with wave.open(str(p),'rb') as w:
        fmt=(w.getnchannels(),w.getsampwidth(),w.getframerate(),w.getcomptype())
        return fmt,w.readframes(w.getnframes())

def main():
    p=argparse.ArgumentParser();p.add_argument('--assembled',type=Path,required=True);p.add_argument('--source',type=Path,required=True);p.add_argument('--start-frame',type=int,required=True);a=p.parse_args()
    if a.start_frame<0:raise SystemExit('start-frame must be nonnegative')
    fmt,full=load(a.assembled);srcfmt,raw=load(a.source)
    if fmt!=srcfmt or fmt[3]!='NONE':raise SystemExit('PCM formats differ or compressed audio unsupported')
    offset=a.start_frame*fmt[0]*fmt[1]
    same=full[offset:offset+len(raw)]==raw
    print(json.dumps({'identicalPCM':same,'sourcePCM_SHA256':hashlib.sha256(raw).hexdigest(),'sourceFrames':len(raw)//(fmt[0]*fmt[1]),'startFrame':a.start_frame,'format':fmt}))
    raise SystemExit(0 if same else 1)
if __name__=='__main__':main()
