"""One bounded initial call for each missing S1-02 example scene; no repair or publication."""
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

TARGETS = [
    "s102-video-dizzy-case", "s102-video-ankle-case",
    "s102-video-eye-case", "s102-video-kit-case",
]
PROTECTED = [
    "s102-video-assess", "s102-video-alert", "s102-video-injury",
    "s102-video-heat", "s102-video-chemical", "s102-video-kit",
    "s102-video-road-case",
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
    assert all(a["role"] == "video" and a["sourceRecordIds"] and a["scenes"] for a in plan["assets"])
    assert set(contract["assets"]) == set(TARGETS)
    assert contract["maxRepairsPerAsset"] == 3
    assert contract["reviewModel"] == "gemini-2.5-flash"
    assert request["action"] == "s102-four-remaining-example-scenes-initial"
    assert request["stepId"] == "S1-02" and request["targetAssetIds"] == TARGETS
    assert request["protectedAcceptedAssetIds"] == PROTECTED
    assert request["priorFinalAcceptedRunId"] == 38830498735
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
    provider_errors = []
    for asset in plan["assets"]:
        asset_id = asset["id"]
        asset_output = output / asset_id
        asset_output.mkdir(parents=True, exist_ok=True)
        state_path = asset_output / "state.json"
        assert not state_path.exists(), f"Asset {asset_id} already began; never repeat blindly"
        state = {"stepId": "S1-02", "assetId": asset_id, "requestHash": sha(HERE / "request.json"),
                 "initialCallNumber": 1, "repairCallsUsed": 0, "status": "started",
                 "manualAcceptance": False, "ownerAcceptedAsLesson": False, "noPublication": True}
        core.write(state_path, state)
        try:
            entry = generator.generate({**plan, "style": pilot_style}, asset, token, asset_output)
            result = quality.check(asset, asset_output / entry["filename"], contract, token)
            state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                          "message": "Inspect actual pixels against source/safety and S1-01; no automatic repair."})
            print(f"{asset_id}: saved; automated passed={result['passed']}; pixel review required", flush=True)
        except Exception as error:
            state.update({"status": "error", "error": str(error)[:300]})
            provider_errors.append(asset_id)
            print(f"{asset_id}: error recorded; no blind retry; continuing other assets", flush=True)
        core.write(state_path, state)
    if provider_errors:
        raise RuntimeError("Some asset calls failed without retry: " + ", ".join(provider_errors))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("validate", "produce"))
    args = parser.parse_args()
    load()
    if args.command == "produce":
        produce()
    else:
        print("Verified four bounded S1-02 example-scene requests; seven accepted scenes protected")
