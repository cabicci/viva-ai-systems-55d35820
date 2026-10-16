"""Generate one bounded S1-03 simulation-scene draft; no automatic retry."""
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

TARGET = "s103-video-decide"


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
    assert [a["id"] for a in plan["assets"]] == [TARGET]
    assert plan["assets"][0]["role"] == "video"
    assert plan["assets"][0]["sourceRecordIds"] == ["TE-U1-T3-D031", "TE-U1-T3-D034", "TE-U1-T3-D047"]
    assert plan["assets"][0]["scenes"] == ["s103-reading-decide"]
    assert contract["reviewModel"] == "gemini-2.5-flash" and contract["maxRepairsPerAsset"] == 3
    assert set(contract["assets"]) == {TARGET}
    assert request["action"] == "s103-one-source-linked-video-style-proof-initial"
    assert request["stepId"] == "S1-03" and request["targetAssetIds"] == [TARGET]
    assert request["sourcePreflight"] == "authoring/S1-03/video-decide-proof-preflight.private.json"
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
    output = HERE / "output" / TARGET
    output.mkdir(parents=True, exist_ok=True)
    state_path = output / "state.json"
    assert not state_path.exists(), "This bounded request already began; never repeat blindly"
    state = {"stepId": "S1-03", "assetId": TARGET, "requestHash": sha(HERE / "request.json"),
             "callKind": request["action"], "initialCallNumber": 1, "repairCallsUsed": 0,
             "status": "started", "manualAcceptance": False, "ownerAcceptedAsLesson": False,
             "noPublication": True}
    core.write(state_path, state)
    try:
        asset = plan["assets"][0]
        entry = generator.generate({**plan, "style": pilot_style}, asset, token, output)
        result = quality.check(asset, output / entry["filename"], contract, token)
        state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                      "message": "Inspect actual pixels against source and S1-01; no automatic repair or final media claim."})
        print(f"{TARGET}: draft saved; automated passed={result['passed']}", flush=True)
    except Exception as error:
        state.update({"status": "error", "error": str(error)[:300]})
        core.write(state_path, state)
        raise
    core.write(state_path, state)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("validate", "produce"))
    args = parser.parse_args()
    load()
    if args.command == "produce":
        produce()
    else:
        print("Verified one bounded S1-03 simulated decision-scene request")
