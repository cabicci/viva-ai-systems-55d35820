import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { accessNoticeCommand } from "@/lib/commerce/access-notice.functions";

type Notice = { kind: string; recipient: string; status: string };

export function AccessNoticeStatus({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { locale } = useLocale();
  const en = locale === "en";
  const command = useServerFn(accessNoticeCommand);
  const result = useQuery({
    queryKey: ["access-notices", user?.id, id],
    enabled: open && !!user,
    refetchInterval: open ? 30_000 : false,
    queryFn: async () =>
      (await command({
        data: { action: "status", data: { source_id: id } },
      })) as unknown as Notice[],
  });
  const kinds: Record<string, string> = {
    campaign_start: en ? "Campaign announcement" : "إعلان الحملة",
    campaign_signup: en ? "Signup notice" : "إشعار التسجيل",
    campaign_end: en ? "End reminder" : "تنبيه الانتهاء",
    coupon: en ? "Coupon" : "كوبون",
    grant: en ? "Access granted" : "منح الإتاحة",
  };
  const statuses: Record<string, string> = {
    pending: en ? "Queued" : "في الانتظار",
    sending: en ? "Sending" : "جارٍ الإرسال",
    accepted: en ? "Accepted by email provider" : "قبله مزوّد البريد",
    "email.delivered": en ? "Delivered" : "تم التسليم",
    "email.delivery_delayed": en ? "Delivery delayed" : "تأخّر التسليم",
    "email.bounced": en ? "Bounced" : "ارتدّ البريد",
    "email.failed": en ? "Delivery failed" : "تعذّر التسليم",
    "email.complained": en ? "Marked as spam" : "أُبلغ عنه كبريد مزعج",
    "email.suppressed": en ? "Suppressed" : "موقوف",
    suppressed: en ? "Suppressed" : "موقوف",
    unknown: en ? "Needs review" : "يحتاج مراجعة",
    failed: en ? "Failed" : "تعذّر الإرسال",
    expired: en ? "Expired" : "انتهى",
    held: en ? "On hold" : "متوقّف مؤقتًا",
  };
  return (
    <details onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>{en ? "Email status (latest 100)" : "حالة البريد (آخر ١٠٠ رسالة)"}</summary>
      {result.isError && (
        <p role="alert">{en ? "Could not read email status." : "تعذر قراءة حالة البريد."}</p>
      )}
      {result.data?.length === 0 && <p>{en ? "No emails recorded." : "مفيش رسائل مسجّلة."}</p>}
      <ul>
        {result.data?.map((item) => (
          <li key={item.kind + ":" + item.recipient}>
            <bdi>{item.recipient}</bdi> · {kinds[item.kind]} ·{" "}
            {statuses[item.status] ?? item.status}
          </li>
        ))}
      </ul>
    </details>
  );
}
