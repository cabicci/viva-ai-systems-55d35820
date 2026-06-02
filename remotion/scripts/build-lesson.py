#!/usr/bin/env python3
"""One-shot pipeline: lesson id -> finished MP4 at public/lessons/intro/<id>.mp4."""
from __future__ import annotations
import argparse
import json
import math
import os
import re
import subprocess
import sys
import fcntl
import time

HERE = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.abspath(os.path.join(HERE, "../.."))
sys.path.insert(0, os.path.join(HERE, "lib"))

from gemini_tts import synthesize_segments  # noqa: E402
from script_writer import generate_scenes_cached  # noqa: E402

FPS = 30
TAIL_SILENCE_FRAMES = 15


def normalize_lesson_id(raw):
    raw = (raw or "").strip()
    lessons_dir = os.path.join(REPO_ROOT, "src/components/intro/lessons")
    exact = os.path.join(lessons_dir, f"{raw}.ts")
    if os.path.exists(exact):
        return raw
    for name in os.listdir(lessons_dir):
        if not name.endswith(".ts") or name == "index.ts":
            continue
        stem = name[:-3]
        if stem.endswith(raw):
            print(f"[normalize] lesson id '{raw}' -> '{stem}'")
            return stem
    return raw


def render_and_mux(lid):
    t0 = time.time()
    print("[render] Rendering Remotion silent MP4")
    renderer = os.path.join(HERE, "render-lesson.mjs")
    render_log = f"/tmp/{lid}/render-lesson.log"
    os.makedirs(os.path.dirname(render_log), exist_ok=True)
    with open(render_log, "w") as f:
        proc = subprocess.Popen(
            ["bun", renderer, lid],
            cwd=os.path.join(REPO_ROOT, "remotion"),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
        )
        assert proc.stdout is not None
        for line in proc.stdout:
            print(line, end="")
            f.write(line)
        returncode = proc.wait()
    if returncode != 0:
        raise RuntimeError(
            f"Remotion render failed with exit code {returncode}; full log: {render_log}"
        )
    print(f"[render] done in {time.time()-t0:.1f}s")

    t1 = time.time()
    print("[mux] Muxing audio + video")
    silent = f"/tmp/{lid}/remotion-silent.mp4"
    master = f"/tmp/{lid}/audio/master.mp3"
    if not os.path.exists(master):
        raise FileNotFoundError(f"missing audio master: {master}")
    out_dir = os.path.join(REPO_ROOT, "public/lessons/intro")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, f"{lid}.mp4")
    subprocess.check_call(
        ["ffmpeg", "-y", "-i", silent, "-i", master,
         "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", out])
    print(f"[mux] done in {time.time()-t1:.1f}s")
    return out


def load_blocks(lesson_id):
    loader = os.path.join(HERE, "lib", "lesson-loader.mjs")
    out = subprocess.check_output(
        ["bun", loader, lesson_id], cwd=REPO_ROOT, text=True)
    data = json.loads(out)
    return data


def copy_assets_to_remotion_public(asset_map):
    if not asset_map:
        return
    src_root = os.path.join(REPO_ROOT, "src/assets/lessons")
    dst_root = os.path.join(REPO_ROOT, "remotion/public/lessons")
    os.makedirs(dst_root, exist_ok=True)
    for _, public_path in asset_map.items():
        # public_path is like "lessons/<...>/file.jpg"; preserve subdirs.
        rel = public_path[len("lessons/"):] if public_path.startswith("lessons/") else public_path
        src = os.path.join(src_root, rel)
        dst = os.path.join(dst_root, rel)
        if os.path.exists(src) and not os.path.exists(dst):
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with open(src, "rb") as f_in, open(dst, "wb") as f_out:
                f_out.write(f_in.read())
            print(f"  copied asset -> remotion/public/lessons/{rel}")


def write_scenes_module(lesson_id, scenes, frames):
    out_dir = os.path.join(REPO_ROOT, "remotion/src/lessons-generated")
    os.makedirs(out_dir, exist_ok=True)
    # Guard: if a ScreenshotCard references an image that doesn't exist in
    # remotion/public/, rewrite it to a safe BulletsCard so the render
    # doesn't 404. This catches Gemini hallucinations (e.g. diagram blocks
    # turned into ScreenshotCard with a made-up `src`).
    public_root = os.path.join(REPO_ROOT, "remotion/public")
    for s in scenes:
        v = s.get("visual") or {}
        if s.get("card") == "ScreenshotCard":
            src = (v.get("src") or "").lstrip("/")
            full = os.path.join(public_root, src) if src else ""
            valid_ext = src.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
            if not src or not valid_ext or not os.path.exists(full):
                print(f"  [guard] ScreenshotCard src missing/invalid ({src!r}) — rewriting to BulletsCard")
                caption = (v.get("caption") or v.get("title") or "").strip()
                # split caption into short bullets on sentence delimiters
                parts = [p.strip() for p in re.split(r"[.،؛\n]+", caption) if p.strip()]
                if not parts:
                    parts = [caption or v.get("eyebrow") or "خد الفكرة دي معاك"]
                s["card"] = "BulletsCard"
                s["visual"] = {
                    "title": v.get("title") or v.get("eyebrow") or "الفكرة",
                    "bullets": parts[:4],
                }
    visuals = []
    for s in scenes:
        visuals.append({"card": s["card"], "accent": s["accent"], **s["visual"]})
    body = (
        "// AUTO-GENERATED by remotion/scripts/build-lesson.py — do NOT edit.\n"
        'import type { SceneData } from "../lesson-cards";\n\n'
        f"export const SCENES: SceneData[] = "
        f"{json.dumps(visuals, ensure_ascii=False, indent=2)} as SceneData[];\n\n"
        f"export const SCENE_FRAMES: number[] = {json.dumps(frames)};\n"
        f"export const TOTAL_FRAMES = SCENE_FRAMES.reduce((a, b) => a + b, 0);\n"
    )
    with open(os.path.join(out_dir, f"{lesson_id}.gen.ts"), "w") as f:
        f.write(body)


def update_registry(lesson_id):
    reg_path = os.path.join(REPO_ROOT, "remotion/src/lessonsRegistry.ts")
    src = open(reg_path).read()
    ident = "L_" + re.sub(r"\W", "_", lesson_id)
    import_line = (
        f'import {{ SCENES as {ident}_S, SCENE_FRAMES as {ident}_F, '
        f'TOTAL_FRAMES as {ident}_T }} from "./lessons-generated/{lesson_id}.gen";'
    )
    entry_line = (
        f'  {{ id: "{lesson_id}", scenes: {ident}_S, sceneFrames: {ident}_F, '
        f"totalFrames: {ident}_T }},"
    )
    src = re.sub(
        rf'^import \{{[^}}]*\}} from "\./lessons-generated/{re.escape(lesson_id)}\.gen";\s*\n',
        "", src, flags=re.MULTILINE)
    src = re.sub(
        rf'^\s*\{{\s*id:\s*"{re.escape(lesson_id)}",[^}}]*\}},?\s*\n',
        "", src, flags=re.MULTILINE)
    src = src.replace("/* @lesson-imports-end */",
                      f"{import_line}\n/* @lesson-imports-end */")
    src = src.replace("/* @lesson-entries-end */",
                      f"{entry_line}\n  /* @lesson-entries-end */")
    with open(reg_path, "w") as f:
        f.write(src)


def preview_script(scenes, lesson_id):
    lines = [f"# Spoken script preview — {lesson_id}\n"]
    for i, s in enumerate(scenes, 1):
        lines.append(f"## Scene {i} · {s['card']} · {s['voice']} · {s['accent']}")
        lines.append(s["spoken"])
        if s.get("focus"):
            lines.append(f"_focus_: {s['focus']}")
        lines.append("")
    preview = "\n".join(lines)
    out_dir = f"/tmp/{lesson_id}"
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, "script-preview.md")
    with open(path, "w") as f:
        f.write(preview)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lesson_id")
    ap.add_argument("--preview-only", action="store_true",
                    help="Generate spoken script and stop.")
    ap.add_argument("--prepare-only", action="store_true",
                    help="Generate script, audio, scenes module and registry; skip render/mux.")
    ap.add_argument("--render-only", action="store_true",
                    help="Render + mux using already generated scenes/audio.")
    ap.add_argument("--force-script", action="store_true",
                    help="Re-call the AI even if a cached script exists.")
    args = ap.parse_args()

    lid = normalize_lesson_id(args.lesson_id)

    if args.render_only:
        out = render_and_mux(lid)
        print(f"\nDONE -> {out}")
        return 0

    print(f"\n[1/7] Loading lesson blocks: {lid}")
    data = load_blocks(lid)
    blocks = data["blocks"]
    asset_map = data.get("assetMap", {})
    has_quiz = bool(data.get("hasQuiz"))
    next_lesson_title = data.get("nextLessonTitle")
    next_lesson_id = data.get("nextLessonId")
    print(f"      context: has_quiz={has_quiz} next='{next_lesson_title}' ({next_lesson_id})")
    title = None
    for b in blocks:
        if b.get("eyebrow") == "HERO":
            title = b.get("title")
            break

    cache = f"/tmp/{lid}/script.json"
    if args.force_script and os.path.exists(cache):
        os.remove(cache)
    print("[2/7] Generating spoken script via Gemini (Flash→Pro fallback)")
    t_script = time.time()
    scenes = generate_scenes_cached(
        lid, blocks, title, cache,
        has_quiz=has_quiz, next_lesson_title=next_lesson_title,
    )
    print(f"      [script] total {time.time()-t_script:.1f}s")

    preview_path = preview_script(scenes, lid)
    print(f"      preview -> {preview_path} ({len(scenes)} scenes)")

    if args.preview_only:
        print("\nPreview-only mode; stopping.")
        return 0

    print("[3/7] Synthesising TTS audio")
    t_tts = time.time()
    audio_dir = f"/tmp/{lid}/audio"
    master = f"{audio_dir}/master.mp3"
    segments = [(i + 1, s["voice"], s["spoken"], s.get("focus", ""))
                for i, s in enumerate(scenes)]
    durations = synthesize_segments(segments, audio_dir, master)
    print(f"      [tts] total {time.time()-t_tts:.1f}s")

    frames = [math.ceil(d * FPS) + TAIL_SILENCE_FRAMES for d in durations]
    total = sum(frames)
    print(f"      scene frames: {frames}  (total {total} frames @ {FPS}fps)")

    print("[4/7] Writing scenes module + registering composition")
    copy_assets_to_remotion_public(asset_map)
    write_scenes_module(lid, scenes, frames)
    lock_path = os.path.join(REPO_ROOT, "remotion/src/lessonsRegistry.lock")
    with open(lock_path, "w") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        update_registry(lid)

    if args.prepare_only:
        print("\nPrepare-only mode; skipping render/mux.")
        return 0

    print("[5/7] Rendering + muxing")
    out = render_and_mux(lid)

    print(f"\n[7/7] DONE -> {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
