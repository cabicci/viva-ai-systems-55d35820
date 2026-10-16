"""Generate the last two bounded S1-03 simulated video-scene drafts."""
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

TARGETS = ["s103-video-evacuate", "s103-video-cases"]
PROTECTED_PREVIOUS = {
    "s103-video-decide": "e6e8fae62f67c745df872bbc70ad3d347b4f1bfdf32d1de6241d780f71fa340e",
    "s103-video-prepare": "63740ecd0e89c2408b47f1300bb90feab9ed9413d4cf029f6f7a1890726393fb",
    "s103-video-response": "d636c827028959213e020743e31dcf565f57e3c3f2abe986a4c02c62ea841ec8",
}


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
    assert all(a["role"] == "video" and a["sourceRecordIds"] and a["scenes"] for a in plan["assets"])
    assert set(contract["assets"]) == set(TARGETS)
    assert contract["reviewModel"] == "gemini-2.5-flash" and contract["maxRepairsPerAsset"] == 3
    assert request["action"] == "s103-two-source-linked-video-scenes-c-initial"
    assert request["stepId"] == "S1-03" and request["targetAssetIds"] == TARGETS
    assert request["sourcePreflight"] == "authoring/S1-03/video-scenes-c-preflight.private.json"
    assert request["priorRunId"] == 38841145763
    assert request["protectedPreviousHashes"] == PROTECTED_PREVIOUS
    assert request["noPublication"] is True and request["noAutomaticRepair"] is True
    assert request["planHash"] == core.digest(plan)
    assert request["contractHash"] == core.digest(contract)
    assert request["scriptHash"] == sha(Path(__file__))
    pilot_style = core.read(ENGINE / plan["styleReference"])["style"]
    assert request["styleHash"] == core.digest(pilot_style)
    return plan, contract, request, pilot_style


def produce() -> None:
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
    for asset in plan["assets"]:
        asset_output = output / asset["id"]
        asset_output.mkdir(parents=True, exist_ok=True)
        state_path = asset_output / "state.json"
        assert not state_path.exists(), f"Asset {asset['id']} already began; never repeat blindly"
        state = {"stepId": "S1-03", "assetId": asset["id"], "requestHash": sha(HERE / "request.json"),
                 "callKind": request["action"], "initialCallNumber": 1,
                 "repairCallsUsed": 0,
                 "status": "started", "manualAcceptance": False, "ownerAcceptedAsLesson": False,
                 "protectedPreviousHashes": PROTECTED_PREVIOUS, "noPublication": True}
        core.write(state_path, state)
        try:
            entry = generator.generate({**plan, "style": pilot_style}, asset, token, asset_output)
            result = quality.check(asset, asset_output / entry["filename"], contract, token)
            state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                          "message": "Inspect actual pixels against source, S1-01 and protected S1-03 previous images; no automatic repair."})
            print(f"{asset['id']}: draft saved; automated passed={result['passed']}", flush=True)
        except Exception as error:
            state.update({"status": "error", "error": str(error)[:300]})
            errors.append(asset["id"])
            print(f"{asset['id']}: error recorded; continuing other assets without retry", flush=True)
        core.write(state_path, state)
    if errors:
        raise RuntimeError("Some image calls failed without retry: " + ", ".join(errors))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("validate", "produce"))
    args = parser.parse_args()
    load()
    if args.command == "produce":
        produce()
    else:
        print("Verified two bounded S1-03 simulated video-scene requests; three earlier drafts protected")
