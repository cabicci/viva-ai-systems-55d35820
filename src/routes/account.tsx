import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  User as UserIcon,
  Mail,
  Calendar,
  BadgeCheck,
  Flame,
  Clock,
  BookCheck,
  Shield,
  KeyRound,
  LogOut,
  Trash2,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { AuthSessionGate, requireAuthBeforeLoad } from "@/lib/auth-route-guard";
import { useEntitlement, useStreak } from "@/lib/entitlements";
import { captureError } from "@/lib/error-capture";
import { LESSONS } from "@/lib/unified-lessons";
import { PATHS } from "@/lib/curriculum-data";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/account")({
  beforeLoad: requireAuthBeforeLoad,
  head: () => ({
    meta: [
      { title: "حسابي — مسارات" },
      {
        name: "description",
        content: "إدارة حسابك واشتراكك على منصة مسارات.",
      },
    ],
  }),
  component: AccountPage,
});

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDuration(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h} س ${m} د`;
  return `${m} دقيقة`;
}

function AccountPage() {
  return (
    <AuthSessionGate>
      <AccountContent />
    </AuthSessionGate>
  );
}

function AccountContent() {
  const { user, signOut } = useAuth();
  const ent = useEntitlement();
  const { streak } = useStreak();
  const [sendingReset, setSendingReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const userId = user!.id;
  const email = user!.email ?? "";
  const admin = ent.isAdmin;

  // All curriculum lesson IDs (intro + 5 paths). Intro lessons live in
  // the curriculum but aren't merged into LESSONS, so we union them here.
  const ALL_LESSON_IDS = (() => {
    const ids = new Set<string>(LESSONS.map((l) => l.id));
    for (const p of PATHS) {
      for (const m of p.modules) {
        for (const l of m.lessons) ids.add(l.id);
      }
    }
    return ids;
  })();
  const totalLessons = ALL_LESSON_IDS.size;

  const { data: sub } = useQuery({
    queryKey: ["account-subscription", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from("user_subscriptions")
        .select("tier, status, provider, current_period_end, created_at")
        .eq("user_id", userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: activitySec } = useQuery({
    queryKey: ["account-activity-time", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data } = await supabase
        .from("user_activity_time")
        .select("total_seconds")
        .eq("user_id", userId)
        .maybeSingle();
      return (data?.total_seconds as number | undefined) ?? 0;
    },
    enabled: !!userId,
  });

  const { data: completedCount } = useQuery({
    queryKey: ["account-completed-lessons", userId],
    queryFn: async () => {
      if (!userId) return 0;
      const { data } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId)
        .eq("status", "completed");
      const unique = new Set(
        (data ?? [])
          .map((r) => r.lesson_id as string)
          .filter((id) => ALL_LESSON_IDS.has(id))
      );
      return unique.size;
    },
    enabled: !!userId,
  });

  const tier = ent.tier;
  const isPro = ent.isPro;

  const handleSendReset = async () => {
    if (!email) return;
    setSendingReset(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("بعتنالك رابط تغيير الباسورد على إيميلك");
    } catch (e) {
      toast.error("حصلت مشكلة. جرّب تاني.");
      captureError("account:reset-password", e);
    } finally {
      setSendingReset(false);
    }
  };

  const handleDelete = async () => {
    if (!userId) return;
    setDeleting(true);
    try {
      const { error } = await supabase.rpc("delete_my_account_data");
      if (error) throw error;
      toast.success("اتمسحت بياناتك. للحذف الكامل للحساب، ابعتلنا.");
      await signOut();
    } catch (e) {
      toast.error("حصلت مشكلة في الحذف.");
      captureError("account:delete-data", e);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const avatarLetter = (email[0] ?? "?").toUpperCase();

  return (
    <div className="min-h-dvh flex" dir="rtl">
      <Sidebar />
      <main className="flex-1 px-4 sm:px-6 lg:px-10 py-8 max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              حسابي
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              معلوماتك، اشتراكك، وإدارة الحساب
            </p>
          </div>
          <Button asChild variant="glass" size="sm">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 rotate-180" /> اللوحة
            </Link>
          </Button>
        </div>

        {/* Profile + Subscription */}
        <div className="grid gap-5 md:grid-cols-2 mb-5">
          {/* Profile card */}
          <section className="glass rounded-2xl p-6 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-2xl font-black text-primary-foreground glow-primary">
                {avatarLetter}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">البروفايل</p>
                <p className="text-lg font-bold truncate">
                  {email || "ضيف"}
                </p>
                {admin && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest text-primary">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
              </div>
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{email || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>انضممت في {formatDate(user?.created_at)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span className="font-mono text-xs truncate">
                  {userId ?? "—"}
                </span>
              </div>
            </div>
          </section>

          {/* Subscription card */}
          <section className="glass rounded-2xl p-6 border border-border/50 flex flex-col">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">الاشتراك</p>
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-2xl font-black">
                    {isPro ? "Pro" : "Free"}
                  </h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest ${
                      isPro
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "bg-muted/50 text-muted-foreground border border-border/50"
                    }`}
                  >
                    {isPro ? "نشط" : "مجاني"}
                  </span>
                </div>
              </div>
              <BadgeCheck
                className={`h-5 w-5 ${isPro ? "text-primary" : "text-muted-foreground"}`}
              />
            </div>

            <div className="mt-4 space-y-2 text-sm flex-1">
              {admin ? (
                <div className="rounded-xl border border-primary/30 bg-primary/[0.05] p-3 text-xs text-primary">
                  وصول كامل (Admin Bypass) — كل الدروس والمميزات مفتوحة.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>الحالة</span>
                    <span className="text-foreground">
                      {sub?.status ?? (isPro ? "active" : "—")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>التجديد القادم</span>
                    <span className="text-foreground">
                      {formatDate(sub?.current_period_end)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>المزود</span>
                    <span className="text-foreground">
                      {sub?.provider ?? "—"}
                    </span>
                  </div>
                </>
              )}
            </div>

            {!isPro && !admin && (
              <Button
                variant="violet"
                size="lg"
                className="mt-5"
                disabled
                title="هيتفعل قريبًا"
              >
                <CreditCard className="h-4 w-4" /> فعّل Pro (قريبًا)
              </Button>
            )}
          </section>
        </div>

        {/* Stats */}
        <section className="glass rounded-2xl p-6 border border-border/50 mb-5">
          <p className="text-xs text-muted-foreground mb-4">
            إحصائيات سريعة
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile
              icon={<Flame className="h-4 w-4 text-orange-400" />}
              label="الـ Streak الحالي"
              value={`${streak.current_streak} يوم`}
            />
            <StatTile
              icon={<Flame className="h-4 w-4 text-amber-400" />}
              label="أطول Streak"
              value={`${streak.longest_streak} يوم`}
            />
            <StatTile
              icon={<Clock className="h-4 w-4 text-sky-400" />}
              label="وقت النشاط"
              value={formatDuration(activitySec ?? 0)}
            />
            <StatTile
              icon={<BookCheck className="h-4 w-4 text-emerald-400" />}
              label="دروس مكتملة"
              value={`${completedCount ?? 0} / ${totalLessons}`}
            />
          </div>
        </section>

        {/* Account management */}
        <section className="glass rounded-2xl p-6 border border-border/50">
          <p className="text-xs text-muted-foreground mb-4">إدارة الحساب</p>
          <div className="grid gap-3 md:grid-cols-3">
            <Button
              variant="glass"
              size="lg"
              onClick={handleSendReset}
              disabled={sendingReset || !email}
              className="justify-start"
            >
              <KeyRound className="h-4 w-4" />
              {sendingReset ? "بنبعت..." : "تغيير كلمة المرور"}
            </Button>
            <Button
              variant="glass"
              size="lg"
              onClick={() => signOut()}
              className="justify-start"
            >
              <LogOut className="h-4 w-4" /> تسجيل خروج
            </Button>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setConfirmDelete(true)}
              className="justify-start"
            >
              <Trash2 className="h-4 w-4" /> حذف الحساب
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            ملاحظة: حذف الحساب بيمسح كل بياناتك (تقدّم، notes، missions،
            اشتراك). للحذف النهائي لبيانات الدخول، ابعتلنا على الإيميل.
          </p>
        </section>

        {/* Delete confirmation */}
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>متأكد إنك عايز تحذف حسابك؟</DialogTitle>
              <DialogDescription>
                ده هيمسح كل بياناتك بشكل نهائي (التقدّم، الـ notes، الـ
                missions، والاشتراك). الإجراء ده مينفعش يترجع.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                variant="glass"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                إلغاء
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "بنحذف..." : "أيوة، احذف"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/50 bg-white/[0.02] p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </div>
      <p className="mt-2 text-xl font-black">{value}</p>
    </div>
  );
}