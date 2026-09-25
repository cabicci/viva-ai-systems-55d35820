import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { requireAdminBeforeLoad } from "@/lib/admin-route-guard";
import { useEntitlement } from "@/lib/entitlements";

export const Route = createFileRoute("/admin/kids-parents")({
  beforeLoad: requireAdminBeforeLoad,
  head: () => ({ meta: [{ title: "مراجعة أولياء الأمور — مسارات" }] }),
  component: KidsParentReviews,
});

type RequestRow = {
  parent_id: string;
  parent_email: string;
  status: "pending" | "approved" | "rejected";
  requested_at: string;
  reviewed_at: string | null;
};

function KidsParentReviews() {
  const { isAdmin, isLoaded } = useEntitlement();
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [references, setReferences] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [requests, release] = await Promise.all([
        supabase
          .from("kids_parent_access_requests" as never)
          .select("parent_id,parent_email,status,requested_at,reviewed_at")
          .order("requested_at", { ascending: false })
          .range(page * pageSize, page * pageSize + pageSize - 1),
        supabase.rpc("kids_admin_parent_review_ready" as never),
      ]);
      if (requests.error || release.error || !Array.isArray(requests.data))
        throw new Error("backend");
      setRows(requests.data as RequestRow[]);
      setReady(release.data === true);
    } catch {
      setRows([]);
      setReady(false);
      setError("تعذّر تحميل المراجعات. خدمة كيدز أو صلاحية المراجعة غير جاهزة.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isLoaded && isAdmin) void load();
  }, [isLoaded, isAdmin, load]);

  async function decide(parentId: string, approve: boolean) {
    const reference = references[parentId]?.trim() ?? "";
    if (reference.length < 8 || reference.length > 120 || busy || (approve && !ready)) return;
    setBusy(parentId);
    setError("");
    try {
      const { error: reviewError } = await supabase.rpc(
        "kids_admin_review_parent" as never,
        { p_parent_id: parentId, p_approve: approve, p_reference: reference } as never,
      );
      if (reviewError) throw reviewError;
      setReferences((current) => ({ ...current, [parentId]: "" }));
      await load();
    } catch {
      setError("لم يُحفظ قرار المراجعة. تحقق من المرجع وجاهزية سياسة الطفل وحاول لاحقًا.");
    } finally {
      setBusy(null);
    }
  }

  if (!isLoaded)
    return (
      <main className="p-8" role="status">
        جارٍ التحقق من صلاحية الإدارة...
      </main>
    );
  if (!isAdmin) return <main className="p-8">هذه الصفحة للإدارة فقط.</main>;
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">مراجعة طلبات أولياء الأمور</h1>
        <Link to="/admin" className="underline">
          لوحة الإدارة
        </Link>
      </header>
      <p className="text-sm text-muted-foreground">
        الطلب يخص حساب بالغ فقط. راجع دليل الولاية والموافقة خارج هذه الصفحة، ثم دوّن مرجع الحالة.
        لا تُدخل بيانات طفل أو مستندات حساسة هنا.
      </p>
      {!ready && !loading && !error && (
        <p role="status" className="rounded-xl border p-4">
          جمع بيانات الطفل مغلق؛ لن يقبل الخادم أي اعتماد حتى تُراجع سياسة الطفل وتُفعّل الإتاحة.
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">جارٍ تحميل الطلبات...</p>
      ) : (
        <div className="space-y-4">
          {rows.length === 0 && <p>لا توجد طلبات في هذه الصفحة.</p>}
          {rows.map((row) => (
            <section key={row.parent_id} className="space-y-3 rounded-xl border p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <strong>{row.parent_email}</strong>
                  <p className="text-xs text-muted-foreground">{row.parent_id}</p>
                </div>
                <span>
                  {row.status === "pending"
                    ? "قيد المراجعة"
                    : row.status === "approved"
                      ? "معتمد"
                      : "مرفوض"}
                </span>
              </div>
              <p className="text-sm">قُدّم: {new Date(row.requested_at).toLocaleString("ar-EG")}</p>
              {row.status !== "rejected" && (
                <div className="flex flex-wrap items-end gap-3">
                  <label className="min-w-64 flex-1 text-sm">
                    مرجع دليل المراجعة
                    <input
                      value={references[row.parent_id] ?? ""}
                      maxLength={120}
                      onChange={(event) =>
                        setReferences((current) => ({
                          ...current,
                          [row.parent_id]: event.target.value,
                        }))
                      }
                      className="mt-1 block w-full rounded-lg border bg-background px-3 py-2"
                    />
                  </label>
                  {row.status === "pending" && (
                    <button
                      type="button"
                      disabled={
                        !ready ||
                        busy !== null ||
                        (references[row.parent_id]?.trim().length ?? 0) < 8
                      }
                      onClick={() => void decide(row.parent_id, true)}
                      className="rounded-lg border px-4 py-2 disabled:opacity-50"
                    >
                      اعتماد بعد التحقق
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy !== null || (references[row.parent_id]?.trim().length ?? 0) < 8}
                    onClick={() => void decide(row.parent_id, false)}
                    className="rounded-lg border px-4 py-2 disabled:opacity-50"
                  >
                    {row.status === "approved" ? "سحب الاعتماد" : "رفض الطلب"}
                  </button>
                </div>
              )}
            </section>
          ))}
          <nav className="flex gap-3">
            <button
              type="button"
              disabled={page === 0 || loading}
              onClick={() => setPage((n) => n - 1)}
              className="underline disabled:opacity-50"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={rows.length < pageSize || loading}
              onClick={() => setPage((n) => n + 1)}
              className="underline disabled:opacity-50"
            >
              التالي
            </button>
          </nav>
        </div>
      )}
    </main>
  );
}
