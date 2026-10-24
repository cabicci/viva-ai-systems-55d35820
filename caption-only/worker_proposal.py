"""Uninstalled proposal. Importable with fake transport; no live CLI entry point.

Root must freeze all 336 existing GUID bindings and approve the exact runner before
any real request. This module never creates/deletes/replaces a video.
"""
from __future__ import annotations

import base64
import hashlib
import json
import math
import re
import urllib.error
import urllib.parse
import urllib.request
import uuid
from decimal import Decimal
from pathlib import Path

LIBRARY = 670679
REPOSITORY = "cabicci/viva-ai-systems-55d35820"
RELEASE = 422730845
LOCALES = {"ar-EG": ("ar", "العربية المصرية"), "en": ("en", "English"),
           "it": ("it", "Italiano"), "de": ("de", "Deutsch")}
SHA = re.compile(r"[0-9a-f]{64}\Z")


class Hold(Exception):
    """Fixed safe reason codes, never remote exception text or credentials."""


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def safe_url(url: str) -> str:
    p = urllib.parse.urlsplit(url)
    return urllib.parse.urlunsplit((p.scheme, p.netloc, p.path, "", ""))


def https_url(url: str, hosts: set[str]) -> urllib.parse.SplitResult:
    p = urllib.parse.urlsplit(url)
    if (p.scheme != "https" or p.hostname not in hosts or p.username or
            p.password or p.port not in (None, 443) or p.fragment):
        raise Hold("UNAPPROVED_URL")
    return p


def validate_entry(e: dict) -> None:
    if e["libraryId"] != LIBRARY or e["locale"] not in LOCALES:
        raise Hold("WRONG_LIBRARY_OR_LOCALE")
    if str(uuid.UUID(e["videoGuid"])) != e["videoGuid"]:
        raise Hold("INVALID_GUID")
    if not SHA.fullmatch(e["sourceSHA256"]) or not SHA.fullmatch(e["uploadReceiptSHA256"]):
        raise Hold("INVALID_SOURCE_OR_RECEIPT_PIN")
    if not re.fullmatch(r"SOIL-REBUILD-S[123]-[0-9]{2}", e["lessonId"]):
        raise Hold("WRONG_LESSON")
    if e["identity"] != f'{e["lessonId"]}:{e["locale"]}:{e["sourceSHA256"]}':
        raise Hold("WRONG_SOURCE_IDENTITY")
    if not math.isfinite(e["durationSeconds"]) or e["durationSeconds"] <= 0:
        raise Hold("INVALID_DURATION")
    if e["durationToleranceSeconds"] != 2 or e["maximumCaptionPOSTs"] != 1:
        raise Hold("BUDGET_OR_TOLERANCE_CHANGE")
    c = e["captions"]
    if (not isinstance(c["assetId"], int) or c["assetId"] <= 0 or
            not isinstance(c["bytes"], int) or not 0 < c["bytes"] <= 2_000_000 or
            not SHA.fullmatch(c["sha256"])):
        raise Hold("INVALID_CAPTION_ASSET")
    hosts = e["approvedCDNHosts"]
    if not hosts or any(not re.fullmatch(r"[a-z0-9-]+\.b-cdn\.net", h) for h in hosts):
        raise Hold("UNFROZEN_CDN_HOST")
    if e.get("protected"):
        if not SHA.fullmatch(e.get("disclosureBindingSHA256", "")):
            raise Hold("MISSING_PRIVATE_DISCLOSURE_BINDING")


def validate_manifest(m: dict) -> None:
    if (m["schema"] != "masaarat.reviewed-bunny-caption-readiness.v1" or
            m["repository"] != REPOSITORY or m["draftReleaseId"] != RELEASE or
            m["automaticMutationRetries"] != 0 or m["maximumConcurrentEntries"] != 2 or
            not 1 <= len(m["entries"]) <= 336 or
            m["maximumCaptionPOSTs"] != len(m["entries"])):
        raise Hold("MANIFEST_SCOPE_OR_BUDGET")
    for e in m["entries"]:
        validate_entry(e)
    if (len({e["identity"] for e in m["entries"]}) != len(m["entries"]) or
            len({e["videoGuid"] for e in m["entries"]}) != len(m["entries"])):
        raise Hold("DUPLICATE_GUID_OR_IDENTITY")


def timestamp(value: str) -> Decimal:
    if not re.fullmatch(r"(?:[0-9]{2,}:)?[0-9]{2}:[0-9]{2}\.[0-9]{3}", value):
        raise Hold("INVALID_VTT_TIMESTAMP")
    pieces = value.split(":")
    h, minute, second = ("0", *pieces) if len(pieces) == 2 else pieces
    if int(minute) >= 60 or Decimal(second) >= 60:
        raise Hold("INVALID_VTT_CLOCK")
    return Decimal(h) * 3600 + Decimal(minute) * 60 + Decimal(second)


def validate_vtt(data: bytes, duration: float) -> dict:
    try:
        text = data.decode("utf-8-sig").replace("\r\n", "\n").replace("\r", "\n")
    except UnicodeError:
        raise Hold("INVALID_VTT_UTF8") from None
    blocks = re.split(r"\n[ \t]*\n", text.strip())
    if not blocks or not re.match(r"\AWEBVTT(?:[ \t].*)?(?:\n|\Z)", blocks[0]):
        raise Hold("INVALID_VTT_HEADER")
    cues = []
    for block in blocks[1:]:
        lines = block.splitlines()
        if not lines or lines[0].startswith(("NOTE", "STYLE", "REGION")):
            continue
        i = 0 if "-->" in lines[0] else 1
        if len(lines) <= i + 1:
            raise Hold("INVALID_VTT_CUE_BLOCK")
        match = re.fullmatch(r"([^ \t]+)[ \t]+-->[ \t]+([^ \t]+)(?:[ \t]+.*)?", lines[i])
        if not match:
            raise Hold("INVALID_VTT_CUE_LINE")
        start, end = timestamp(match[1]), timestamp(match[2])
        if not Decimal(0) <= start < end <= Decimal(str(duration)):
            raise Hold("VTT_CUE_OUTSIDE_ACTUAL_SOURCE_DURATION")
        if cues and start < cues[-1][0]:
            raise Hold("VTT_CUES_OUT_OF_ORDER")
        if not "\n".join(lines[i + 1:]).strip():
            raise Hold("EMPTY_VTT_CUE")
        cues.append((start, end))
    if not cues:
        raise Hold("NO_VTT_CUES")
    return {"cueCount": len(cues), "lastCueEnd": float(max(x[1] for x in cues)),
            "actualSourceDuration": duration, "timingInvented": False}


class Files:
    def __init__(self, root: Path):
        self.root = root
        root.mkdir(parents=True, exist_ok=True)

    def exists(self, name: str) -> bool:
        return (self.root / name).exists()

    def save(self, name: str, value: dict):
        with (self.root / name).open("x", encoding="utf8") as f:
            json.dump(value, f, ensure_ascii=False, indent=2)
            f.write("\n")


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class RealTransportProposal:
    """No implicit redirects, retries, token logging or credential forwarding."""
    def __init__(self, bunny_key: str, github_token: str):
        self._bunny = bunny_key
        self._github = github_token
        self._opener = urllib.request.build_opener(NoRedirect())

    def request(self, method: str, url: str, body: bytes | None, auth: str | None):
        headers = {"Accept": "application/json"}
        p = urllib.parse.urlsplit(url)
        if auth == "bunny":
            https_url(url, {"video.bunnycdn.com"})
            headers["AccessKey"] = self._bunny
        elif auth == "github":
            https_url(url, {"api.github.com"})
            headers.update(Authorization="Bearer " + self._github, Accept="application/octet-stream")
        elif auth is not None:
            raise Hold("INVALID_AUTH_DESTINATION")
        if body is not None:
            headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with self._opener.open(req, timeout=90) as response:
                return response.status, response.read(2_000_001), dict(response.headers)
        except urllib.error.HTTPError as e:
            return e.code, e.read(2_000_001), dict(e.headers)


class Worker:
    def __init__(self, transport, files):
        self.transport, self.files, self.gets = transport, files, 0

    def request(self, method, url, body=None, auth=None):
        if method not in ("GET", "POST"):
            raise Hold("PROHIBITED_HTTP_METHOD")
        if method == "GET":
            if self.gets >= 9:
                raise Hold("FINITE_GET_BUDGET_EXHAUSTED")
            self.gets += 1
            self.files.save(f"get-intent-{self.gets:02}.json",
                            {"urlWithoutQuery": safe_url(url), "urlSHA256": digest(url.encode()),
                             "credentialClassOnly": auth, "maximumAttempts": 1})
        return self.transport.request(method, url, body, auth)

    def get_json(self, url, auth):
        code, raw, _ = self.request("GET", url, auth=auth)
        if code != 200:
            raise Hold("METADATA_GET_NOT_200")
        try:
            return json.loads(raw)
        except (ValueError, UnicodeError):
            raise Hold("METADATA_JSON_INVALID") from None

    def check_video(self, data, e):
        if data.get("guid") != e["videoGuid"] or data.get("videoLibraryId") != LIBRARY:
            raise Hold("REMOTE_GUID_OR_LIBRARY_MISMATCH")
        if data.get("status") != 4:
            raise Hold("REMOTE_NOT_STATUS4_READY")
        length = data.get("length")
        if (not isinstance(length, (int, float)) or not math.isfinite(length) or
                abs(length - e["durationSeconds"]) > 2):
            raise Hold("REMOTE_DURATION_MISMATCH")
        original = data.get("originalHash")
        if original and original.lower().removeprefix("sha256:") != e["sourceSHA256"]:
            raise Hold("REMOTE_ORIGINAL_HASH_MISMATCH")
        if e.get("expectedRemoteTitle") and data.get("title") != e["expectedRemoteTitle"]:
            raise Hold("REMOTE_TITLE_BINDING_MISMATCH")
        return "REMOTE_SHA256_MATCH" if original else "REMOTE_HASH_UNAVAILABLE_FROZEN_UPLOAD_BINDING_ONLY"

    def caption_bytes(self, e):
        c = e["captions"]
        url = f'https://api.github.com/repos/{REPOSITORY}/releases/assets/{c["assetId"]}'
        code, data, headers = self.request("GET", url, auth="github")
        if code in (301, 302, 303, 307, 308):
            location = next((v for k, v in headers.items() if k.lower() == "location"), None)
            if not location:
                raise Hold("ASSET_REDIRECT_LOCATION_MISSING")
            https_url(location, {"release-assets.githubusercontent.com", "objects.githubusercontent.com"})
            # New unauthenticated request: never carry the GitHub Authorization header.
            code, data, _ = self.request("GET", location, auth=None)
        if code != 200 or len(data) != c["bytes"] or digest(data) != c["sha256"]:
            raise Hold("LOCAL_CAPTION_ASSET_HASH_OR_SIZE_MISMATCH")
        return data

    def remote_caption(self, play, e):
        """Only proven URL or observed HLS URI; never infer a caption filename."""
        directory = play.get("captionsPath")
        if not directory:
            raise Hold("REMOTE_CAPTION_DIRECTORY_UNPROVEN")
        hosts = set(e["approvedCDNHosts"])
        base = https_url(directory, hosts)
        if e["videoGuid"] not in base.path.split("/"):
            raise Hold("CAPTION_DIRECTORY_GUID_MISMATCH")
        source_lang, _ = LOCALES[e["locale"]]
        proof = e.get("remoteCaptionURLProof")
        if proof:
            if (proof["method"] != "ROOT_VERIFIED_OBSERVED_PLAYER_CAPTION_REQUEST" or
                    not SHA.fullmatch(proof["evidenceSHA256"]) or
                    proof["sourceLang"] != source_lang or proof["videoGuid"] != e["videoGuid"]):
                raise Hold("REMOTE_CAPTION_URL_PROOF_MISMATCH")
            url = proof["url"]
        else:
            playlist = play.get("videoPlaylistUrl")
            if not playlist:
                raise Hold("NO_OBSERVED_CAPTION_URL_OR_PLAYLIST")
            https_url(playlist, hosts)
            code, raw, _ = self.request("GET", playlist, auth=None)
            if code != 200:
                raise Hold("PLAYLIST_UNAVAILABLE")
            try:
                text = raw.decode("utf-8-sig")
            except UnicodeError:
                raise Hold("PLAYLIST_INVALID_UTF8") from None
            if not text.startswith("#EXTM3U"):
                raise Hold("NOT_HLS_PLAYLIST")
            urls = []
            for line in text.splitlines():
                if not line.startswith("#EXT-X-MEDIA:"):
                    continue
                attrs = dict((key, quoted if quoted else bare) for key, quoted, bare in
                             re.findall(r'([A-Z0-9-]+)=(?:"([^"]*)"|([^,]*))', line))
                if attrs.get("TYPE") == "SUBTITLES" and attrs.get("LANGUAGE") == source_lang and attrs.get("URI"):
                    urls.append(urllib.parse.urljoin(playlist, attrs["URI"]))
            if len(set(urls)) != 1:
                raise Hold("TARGET_CAPTION_URI_NOT_UNIQUE_OR_ABSENT")
            url = urls[0]
        target = https_url(url, hosts)
        prefix = base.path.rstrip("/") + "/"
        if target.hostname != base.hostname or not target.path.startswith(prefix):
            raise Hold("CAPTION_URL_OUTSIDE_PROVEN_DIRECTORY")
        code, data, _ = self.request("GET", url, auth=None)
        if code != 200:
            raise Hold("REMOTE_VTT_UNAVAILABLE")
        if len(data) > 2_000_000:
            raise Hold("REMOTE_VTT_TOO_LARGE")
        return data, {"remoteURLWithoutQuery": safe_url(url), "sha256": digest(data)}

    def run(self, e):
        state = {"identity": e.get("identity"), "videoGuid": e.get("videoGuid"),
                 "metadataReady": False, "durationMatched": False, "sourceHashEvidence": "UNVERIFIED",
                 "captionLocalVerified": False, "captionPOSTAttempted": False, "captionACK": False,
                 "remoteVTTActualMatch": False, "playback": "NOT_TESTED_SEPARATE_BROWSER_QA",
                 "oldGUIDPreserved": True, "videoCreateDeletePUTCalls": 0,
                 "protected": bool(e.get("protected")),
                 "disclosureBindingSHA256": e.get("disclosureBindingSHA256")}
        try:
            validate_entry(e)
            if self.files.exists("caption-post-intent.json"):
                raise Hold("PRIOR_MUTATION_INTENT_REQUIRES_ROOT_RECONCILIATION_NO_RETRY")
            endpoint = f'https://video.bunnycdn.com/library/{LIBRARY}/videos/{e["videoGuid"]}'
            video = self.get_json(endpoint, "bunny")
            state["sourceHashEvidence"] = self.check_video(video, e)
            state.update(metadataReady=True, durationMatched=True)
            play = self.get_json(endpoint + "/play", None)
            play_hash = self.check_video(play.get("video") or {}, e)
            if state["sourceHashEvidence"] != "REMOTE_SHA256_MATCH":
                state["sourceHashEvidence"] = play_hash
            self.files.save("preflight-verified.json", {**state, "actualRemoteDuration": video["length"]})
            data = self.caption_bytes(e)
            state["vttValidation"] = validate_vtt(data, e["durationSeconds"])
            state["captionLocalVerified"] = True
            lang, label = LOCALES[e["locale"]]
            tracks = [c for v in [video, play["video"]] for c in v.get("captions", [])
                      if c.get("srclang") == lang]
            if tracks:
                remote, receipt = self.remote_caption(play, e)
                validate_vtt(remote, e["durationSeconds"])
                self.files.save("existing-remote-vtt-check.json", receipt)
                if digest(remote) != e["captions"]["sha256"]:
                    raise Hold("EXISTING_CAPTION_DIFFERS_NEVER_OVERWRITE")
                if any(c.get("label") != label for c in tracks):
                    raise Hold("EXISTING_CAPTION_LABEL_DIFFERS_NO_OVERWRITE")
                state.update(remoteVTTActualMatch=True, result="EXISTING_EXACT_CAPTION_REUSED_NO_POST")
            else:
                body = json.dumps({"label": label, "captionsFile": base64.b64encode(data).decode()},
                                  ensure_ascii=False, separators=(",", ":")).encode()
                # Exclusive durable intent precedes the only permitted mutation.
                self.files.save("caption-post-intent.json", {"identity": e["identity"],
                    "videoGuid": e["videoGuid"], "sourceSHA256": e["sourceSHA256"],
                    "captionSHA256": e["captions"]["sha256"], "bodySHA256": digest(body),
                    "sourceLang": lang, "label": label, "maximumPOSTs": 1, "automaticRetries": 0})
                state["captionPOSTAttempted"] = True
                code, raw, _ = self.request("POST", endpoint + "/captions/" + lang, body, "bunny")
                try:
                    ack = json.loads(raw)
                except (ValueError, UnicodeError):
                    raise Hold("CAPTION_POST_RESPONSE_INVALID_UNKNOWN_NO_RETRY") from None
                if code != 200 or ack.get("success") is not True:
                    raise Hold("CAPTION_POST_NOT_ACKNOWLEDGED_NO_RETRY")
                state["captionACK"] = True
                self.files.save("caption-post-ack.json", {"success": True, "httpStatus": code,
                                                         "identity": e["identity"]})
                after = self.get_json(endpoint + "/play", None)
                self.check_video(after.get("video") or {}, e)
                new_tracks = [c for c in after["video"].get("captions", []) if c.get("srclang") == lang]
                if not new_tracks:
                    raise Hold("ACK_ONLY_REMOTE_TRACK_NOT_YET_VISIBLE_NO_POLL")
                if any(c.get("label") != label for c in new_tracks):
                    raise Hold("ACK_BUT_REMOTE_LABEL_DIFFERS_NO_RETRY")
                remote, receipt = self.remote_caption(after, e)
                validate_vtt(remote, e["durationSeconds"])
                self.files.save("post-ack-remote-vtt-check.json", receipt)
                if digest(remote) != e["captions"]["sha256"]:
                    raise Hold("ACK_BUT_REMOTE_VTT_BYTES_DIFFER_NO_RETRY")
                state.update(remoteVTTActualMatch=True, result="CAPTION_ACK_AND_REMOTE_BYTES_MATCH_BROWSER_QA_PENDING")
        except Hold as ehold:
            state["result"] = "HOLD"
            state["reason"] = str(ehold)
        except Exception as exc:
            # Do not include exception messages: they may contain request secrets.
            state["result"] = "UNKNOWN_NO_RETRY" if state["captionPOSTAttempted"] else "HOLD_NETWORK_OR_INVALID_INPUT"
            state["errorClass"] = type(exc).__name__
        state["GETCalls"] = self.gets
        self.files.save("outcome.json", state)
        return state


if __name__ == "__main__":
    raise SystemExit("Preparation only. No approved frozen 336-GUID runner is installed or enabled.")
