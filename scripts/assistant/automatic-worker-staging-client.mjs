// source/src/lib/assistant-automation/driver.ts
async function runAutomaticDriver(deps) {
  let ready = false;
  for (let i = 0;i < 30; i++) {
    try {
      const status = await deps.call("status");
      if (status.schemaVersion === "assistant-auto-v1") {
        if (status.enabled !== true)
          return "disabled";
        ready = true;
        break;
      }
    } catch {}
    await deps.wait(15000);
  }
  if (!ready)
    throw new Error("AUTOMATION_DEPLOYMENT_NOT_READY");
  const deadline = deps.now() + 40 * 60000;
  let held = false;
  for (let count = 0;count < 5000 && deps.now() < deadline; count++) {
    const result = await deps.call("tick");
    if (result.disabled === true || result.busy === true) {
      if (held)
        throw new Error("AUTOMATION_REVIEW_REQUIRED");
      return result.disabled === true ? "disabled" : "busy";
    }
    if (result.replayed === true)
      throw new Error("AUTOMATION_REQUEST_ALREADY_CONSUMED");
    if (result.held === true) {
      held = true;
      deps.log(JSON.stringify({ state: "held", code: /^AUTOMATION_[A-Z0-9_]{1,64}$/.test(String(result.code)) ? result.code : "AUTOMATION_OPERATION_UNAVAILABLE" }));
    } else if (result.done === true) {
      if (held || Number(result.held) > 0)
        throw new Error("AUTOMATION_REVIEW_REQUIRED");
      return "complete";
    } else if (result.progressed === true) {
      if (!["ai", "kids", "technical", "academic"].includes(String(result.area)) || typeof result.cardId !== "string" || !/^[A-Za-z0-9-]{1,80}$/.test(result.cardId) || !Number.isSafeInteger(result.completedScopes) || !Number.isSafeInteger(result.totalScopes) || Number(result.completedScopes) < 1 || Number(result.completedScopes) > Number(result.totalScopes))
        throw new Error("AUTOMATION_RESPONSE_INVALID");
      if (result.cardComplete === true || count % 20 === 0)
        deps.log(JSON.stringify({
          area: result.area,
          cardId: result.cardId,
          completedScopes: result.completedScopes,
          totalScopes: result.totalScopes,
          complete: result.cardComplete === true
        }));
    } else
      throw new Error("AUTOMATION_RESPONSE_INVALID");
  }
  if (held)
    throw new Error("AUTOMATION_REVIEW_REQUIRED");
  return "paused";
}

// native-caller-source.ts
var endpoint = "https://project--0d675f0a-ecc5-4c62-9217-54973c927902.lovable.app/api/public/assistant-indexing";
var identity;
async function token() {
  if (identity && identity.until > Date.now())
    return identity.token;
  const url = new URL(process.env.ACTIONS_ID_TOKEN_REQUEST_URL ?? "");
  if (url.protocol !== "https:" || !url.hostname.endsWith(".actions.githubusercontent.com") || !process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN)
    throw new Error("AUTOMATION_IDENTITY_UNAVAILABLE");
  url.searchParams.set("audience", endpoint);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN}` },
    signal: AbortSignal.timeout(15000),
    redirect: "error"
  });
  if (!response.ok)
    throw new Error("AUTOMATION_IDENTITY_UNAVAILABLE");
  const data = await response.json();
  if (typeof data.value !== "string" || data.value.length > 16000)
    throw new Error("AUTOMATION_IDENTITY_UNAVAILABLE");
  console.log(`::add-mask::${data.value}`);
  identity = { token: data.value, until: Date.now() + 120000 };
  return data.value;
}
async function call(operation) {
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(operation === "status" ? 20000 : 125000),
    headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ operation, ...operation === "tick" ? { requestId: crypto.randomUUID() } : {} })
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json"))
    throw new Error("AUTOMATION_REQUEST_UNCONFIRMED");
  const text = await response.text();
  if (text.length > 4000)
    throw new Error("AUTOMATION_RESPONSE_INVALID");
  const body = JSON.parse(text);
  if (!body || Array.isArray(body) || typeof body !== "object")
    throw new Error("AUTOMATION_RESPONSE_INVALID");
  return body;
}
async function main() {
  const state = await runAutomaticDriver({
    call,
    wait: (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    now: Date.now,
    log: (message) => console.log(message)
  });
  console.log(`Automatic indexing: ${state}.`);
}
await main().catch(() => {
  console.error("Automatic indexing stopped safely. Inspect sanitized job status before any uncertain request is retried.");
  process.exitCode = 1;
});
