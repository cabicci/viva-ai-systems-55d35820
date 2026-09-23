"""Remove TTS-generated long trailing silence before local recovery rendering."""
import argparse, array, hashlib, json, math, wave
from pathlib import Path
BASE=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument("--lesson",type=int,required=True,choices=range(2,13))
parser.add_argument("--locale",required=True,choices=("ar-EG","ar-MSA","ar-Gulf","en"))
args=parser.parse_args()
slug=f"lesson-{args.lesson:02}"
folder=BASE/"public/generated/audio/level1"/slug/args.locale
source=json.loads((BASE/"content/level1-video.json").read_text(encoding="utf-8"))[f"{args.lesson:02}/{args.locale}"]
timings=json.loads((folder/"timings.json").read_text(encoding="utf-8"))
if len(timings)!=7: raise SystemExit("Expected seven scene timings")
report=[]
for i,(scene,timing) in enumerate(zip(source["scenes"],timings)):
    sha=hashlib.sha256(scene["narration"].encode()).hexdigest()
    if timing["textSha256"]!=sha: raise SystemExit("Stale audio source")
    path=folder/f"{i:02}.wav"
    with wave.open(str(path),"rb") as wav:
        params=wav.getparams()
        if (params.nchannels,params.sampwidth,params.framerate)!=(1,2,24000): raise SystemExit("Unexpected WAV format")
        raw=wav.readframes(params.nframes)
    samples=array.array("h");samples.frombytes(raw)
    last=next((n for n in range(len(samples)-1,-1,-1) if abs(samples[n])>=250),-1)
    if last<0: raise SystemExit("Silent scene audio")
    keep=min(len(samples),last+1+int(0.45*params.framerate))
    tail=(len(samples)-keep)/params.framerate
    if tail>1.5:
        with wave.open(str(path),"wb") as wav:
            wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(24000)
            wav.writeframes(raw[:keep*2])
        timing["frames"]=math.ceil((keep/24000+0.5)*24)
    else: keep=len(samples)
    report.append({"scene":scene["id"],"originalSeconds":round(len(samples)/24000,3),"finalSeconds":round(keep/24000,3),"tailTrimmedSeconds":round((len(samples)-keep)/24000,3)})
(folder/"timings.json").write_text(json.dumps(timings)+"\n",encoding="utf-8")
evidence={"lesson":args.lesson,"locale":args.locale,"method":"threshold 250 PCM; retain 0.45s after last speech; trim only tails over 1.5s","segments":report}
(BASE/"evidence"/f"trim-{slug}-{args.locale}.json").write_text(json.dumps(evidence,indent=2)+"\n",encoding="utf-8")
print(json.dumps(evidence))
