# Qualified remaining-step master assembly

This package adds no provider call and never changes selected source speech. It is separate from the acceptedS01 assembler. Its Actions worker supports the actual5/6scene source packages for existingFATE2-S02–S11 and any complete ready subset of the commissionedar-EG/en locales. It preserves each original monoPCM16/24kHz passage exactly and adds only measured sub-frame zero tails to the30fps scene boundary. MP4 delivery uses AAC; the retained assembledWAV is the exact-source reuse evidence.

## Build an actual selection

Root creates a real selected-scene JSON only after the actual audio gates and rendered files exist:

```json
{
  "step": "FATE2-S02",
  "locales": {
    "ar-EG": [
      {
        "sceneIndex": 1,
        "deliverySHA256": "ACTUAL_ACCEPTED_DELIVERY_SHA",
        "audio": {"run": 123, "artifact": "actual-original", "file": "S02-01-ar-EG.wav", "sha256": "ACTUAL_SHA", "localPath": "production/ACTUAL/artifacts/actual-original/S02-01-ar-EG.wav"},
        "audioGate": {"run": 124, "artifact": "actual-review", "file": "review-disposition.en.json", "sha256": "ACTUAL_SHA", "localPath": "production/ACTUAL/artifacts/actual-review/review-disposition.en.json"},
        "visual": {"run": 125, "artifact": "actual-render", "file": "visual.mp4", "sha256": "ACTUAL_SHA", "localPath": "production/ACTUAL/artifacts/actual-render/visual.mp4"},
        "timing": {"run": 125, "artifact": "actual-render", "file": "timing-and-inputs.en.json", "sha256": "ACTUAL_SHA", "localPath": "production/ACTUAL/artifacts/actual-render/timing-and-inputs.en.json"},
        "render": {"run": 125, "artifact": "actual-render", "file": "render.en.json", "sha256": "ACTUAL_SHA", "localPath": "production/ACTUAL/artifacts/actual-render/render.en.json"},
        "selectedVideo": {"run": 125, "artifact": "actual-render", "file": "ACTUAL_SCENE.mp4", "sha256": "ACTUAL_SHA", "localPath": "production/ACTUAL/artifacts/actual-render/ACTUAL_SCENE.mp4"}
      }
    ]
  }
}
```

The displayed123–125references andACTUAL_SHA strings above are schema illustrations only, not executable requests. Supply every scene in its exact source order; optionally provide `title` asar/en mapping. The builder fills currentsectionIDs, source textSHA and source titles and verifies every actual received artifact, the clear gate, PCM metadata, current spoken source, accepted delivery hash and renderer/clock identities. A hold, missing same-voice observation, stale text, unreviewed recording or wrong file cannot pass.

Run from the reviewed own worktree:

`python build_rest_masters.py --root PROJECT/rebuild-v2 --step FATE2-S02 --selection ACTUAL_SELECTION.json --version v1`

It creates only`rest-master-assembly/jobs/FATE2-S02-v1/`: frozenrequest, exactimplementation copies, acceptedmethodcopy and`workflow.en.yml`. Root inspects/stages all dependency raw hashes and copies the emitted workflow to its reported`.github/workflows/...`target. Root performs the short verified push; this helper never mutates Git or registry state. No existing request version is overwritten. Each locale publishes immediately as`fate-v2-master-FATE2-S02-v1-LOCALE`.

The worker verifies actual clear source gates again, probes every silent scene onActions, assembles without crops/fades/time stretch, byte-checks originals at exactPCMpositions, decodes the fullMP4, and extracts actual encoded scene/join checkpoints in one pass. It returns source/audio/review/timing/scene identities, captions and measured chapter offsets. The gate is scoped machine qualification, not native/human listening or a full visual/scientific certificate.

## Integrate only received/reviewed outputs

Root first inspects actual encoded master checkpoints and saves a scoped review JSON with`status:qualified_for_owner_playback`, the exact`videoSHA256`and nonempty`actualEncodedFramesInspected:[{path,sha256}]`. Do not fill that record from intended artwork or metadata alone.

Prepare a received-master manifest:

```json
{"step":"FATE2-S02","masters":{"ar-EG":{"video":"production/ACTUAL/FATE2-S02-ar-EG.mp4","sha256":"ACTUAL_SHA","assembly":"production/ACTUAL/assembly.en.json","assemblySHA256":"ACTUAL_SHA","timeline":"production/ACTUAL/timeline.en.json","timelineSHA256":"ACTUAL_SHA","review":{"path":"production/ACTUAL/actual-master-review.en.json","sha256":"ACTUAL_SHA"}}}}
```

`python integrate_rest_masters.py --root PROJECT/rebuild-v2 --step FATE2-S02 --manifest ACTUAL_MANIFEST.json`

Default is plan-only: proposedfiles and exactbefore/afterhashes under`rest-master-assembly/plans/`. Root can inspect them then repeat with`--apply`for the authorized narrow preview write. It hashes before mutation, backs up current bytes, reads back exact intended outputs and records a portable receipt. The new binding updates only this step's completedlocale(s), a dynamic completed-video notice and a boundedmedia-reviewsection. ExistingS01selection, every other lesson, theS02reviseddefinition/practicemodule, privateanswers and originals are preserved. A different existing selected video requires`--replace-expected-json`containing the exact old localeSHA; it is never silently replaced. No database/Bunny/platform publication occurs.

Run the pure guards with`python -B test_selection_contract.py`from this directory. Tests cover actualidentity/clock contracts, heldsound, unsupportedvoiceobservations, unit-framepadding boundaries, stale encodedversions and forbiddenpaths. They do not render media or certify nativebrowser/physical performance.
