#!/usr/bin/env python3
"""Reuse the existing TTS, Remotion project, audio gate and caption writer."""
from __future__ import annotations
import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
VOICE = "Charon"
FOCUS = "Clear workshop vocabulary; preserve dimensions and decision meaning."
sys.path.insert(0, str(HERE / "lib"))
from gemini_tts import synthesize_segments, GAP_MS  # noqa: E402
from captions_vtt import write_captions_vtt  # noqa: E402
from importlib.util import spec_from_file_location, module_from_spec
spec = spec_from_file_location("furniture_builder", HERE / "build-furniture-pilot.py")
furniture = module_from_spec(spec)
spec.loader.exec_module(furniture)


def package_path(lesson_id, locale):
    if lesson_id not in {f"technical-m01-l0{i}" for i in range(1, 5)}:
        raise ValueError("Only reviewed M01 lesson IDs are eligible for this production batch")
    canonical_id = lesson_id.removeprefix("technical-").upper()
    return ROOT / f"src/lib/technical-education/lessons/{canonical_id}__{locale}.json"


def fingerprint(lesson_id, locale):
    paths = [HERE / "build-technical-lesson.py", HERE / "build-furniture-pilot.py",
             HERE / "lib/gemini_tts.py", HERE / "lib/locale_profiles.py",
             HERE / "lib/egyptian_phonetic.py", ROOT / "remotion/src/furniture/index.tsx"]
    if lesson_id == "furniture-m1-cut-list":
        paths += list((ROOT / "remotion/src/furniture").glob("*.ts"))
        paths += [ROOT / "remotion/src/furniture/FurnitureAssembly.tsx",
                  ROOT / "remotion/src/furniture/script.json", ROOT / "src/lib/furniture-pilot/model.ts"]
    else:
        paths += [package_path(lesson_id, locale), ROOT / "remotion/src/furniture/TechnicalExplainer.tsx",
                  ROOT / "src/components/technical-education/TechnicalDiagram.tsx"]
    h = hashlib.sha256(lesson_id.encode() + locale.encode())
    for p in sorted(set(paths)):
        h.update(str(p.relative_to(ROOT)).encode() + b"\0" + p.read_bytes())
    return h.hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lesson-id", required=True)
    parser.add_argument("--locale", choices=["ar-EG", "ar-MSA", "ar-Gulf", "en"], required=True)
    parser.add_argument("--fingerprint", action="store_true")
    parser.add_argument("--audio-fingerprint", action="store_true")
    args = parser.parse_args()
    if args.audio_fingerprint:
        if args.lesson_id == "furniture-m1-cut-list":
            data = json.loads((ROOT / "remotion/src/furniture/script.json").read_text())[args.locale]
            spoken = [{"spoken": s["spoken"], "focus": s.get("focus", "")} for s in data]
        else:
            lesson = json.loads(package_path(args.lesson_id, args.locale).read_text())
            spoken = [lesson["intro"], *[s["text"] for s in lesson["sections"]], lesson["example"]["text"] + " " + lesson["example"]["decision"]]
        h = hashlib.sha256(json.dumps({"spoken": spoken, "voice": VOICE, "locale": args.locale, "focus": FOCUS if args.lesson_id != "furniture-m1-cut-list" else "per-scene"}, ensure_ascii=False, sort_keys=True).encode())
        if args.lesson_id == "furniture-m1-cut-list": h.update((HERE / "build-furniture-pilot.py").read_bytes())
        for name in ["gemini_tts.py", "locale_profiles.py", "egyptian_phonetic.py"]:
            h.update((HERE / "lib" / name).read_bytes())
        print(h.hexdigest())
        return
    if args.fingerprint:
        print(fingerprint(args.lesson_id, args.locale))
        return
    if args.lesson_id == "furniture-m1-cut-list":
        subprocess.run([sys.executable, str(HERE / "build-furniture-pilot.py"), "--locale", args.locale], check=True)
        return
    lesson = json.loads(package_path(args.lesson_id, args.locale).read_text())
    diagram = lesson["sections"][0]["diagram"]
    # Display and speech are separate, linked by the original section ID.
    scenes = [{"concept_id": "overview", "title": lesson["title"],
               "detail": lesson["goals"][0], "spoken": lesson["intro"], "diagram": diagram}]
    for section in lesson["sections"]:
        scenes.append({"concept_id": section["id"], "title": section["title"],
                       "detail": section["text"].split(".")[0] + ".", "spoken": section["text"], "diagram": section["diagram"]})
    scenes.append({"concept_id": "example", "title": lesson["example"]["title"],
                   "detail": lesson["example"]["decision"],
                   "spoken": lesson["example"]["text"] + " " + lesson["example"]["decision"], "diagram": diagram})
    work_id = f"{args.lesson_id}__{args.locale}"
    work = Path("/tmp") / work_id
    work.mkdir(exist_ok=True)
    audio = work / "audio/master.mp3"
    segments = [(i, VOICE, s["spoken"], FOCUS) for i, s in enumerate(scenes)]
    durations = synthesize_segments(segments, str(audio.parent), str(audio), locale=None if args.locale == "ar-EG" else args.locale)
    frames = [math.ceil((duration + (GAP_MS / 1000 if i < len(durations) - 1 else 0.5)) * 30) for i, duration in enumerate(durations)]
    props = work / "props.json"
    props.write_text(json.dumps({"locale": args.locale, "title": lesson["title"], "scenes": scenes, "sceneFrames": frames}))
    silent = work / "remotion-silent.mp4"
    subprocess.run(["bunx", "--no-install", "remotion", "render", "src/furniture/index.tsx", "technical-lesson-explainer", str(silent), "--props", str(props), "--codec=h264", "--crf=20", "--concurrency=2"], cwd=ROOT / "remotion", check=True)
    output = ROOT / "public/lessons/intro" / f"{work_id}.mp4"
    output.parent.mkdir(parents=True, exist_ok=True)
    mean_volume = furniture.mux_audio(silent, audio, output)
    write_captions_vtt(work_id, scenes, durations)
    (work / "transcript.txt").write_text("\n\n".join(s["spoken"] for s in scenes))
    (work / "render-evidence.json").write_text(json.dumps({"lessonId": args.lesson_id, "locale": args.locale, "sceneFrames": frames, "durationSeconds": sum(frames) / 30, "meanVolumeDb": mean_volume, "fingerprint": fingerprint(args.lesson_id, args.locale), "naturalnessReview": "pending-listener-acceptance"}, indent=2))
    print(f"Built {output}")


if __name__ == "__main__":
    main()
