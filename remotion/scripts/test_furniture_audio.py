import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("builder", Path(__file__).parent / "build-furniture-pilot.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class NarrationMuxTests(unittest.TestCase):
    def test_selects_narration_when_the_video_already_has_a_silent_audio_track(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            video, voice, output = root / "silent.mp4", root / "voice.wav", root / "final.mp4"
            subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "color=c=white:s=160x90:d=1",
                "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "1", "-c:v", "libx264", "-c:a", "aac", str(video)], check=True, capture_output=True)
            subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", str(voice)], check=True, capture_output=True)
            self.assertGreater(builder.mux_audio(video, voice, output), -40)
            silent_voice = root / "silent.wav"
            subprocess.run(["ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", "1", str(silent_voice)], check=True, capture_output=True)
            with self.assertRaises(RuntimeError):
                builder.mux_audio(video, silent_voice, output)


if __name__ == "__main__":
    unittest.main()
