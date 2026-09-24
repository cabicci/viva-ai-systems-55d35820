"""Check generated narration and the final encoded video without logging credentials."""
import argparse, array, hashlib, json, math, subprocess, sys, wave
from pathlib import Path
BASE = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument("--locale", required=True, choices=("ar-EG","ar-MSA","ar-Gulf","en"))
parser.add_argument("--lesson",required=True,type=int,choices=range(1,13))
parser.add_argument("--level",type=int,choices=(1,2,3),default=1)
args = parser.parse_args()
lesson_no=args.lesson
level=args.level
assert level!=1 or lesson_no>=2
lesson_slug=f"lesson-{lesson_no:02}"
locale = args.locale
lesson=json.loads((BASE/("content/level1-video.json" if level==1 else "content/advanced-video.json")).read_text(encoding="utf-8"))[f"{lesson_no:02}/{locale}" if level==1 else f"{level}/{lesson_no:02}/{locale}"]
folder = BASE/f"public/generated/audio/level{level}"/lesson_slug/locale
timings = json.loads((folder/"timings.json").read_text())
assert len(timings) == len(lesson["scenes"]) == 7
evidence = []
cursor = 0
captions = ["WEBVTT", ""]
def stamp(seconds):
    ms = round(seconds*1000)
    return f"{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}"
for i, (scene, timing) in enumerate(zip(lesson["scenes"], timings)):
    expected = hashlib.sha256(scene["narration"].encode()).hexdigest()
    assert timing["textSha256"] == expected, "Stale narration"
    assert timing["audio"] == f"generated/audio/level{level}/{lesson_slug}/{locale}/{i:02}.wav"
    with wave.open(str(folder/f"{i:02}.wav"), "rb") as wav:
        assert (wav.getnchannels(),wav.getsampwidth(),wav.getframerate()) == (1,2,24000)
        duration = wav.getnframes()/wav.getframerate()
        samples = array.array("h", wav.readframes(wav.getnframes()))
    if sys.byteorder != "little":
        samples.byteswap()
    assert duration > 0.5 and samples, "Empty segment"
    rms = math.sqrt(sum(s*s for s in samples)/len(samples))
    assert rms > 20, "Silent or near-silent segment"
    assert timing["frames"] == math.ceil((duration+0.5)*24), "Invalid scene padding"
    captions.extend([str(i+1), f"{stamp(cursor/24)} --> {stamp(cursor/24+duration)}", scene["narration"], ""])
    cursor += timing["frames"]
    evidence.append({"scene":scene["id"],"durationSeconds":duration,"rms":round(rms,2),"textSha256":expected})
video = BASE/f"public/generated/videos/level{level}"/lesson_slug/(locale+".mp4")
probe = subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(video)],check=True,capture_output=True,text=True)
meta = json.loads(probe.stdout)
visual = next(s for s in meta["streams"] if s["codec_type"]=="video")
sound = next(s for s in meta["streams"] if s["codec_type"]=="audio")
assert (visual["width"],visual["height"]) == (1280,720)
assert visual["codec_name"]=="h264" and sound["codec_name"]=="aac"
assert abs(float(meta["format"]["duration"])-cursor/24) < 0.12
assert cursor/24<=150, "Video exceeds 150-second lesson limit"
caption_path = video.with_suffix(".vtt")
caption_path.write_text("\n".join(captions),encoding="utf-8")
result = {"level":level,"lesson":lesson_no,"locale":locale,"status":"technical-pass","frames":cursor,"durationSeconds":cursor/24,"videoSha256":hashlib.sha256(video.read_bytes()).hexdigest(),"audioSegments":evidence,"captions":"scene-aligned; source script","spokenAccuracyReview":"pending human listening"}
(BASE/"evidence").mkdir(exist_ok=True)
(BASE/"evidence"/("narrated-level"+str(level)+"-"+lesson_slug+"-"+locale+".json")).write_text(json.dumps(result,indent=2)+"\n",encoding="utf-8")
print(f"VERIFIED {locale}: 7 audible segments, H264/AAC, {cursor/24:.2f}s, 7 scenes")
