"""One bounded source-linked S1-04 tool still proof; never publish."""
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
    assert len(plan["assets"]) == 1 and plan["assets"][0]["id"] == "s1-04-tool-layout-still"
    assert plan["assets"][0]["role"] == "lesson"
    assert "TE-U1-T1-D053" in plan["assets"][0]["sourceRecordIds"]
    assert set(contract["assets"]) == {plan["assets"][0]["id"]}
    assert contract["maxRepairsPerAsset"] == 3
    assert request["action"] == "s104-tool-still-proof-one" and request["stepId"] == "S1-04"
    assert request["targetAssetId"] == plan["assets"][0]["id"] and request["noPublication"] is True
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
    state_path = output / "state.json"
    assert not state_path.exists(), "This one-image request already began; never repeat blindly"
    asset = plan["assets"][0]
    state = {"stepId": "S1-04", "assetId": asset["id"], "requestHash": sha(HERE / "request.json"),
             "initialCallNumber": 1, "repairCallsUsed": 0, "status": "started", "manualAcceptance": False,
             "ownerAcceptedAsLesson": False, "noPublication": True}
    core.write(state_path, state)
    try:
        entry = generator.generate({**plan, "style": pilot_style}, asset, token, output)
        result = quality.check(asset, output / entry["filename"], contract, token)
        state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                      "message": "Inspect actual pixels against source geometry and S1-01 before accepting; no automatic repair."})
    except Exception as error:
        state.update({"status": "error", "error": str(error)[:300]})
        core.write(state_path, state)
        raise
    core.write(state_path, state)
    print(f"S1-04 tool still candidate saved; automated passed={result['passed']}; human pixel review required", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("validate", "produce"))
    args = parser.parse_args()
    load()
    if args.command == "produce":
        produce()
    else:
        print("Verified one-asset S1-04 tool still request")
