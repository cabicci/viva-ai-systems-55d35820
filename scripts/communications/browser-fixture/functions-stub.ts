import { state } from "./state";
export async function getAccountPhone() {
  return {
    ok: true,
    value: {
      enabled: true,
      channels: ["whatsapp", "sms"],
      phone: state.phone,
      verifiedAt: state.phone ? "2026-10-08T00:00:00Z" : null,
    },
  };
}
export async function sendAccountPhoneCode(request: { data: { phone: string } }) {
  state.sends.push(request);
  return {
    ok: true,
    value: {
      challengeId: "00000000-0000-4000-8000-000000000001",
      expiresAt: new Date(Date.now() + 600000).toISOString(),
    },
  };
}
export async function verifyAccountPhoneCode(request: { data: { code: string } }) {
  state.checks.push(request);
  const verified = request.data.code === "654321";
  if (verified) state.phone = "+201012345678";
  return { ok: true, value: { verified } };
}
