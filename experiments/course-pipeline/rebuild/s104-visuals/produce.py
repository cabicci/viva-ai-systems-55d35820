"""Bounded source-linked S1-04 stills; never publish or rerun a started asset."""
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
    assert [a["id"] for a in plan["assets"]] == [
        "s1-04-tool-layout-still", "s1-04-representation-still", "s1-04-contamination-still"
    ]
    assert all(a["role"] == "lesson" and a["sourceRecordIds"] and a["scenes"] for a in plan["assets"])
    assert "TE-U1-T1-D053" in plan["assets"][0]["sourceRecordIds"]
    assert set(contract["assets"]) == {a["id"] for a in plan["assets"]}
    assert contract["maxRepairsPerAsset"] == 3
    assert request["action"] == "s104-two-other-stills-initial" and request["stepId"] == "S1-04"
    assert request["targetAssetIds"] == ["s1-04-representation-still", "s1-04-contamination-still"]
    assert request["priorToolStillRunId"] == 38831233080
    assert request["priorToolStillSha256"] == "c65f5ffcefecdeeff9ec1433c2e506b09817060c3c02906f5e75f237fdb62356"
    assert request["noPublication"] is True
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
    for asset_id in request["targetAssetIds"]:
        asset, = [item for item in plan["assets"] if item["id"] == asset_id]
        asset_output = output / asset_id
        asset_output.mkdir(parents=True, exist_ok=True)
        state_path = asset_output / "state.json"
        assert not state_path.exists(), f"Asset {asset_id} already began; never repeat blindly"
        state = {"stepId": "S1-04", "assetId": asset_id, "requestHash": sha(HERE / "request.json"),
                 "initialCallNumber": 1, "repairCallsUsed": 0, "status": "started", "manualAcceptance": False,
                 "ownerAcceptedAsLesson": False, "noPublication": True}
        core.write(state_path, state)
        try:
            entry = generator.generate({**plan, "style": pilot_style}, asset, token, asset_output)
            result = quality.check(asset, asset_output / entry["filename"], contract, token)
            state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                          "message": "Inspect actual pixels against source geometry and S1-01 before accepting; no automatic repair."})
        except Exception as error:
            state.update({"status": "error", "error": str(error)[:300]})
            core.write(state_path, state)
            raise
        core.write(state_path, state)
        print(f"{asset_id}: draft saved; automated passed={result['passed']}; human pixel review required", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("validate", "produce"))
    args = parser.parse_args()
    load()
    if args.command == "produce":
        produce()
    else:
        print("Verified two new bounded S1-04 still requests; existing tool still unchanged")
