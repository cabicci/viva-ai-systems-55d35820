const base = process.argv[2] ?? "http://127.0.0.1:4178";

type Case = {
  label: string;
  path: string;
  headers: Record<string, string>;
  expectLang: string;
  expectContains?: string[];
  expectAbsent?: string[];
};

const cases: Case[] = [
  {
    label: "landing-en-url",
    path: "/?locale=en",
    headers: { "cf-ipcountry": "EG" },
    expectLang: "en",
    expectContains: ["Learn artificial intelligence"],
    expectAbsent: ["اتعلم الذكاء الاصطناعي"],
  },
  {
    label: "landing-ar-MSA-url",
    path: "/?locale=ar-MSA",
    headers: { "cf-ipcountry": "US" },
    expectLang: "ar",
    expectContains: ["لا بالحديث فقط"],
  },
  {
    label: "landing-ar-Gulf-url",
    path: "/?locale=ar-Gulf",
    headers: { "cf-ipcountry": "US" },
    expectLang: "ar",
    expectContains: ["مو بالكلام"],
  },
  {
    label: "landing-ar-EG-default",
    path: "/",
    headers: { "cf-ipcountry": "EG" },
    expectLang: "ar",
    expectContains: ["اتعلم الذكاء الاصطناعي"],
  },
  {
    label: "curriculum-en-url",
    path: "/curriculum?locale=en",
    headers: { "cf-ipcountry": "EG" },
    expectLang: "en",
    expectContains: ["platform"],
  },
  {
    label: "learn-cookie-ar-EG-over-us-geo",
    path: "/learn/intro/intro-m1-l1-what-is-ai",
    headers: { "cf-ipcountry": "US", Cookie: "masaarat_locale=ar-EG" },
    expectLang: "ar",
    expectAbsent: ["Learn artificial intelligence"],
  },
  {
    label: "learn-cookie-en-over-eg-geo",
    path: "/learn/intro/intro-m1-l1-what-is-ai",
    headers: { "cf-ipcountry": "EG", Cookie: "masaarat_locale=en" },
    expectLang: "en",
    expectAbsent: ["Localized lesson:"],
  },
  {
    label: "learn-url-ar-Gulf-over-cookie-en",
    path: "/learn/intro/intro-m1-l1-what-is-ai?locale=ar-Gulf",
    headers: { "cf-ipcountry": "US", Cookie: "masaarat_locale=en" },
    expectLang: "ar",
    expectAbsent: ["Localized lesson:"],
  },
  {
    label: "learn-fr-FR-fallback",
    path: "/learn/intro/intro-m1-l1-what-is-ai?locale=fr-FR",
    headers: { "cf-ipcountry": "US" },
    expectLang: "ar",
    expectAbsent: ["Localized lesson:"],
  },
];

const results: Record<string, { ok: boolean; lang?: string; error?: string }> = {};
let pass = true;

for (const testCase of cases) {
  const url = `${base.replace(/\/$/, "")}${testCase.path}`;
  try {
    const response = await fetch(url, { headers: testCase.headers });
    const html = await response.text();
    const lang = html.match(/html lang="([^"]+)"/)?.[1];
    let ok = response.ok && lang === testCase.expectLang;

    if (testCase.expectContains) {
      for (const needle of testCase.expectContains) {
        if (!html.includes(needle)) {
          ok = false;
        }
      }
    }
    if (testCase.expectAbsent) {
      for (const needle of testCase.expectAbsent) {
        if (html.includes(needle)) {
          ok = false;
        }
      }
    }
    if (html.includes("Hydration failed") || html.includes("Minified React error #418")) {
      ok = false;
    }

    results[testCase.label] = { ok, lang };
    if (!ok) pass = false;
  } catch (error) {
    results[testCase.label] = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
    pass = false;
  }
}

console.log(JSON.stringify({ pass, results }, null, 2));
process.exit(pass ? 0 : 1);
