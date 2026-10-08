// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { phoneVerificationInput } from "./contracts";
import {
  checkPhoneVerification,
  readAuthorizedCommunicationsReadiness,
  readCommunicationsReadiness,
  startPhoneVerification,
} from "./twilio.server";

const env = {
  TWILIO_ACCOUNT_SID: `AC${"a".repeat(32)}`,
  TWILIO_AUTH_TOKEN: "SYNTHETIC_TEST_TOKEN",
  TWILIO_VERIFY_SERVICE_SID: `VA${"b".repeat(32)}`,
};
const verificationSid = `VE${"c".repeat(32)}`;
const phone = "+201012345678";
const result = {
  sid: verificationSid,
  service_sid: env.TWILIO_VERIFY_SERVICE_SID,
  to: phone,
  status: "pending",
  valid: false,
};
const transport = (body: unknown, status = 200) =>
  vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response(JSON.stringify(body), { status }));
const startInput = { phone, channel: "sms", locale: "ar-EG" };
const checkInput = { verificationSid, phone, code: "123456" };
const connectorEnv = {
  TWILIO_API_KEY: "SYNTHETIC_OPAQUE_CONNECTION_KEY",
  LOVABLE_API_KEY: "SYNTHETIC_SERVER_GATEWAY_TOKEN",
  TWILIO_VERIFY_SERVICE_SID: env.TWILIO_VERIFY_SERVICE_SID,
};

describe("private failure diagnostics", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });
  afterEach(() => vi.restoreAllMocks());

  it("identifies missing configuration without fetching or exposing any configured value", async () => {
    const fetcher = transport(result);
    await expect(
      startPhoneVerification(
        startInput,
        { ...connectorEnv, LOVABLE_API_KEY: "" },
        fetcher,
      ),
    ).rejects.toThrow("COMMUNICATIONS_NOT_CONFIGURED");
    expect(fetcher).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledExactlyOnceWith("[masaarat.phone]", {
      operation: "start",
      stage: "configuration",
    });
  });

  it("retains only the HTTP status and numeric provider code from a rejected send", async () => {
    const fetcher = transport(
      {
        code: 60203,
        message: `${phone} ${checkInput.code} ${connectorEnv.TWILIO_API_KEY}`,
        more_info: `https://example.invalid/${verificationSid}`,
        request: { headers: connectorEnv, body: checkInput },
      },
      400,
    );
    const error = await startPhoneVerification(
      startInput,
      connectorEnv,
      fetcher,
    ).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe("COMMUNICATIONS_PROVIDER_REJECTED");
    expect((error as Error).cause).toBeUndefined();
    expect(console.warn).toHaveBeenCalledExactlyOnceWith("[masaarat.phone]", {
      operation: "start",
      stage: "http",
      httpStatus: 400,
      providerCode: 60203,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it.each([
    phone,
    checkInput.code,
    connectorEnv.TWILIO_API_KEY,
    null,
    {},
    -1,
    1.5,
    1_000_000,
  ])("discards an invalid provider code (%j)", async (code) => {
    await expect(
      startPhoneVerification(
        startInput,
        connectorEnv,
        transport({ code }, 429),
      ),
    ).rejects.toThrow("COMMUNICATIONS_RATE_LIMITED");
    expect(console.warn).toHaveBeenCalledExactlyOnceWith("[masaarat.phone]", {
      operation: "start",
      stage: "http",
      httpStatus: 429,
    });
  });

  it("records the gateway status even when a rejection body is not JSON", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(`<html>${phone} ${connectorEnv.LOVABLE_API_KEY}</html>`, {
          status: 403,
        }),
      );
    await expect(
      startPhoneVerification(startInput, connectorEnv, fetcher),
    ).rejects.toThrow("COMMUNICATIONS_PROVIDER_REJECTED");
    expect(console.warn).toHaveBeenCalledExactlyOnceWith("[masaarat.phone]", {
      operation: "start",
      stage: "http",
      httpStatus: 403,
    });
  });

  it("identifies a transport exception without its sensitive message and without retrying", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(
        new Error(
          `${phone} ${checkInput.code} ${connectorEnv.LOVABLE_API_KEY}`,
        ),
      );
    await expect(
      checkPhoneVerification(checkInput, connectorEnv, fetcher),
    ).rejects.toThrow("COMMUNICATIONS_PROVIDER_UNCERTAIN");
    expect(console.warn).toHaveBeenCalledExactlyOnceWith("[masaarat.phone]", {
      operation: "check",
      stage: "transport",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("distinguishes malformed JSON from a mismatched receipt without logging either body", async () => {
    const malformed = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(phone));
    await expect(
      startPhoneVerification(startInput, connectorEnv, malformed),
    ).rejects.toThrow("COMMUNICATIONS_PROVIDER_INVALID");
    expect(console.warn).toHaveBeenCalledExactlyOnceWith("[masaarat.phone]", {
      operation: "start",
      stage: "json",
      httpStatus: 200,
    });
    vi.mocked(console.warn).mockClear();
    await expect(
      checkPhoneVerification(
        checkInput,
        connectorEnv,
        transport({ ...result, to: "mismatch" }),
      ),
    ).rejects.toThrow("COMMUNICATIONS_PROVIDER_INVALID");
    expect(console.warn).toHaveBeenCalledExactlyOnceWith("[masaarat.phone]", {
      operation: "check",
      stage: "receipt",
    });
  });

  it("does not log successful sends or successful verification receipts", async () => {
    await startPhoneVerification(startInput, connectorEnv, transport(result));
    await checkPhoneVerification(
      checkInput,
      connectorEnv,
      transport({ ...result, status: "approved", valid: true }),
    );
    expect(console.warn).not.toHaveBeenCalled();
  });
});

describe("Twilio transport before activation", () => {
  it("uses the linked Lovable connector without requiring a raw Twilio Auth Token", async () => {
    const fetcher = transport({ sid: env.TWILIO_VERIFY_SERVICE_SID });
    const readiness = await readCommunicationsReadiness(connectorEnv, fetcher);
    expect(readiness.credentialsConfigured).toBe(true);
    expect(readiness.verifyReachable).toBe(true);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe(
      `https://connector-gateway.lovable.dev/twilio/verify/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}`,
    );
    expect(options?.headers).toEqual({
      Authorization: `Bearer ${connectorEnv.LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": connectorEnv.TWILIO_API_KEY,
    });
    expect(options?.redirect).toBe("error");
    expect(JSON.stringify(readiness)).not.toContain(
      connectorEnv.TWILIO_API_KEY,
    );
    expect(JSON.stringify(readiness)).not.toContain(
      connectorEnv.LOVABLE_API_KEY,
    );
  });
  it("recognizes an existing connector while Verify Service configuration is still pending", async () => {
    const fetcher = transport(result);
    const readiness = await readCommunicationsReadiness(
      { ...connectorEnv, TWILIO_VERIFY_SERVICE_SID: undefined },
      fetcher,
    );
    expect(readiness.credentialsConfigured).toBe(true);
    expect(readiness.verifyConfigured).toBe(false);
    expect(readiness.verifyReachable).toBe(null);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([
    { TWILIO_API_KEY: connectorEnv.TWILIO_API_KEY },
    { LOVABLE_API_KEY: connectorEnv.LOVABLE_API_KEY },
    { TWILIO_API_KEY: "", LOVABLE_API_KEY: connectorEnv.LOVABLE_API_KEY },
  ])(
    "rejects partial native credentials instead of falling back to another account",
    async (partial) => {
      const fetcher = transport(result),
        configuration = { ...env, ...partial };
      expect(
        (await readCommunicationsReadiness(configuration, fetcher))
          .credentialsConfigured,
      ).toBe(false);
      await expect(
        startPhoneVerification(startInput, configuration, fetcher),
      ).rejects.toThrow("COMMUNICATIONS_NOT_CONFIGURED");
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it("uses the connector gateway for start and check, while retaining exact receipt binding", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(result)))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ ...result, status: "approved", valid: true }),
        ),
      );
    expect(
      await startPhoneVerification(startInput, connectorEnv, fetcher),
    ).toEqual({
      verificationSid,
      phone,
    });
    expect(
      await checkPhoneVerification(checkInput, connectorEnv, fetcher),
    ).toBe(true);
    expect(fetcher.mock.calls.map(([url]) => url)).toEqual([
      `https://connector-gateway.lovable.dev/twilio/verify/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/Verifications`,
      `https://connector-gateway.lovable.dev/twilio/verify/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}/VerificationCheck`,
    ]);
    expect(
      fetcher.mock.calls.every(
        ([, options]) =>
          options?.method === "POST" && options?.redirect === "error",
      ),
    ).toBe(true);
  });
  it.each([false, null, "true"])(
    "denies non-admin stored-role outcomes (%s) before calling Twilio",
    async (data) => {
      const rpc = vi.fn().mockResolvedValue({ data, error: null }),
        fetcher = transport(result);
      await expect(
        readAuthorizedCommunicationsReadiness(
          "verified-user",
          rpc,
          env,
          fetcher,
        ),
      ).rejects.toThrow("Forbidden");
      expect(rpc).toHaveBeenCalledWith("has_role", {
        _user_id: "verified-user",
        _role: "admin",
      });
      expect(rpc).toHaveBeenCalledOnce();
      expect(fetcher).not.toHaveBeenCalled();
    },
  );
  it("denies an authorization error and a deletion-blocked administrator", async () => {
    const fetcher = transport(result);
    await expect(
      readAuthorizedCommunicationsReadiness(
        "verified-user",
        vi.fn().mockResolvedValue({ data: true, error: "denied" }),
        env,
        fetcher,
      ),
    ).rejects.toThrow("Forbidden");
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null });
    await expect(
      readAuthorizedCommunicationsReadiness("verified-user", rpc, env, fetcher),
    ).rejects.toThrow("ACCOUNT_DELETION_PENDING");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("allows a stored administrator with an active account to make a read-only check", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null }),
      fetcher = transport({ sid: env.TWILIO_VERIFY_SERVICE_SID });
    expect(
      (
        await readAuthorizedCommunicationsReadiness(
          "verified-admin",
          rpc,
          env,
          fetcher,
        )
      ).verifyReachable,
    ).toBe(true);
    expect(rpc.mock.calls[1]).toEqual(["lc09_account_active"]);
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][1]?.method).toBe("GET");
  });
  it("normalizes an explicit international phone, and rejects arbitrary identity/config fields", () => {
    expect(
      phoneVerificationInput.parse({ ...startInput, phone: "+20 10 1234 5678" })
        .phone,
    ).toBe(phone);
    for (const input of [
      { ...startInput, phone: "01012345678" },
      { ...startInput, userId: "some-other-user" },
      { ...startInput, channel: "call" },
      { ...startInput, phone: "javascript:alert(1)" },
    ])
      expect(() => phoneVerificationInput.parse(input)).toThrow();
  });
  it("does not fetch without existing configuration and reports only presence flags", async () => {
    const fetcher = transport(result);
    const flags = await readCommunicationsReadiness({}, fetcher);
    expect(flags).toEqual({
      credentialsConfigured: false,
      verifyConfigured: false,
      verifyReachable: null,
      messagingConfigured: false,
      whatsappSenderConfigured: false,
      activationAvailable: false,
    });
    await expect(
      startPhoneVerification(startInput, {}, fetcher),
    ).rejects.toThrow("COMMUNICATIONS_NOT_CONFIGURED");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("checks the configured service with GET; never sends a code during a readiness check", async () => {
    const fetcher = transport({ sid: env.TWILIO_VERIFY_SERVICE_SID });
    const flags = await readCommunicationsReadiness(env, fetcher);
    expect(flags.verifyReachable).toBe(true);
    expect(flags.activationAvailable).toBe(false);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe(
      `https://verify.twilio.com/v2/Services/${env.TWILIO_VERIFY_SERVICE_SID}`,
    );
    expect(options?.method).toBe("GET");
    expect(options?.redirect).toBe("error");
    expect(options?.body).toBeUndefined();
    expect(JSON.stringify(flags)).not.toContain(env.TWILIO_AUTH_TOKEN);
    expect(JSON.stringify(flags)).not.toContain(env.TWILIO_ACCOUNT_SID);
  });
  it("rejects a service mismatch during a connectivity check", async () => {
    expect(
      (
        await readCommunicationsReadiness(
          env,
          transport({ sid: `VA${"d".repeat(32)}` }),
        )
      ).verifyReachable,
    ).toBe(false);
  });
  it.each(
    ["sms", "whatsapp"].flatMap((channel) =>
      ["ar-EG", "ar-MSA", "ar-Gulf", "en"].map((locale) => [channel, locale]),
    ),
  )(
    "requests only the selected %s channel and canonical %s locale",
    async (channel, locale) => {
      const fetcher = transport(result);
      expect(
        await startPhoneVerification(
          { ...startInput, channel, locale },
          env,
          fetcher,
        ),
      ).toEqual({
        verificationSid,
        phone,
      });
      const body = fetcher.mock.calls[0][1]?.body as URLSearchParams;
      expect(Object.fromEntries(body)).toEqual({
        To: phone,
        Channel: channel,
        Locale: locale === "en" ? "en" : "ar",
      });
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );
  it.each([
    { ...result, to: "+201099999999" },
    { ...result, service_sid: `VA${"d".repeat(32)}` },
    { ...result, status: "approved" },
    { ...result, sid: "invalid" },
  ])("rejects mismatched start receipts", async (receipt) => {
    await expect(
      startPhoneVerification(startInput, env, transport(receipt)),
    ).rejects.toThrow("COMMUNICATIONS_PROVIDER_INVALID");
  });
  it("checks the persisted challenge SID rather than accepting a caller-supplied approval", async () => {
    const fetcher = transport({ ...result, status: "approved", valid: true });
    expect(await checkPhoneVerification(checkInput, env, fetcher)).toBe(true);
    expect(
      Object.fromEntries(fetcher.mock.calls[0][1]?.body as URLSearchParams),
    ).toEqual({
      VerificationSid: verificationSid,
      Code: "123456",
    });
    expect(
      await checkPhoneVerification(
        checkInput,
        env,
        transport({ ...result, status: "approved", valid: false }),
      ),
    ).toBe(false);
    expect(
      await checkPhoneVerification(checkInput, env, transport(result)),
    ).toBe(false);
  });
  it.each([
    { ...result, status: "approved", valid: true, to: "+201099999999" },
    { ...result, status: "approved", valid: true, sid: `VE${"d".repeat(32)}` },
    {
      ...result,
      status: "approved",
      valid: true,
      service_sid: `VA${"d".repeat(32)}`,
    },
  ])(
    "rejects approval for a different phone, challenge or service",
    async (receipt) => {
      await expect(
        checkPhoneVerification(checkInput, env, transport(receipt)),
      ).rejects.toThrow("COMMUNICATIONS_PROVIDER_INVALID");
    },
  );
  it("never retries an uncertain send or falls back to another channel", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("Sensitive provider/network detail"));
    await expect(
      startPhoneVerification(startInput, env, fetcher),
    ).rejects.toThrow("COMMUNICATIONS_PROVIDER_UNCERTAIN");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it.each([
    [401, "COMMUNICATIONS_PROVIDER_REJECTED"],
    [404, "COMMUNICATIONS_VERIFICATION_UNAVAILABLE"],
    [429, "COMMUNICATIONS_RATE_LIMITED"],
  ])("redacts provider errors (%s)", async (status, message) => {
    await expect(
      startPhoneVerification(
        startInput,
        env,
        transport(
          { message: `Sensitive ${phone} ${env.TWILIO_AUTH_TOKEN}` },
          status as number,
        ),
      ),
    ).rejects.toThrow(message as string);
  });
});
