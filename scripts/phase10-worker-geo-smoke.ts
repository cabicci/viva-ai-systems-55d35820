const base = process.argv[2] ?? "http://127.0.0.1:4178/learn/intro/intro-m1-l1-what-is-ai";

const cases: Array<[string, string, Record<string, string>]> = [
  ["default", base, {}],
  ["EG", base, { "cf-ipcountry": "EG" }],
  ["SA", base, { "cf-ipcountry": "SA" }],
  ["US", base, { "cf-ipcountry": "US" }],
  ["IS-unknown", base, { "cf-ipcountry": "IS" }],
  [
    "cookie-over-geo",
    base,
    { "cf-ipcountry": "US", Cookie: "masaarat_locale=ar-Gulf" },
  ],
  ["url-over-geo", `${base}?locale=ar-MSA`, { "cf-ipcountry": "US" }],
];

const results: Record<string, string> = {};
for (const [label, url, headers] of cases) {
  const response = await fetch(url, { headers });
  const html = await response.text();
  const match = html.match(/html lang="([^"]+)"/);
  results[label] = match?.[1] ?? "?";
}

const pass =
  results.default === "ar" &&
  results.EG === "ar" &&
  results.SA === "ar" &&
  results.US === "en" &&
  results["IS-unknown"] === "ar" &&
  results["cookie-over-geo"] === "ar" &&
  results["url-over-geo"] === "ar";

console.log(JSON.stringify({ pass, results }, null, 2));
process.exit(pass ? 0 : 1);
