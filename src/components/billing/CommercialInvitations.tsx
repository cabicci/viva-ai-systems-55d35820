import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  getCommercialInvitations,
  acceptCommercialInvitation,
} from "@/lib/billing/commercial-invitations.functions";
import type { SupportedLocale } from "@/lib/locale/types";

const copy = {
  "ar-EG": {
    title: "دعوات المناهج",
    all: "كل المناهج المنشورة",
    selected: "المناهج المحددة في الدعوة",
    quota: "{questions} سؤال شهريًا للمناهج المشمولة، بالإضافة إلى حصة اشتراكك إن وجد.",
    forever: "من غير تاريخ انتهاء",
    days: "يوم من وقت قبولك",
    accept: "قبول الدعوة وبدء المدة",
    busy: "جارٍ القبول…",
    error: "تعذّر قبول الدعوة. جرّب مرة تانية.",
    loadError: "تعذّر تحميل الدعوات.",
    retry: "إعادة المحاولة",
  },
  "ar-MSA": {
    title: "دعوات المناهج",
    all: "جميع المناهج المنشورة",
    selected: "المناهج المحددة في الدعوة",
    quota: "{questions} سؤال شهريًا للمناهج المشمولة، بالإضافة إلى حصة اشتراكك إن وجد.",
    forever: "دون تاريخ انتهاء",
    days: "يومًا من وقت القبول",
    accept: "قبول الدعوة وبدء المدة",
    busy: "جارٍ القبول…",
    error: "تعذّر قبول الدعوة. حاول مرة أخرى.",
    loadError: "تعذّر تحميل الدعوات.",
    retry: "إعادة المحاولة",
  },
  "ar-Gulf": {
    title: "دعوات المناهج",
    all: "كل المناهج المنشورة",
    selected: "المناهج المحددة في الدعوة",
    quota: "{questions} سؤال شهريًا للمناهج المشمولة، بالإضافة إلى حصة اشتراكك إن وجد.",
    forever: "بدون تاريخ انتهاء",
    days: "يوم من وقت قبولك",
    accept: "قبول الدعوة وبدء المدة",
    busy: "جارٍ القبول…",
    error: "تعذّر قبول الدعوة. حاول مرة ثانية.",
    loadError: "تعذّر تحميل الدعوات.",
    retry: "إعادة المحاولة",
  },
  en: {
    title: "Curriculum invitations",
    all: "All published curricula",
    selected: "The curricula selected in this invitation",
    quota:
      "{questions} monthly questions for the included curricula, in addition to any subscription allowance.",
    forever: "No expiry date",
    days: "days from acceptance",
    accept: "Accept invitation and start access",
    busy: "Accepting…",
    error: "Could not accept the invitation. Please try again.",
    loadError: "Could not load invitations.",
    retry: "Try again",
  },
};
export function CommercialInvitations({
  userId,
  locale,
}: {
  userId: string;
  locale: SupportedLocale;
}) {
  const c = copy[locale],
    client = useQueryClient();
  const key = ["commercial-invitations", userId];
  const query = useQuery({
    queryKey: key,
    queryFn: () => getCommercialInvitations({ data: { expectedAccountId: userId } }),
  });
  const [busy, setBusy] = useState<string | null>(null),
    [error, setError] = useState(false);
  const pending = query.data?.filter((row) => !row.accepted_at) ?? [];
  if (query.isError)
    return (
      <div className="text-sm text-muted-foreground" role="status">
        {c.loadError}{" "}
        <Button variant="ghost" onClick={() => void query.refetch()}>
          {c.retry}
        </Button>
      </div>
    );
  if (!pending.length) return null;
  async function accept(id: string) {
    setBusy(id);
    setError(false);
    try {
      await acceptCommercialInvitation({ data: { expectedAccountId: userId, invitationId: id } });
      await client.invalidateQueries({ queryKey: key });
      await client.invalidateQueries({ queryKey: ["user-subscription", userId] });
      await client.invalidateQueries({ queryKey: ["commercial-content-access", userId] });
      await client.invalidateQueries({ queryKey: ["scheduled-free-access", userId] });
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }
  return (
    <section
      className="glass rounded-2xl border border-border/50 p-6 space-y-4"
      aria-label={c.title}
    >
      <h2 className="font-bold text-lg">{c.title}</h2>
      {pending.map((row) => (
        <div key={row.id} className="rounded-xl border p-4 space-y-2">
          <p>{row.scope_mode === "all_published" ? c.all : c.selected}</p>
          {row.scope_mode !== "all_published" && row.catalogue_details?.length ? (
            <ul className="list-disc ps-5">
              {row.catalogue_details.map((item) => (
                <li key={item.id}>{item.titles?.[locale] ?? item.title}</li>
              ))}
            </ul>
          ) : null}
          <p className="text-sm text-muted-foreground">
            {c.quota.replace(
              "{questions}",
              new Intl.NumberFormat(locale === "en" ? "en" : "ar-EG").format(
                row.monthly_questions ?? 300,
              ),
            )}
          </p>
          <p className="text-sm">
            {row.duration_days === null ? c.forever : `${row.duration_days} ${c.days}`}
          </p>
          <Button onClick={() => void accept(row.id)} disabled={busy !== null}>
            {busy === row.id ? c.busy : c.accept}
          </Button>
        </div>
      ))}
      {error && <p role="alert">{c.error}</p>}
    </section>
  );
}
