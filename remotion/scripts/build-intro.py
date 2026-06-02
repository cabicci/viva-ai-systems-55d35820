#!/usr/bin/env python3
"""Build the platform intro video.

- 5 scenes, Egyptian Arabic, voice Charon
- Cinematic background music from ElevenLabs Music API
- Mixes voice (full) + music (ducked) + renders Remotion comp `platform-intro`
- Output: public/intro/platform-intro.mp4
"""
from __future__ import annotations
import json, math, os, subprocess, sys, time, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
sys.path.insert(0, HERE)

from lib.gemini_tts import synthesize_segments  # type: ignore

FPS = 30
TAIL_SILENCE_FRAMES = 9
ID = "platform-intro"
OUT_DIR = f"/tmp/{ID}"
AUDIO_DIR = f"{OUT_DIR}/audio"

SCENES = [
    ("Charon",
     "تخيّل.",
     "تخيّل=takhayyel, نبرة سينمائية بطيئة وعميقة"),
    ("Charon",
     "إنّك تشتغل بالذكاء الاصطناعي. من غير ما تكون مبرمج. ومن غير ما تكون فاهم حاجة.",
     "الذكاء الاصطناعي=el-zaka' el-istina'i, مبرمج=mebarmeg"),
    ("Charon",
     "منصّة كاملة بالعربي. صفر برمجة. صفر تعقيد. بأبسط لغة، خطوة بخطوة، من الصفر.",
     "منصّة=manaSSa, تعقيد=ta'eed"),
    ("Charon",
     "خمس مسارات. Builder. Creator. Automator. Analyst. وBusiness. اختار اللي يعجبك وابدأ.",
     "نطق إنجليزي طبيعي للخمس كلمات، فاصل واضح بينهم"),
    ("Charon",
     "المستقبل وصل. والمفتاح بقى في إيدك. ابدأ دلوقتي.",
     "نبرة قوية وحاسمة"),
]


def gen_music(duration_s, out_path):
    if os.path.exists(out_path) and os.path.getsize(out_path) > 10000:
        print(f"[music] cached -> {out_path}")
        return
    api_key = (os.environ.get("ELEVENLABS_API_KEY_1")
               or os.environ.get("ELEVENLABS_API_KEY"))
    if not api_key:
        raise RuntimeError("ELEVENLABS_API_KEY missing")
    prompt = (
        "Cinematic futuristic ambient instrumental. Slow majestic build with deep "
        "sub-bass pulse, ethereal synth pads, soft golden shimmer textures, and sparse "
        "piano notes. Subtle low percussion entering midway. Elegant, mysterious, "
        "premium and uplifting mood. Fully instrumental, no vocals, no lyrics."
    )
    dur_ms = max(10000, int(math.ceil(duration_s) * 1000))
    body = json.dumps({"prompt": prompt, "music_length_ms": dur_ms}).encode()
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1/music",
        data=body,
        headers={"xi-api-key": api_key, "Content-Type": "application/json"},
        method="POST",
    )
    print(f"[music] requesting {dur_ms}ms cinematic track...")
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            audio = r.read()
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"music HTTP {e.code}: {e.read().decode()[:300]}")
    with open(out_path, "wb") as f:
        f.write(audio)
    print(f"[music] done in {time.time()-t0:.1f}s -> {out_path} ({len(audio)//1024} KB)")


def mix_voice_and_music(voice_mp3, music_mp3, out_mp3):
    print("[mix] sidechain-ducking music under voice...")
    cmd = [
        "ffmpeg", "-y",
        "-i", voice_mp3,
        "-i", music_mp3,
        "-filter_complex",
        "[0:a]volume=1.0,aresample=44100[voice];"
        "[1:a]volume=0.18,aresample=44100[bg];"
        "[bg][voice]sidechaincompress=threshold=0.04:ratio=8:attack=20:release=400:makeup=1[bgduck];"
        "[voice][bgduck]amix=inputs=2:duration=first:dropout_transition=2,alimiter=limit=0.95[out]",
        "-map", "[out]",
        "-c:a", "libmp3lame", "-b:a", "192k",
        out_mp3,
    ]
    subprocess.check_call(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"[mix] done -> {out_mp3}")


def write_manifest(scene_frames):
    total = sum(scene_frames)
    manifest = {"totalFrames": total, "sceneFrames": scene_frames}
    path = os.path.join(REPO_ROOT, "remotion/src/intro/intro.manifest.json")
    with open(path, "w") as f:
        json.dump(manifest, f, indent=2)
    print(f"[manifest] {scene_frames} (total {total}f / {total/FPS:.1f}s) -> {path}")


def render_remotion(silent_out):
    print("[render] Remotion silent MP4...")
    renderer = os.path.join(HERE, "render-lesson.mjs")
    subprocess.check_call(
        ["bun", renderer, ID],
        cwd=os.path.join(REPO_ROOT, "remotion"),
    )
    src = f"/tmp/{ID}/remotion-silent.mp4"
    if src != silent_out:
        subprocess.check_call(["cp", src, silent_out])
    print(f"[render] -> {silent_out}")


def mux(silent_mp4, master_mp3, final_mp4):
    print("[mux] video + audio -> final mp4")
    subprocess.check_call([
        "ffmpeg", "-y", "-i", silent_mp4, "-i", master_mp3,
        "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", final_mp4,
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"[mux] -> {final_mp4}")


def main():
    os.makedirs(AUDIO_DIR, exist_ok=True)

    print("[1/5] Generating TTS (Charon, Egyptian)...")
    voice_master = f"{AUDIO_DIR}/voice.mp3"
    segments = [(i + 1, voice, text, focus)
                for i, (voice, text, focus) in enumerate(SCENES)]
    durations = synthesize_segments(segments, AUDIO_DIR, voice_master)
    print(f"[1/5] durations: {[round(d,2) for d in durations]} (sum {sum(durations):.1f}s)")

    scene_frames = [math.ceil(d * FPS) + TAIL_SILENCE_FRAMES for d in durations]
    total_frames = sum(scene_frames)
    write_manifest(scene_frames)

    print("[2/5] Generating cinematic music...")
    total_s = total_frames / FPS
    music_path = f"{AUDIO_DIR}/music.mp3"
    gen_music(total_s + 1.0, music_path)

    print("[3/5] Mixing voice + music...")
    master_mp3 = f"{AUDIO_DIR}/master.mp3"
    mix_voice_and_music(voice_master, music_path, master_mp3)

    print("[4/5] Rendering Remotion...")
    silent = f"{OUT_DIR}/silent.mp4"
    render_remotion(silent)

    print("[5/5] Final mux...")
    out_dir = os.path.join(REPO_ROOT, "public/intro")
    os.makedirs(out_dir, exist_ok=True)
    final = os.path.join(out_dir, f"{ID}.mp4")
    mux(silent, master_mp3, final)
    size_mb = os.path.getsize(final) / 1024 / 1024
    print(f"\nDONE -> {final} ({size_mb:.1f} MB, {total_s:.1f}s)")


if __name__ == "__main__":
    main()