import {
  startPhoneVerification,
  checkPhoneVerification,
  readCommunicationsReadiness,
} from "../../../src/lib/communications/twilio.server.ts";
const env = {
  TWILIO_API_KEY: "SYNTHETIC_CONNECTION",
  LOVABLE_API_KEY: "SYNTHETIC_GATEWAY",
  TWILIO_VERIFY_SERVICE_SID: "VA" + "b".repeat(32),
};
const phone = "+201012345678";
export default {
  async test() {
    const readiness = await readCommunicationsReadiness(env);
    if (!readiness.verifyReachable) throw Error("Worker GET failed");
    const sent = await startPhoneVerification({ phone, channel: "whatsapp", locale: "en" }, env);
    if (sent.verificationSid !== "VE" + "c".repeat(32)) throw Error("Worker POST failed");
    if (
      !(await checkPhoneVerification(
        { phone, verificationSid: sent.verificationSid, code: "123456" },
        env,
      ))
    )
      throw Error("Worker check failed");
    let rejected = false;
    try {
      await startPhoneVerification(
        { phone, channel: "sms", locale: "en" },
        { ...env, TWILIO_VERIFY_SERVICE_SID: "VA" + "d".repeat(32) },
      );
    } catch (error) {
      rejected = error.message === "COMMUNICATIONS_PROVIDER_REJECTED";
    }
    if (!rejected) throw Error("Worker followed a redirect");
    console.log(
      "PASS: actual transport GET/start/check and redirect rejection; synthetic outbound worker only",
    );
  },
};
