"""Generate only the next three source-linked S1-04 draft video-scene images."""
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

TARGETS = ["s104-video-structure", "s104-video-contamination", "s104-video-prepare"]
PROTECTED_STILLS = {
    "s1-04-representation-still": "2a9c09f4d2c6df2620f411e9e2dc58ff745a15f3541475714e4404a5482292e0",
    "s1-04-tool-layout-still": "c65f5ffcefecdeeff9ec1433c2e506b09817060c3c02906f5e75f237fdb62356",
    "s1-04-contamination-still": "361e75b9439b2c91a489c1531b6cdcd4a0c2a11327388e7546fcb6b48ca86a0d",
}
PROTECTED_VIDEO = {
    "s104-video-purpose": "e37f45f06201e397659e128e16826f5b271dbe6733562fd540b41f58a3550167",
    "s104-video-representation": "3e8009cf3083530c05768fafa5a78a894a7bf899fffd42d3c81af293aee65490",
    "s104-video-tools": "1aab06da6570acb44e41f1e434ca65682b4b2ac1b942e14ca3eb7a4c4edc1e29",
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
    assert request["action"] == "s104-three-source-linked-video-scenes-b-initial"
    assert request["stepId"] == "S1-04" and request["targetAssetIds"] == TARGETS
    assert request["protectedStillHashes"] == PROTECTED_STILLS
    assert request["protectedVideoHashes"] == PROTECTED_VIDEO
    assert request["priorRunId"] == 38836980647
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
        state = {"stepId": "S1-04", "assetId": asset["id"], "requestHash": sha(HERE / "request.json"),
                 "callKind": request["action"], "initialCallNumber": 1, "repairCallsUsed": 0,
                 "status": "started", "manualAcceptance": False, "ownerAcceptedAsLesson": False,
                 "protectedStillHashes": PROTECTED_STILLS, "protectedVideoHashes": PROTECTED_VIDEO, "noPublication": True}
        core.write(state_path, state)
        try:
            entry = generator.generate({**plan, "style": pilot_style}, asset, token, asset_output)
            result = quality.check(asset, asset_output / entry["filename"], contract, token)
            state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                          "message": "Inspect actual pixels against source, S1-01 and protected S1-04 stills; no automatic repair."})
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
        print("Verified three bounded S1-04 draft video scenes; accepted stills protected")
