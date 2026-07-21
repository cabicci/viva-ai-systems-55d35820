/** Path/URL normalization resistant to trivial obfuscation (not a full security sandbox). */

export function decodeURIComponentSafe(raw: string): string {
  let cur = raw;
  for (let i = 0; i < 3; i++) {
    try {
      const next = decodeURIComponent(cur.replace(/\+/g, "%20"));
      if (next === cur) break;
      cur = next;
    } catch {
      break;
    }
  }
  return cur;
}

export function normalizeRef(raw: string): string {
  let s = raw.replace(/\\/g, "/").toLowerCase();
  // collapse repeated slashes
  s = s.replace(/\/+/g, "/");
  // strip trivial ./ segments
  s = s.replace(/\/\.\//g, "/");
  // reject/resolve simple ..
  const parts = s.split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") {
      if (out.length) out.pop();
      continue;
    }
    if (p === "." || p === "") {
      if (p === "" && out.length === 0) out.push("");
      continue;
    }
    out.push(p);
  }
  return out.join("/");
}
