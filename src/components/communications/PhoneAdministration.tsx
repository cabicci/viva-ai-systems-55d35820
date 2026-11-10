import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { listUsers } from "@/lib/admin.functions";
import {
  getPhoneAdministration,
  configurePhoneAdministration,
} from "@/lib/communications/phone-admin.functions";
import type { PhoneAdminInput, PhoneAdminSnapshot } from "@/lib/communications/phone-admin";
import type { SupportedLocale } from "@/lib/locale/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PhoneAdministration({ locale }: { locale: SupportedLocale }) {
  const { user } = useAuth();
  const cache = useQueryClient();
  const load = useServerFn(getPhoneAdministration);
  const configure = useServerFn(configurePhoneAdministration);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const t = (ar: string, en: string) => (locale === "en" ? en : ar);
  const queryKey = ["phone-administration", user?.id];
  const query = useQuery({
    queryKey,
    queryFn: () => load(),
    enabled: !!user,
    retry: false,
    refetchOnWindowFocus: false,
  });
  async function save(input: PhoneAdminInput) {
    if (saving) return;
    setSaving(true);
    setMessage("");
    try {
      cache.setQueryData(queryKey, await configure({ data: input }));
      setMessage(t("تم حفظ الإعدادات.", "Settings saved."));
    } catch (error) {
      setMessage(
        error instanceof Error && error.message.includes("PHONE_CONTROL_CONFLICT")
          ? t(
              "تغيرت الإعدادات من جلسة أخرى. حدّث الصفحة وراجعها قبل الحفظ.",
              "Settings changed in another session. Refresh and review before saving.",
            )
          : t(
              "تعذر الحفظ. احتفظنا باختياراتك للمراجعة وإعادة المحاولة.",
              "Save failed. Your choices remain available to review and retry.",
            ),
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="space-y-4 rounded-xl border p-5" aria-busy={query.isFetching || saving}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">
          {t("إدارة تأكيد الهاتف", "Phone verification controls")}
        </h2>
        <Button
          variant="outline"
          disabled={query.isFetching || saving}
          onClick={() => void query.refetch()}
        >
          {t("تحديث", "Refresh")}
        </Button>
      </div>
      {query.isPending ? (
        <p role="status">{t("جارٍ تحميل الإعدادات…", "Loading settings…")}</p>
      ) : query.isError || !query.data ? (
        <p role="alert">{t("تعذر تحميل إعدادات الهاتف.", "Phone settings could not be loaded.")}</p>
      ) : (
        <PhoneControlForm
          key={`${user?.id}:${query.data.revision}`}
          value={query.data}
          locale={locale}
          busy={saving}
          save={save}
        />
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}

function PhoneControlForm({
  value,
  locale,
  busy,
  save,
}: {
  value: PhoneAdminSnapshot;
  locale: SupportedLocale;
  busy: boolean;
  save(input: PhoneAdminInput): Promise<void>;
}) {
  const { user } = useAuth();
  const users = useServerFn(listUsers);
  const [page, setPage] = useState(1);
  const [enabled, setEnabled] = useState(value.enabled);
  const [channels, setChannels] = useState(value.channels);
  const [testUsers, setTestUsers] = useState(value.testUsers);
  const [dailyCap, setDailyCap] = useState(String(value.dailyCap));
  const t = (ar: string, en: string) => (locale === "en" ? en : ar);
  const accounts = useQuery({
    queryKey: ["phone-pilot-accounts", user?.id, page],
    queryFn: () => users({ data: { page, pageSize: 25 } }),
    retry: false,
    refetchOnWindowFocus: false,
  });
  const states = {
    reserved: t("محجوزة", "Reserved"),
    pending: t("بانتظار التأكيد", "Pending"),
    uncertain: t("نتيجة الإرسال غير مؤكدة", "Send outcome unknown"),
    checking: t("جارٍ التحقق", "Checking"),
    exhausted: t("انتهت المحاولات", "Attempts exhausted"),
    verified: t("مؤكدة", "Verified"),
  };
  const cap = Number(dailyCap);
  return (
    <>
      <p>
        {t("الإرسال اليوم", "Today's sends")}: {value.sentToday} / {value.dailyCap} ·{" "}
        {t("الحسابات المؤكدة", "Verified accounts")}: {value.verifiedAccounts}
      </p>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (Number.isInteger(cap) && cap >= 1 && cap <= 100 && channels.length) {
            void save({ revision: value.revision, enabled, channels, testUsers, dailyCap: cap });
          }
        }}
      >
        <fieldset disabled={busy} className="space-y-3">
          <label className="flex min-h-11 items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
            />
            {t("إتاحة التحقق للحسابات المحددة", "Allow verification for selected accounts")}
          </label>
          <p className="text-sm text-muted-foreground">
            {t(
              "اختيار القناة يحدد ما يظهر للحسابات المسموح لها. يلزم اكتمال ربط القناة لدى المزود قبل استخدامها.",
              "Channels determine the choices shown to permitted accounts. Complete provider setup before using a channel.",
            )}
          </p>
          {(["sms", "whatsapp"] as const).map((channel) => (
            <label key={channel} className="flex min-h-11 items-center gap-2">
              <input
                type="checkbox"
                checked={channels.includes(channel)}
                onChange={(event) =>
                  setChannels(
                    event.target.checked
                      ? [...channels, channel]
                      : channels.filter((item) => item !== channel),
                  )
                }
              />
              {channel === "sms" ? "SMS" : "WhatsApp"}
            </label>
          ))}
          <label className="block max-w-sm">
            {t("الحد اليومي لجميع الحسابات", "Daily limit across all accounts")}
            <Input
              type="number"
              min={1}
              max={100}
              step={1}
              value={dailyCap}
              onChange={(event) => setDailyCap(event.target.value)}
            />
          </label>
          <fieldset className="rounded-lg border p-3">
            <legend>{t("الحسابات المسموح لها بالتجربة", "Accounts allowed in the pilot")}</legend>
            {accounts.isError ? (
              <p role="alert">
                {t(
                  "تعذر تحميل الحسابات؛ الاختيارات المحفوظة باقية.",
                  "Accounts could not be loaded; saved selections are retained.",
                )}
              </p>
            ) : accounts.isPending ? (
              <p role="status">{t("جارٍ تحميل الحسابات…", "Loading accounts…")}</p>
            ) : (
              accounts.data.users.map((account) => (
                <label key={account.id} className="flex min-h-11 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={testUsers.includes(account.id)}
                    onChange={(event) =>
                      setTestUsers(
                        event.target.checked
                          ? [...testUsers, account.id]
                          : testUsers.filter((id) => id !== account.id),
                      )
                    }
                  />
                  <bdi>{account.email ?? account.id}</bdi>
                </label>
              ))
            )}
            <p>
              {t("المحدد", "Selected")}: {testUsers.length} / 100
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={page === 1 || accounts.isFetching}
                onClick={() => setPage(page - 1)}
              >
                {t("السابق", "Previous")}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!accounts.data?.hasMore || accounts.isFetching}
                onClick={() => setPage(page + 1)}
              >
                {t("التالي", "Next")}
              </Button>
            </div>
          </fieldset>
        </fieldset>
        <Button
          type="submit"
          disabled={
            busy ||
            !channels.length ||
            !Number.isInteger(cap) ||
            cap < 1 ||
            cap > 100 ||
            testUsers.length > 100
          }
        >
          {t("حفظ الإعدادات", "Save settings")}
        </Button>
      </form>
      <h3 className="font-bold">{t("آخر محاولات التحقق", "Recent verification attempts")}</h3>
      {!value.recent.length ? (
        <p>{t("لا توجد محاولات مسجلة.", "No recorded attempts.")}</p>
      ) : (
        <ul className="space-y-2">
          {value.recent.map((item) => (
            <li key={item.id} className="flex flex-wrap gap-3 rounded-lg border p-3">
              <bdi>••••{item.phoneTail}</bdi>
              <span>{item.channel}</span>
              <span>{states[item.state]}</span>
              <time dateTime={item.createdAt}>
                {new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "ar-EG", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "Africa/Cairo",
                }).format(new Date(item.createdAt))}
              </time>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
