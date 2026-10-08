import { useEffect, useState } from "react";
import { phoneVerificationCopy } from "@/lib/communications/phone-copy";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getAccountPhone,
  sendAccountPhoneCode,
  verifyAccountPhoneCode,
} from "@/lib/communications/phone.functions";
import type { PhoneChallenge, PhoneError } from "@/lib/communications/phone-contracts";
import type { DeliveryChannel } from "@/lib/communications/contracts";

export function PhoneVerification({ standalone = false }: { standalone?: boolean } = {}) {
  const { user } = useAuth();
  const { locale, dir } = useLocale();
  const t = phoneVerificationCopy(locale);
  const Heading = standalone ? "h1" : "h2";
  const load = useServerFn(getAccountPhone),
    send = useServerFn(sendAccountPhoneCode),
    check = useServerFn(verifyAccountPhoneCode);
  const status = useQuery({
    queryKey: ["account-phone", user?.id],
    queryFn: () => load(),
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const [phone, setPhone] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<DeliveryChannel | null>(null);
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!challenge) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [challenge]);
  const expired = !!challenge && Date.parse(challenge.expiresAt) <= now;
  const [error, setError] = useState<PhoneError | "invalid" | null>(null);
  const messages = {
    disabled: t.disabled,
    email: t.email,
    phone: t.phoneError,
    limit: t.limit,
    challenge: t.challenge,
    unavailable: t.unavailable,
    invalid: t.invalid,
  };
  const value = status.data?.ok ? status.data.value : undefined;
  const channel =
    selectedChannel && value?.channels.includes(selectedChannel)
      ? selectedChannel
      : value?.channels.includes("whatsapp")
        ? "whatsapp"
        : "sms";
  async function start() {
    if (busy || !value?.enabled || !value.channels.includes(channel) || challenge) return;
    setBusy(true);
    setError(null);
    try {
      const result = await send({ data: { phone, locale, channel } });
      if (result.ok) setChallenge(result.value);
      else setError(result.error);
    } catch {
      setError("unavailable");
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    if (busy || !challenge) return;
    setBusy(true);
    setError(null);
    try {
      const result = await check({ data: { challengeId: challenge.challengeId, code } });
      setCode(""); // Never retain the entered code after the request.
      if (result.ok && result.value.verified) {
        setChallenge(null);
        setPhone("");
        await status.refetch();
      } else if (result.ok) setError("invalid");
      else {
        setError(result.error);
        if (result.error === "challenge") setChallenge(null);
      }
    } catch {
      setCode("");
      setError("unavailable");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="phone-verification"
      className="glass rounded-2xl p-6 border border-border/50 mb-5"
      dir={dir}
      aria-busy={busy || status.isFetching}
    >
      <Heading className="text-lg font-bold">{t.title}</Heading>
      <p className="text-sm text-muted-foreground mt-2">{t.intro}</p>
      {value?.phone && (
        <p className="mt-3" role="status">
          {t.verified}: <bdi dir="ltr">{value.phone}</bdi>
        </p>
      )}
      {status.isPending ? (
        <p role="status">{t.wait}</p>
      ) : !value ? (
        <div>
          <p role="alert">
            {status.data && !status.data.ok ? messages[status.data.error] : t.unavailable}
          </p>
          <Button variant="outline" onClick={() => void status.refetch()}>
            {t.retry}
          </Button>
        </div>
      ) : !value.enabled ? (
        <p className="mt-3 text-sm" role="status">
          {t.off}
        </p>
      ) : (
        <div className="mt-4 grid gap-3 max-w-md">
          <fieldset disabled={busy || !!challenge} className="grid gap-2">
            <legend className="text-sm mb-2">{t.channel}</legend>
            {(["whatsapp", "sms"] as const)
              .filter((item) => value.channels.includes(item))
              .map((item) => (
                <label key={item} className="flex items-center gap-2 min-h-10">
                  <input
                    type="radio"
                    name="phone-delivery-channel"
                    value={item}
                    checked={channel === item}
                    onChange={() => setSelectedChannel(item)}
                  />
                  {t[item]}
                </label>
              ))}
          </fieldset>
          <label>
            {t.phone}
            <Input
              type="tel"
              autoComplete="tel"
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={busy || !!challenge}
              placeholder="+20…"
              maxLength={40}
            />
          </label>
          {!challenge ? (
            <Button onClick={() => void start()} disabled={busy || !phone.trim()}>
              {busy ? t.wait : t.send}
            </Button>
          ) : expired ? (
            <>
              <p role="status">{t.challenge}</p>
              <Button
                disabled={busy}
                onClick={() => {
                  setChallenge(null);
                  setCode("");
                  setError(null);
                }}
              >
                {t.retry}
              </Button>
            </>
          ) : (
            <>
              <p role="status" className="text-sm">
                {t.sent}
              </p>
              <label>
                {t.code}
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  dir="ltr"
                  maxLength={6}
                  disabled={busy}
                />
              </label>
              <Button onClick={() => void verify()} disabled={busy || !/^[0-9]{6}$/.test(code)}>
                {busy ? t.wait : t.confirm}
              </Button>
            </>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {messages[error]}
        </p>
      )}
    </section>
  );
}
