export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.hostname !== "connector-gateway.lovable.dev")
      throw Error("Redirect must never be followed");
    if (url.pathname.includes("VA" + "d".repeat(32)))
      return new Response(null, {
        status: 302,
        headers: { Location: "https://unexpected.invalid/" },
      });
    const service = "VA" + "b".repeat(32);
    if (request.method === "GET") return Response.json({ sid: service });
    const body = new URLSearchParams(await request.text());
    const check = url.pathname.endsWith("/VerificationCheck");
    if (check ? body.get("Code") !== "123456" : body.get("Channel") !== "whatsapp")
      throw Error("Unexpected form");
    return Response.json({
      sid: "VE" + "c".repeat(32),
      service_sid: service,
      to: "+201012345678",
      status: check ? "approved" : "pending",
      valid: check,
    });
  },
};
