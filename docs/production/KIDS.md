# Kids production reference

Start at [README](README.md). The source archive retains both `feature/masaarat-kids-pilot` and `feature/masaarat-kids-levels-2-3`; see exact tags/SHAs in [sources](sources.json). Both matter: the later branch does not contain every exact earlier file version.

Source root: `experiments/masaarat-kids/`.

- Authored locale packages and scene scripts: `content/`, `curriculum/level-{1,2,3}/lesson-*`.
- Preparation: `scripts/prepare-level1-video.py`, `scripts/prepare-advanced-video.py`.
- Narration: `scripts/narrate-level1.py` supports `--level`, `--lesson`, `--locale`; existing locale instructions and voice policy are retained.
- Audio finishing: `scripts/trim-level1-audio.py`.
- Renderer: `scripts/render-level1.ts`, source compositions under `src/`; advanced production reuses this entry point with the selected level.
- Validation: `scripts/verify-level1.py`; scene-aligned WebVTT, narration hashes and media evidence remain separate.
- Existing workflow references: `kids-level1-production.yml`, `kids-advanced-production.yml` in the preserved commits. These historical requests are not new production orders.

Platform integration on main: `content/kids/media-inventory.json` (144 exact source/caption checksum entries), `scripts/kids/stage_media.py`, `scripts/kids/import_drafts.py`, private-content/playback endpoints and family grants. Hosting, approved private content and parent/child isolation must remain separate from renderer preview content. Never re-import or replace an accepted package merely to centralize documentation.

Old production artifacts included narration, MP4, captions and evidence, with time-limited Actions retention. Preservation does not claim every original WAV/MP4 remains available permanently. A future change must locate required originals or clearly record which are unavailable before any specifically approved new generation.
