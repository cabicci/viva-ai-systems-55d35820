"""Read-only reconciliation of the existing pesticides collection. Never mutates Bunny."""
import datetime
import json
import os
from pathlib import Path
import urllib.error
import urllib.parse
import urllib.request

LIBRARY = "670679"
COLLECTION = "13b22b22-dad4-4e30-8736-753c961011c3"
GUIDS = ["8471747c-8383-4fbf-9142-9bf54e64617e", "662ec0aa-f0f7-4d6d-83a1-2b5c42a6872e"]
OUT = Path("pesticides-bunny-audit")
FIELDS = ["videoLibraryId", "guid", "title", "collectionId", "status", "originalHash", "hasOriginal", "length", "width", "height", "encodeProgress", "availableResolutions", "storageSize", "isPublic", "dateUploaded"]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise RuntimeError("Redirect denied")


def main():
    assert os.environ.get("GITHUB_ACTIONS") == "true"
    assert os.environ.get("GITHUB_RUN_ATTEMPT") == "1"
    assert os.environ.get("BUNNY_STREAM_LIBRARY_ID") == LIBRARY
    key = os.environ["BUNNY_STREAM_API_KEY"]
    assert key and key == key.strip()
    OUT.mkdir(exist_ok=True)
    report = {"schema": "pesticides-bunny-reconciliation.v1", "observedUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(), "libraryID": LIBRARY, "collectionID": COLLECTION, "runID": os.environ["GITHUB_RUN_ID"], "mutationRequests": 0, "requests": [], "collectionVideos": [], "existingVideoDetails": []}
    opener = urllib.request.build_opener(NoRedirect)

    def save():
        (OUT / "reconciliation.en.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    def get(suffix):
        assert suffix.startswith(("/collections/" + COLLECTION, "/videos"))
        entry = {"method": "GET", "path": suffix}
        report["requests"].append(entry)
        save()
        req = urllib.request.Request("https://video.bunnycdn.com/library/" + LIBRARY + suffix, headers={"AccessKey": key, "Accept": "application/json"}, method="GET")
        try:
            with opener.open(req, timeout=40) as response:
                entry["status"] = response.status
                raw = response.read(2_000_001)
                assert len(raw) <= 2_000_000
                result = json.loads(raw)
                save()
                return result
        except urllib.error.HTTPError as error:
            entry["status"] = error.code
            save()
            return {"httpError": error.code}
        except Exception:
            entry["failure"] = "GET failed; no mutation attempted"
            save()
            raise RuntimeError("Scoped Bunny GET failed") from None

    try:
        collection = get("/collections/" + COLLECTION)
        report["collection"] = {k: collection.get(k) for k in ["guid", "videoLibraryId", "name", "videoCount", "totalSize", "httpError"]}
        assert collection.get("guid") == COLLECTION
        assert collection.get("videoLibraryId") == int(LIBRARY)
        for page in range(1, 6):
            result = get("/videos?" + urllib.parse.urlencode({"collection": COLLECTION, "page": page, "itemsPerPage": 100}))
            assert "items" in result
            report["collectionTotalItems"] = result.get("totalItems")
            for video in result["items"]:
                assert video.get("collectionId") == COLLECTION
                assert video.get("videoLibraryId") == int(LIBRARY)
                report["collectionVideos"].append({k: video.get(k) for k in FIELDS})
            if len(report["collectionVideos"]) >= result["totalItems"]:
                break
        assert len(report["collectionVideos"]) == report["collectionTotalItems"]
        for guid in GUIDS:
            video = get("/videos/" + guid)
            assert video.get("guid") == guid and video.get("collectionId") == COLLECTION
            report["existingVideoDetails"].append({"metadata": {k: video.get(k) for k in FIELDS}, "storage": get("/videos/" + guid + "/storage")})
        report["state"] = "READ_ONLY_RECONCILIATION_COMPLETE"
        save()
        print(json.dumps({"state": report["state"], "collectionVideoCount": len(report["collectionVideos"]), "mutationRequests": 0}))
    finally:
        save()


if __name__ == "__main__":
    main()
