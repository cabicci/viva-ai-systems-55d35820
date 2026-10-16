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
    assert request["action"] in ("generate-s102-images-only", "repair-s102-style-proof-one", "repair-s102-assess-no-figure", "repair-s102-assess-continuous-barrier", "repair-s102-style-batch-a")
    assert request["stepId"] == "S1-02" and request["maxRepairsAfterInitial"] == 3
    assert request["planHash"] == core.digest(plan)
    assert request["contractHash"] == core.digest(contract)
    assert request["scriptHash"] == sha(Path(__file__))
    if request["action"] == "repair-s102-style-proof-one":
        assert request["targetAssetId"] == "s102-video-assess"
        assert request["priorRunId"] == 38824862958
        assert request["priorRequestSha256"] == "fa9dd442a48bcc5c3caa132e8752643fdab5905a311da69f395128d4fe355146"
        assert request["styleReferenceHash"] == core.digest(core.read(ENGINE / "course/visuals.json")["style"])
    if request["action"] == "repair-s102-assess-no-figure":
        assert request["targetAssetId"] == "s102-video-assess"
        assert request["priorRunId"] == 38827595401
        assert request["priorCandidateSha256"] == "58788c93ce1e7d201bc3e598f8f7b4408ffb1f6b33f281abcfd115925cb03b73"
        assert request["styleReferenceHash"] == core.digest(core.read(ENGINE / "course/visuals.json")["style"])
    if request["action"] == "repair-s102-assess-continuous-barrier":
        assert request["targetAssetId"] == "s102-video-assess"
        assert request["priorRunId"] == 38827990678
        assert request["priorCandidateSha256"] == "083ed57f1cdc5cb57b88414df09e36f3876076f1b03108e5bee95189fae3c739"
        assert request["styleReferenceHash"] == core.digest(core.read(ENGINE / "course/visuals.json")["style"])
    if request["action"] == "repair-s102-style-batch-a":
        assert request["priorRunId"] == 38828325464
        assert request["targetAssetIds"] == ["s102-video-alert", "s102-video-chemical"]
        assert request["priorImageHashes"] == {
            "s102-video-alert": "343ed9d2a5f89531f4f0b9675057f892979f7e0dcdd7956d5af149c2d974c36c",
            "s102-video-chemical": "c6643995050b14f63aafd3f252627e4f406757e2ba2363f3a2e02127b8978ae5",
        }
        assert request["styleReferenceHash"] == core.digest(core.read(ENGINE / "course/visuals.json")["style"])
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


def style_proof() -> None:
    """One bounded targeted style repair; preserve all old images and require manual acceptance."""
    plan, contract, request = load()
    token = credential()
    model = core.request_json(f"https://generativelanguage.googleapis.com/v1beta/models/{plan['model']}", token)
    assert "generateContent" in model.get("supportedGenerationMethods", []), "Image model unavailable"
    dest = HERE / "output"
    prior = core.read(dest / "receipt.json")
    assert prior["requestHash"] == request["priorRequestSha256"] and len(prior["assets"]) == 6
    original, = [row for row in prior["assets"] if row["id"] == request["targetAssetId"]]
    assert original["repairCount"] == 0 and (dest / original["filename"]).exists()
    assert sha(dest / original["filename"]) == original["sha256"]
    proof_dest = dest / "style-proof"
    proof_dest.mkdir(parents=True, exist_ok=True)
    state_path = proof_dest / "state.json"
    assert not state_path.exists(), "Style proof already attempted; do not spend another call"
    pilot_style = core.read(ENGINE / "course/visuals.json")["style"]
    assert core.digest(pilot_style) == request["styleReferenceHash"]
    source, = [item for item in plan["assets"] if item["id"] == request["targetAssetId"]]
    subject = (
        "A SMALL raised miniature field-access diorama seen from an elevated three-quarter isometric angle. "
        "At the near edge, a generic blank barrier marks a safe pause. A distinct simplified unbranded farm "
        "service-vehicle route and uneven ground are visible; a distant unmistakably synthetic faceless "
        "training mannequin is on the protected side of the miniature. The scene communicates assess the "
        "site before entering. Sculpted rounded CARTOON forms on warm off-white, clearly not photography; "
        "realistic earth, metal and fabric textures only. No letters, numbers, markings, car badge, logos, "
        "human figures, actual injury or text in pixels. Keep all props inside the frame with generous margin."
    )
    state = {"stepId": "S1-02", "assetId": source["id"], "requestHash": sha(HERE / "request.json"),
             "priorImageSha256": original["sha256"], "repairCallNumber": 1,
             "status": "started", "manualAcceptance": False, "scope": "one style proof only"}
    core.write(state_path, state)
    try:
        entry = generator.generate({**plan, "style": pilot_style}, {**source, "subject": subject}, token, proof_dest)
        checks = {**contract, "assets": {**contract["assets"], source["id"]: [
            {"id": "pilot-cartoon-parity", "criterion": "Clearly a compact stylized 3D CARTOON diorama on warm off-white like the accepted pilot, not photoreal full-scene photography."},
            {"id": "safe-scan", "criterion": "Raised miniature shows a safe barrier, distinct vehicle route, uneven ground and only a synthetic faceless training mannequin, with no letters or manufacturer badge."}
        ]}}
        result = quality.check(source, proof_dest / entry["filename"], checks, token)
        state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                      "manualAcceptance": False, "message": "Actual pixels must be compared with S1-01 before broader generation."})
    except Exception as error:
        state.update({"status": "error", "error": str(error)[:300], "manualAcceptance": False})
        core.write(state_path, state)
        raise
    core.write(state_path, state)
    print(f"One S1-02 style proof saved; automated passed={result['passed']}; manual review required", flush=True)


def assess_repair2() -> None:
    """One further assess-only repair after the first style candidate failed manual safety review."""
    plan, contract, request = load()
    dest = HERE / "output"
    previous = core.read(dest / "style-proof/state.json")
    assert previous["status"] == "candidate" and previous["repairCallNumber"] == 1
    assert previous["entry"]["sha256"] == request["priorCandidateSha256"]
    assert sha(dest / "style-proof/s102-video-assess.png") == request["priorCandidateSha256"]
    proof_dest = dest / "style-proof/assess-repair2"
    proof_dest.mkdir(parents=True, exist_ok=True)
    state_path = proof_dest / "state.json"
    assert not state_path.exists(), "Second assess repair already attempted; never spend a blind retry"
    pilot_style = core.read(ENGINE / "course/visuals.json")["style"]
    assert core.digest(pilot_style) == request["styleReferenceHash"]
    source, = [item for item in plan["assets"] if item["id"] == request["targetAssetId"]]
    subject = (
        "A compact raised field-access teaching diorama from an elevated three-quarter view, on the same warm "
        "off-white background and premium rounded 3D CARTOON form as the accepted pilot. A solid generic blank "
        "barrier COMPLETELY spans the near entrance to an empty track; the camera/viewer remains clearly on "
        "the safe near side. Far beyond the barrier, show an empty stationary generic unbranded farm utility "
        "vehicle on solid ground, and a separate clearly recessed hole plus uneven ground within the blocked "
        "area. The vehicle is NOT over the hole or tipping into it. The scene teaches pause and inspect before "
        "entering, never a rescue or crossing. NO person, mannequin, toy figure, face, body, silhouette or "
        "character anywhere. No text, numbers, arrows, markings, logos, manufacturer grille or badges. "
        "Sculpted miniature with tactile soil and metal textures; generous margin around every object."
    )
    state = {"stepId": "S1-02", "assetId": source["id"], "requestHash": sha(HERE / "request.json"),
             "priorCandidateSha256": previous["entry"]["sha256"], "repairCallNumber": 2,
             "status": "started", "manualAcceptance": False, "scope": "assess image only"}
    core.write(state_path, state)
    try:
        token = credential()
        model = core.request_json(f"https://generativelanguage.googleapis.com/v1beta/models/{plan['model']}", token)
        assert "generateContent" in model.get("supportedGenerationMethods", []), "Image model unavailable"
        entry = generator.generate({**plan, "style": pilot_style}, {**source, "subject": subject}, token, proof_dest)
        strict_global = [
            {**item, "criterion": "No person, mannequin, toy figure, face, hand, body, silhouette or character appears anywhere."}
            if item["id"] == "no-people" else item for item in contract["global"]
        ]
        checks = {**contract, "global": strict_global, "assets": {**contract["assets"], source["id"]: [
            {"id": "pilot-cartoon-parity", "criterion": "Compact stylized 3D CARTOON miniature on warm off-white like the accepted pilot; not photoreal full-scene photography."},
            {"id": "barrier-and-hole", "criterion": "An empty stationary unbranded vehicle and recessed ground hole are beyond a barrier that fully blocks the track; the near camera side is safe, with no vehicle over the hole."}
        ]}}
        result = quality.check(source, proof_dest / entry["filename"], checks, token)
        state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                      "manualAcceptance": False, "message": "Inspect actual pixels before accepting this repaired asset."})
    except Exception as error:
        state.update({"status": "error", "error": str(error)[:300], "manualAcceptance": False})
        core.write(state_path, state)
        raise
    core.write(state_path, state)
    print(f"S1-02 assess repair 2 saved; automated passed={result['passed']}; manual pixel review required", flush=True)


def assess_repair3() -> None:
    """Final authorized assess-image repair; preserve attempt history and require pixel inspection."""
    plan, contract, request = load()
    dest = HERE / "output"
    previous = core.read(dest / "style-proof/assess-repair2/state.json")
    assert previous["status"] == "candidate" and previous["repairCallNumber"] == 2
    assert previous["entry"]["sha256"] == request["priorCandidateSha256"]
    assert sha(dest / "style-proof/assess-repair2/s102-video-assess.png") == request["priorCandidateSha256"]
    proof_dest = dest / "style-proof/assess-repair3"
    proof_dest.mkdir(parents=True, exist_ok=True)
    state_path = proof_dest / "state.json"
    assert not state_path.exists(), "Third assess repair already attempted; no further provider calls"
    pilot_style = core.read(ENGINE / "course/visuals.json")["style"]
    assert core.digest(pilot_style) == request["styleReferenceHash"]
    source, = [item for item in plan["assets"] if item["id"] == request["targetAssetId"]]
    subject = (
        "Compact raised agricultural field-access safety diorama, premium rounded 3D CARTOON on warm off-white. "
        "The dominant FOREGROUND object is ONE UNBROKEN solid waist-high barrier/fence that stretches all the "
        "way from the LEFT OUTER EDGE to the RIGHT OUTER EDGE of the miniature across the ENTIRE entrance. "
        "Every possible path into the field crosses this continuous barrier; NO side gap, half barrier, opening "
        "or walk-around route. A generous EMPTY SAFE OBSERVATION AREA is in front of the barrier closest to "
        "the camera. Behind the barrier only, far from the viewer: an empty parked generic unbranded farm "
        "utility vehicle on solid ground at left, and a clearly recessed soil hole with uneven surface at "
        "right, separated from the vehicle. The vehicle is NOT tipping into the hole. This is a static hazard "
        "scan, with NO people, mannequins, toy figures, faces, bodies, characters, hands or silhouettes. "
        "No letters, symbols, numbers, arrows, logos, stripes, badges or pseudo-writing. Realistic soil and "
        "metal materials within simplified sculpted cartoon shapes; all objects inside frame with margin."
    )
    state = {"stepId": "S1-02", "assetId": source["id"], "requestHash": sha(HERE / "request.json"),
             "priorCandidateSha256": previous["entry"]["sha256"], "repairCallNumber": 3,
             "status": "started", "manualAcceptance": False, "scope": "final assess image repair only"}
    core.write(state_path, state)
    try:
        token = credential()
        model = core.request_json(f"https://generativelanguage.googleapis.com/v1beta/models/{plan['model']}", token)
        assert "generateContent" in model.get("supportedGenerationMethods", []), "Image model unavailable"
        entry = generator.generate({**plan, "style": pilot_style}, {**source, "subject": subject}, token, proof_dest)
        strict_global = [
            {**item, "criterion": "No person, mannequin, toy figure, face, hand, body, silhouette or character appears anywhere."}
            if item["id"] == "no-people" else item for item in contract["global"]
        ]
        checks = {**contract, "global": strict_global, "assets": {**contract["assets"], source["id"]: [
            {"id": "pilot-cartoon-parity", "criterion": "Compact clearly stylized 3D CARTOON miniature on warm off-white matching the accepted pilot, not a photograph."},
            {"id": "unbroken-front-barrier", "criterion": "A single solid UNBROKEN barrier goes from left outer edge to right outer edge across the FULL NEAR entrance, with no walk-around side gap; an empty safe observation area is in front and all hazards including vehicle and hole are behind it."},
            {"id": "vehicle-hole-separation", "criterion": "The empty generic vehicle is on intact ground well apart from the clearly recessed hole, not poised above or tipping into it; no brand badge or text."}
        ]}}
        result = quality.check(source, proof_dest / entry["filename"], checks, token)
        state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                      "manualAcceptance": False, "message": "This was the final authorized repair; inspect actual pixels and log any exception."})
    except Exception as error:
        state.update({"status": "error", "error": str(error)[:300], "manualAcceptance": False})
        core.write(state_path, state)
        raise
    core.write(state_path, state)
    print(f"Final S1-02 assess repair saved; automated passed={result['passed']}; manual review required", flush=True)


def style_batch_a() -> None:
    """Two separate first style repairs; do not revisit the completed assess asset."""
    plan, contract, request = load()
    dest = HERE / "output"
    prior = core.read(dest / "receipt.json")
    assert prior["requestHash"] == "fa9dd442a48bcc5c3caa132e8752643fdab5905a311da69f395128d4fe355146"
    assert len(prior["assets"]) == 6
    assess = core.read(dest / "style-proof/assess-repair3/state.json")
    assert assess["status"] == "candidate" and assess["repairCallNumber"] == 3
    assert sha(dest / "style-proof/assess-repair3/s102-video-assess.png") == assess["entry"]["sha256"]
    pilot_style = core.read(ENGINE / "course/visuals.json")["style"]
    assert core.digest(pilot_style) == request["styleReferenceHash"]
    specifications = {
        "s102-video-alert": {
            "subject": "Compact raised emergency-communication training diorama viewed three-quarter isometric, "
                       "same warm off-white 3D CARTOON look as the accepted pilot. On a simple safe-side "
                       "table: ONE blank-screen phone, ONE completely blank site information card and a "
                       "plain unmarked pencil. A low physical boundary separates this clean station from "
                       "a small empty farm work zone; a distinct CLEAR OPEN ACCESS PATH for authorized "
                       "responders remains to one side of the boundary. Keep the foreground table and "
                       "safe route readable, with realistic matte plastic, wood and earth textures in "
                       "simplified sculpted forms. No people, toy figures, hands, actual call, text, "
                       "numbers, logos, screen icons, writing lines or pseudo-writing. All props in frame.",
            "checks": [
                {"id": "blank-call-props", "criterion": "A phone with fully blank screen and completely blank information card are prominent on the safe-side table; no call, number, text or pseudo-writing appears."},
                {"id": "responder-route", "criterion": "An empty clear responder access path is visibly separate from the clean communication station and not blocked by the low boundary or a hazard."},
            ],
        },
        "s102-video-chemical": {
            "subject": "Compact raised chemical-exposure TRAINING PROPS diorama, three-quarter isometric, "
                       "same warm off-white 3D CARTOON style as accepted pilot with tactile metal and "
                       "plastic materials. On the far-left safe table is ONE closed blank harmless practice "
                       "bottle and unused splash goggles. A clear unobstructed floor route leads to a "
                       "distinct FULL-SIZE FIXED eyewash facility on the right: two outward-angled "
                       "eyewash nozzles over a broad basin, connected to visible fixed water pipe and "
                       "drain support, not a small handheld rinse bottle or eyewash cup. The station is "
                       "present for scenario explanation, not running on a person. No liquid splash, "
                       "person, mannequin, hands, face, active treatment, text, signs, symbols, logos "
                       "or pseudo-writing anywhere; all props inside frame with margin.",
            "checks": [
                {"id": "full-eyewash", "criterion": "A recognizable fixed plumbed full eyewash facility with two nozzles and a broad basin appears, not just a small bottle or cup; no actual treatment or person."},
                {"id": "clean-route", "criterion": "A closed blank practice bottle is separate from the facility, and an unobstructed route between table and eyewash is clear, with no discharge or real spill."},
            ],
        },
    }
    token = credential()
    model = core.request_json(f"https://generativelanguage.googleapis.com/v1beta/models/{plan['model']}", token)
    assert "generateContent" in model.get("supportedGenerationMethods", []), "Image model unavailable"
    batch = dest / "style-batch-a"
    batch.mkdir(parents=True, exist_ok=True)
    for asset_id in request["targetAssetIds"]:
        old, = [row for row in prior["assets"] if row["id"] == asset_id]
        source, = [row for row in plan["assets"] if row["id"] == asset_id]
        assert old["sha256"] == request["priorImageHashes"][asset_id] and old["repairCount"] == 0
        assert sha(dest / old["filename"]) == old["sha256"]
        asset_dest = batch / asset_id
        asset_dest.mkdir(parents=True, exist_ok=True)
        state_path = asset_dest / "state.json"
        assert not state_path.exists(), f"Style repair already attempted for {asset_id}; no blind retry"
        state = {"stepId": "S1-02", "assetId": asset_id, "priorImageSha256": old["sha256"],
                 "requestHash": sha(HERE / "request.json"), "repairCallNumber": 1,
                 "status": "started", "manualAcceptance": False}
        core.write(state_path, state)
        try:
            entry = generator.generate({**plan, "style": pilot_style},
                                       {**source, "subject": specifications[asset_id]["subject"]}, token, asset_dest)
            strict_global = [
                {**item, "criterion": "No person, mannequin, toy figure, face, hand, body, silhouette or character appears."}
                if item["id"] == "no-people" else item for item in contract["global"]
            ]
            checks = {**contract, "global": strict_global, "assets": {**contract["assets"], asset_id: [
                {"id": "pilot-cartoon-parity", "criterion": "Compact clearly sculpted 3D CARTOON diorama on warm off-white like the accepted pilot, not photoreal full-scene photography."},
                *specifications[asset_id]["checks"],
            ]}}
            result = quality.check(source, asset_dest / entry["filename"], checks, token)
            state.update({"status": "candidate", "entry": entry, "automatedQuality": result,
                          "manualAcceptance": False, "message": "Actual pixel inspection required before asset acceptance."})
        except Exception as error:
            state.update({"status": "error", "error": str(error)[:300]})
            core.write(state_path, state)
            raise
        core.write(state_path, state)
        print(f"{asset_id}: first pilot-style repair saved; automated passed={result['passed']}; manual review required", flush=True)


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
        if request["action"] == "repair-s102-style-proof-one":
            style_proof()
        elif request["action"] == "repair-s102-assess-no-figure":
            assess_repair2()
        elif request["action"] == "repair-s102-assess-continuous-barrier":
            assess_repair3()
        elif request["action"] == "repair-s102-style-batch-a":
            style_batch_a()
        else:
            produce()
