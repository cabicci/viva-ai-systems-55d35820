#!/usr/bin/env python3
"""Render the branch-only furniture lesson using the existing Gemini TTS pipeline."""
from __future__ import annotations
import argparse
import json
import math
import re
from pathlib import Path
import subprocess
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE / "lib"))
from gemini_tts import synthesize_segments, GAP_MS  # noqa: E402
from technical_egyptian import technical_policy  # noqa: E402
from captions_vtt import write_captions_vtt  # noqa: E402


def mux_audio(silent, audio, output):
    subprocess.run(["ffmpeg", "-y", "-i", str(silent), "-i", str(audio),
                    "-map", "0:v:0", "-map", "1:a:0", "-af", "apad",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", str(output)], check=True, capture_output=True)
    report = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(output),
        "-af", "volumedetect", "-vn", "-sn", "-dn", "-f", "null", "-"],
        check=True, capture_output=True, text=True).stderr
    match = re.search(r"mean_volume:\s*([-\d.]+) dB", report)
    if not match or float(match.group(1)) < -60:
        raise RuntimeError("Narrated output is silent or below the audible level gate; upload blocked")
    return float(match.group(1))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--locale", choices=["ar-EG", "ar-MSA", "ar-Gulf", "en"], required=True)
    args = parser.parse_args()
    scripts = json.loads((ROOT / "remotion/src/furniture/script.json").read_text())
    scenes = scripts[args.locale]
    work_id = f"furniture-m1-cut-list__{args.locale}"
    work = Path("/tmp") / work_id
    work.mkdir(parents=True, exist_ok=True)
    audio = work / "audio/master.mp3"
    segments = [(i, "Charon", scene["spoken"], scene.get("focus", "")) for i, scene in enumerate(scenes)]
    durations = synthesize_segments(segments, str(audio.parent), str(audio),
                                   locale=None if args.locale == "ar-EG" else args.locale,
                                   narration_policy=technical_policy(args.locale))
    frames = [math.ceil((duration + (GAP_MS / 1000 if i < len(durations) - 1 else 0.5)) * 30)
              for i, duration in enumerate(durations)]
    props = work / "props.json"
    props.write_text(json.dumps({"locale": args.locale, "sceneFrames": frames, "narrated": True}))
    silent = work / "remotion-silent.mp4"
    subprocess.run(["bunx", "--no-install", "remotion", "render", "src/furniture/index.tsx",
                    "furniture-pilot-assembly", str(silent), "--props", str(props),
                    "--codec=h264", "--crf=20", "--concurrency=2"], cwd=ROOT / "remotion", check=True)
    output = ROOT / "public/lessons/intro" / f"{work_id}.mp4"
    output.parent.mkdir(parents=True, exist_ok=True)
    # Pad the final narration to cover rounding/tail; never trim the last sentence.
    mean_volume = mux_audio(silent, audio, output)
    write_captions_vtt(work_id, scenes, durations)
    (work / "transcript.txt").write_text("\n\n".join(scene["spoken"] for scene in scenes))
    (work / "render-evidence.json").write_text(json.dumps({"locale": args.locale,
        "sceneFrames": frames, "durationSeconds": sum(frames) / 30,
        "mp4": str(output), "tts": "existing-gemini-tts", "voice": "Charon",
        "meanVolumeDb": mean_volume}, indent=2))
    print(f"Built {output}")


if __name__ == "__main__":
    main()
