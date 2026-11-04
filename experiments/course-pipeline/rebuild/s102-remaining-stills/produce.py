"""Generate only the three distinct S1-02 reading stills; one call each, no publication."""
from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ENGINE = HERE.parents[1]
sys.path.insert(0, str(ENGINE))
import generate_visuals as generator
import pipeline as core
import visual_quality as quality

TARGETS = ["s1-02-scene-safety-still", "s1-02-heat-comparison-still", "s1-02-aid-kit-still"]
EXCLUDED_VIDEO_SCENES = [
    "s102-video-assess", "s102-video-alert", "s102-video-injury", "s102-video-heat",
    "s102-video-chemical", "s102-video-kit", "s102-video-road-case",
    "s102-video-dizzy-case", "s102-video-ankle-case", "s102-video-eye-case",
    "s102-video-kit-case",
]


def sha(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load():
    plan = core.read(HERE / "visuals.json")
    contract = core.read(HERE / "contract.json")
    request = core.read(HERE / "request.json")
    assert plan["provider"] == "gemini" and plan["apiVersion"] == "v1beta"
    assert plan["model"] == "gemini-nano-banana-2.1"
    assert plan["imageSize"] == "2K" and plan["aspectRatio"] == "16:9"
    assert plan["styleReference"] == "course/visuals.json"
    assert [a["id"] for a in plan["assets"]] == TARGETS
    assert all(a["role"] == "lesson" and a["sourceRecordIds"] and a["scenes"] for a in plan["assets"])
    assert set(contract["assets"]) == set(TARGETS)
    assert contract["reviewModel"] == "gemini-2.5-flash" and contract["maxRepairsPerAsset"] == 3
    assert request["action"] in ("s102-three-distinct-reading-stills-initial", "s102-scene-safety-still-targeted-repair-1")
    assert request["stepId"] == "S1-02"
    if request["action"] == "s102-scene-safety-still-targeted-repair-1":
        assert request["targetAssetIds"] == ["s1-02-scene-safety-still"]
        assert request["priorRunId"] == 38835345260
        assert request["priorSafetySha256"] == "ada32a0559b43245872582dabda208973a544c5d77635d73d5277458ecaa63f0"
        assert request["repairCallNumber"] == 1
        assert request["protectedAcceptedHashes"] == {
            "s1-02-heat-comparison-still": "157c56f29f3fef8356f66ab6ccb8a648a838d3c4494d4be58cb28c213cd464c6",
            "s1-02-aid-kit-still": "2505108e675e14a39fe12f76a881bbe55e5ecb596e62810b582876c9bef8564e",
        }
    else:
        assert request["targetAssetIds"] == TARGETS
    assert request["excludedVideoSceneIds"] == EXCLUDED_VIDEO_SCENES
    assert request["referenceExampleRunId"] == 38834215716
    assert request["noPublication"] is True and request["noAutomaticRepair"] is True
    assert request["planHash"] == core.digest(plan)
    assert request["contractHash"] == core.digest(contract)
    assert request["scriptHash"] == sha(Path(__file__))
    pilot_style = core.read(ENGINE / plan["styleReference"])["style"]
    assert request["styleHash"] == core.digest(pilot_style)
    return plan, contract, request, pilot_style


def produce():
    plan, contract, request, pilot_style = load()
    token = next((os.environ.get(name) for name in
                  ("GEMINI_API_KEY", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3")
                  if os.environ.get(name)), None)
    assert token, "No Actions Gemini credential configured; stop"
    for model in (plan["model"], contract["reviewModel"]):
        available = core.request_json(f"https://generativelanguage.googleapis.com/v1beta/models/{model}", token)
        assert "generateContent" in available.get("supportedGenerationMethods", []), "Image/review model unavailable"
    output = HERE / "output"
    output.mkdir(parents=True, exist_ok=True)
    errors = []
    for asset in (a for a in plan["assets"] if a["id"] in request["targetAssetIds"]):
        asset_output = output / asset["id"]
        asset_output.mkdir(parents=True, exist_ok=True)
        state_path = asset_output / "state.json"
        assert not state_path.exists(), f"Asset {asset['id']} already began; never repeat blindly"
        state = {"stepId": "S1-02", "assetId": asset["id"], "requestHash": sha(HERE / "request.json"),
                 "callKind": request["action"], "initialCallNumber": 1,
                 "repairCallsUsed": request.get("repairCallNumber", 0),
                 "priorCandidateSha256": request.get("priorSafetySha256"), "status": "started",
                 "manualAcceptance": False, "ownerAcceptedAsLesson": False, "noPublication": True}
        core.write(state_path, state)
        try:
            entry = generator.generate({**plan, "style": pilot_style}, asset, token, asset_output)
            result = quality.check(asset, asset_output / entry["filename"], contract, token)
            state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                          "message": "Inspect actual pixels and compare with S1-01 and future actual video frames; no automatic repair."})
            print(f"{asset['id']}: draft saved; automated passed={result['passed']}", flush=True)
        except Exception as error:
            state.update({"status": "error", "error": str(error)[:300]})
            errors.append(asset["id"])
            print(f"{asset['id']}: error recorded; continuing other independent stills without retry", flush=True)
        core.write(state_path, state)
    if errors:
        raise RuntimeError("Some still calls failed without retry: " + ", ".join(errors))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("validate", "produce"))
    args = parser.parse_args()
    load()
    if args.command == "produce":
        produce()
    else:
        print("Verified three bounded distinct S1-02 reading stills; all video scenes excluded")
