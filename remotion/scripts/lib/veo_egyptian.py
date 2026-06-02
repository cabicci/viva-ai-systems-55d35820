"""
Veo Egyptian Arabic prompt builder.

Single source of truth for Egyptian Ammiya (Cairo) prompts sent to Veo.
Mirrors mem://design/egyptian-arabic-prompt-rules.

Usage:
    from lib.veo_egyptian import build_veo_prompt, NEGATIVE_PROMPT

    prompt = build_veo_prompt(
        arabic_line="الـ AI شاطر أوي في حاجات.",
        latin_phonetic="el-AI shaaTer awy fee 7agaat.",
        focus_words="شاطر=shaaTer (hard T), أوي=awy",
    )
"""

EGYPTIAN_RULES_BLOCK = """\
VOICE & ACCENT (CRITICAL — STRICT): Speak ONLY in NATIVE CAIRO EGYPTIAN ARABIC
(اللهجة المصرية العامية القاهرية / Masri). NEVER use Modern Standard Arabic
(fusha), NEVER Gulf, NEVER Levantine, NEVER Maghrebi.

PHONETIC RULES (mandatory):
 - ج = HARD G as in "gold" / "gamal". NEVER soft J/zh.
 - ق = GLOTTAL STOP (hamza), e.g. 'aal not qaal, 'orayyeb not qareeb.
   Exception only for: قرآن، القاهرة، قانون (keep Q).
 - ث = pronounced as ت (T) or س (S). Never English 'th'. e.g. keteer not katheer.
 - ذ = pronounced as د (D) or ز (Z). e.g. da not hadha, zaki not dhaki.
 - ظ = pronounced as ز (Z) or heavy ض (D).

GRAMMAR (Egyptian colloquial only):
 - Negation: ما+verb+ش (ماعرفش) or مش+noun (مش حلو). NEVER لا/ليس.
 - Future tense: prefix هـ (هسافر، هنعمل). NEVER سـ or سوف.
 - Present continuous: prefix بـ (بيشرب، بنلعب).
 - Relative pronoun: اللي for all (NEVER الذي/التي/الذين).

VOCABULARY (use Egyptian, never MSA):
 - ليه (not لماذا), إيه (not ماذا), إزاي (not كيف), إمتى (not متى), فين (not أين).
 - دلوقتي (not الآن), راح (not ذهب), شاف (not رأى), عايز/عايزة (not أريد).
 - بس (not فقط), قوي placed AFTER adjective (حلو قوي, not جداً جميل).
 - كويس / ماشي / تمام (not جيد/حسنًا).
 - Demonstrative AFTER noun: الراجل ده, البنت دي, الناس دول.

TONE: warm, friendly, melodic, energetic — like an Egyptian YouTuber explaining
to a friend. Mid-pace, clear, slight smile in voice. NOT formal, NOT news-anchor,
NOT religious.

PACING & SILENCE (CRITICAL):
 - Leave a clear natural breath/pause of 400–700ms between sentences (after
   every period . question mark ? or exclamation !).
 - DO NOT rush sentences together. Finish one sentence completely, pause,
   then start the next. Sentences must NEVER overlap or blend.
 - Within a sentence, brief pauses on commas are fine (~150ms).
 - Speak at moderate pace — clarity over speed.

ENGLISH TECH TERMS (AI, ChatGPT, Code, Training, Model, Bias, Hallucination,
Mission, Inference): spoken naturally with light Egyptian-English accent.

WORDS KNOWN TO MISPRONOUNCE — already substituted in the script; do not
revert: ضعف→مش شاطر فيه, الدقيقة→المظبوطة, منحاز→مايل, الناتج→النتيجة,
يخمّن→يخترع, بثقة→وهو واثق."""

NEGATIVE_PROMPT = (
    "text overlay, captions, subtitles, watermark, camera shake, zoom, pan, "
    "background change, multiple speakers, lip-sync mismatch, "
    "fusha pronunciation, Modern Standard Arabic, Gulf accent, Levantine accent, "
    "Maghrebi accent, music, background music, news-anchor tone, religious tone, "
    "English 'th' sound, hard Q sound, soft J for ج."
)

DEFAULT_SUBJECT = (
    "Ashraf — an Egyptian man in his mid-30s, casual modern look, "
    "warm friendly face, slight smile."
)
DEFAULT_BACKGROUND = (
    "Soft cream/peach studio background. Same across all clips. "
    "Soft natural lighting from upper-left. Subtle hand gesture only on emphasis word."
)
DEFAULT_CAMERA = (
    "Static medium shot, eye-level, slight depth of field. No camera movement."
)


def build_veo_prompt(
    arabic_line: str,
    latin_phonetic: str,
    focus_words: str,
    subject: str = DEFAULT_SUBJECT,
    background: str = DEFAULT_BACKGROUND,
    camera: str = DEFAULT_CAMERA,
) -> str:
    """Build a complete Veo prompt enforcing Egyptian Ammiya pronunciation.

    Args:
        arabic_line:    Exact Egyptian-colloquial Arabic to be spoken.
        latin_phonetic: Latin transliteration as pronunciation reference
                        (model should NOT read this aloud).
        focus_words:    Comma-separated list of tricky words with explicit
                        pronunciation hints, e.g. "تقوله='oolo (glottal)".
        subject:        Speaker description (defaults to Ashraf).
        background:     Studio/scene description.
        camera:         Camera instructions.
    """
    return (
        f"CAMERA: {camera}\n"
        f"SUBJECT: {subject}\n"
        f"BACKGROUND: {background}\n"
        f"\n"
        f"{EGYPTIAN_RULES_BLOCK}\n"
        f"\n"
        f"DIALOGUE (Arabic) — say EXACTLY this in Egyptian colloquial:\n"
        f"{arabic_line}\n"
        f"\n"
        f"PHONETIC GUIDE (Latin) — pronunciation reference only, do NOT read aloud:\n"
        f"{latin_phonetic}\n"
        f"\n"
        f"FOCUS WORDS (pronounce carefully): {focus_words}\n"
        f"\n"
        f"NEGATIVE: {NEGATIVE_PROMPT}"
    )


def concat_audio_with_silence(
    audio_paths: list[str],
    output_path: str,
    gap_ms: int = 400,
) -> None:
    """Concatenate audio clips with a silence gap between each.

    Re-encodes via ffmpeg's concat filter (not demuxer) so silence
    spacers reliably contribute to the output duration. Requires ffmpeg.
    Default gap = 400ms (matches the in-prompt pause rule).

    NOTE: Use an MP4-style container (.m4a, .mp4, .mov) for output.
    Raw ADTS .aac reports an incorrect duration via ffprobe even though
    the audio data is correct — m4a stores accurate stsz/stts metadata.
    """
    import subprocess, tempfile, os
    if not audio_paths:
        raise ValueError("audio_paths is empty")
    gap_s = gap_ms / 1000.0
    with tempfile.TemporaryDirectory() as tmp:
        # Generate silence as WAV (concat filter handles PCM cleanly).
        silence = os.path.join(tmp, "gap.wav")
        subprocess.run(
            ["ffmpeg", "-y", "-f", "lavfi", "-i",
             "anullsrc=channel_layout=stereo:sample_rate=48000",
             "-t", str(gap_s), silence],
            check=True, capture_output=True,
        )
        # Build input list and concat filter spec.
        inputs: list[str] = []
        parts: list[str] = []
        idx = 0
        for i, p in enumerate(audio_paths):
            inputs += ["-i", p]
            parts.append(f"[{idx}:a]")
            idx += 1
            if i < len(audio_paths) - 1:
                inputs += ["-i", silence]
                parts.append(f"[{idx}:a]")
                idx += 1
        n = len(parts)
        filter_complex = "".join(parts) + f"concat=n={n}:v=0:a=1[out]"
        cmd = ["ffmpeg", "-y", *inputs,
               "-filter_complex", filter_complex,
               "-map", "[out]", "-c:a", "aac", "-b:a", "192k", output_path]
        subprocess.run(cmd, check=True, capture_output=True)