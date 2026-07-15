"""Bunny Stream HTTP client using repository-proven + official docs operations.

Official evidence:
  - Create Video POST /library/{libraryId}/videos
    https://docs.bunny.net/api-reference/stream/manage-videos/create-video
  - Upload Video PUT /library/{libraryId}/videos/{videoId}
    https://docs.bunny.net/api-reference/stream/manage-videos/upload-video
  - Get Video GET /library/{libraryId}/videos/{videoId}
    https://docs.bunny.net/api-reference/stream/manage-videos/get-video
  - List Videos GET /library/{libraryId}/videos?search=
    https://docs.bunny.net/api-reference/stream/manage-videos/list-videos

Repository evidence:
  - .github/scripts/upload_bunny_locale.py (create + PUT + AccessKey)
  - .github/scripts/verify_bunny_ready.py (GET by GUID; status codes)

No caption-track upload. No delete/replace on finalized identity.
No polling loops.
"""
from __future__ import annotations

import json
import re
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from typing import Any, Callable


HttpFn = Callable[[str, str, bytes | None, dict[str, str]], tuple[int, bytes]]

SHA256_HEX_RE = re.compile(r"^[a-f0-9]{64}$")
# Deterministic discovery bound — pagination only, no status polling.
MAX_LIST_PAGES = 10
ITEMS_PER_PAGE = 100


@dataclass
class BunnyCallLog:
    creates: list[str] = field(default_factory=list)
    uploads: list[str] = field(default_factory=list)
    gets: list[str] = field(default_factory=list)
    lists: list[str] = field(default_factory=list)


@dataclass
class BunnyClient:
    library_id: str
    api_key: str
    http: HttpFn | None = None
    log: BunnyCallLog = field(default_factory=BunnyCallLog)

    @property
    def base(self) -> str:
        return f"https://video.bunnycdn.com/library/{self.library_id}/videos"

    def _headers(self, ctype: str | None = None) -> dict[str, str]:
        h = {"AccessKey": self.api_key, "accept": "application/json"}
        if ctype:
            h["content-type"] = ctype
        return h

    def _request(
        self, method: str, url: str, body: bytes | None = None, ctype: str | None = None
    ) -> tuple[int, bytes]:
        if self.http is not None:
            return self.http(method, url, body, self._headers(ctype))
        req = urllib.request.Request(url, method=method, data=body)
        for k, v in self._headers(ctype).items():
            req.add_header(k, v)
        try:
            with urllib.request.urlopen(req, timeout=600) as resp:
                return resp.status, resp.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def create_video(self, title: str) -> str:
        self.log.creates.append(title)
        status, raw = self._request(
            "POST",
            self.base,
            json.dumps({"title": title}).encode(),
            "application/json",
        )
        if status != 200:
            raise RuntimeError(f"Bunny create failed HTTP {status}")
        data = json.loads(raw.decode())
        guid = data.get("guid")
        if not guid:
            raise RuntimeError("Bunny create response missing guid")
        return str(guid)

    def upload_mp4(self, guid: str, mp4_bytes: bytes) -> None:
        self.log.uploads.append(guid)
        status, raw = self._request(
            "PUT",
            f"{self.base}/{guid}",
            mp4_bytes,
            "application/octet-stream",
        )
        if status not in (200, 201):
            raise RuntimeError(f"Bunny upload failed HTTP {status}: {raw[:200]!r}")

    def get_video(self, guid: str) -> dict[str, Any]:
        self.log.gets.append(guid)
        status, raw = self._request("GET", f"{self.base}/{guid}")
        if status == 404:
            raise FileNotFoundError(f"Bunny video not found: {guid}")
        if status != 200:
            raise RuntimeError(f"Bunny get failed HTTP {status}")
        return json.loads(raw.decode())

    def list_videos_search(
        self, search: str, page: int = 1
    ) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        """Official List Videos with search query (single page; no poll loop)."""
        self.log.lists.append(f"{search}@page={page}")
        q = urllib.parse.urlencode(
            {"page": page, "itemsPerPage": ITEMS_PER_PAGE, "search": search}
        )
        status, raw = self._request("GET", f"{self.base}?{q}")
        if status != 200:
            raise RuntimeError(f"Bunny list failed HTTP {status}")
        data = json.loads(raw.decode())
        items = data.get("items") or []
        return list(items), data

    def _page_proves_exhaustion(
        self, page: int, items: list[dict[str, Any]], page_data: dict[str, Any]
    ) -> bool:
        """True when this page proves no further Bunny list pages exist."""
        if not items:
            return True
        if len(items) < ITEMS_PER_PAGE:
            return True

        current = page_data.get("currentPage")
        total_pages = page_data.get("totalPages")
        if isinstance(current, int) and isinstance(total_pages, int) and total_pages > 0:
            if current == page and current >= total_pages:
                return True

        total_items = page_data.get("totalItems")
        if isinstance(total_items, int) and total_items >= 0:
            if page * ITEMS_PER_PAGE >= total_items:
                return True

        return False

    def list_exact_title_candidates(
        self, title: str
    ) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
        """Bounded pagination discovery for exact title matches only.

        Returns (candidates, reconciliation). When reconciliation is set the
        candidate set must not be treated as complete (fail closed).
        """
        found: list[dict[str, Any]] = []
        for page in range(1, MAX_LIST_PAGES + 1):
            items, page_data = self.list_videos_search(title, page=page)
            if not items:
                break
            for item in items:
                if item.get("title") == title:
                    found.append(item)
            if self._page_proves_exhaustion(page, items, page_data):
                break
            if page == MAX_LIST_PAGES:
                return [], {
                    "reason": "bunny-discovery-page-limit-exceeded",
                    "title": title,
                    "maxPages": MAX_LIST_PAGES,
                    "itemsPerPage": ITEMS_PER_PAGE,
                }
        return found, None

    def _read_top_level_original_hash(self, item: dict[str, Any]) -> tuple[str | None, str | None]:
        """Return (normalized_hash, problem_code). Only top-level originalHash is accepted."""
        if "originalHash" not in item:
            if isinstance(item.get("meta"), dict) and "originalHash" in item["meta"]:
                return None, "meta-originalHash-rejected"
            return None, "missing-originalHash"
        raw = item["originalHash"]
        if raw is None:
            return None, "null-originalHash"
        if raw == "":
            return None, "empty-originalHash"
        if not isinstance(raw, str):
            return None, "non-string-originalHash"
        normalized = raw.lower()
        if not SHA256_HEX_RE.match(normalized):
            return None, "malformed-originalHash"
        return normalized, None

    def find_by_title_and_hash(
        self, title: str, video_checksum: str
    ) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
        """Recover candidates by official search + exact top-level originalHash match.

        Returns (matches, reconciliation). reconciliation is set when recovery must fail closed.
        """
        expected = video_checksum.lower()
        if not SHA256_HEX_RE.match(expected):
            return [], {
                "reason": "invalid-expected-video-checksum",
                "videoChecksum": video_checksum,
            }

        hash_matches: list[dict[str, Any]] = []
        problems: list[dict[str, Any]] = []

        candidates, discovery_recon = self.list_exact_title_candidates(title)
        if discovery_recon is not None:
            return [], discovery_recon

        for item in candidates:
            oh, problem = self._read_top_level_original_hash(item)
            if problem:
                problems.append(
                    {
                        "guid": item.get("guid"),
                        "issue": problem,
                    }
                )
                continue
            assert oh is not None
            if oh == expected:
                hash_matches.append(item)
            # Valid nonmatching top-level originalHash → older distinct video; allowed.

        if problems:
            return [], {
                "reason": "bunny-originalHash-recovery-ambiguous",
                "title": title,
                "videoChecksum": expected,
                "problems": problems,
            }

        if len(hash_matches) > 1:
            return [], {
                "reason": "multiple-bunny-identities",
                "guids": [m.get("guid") for m in hash_matches],
                "title": title,
                "videoChecksum": expected,
            }

        return hash_matches, None

    def verify_top_level_original_hash(
        self, video: dict[str, Any], expected_checksum: str
    ) -> dict[str, Any] | None:
        """Validate GET response originalHash for recovered GUID proof."""
        oh, problem = self._read_top_level_original_hash(video)
        expected = expected_checksum.lower()
        if problem:
            return {
                "reason": "bunny-get-originalHash-invalid",
                "issue": problem,
                "guid": video.get("guid"),
            }
        if oh != expected:
            return {
                "reason": "bunny-get-originalHash-mismatch",
                "guid": video.get("guid"),
                "expected": expected,
            }
        return None
