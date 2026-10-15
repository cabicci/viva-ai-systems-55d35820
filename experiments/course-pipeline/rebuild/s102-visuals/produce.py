"""Generate and QA only the bounded S1-02 image request; never publish."""
from __future__ import annotations

import argparse
import hashlib
import json
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


def load() -> tuple[dict, dict, dict]:
    plan = core.read(HERE / "visuals.json")
    contract = core.read(HERE / "contract.json")
    request = core.read(HERE / "request.json")
    assert plan["provider"] == "gemini" and plan["model"] == "gemini-nano-banana-2.1"
    assert contract["reviewModel"] == "gemini-2.5-flash"
    assert contract["maxRepairsPerAsset"] == 3
    assert len(plan["assets"]) == 14 and len({a["id"] for a in plan["assets"]}) == 14
    assert {a["id"] for a in plan["assets"]} == set(contract["assets"])
    assert all(a["scenes"] and a["subject"] and a["role"] in ("video", "lesson") for a in plan["assets"])
    assert request["action"] == "generate-s102-images-only"
    assert request["stepId"] == "S1-02" and request["maxRepairsAfterInitial"] == 3
    assert request["planHash"] == core.digest(plan)
    assert request["contractHash"] == core.digest(contract)
    assert request["scriptHash"] == sha(Path(__file__))
    return plan, contract, request


def credential() -> str:
    token = next((os.environ.get(name) for name in ("GEMINI_API_KEY", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2", "GEMINI_API_KEY_3") if os.environ.get(name)), None)
    assert token, "No Actions Gemini credential configured; stop without generating"
    return token


def produce() -> None:
    plan, contract, request = load()
    token = credential()
    for model in (plan["model"], contract["reviewModel"]):
        status = core.request_json(f"https://generativelanguage.googleapis.com/v1beta/models/{model}", token)
        assert "generateContent" in status.get("supportedGenerationMethods", []), f"Model unavailable: {model}"
    dest = HERE / "output"
    dest.mkdir(parents=True, exist_ok=True)
    receipt = {
        "stepId": "S1-02", "requestHash": sha(HERE / "request.json"),
        "planHash": core.digest(plan), "contractHash": core.digest(contract),
        "provider": "gemini", "generated": False, "qualityPassed": False,
        "ownerAccepted": False, "assets": [], "failures": []
    }
    for asset in plan["assets"]:
        job_key = core.digest({"asset": generator.asset_key(plan, asset), "contract": contract})
        state_path = dest / "attempts" / f"{job_key}.json"
        state = core.read(state_path) if state_path.exists() else {"attempts": []}
        accepted = state.get("accepted")
        if accepted and (dest / accepted["filename"]).exists() and sha(dest / accepted["filename"]) == accepted["sha256"]:
            receipt["assets"].append(accepted)
            core.write(dest / "receipt.json", receipt)
            print(f"{asset['id']}: reused checked pixels", flush=True)
            continue
        reasons = state["attempts"][-1].get("failures", []) if state["attempts"] else []
        while len(state["attempts"]) <= contract["maxRepairsPerAsset"]:
            attempt = len(state["attempts"])
            record = {"attempt": attempt, "status": "started"}
            state["attempts"].append(record)
            core.write(state_path, state)
            subject = asset["subject"]
            if reasons:
                subject += "\nTARGETED REPAIR OF ONLY THESE VISIBLE DEFECTS: " + json.dumps(reasons, ensure_ascii=False)
            try:
                entry = generator.generate(plan, {**asset, "subject": subject}, token, dest)
                result = quality.check(asset, dest / entry["filename"], contract, token)
                entry.update({"role": asset["role"], "automatedQuality": result, "repairCount": attempt})
                reasons = [item["reason"] for item in result["checks"] if not item["pass"]]
                record.update({"status": "reviewed", "entry": entry, "failures": reasons})
                if result["passed"]:
                    state["accepted"] = entry
            except Exception as error:
                record.update({"status": "error", "error": str(error)[:300]})
                core.write(state_path, state)
                receipt["failures"].append({"id": asset["id"], "reason": "provider-or-transport-error", "detail": str(error)[:300]})
                core.write(dest / "receipt.json", receipt)
                raise  # Unknown outcome: preserve state and stop, never spend a blind retry.
            core.write(state_path, state)
            if state.get("accepted"):
                break
        if state.get("accepted"):
            receipt["assets"].append(state["accepted"])
            print(f"{asset['id']}: automated contract passed", flush=True)
        else:
            receipt["failures"].append({"id": asset["id"], "reason": "three-targeted-repairs-exhausted", "lastChecks": reasons})
            print(f"{asset['id']}: bounded QA exception", flush=True)
        core.write(dest / "receipt.json", receipt)
    receipt["generated"] = len(receipt["assets"]) == len(plan["assets"])
    receipt["qualityPassed"] = receipt["generated"] and not receipt["failures"]
    core.write(dest / "receipt.json", receipt)
    assert receipt["qualityPassed"], "Image stage has documented exceptions; no further paid attempts authorized"
    print("Fourteen S1-02 images passed automated checks; actual pixel review still required", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=("validate", "produce"))
    parser.add_argument("--request-sha", help="Exact request.json SHA-256 supplied by the bounded workflow dispatch")
    args = parser.parse_args()
    if args.request_sha:
        assert sha(HERE / "request.json") == args.request_sha, "Workflow dispatch requested a different image package"
    plan, contract, request = load()
    print(f"Verified bounded request for {len(plan['assets'])} S1-02 images")
    if args.command == "produce":
        produce()
