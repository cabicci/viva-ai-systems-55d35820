import { useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { unlockCoursePassword } from "@/lib/course-system/intake/course-password.functions";
import type { SupportedLocale } from "@/lib/locale/types";
import type { COURSE_AREAS } from "@/lib/course-system/contract";

const COPY = {
  "ar-EG": {
    title: "المنهج ده محمي بباسورد",
    body: "اكتب الباسورد علشان تفتح المنهج. هيفضل مفتوح لحسابك بعد كده.",
    label: "الباسورد",
    submit: "افتح المنهج",
    wrong: "الباسورد غلط، جرّب تاني.",
    limited: "محاولات كتير غلط. استنى ربع ساعة وجرّب تاني.",
    unavailable: "القفل لسه ما اتجهزش. جرّب بعدين.",
    error: "حصلت مشكلة، جرّب تاني.",
    signIn: "سجّل دخولك الأول علشان تكتب الباسورد.",
    signInCta: "تسجيل الدخول",
    checking: "جاري التحقق…",
  },
  "ar-MSA": {
    title: "هذا المنهج محمي بكلمة مرور",
    body: "أدخل كلمة المرور لفتح المنهج. سيبقى مفتوحًا لحسابك بعد ذلك.",
    label: "كلمة المرور",
    submit: "افتح المنهج",
    wrong: "كلمة المرور غير صحيحة، حاول مرة أخرى.",
    limited: "محاولات خاطئة كثيرة. انتظر ربع ساعة ثم حاول مجددًا.",
    unavailable: "القفل غير جاهز بعد. حاول لاحقًا.",
    error: "حدثت مشكلة، حاول مرة أخرى.",
    signIn: "سجّل الدخول أولًا لإدخال كلمة المرور.",
    signInCta: "تسجيل الدخول",
    checking: "جارٍ التحقق…",
  },
  "ar-Gulf": {
    title: "هذا المنهج محمي بكلمة سر",
    body: "اكتب كلمة السر عشان تفتح المنهج. بيظل مفتوح لحسابك بعدين.",
    label: "كلمة السر",
    submit: "افتح المنهج",
    wrong: "كلمة السر غلط، جرّب مرة ثانية.",
    limited: "محاولات غلط واجد. انتظر ربع ساعة وجرّب مرة ثانية.",
    unavailable: "القفل ما هو جاهز للحين. جرّب بعدين.",
    error: "صارت مشكلة، جرّب مرة ثانية.",
    signIn: "سجّل دخولك أول عشان تكتب كلمة السر.",
    signInCta: "تسجيل الدخول",
    checking: "جاري التحقق…",
  },
  en: {
    title: "This curriculum is password protected",
    body: "Enter the password to open this curriculum. It stays open for your account afterwards.",
    label: "Password",
    submit: "Open curriculum",
    wrong: "Incorrect password, please try again.",
    limited: "Too many wrong attempts. Wait 15 minutes and try again.",
    unavailable: "The lock isn't ready yet. Please try later.",
    error: "Something went wrong, please try again.",
    signIn: "Sign in first to enter the password.",
    signInCta: "Sign in",
    checking: "Checking…",
  },
} as const;

type Area = (typeof COURSE_AREAS)[number];

export function CoursePasswordGate({
  area,
  courseId,
  locale,
  children,
}: {
  area: Area;
  courseId: string;
  locale: SupportedLocale;
  children: ReactNode;
}) {
  const t = COPY[locale] ?? COPY["ar-EG"];
  const auth = useAuth();
  const queryClient = useQueryClient();
  const unlock = useServerFn(unlockCoursePassword);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string>();
  const [busy, setBusy] = useState(false);
  const state = useQuery({
    queryKey: ["course-password-state", area, courseId, auth.user?.id ?? null],
    enabled: !auth.loading,
    queryFn: async () => {
      const r = await supabase.rpc("curriculum_password_state", {
        p_area: area,
        p_course: courseId,
      });
      if (r.error) throw new Error(r.error.message);
      return r.data as { locked: boolean; unlocked: boolean };
    },
  });

  if (auth.loading || state.isPending) return <p role="status">{t.checking}</p>;
  if (state.isError)
    return (
      <div role="alert">
        <p>{t.error}</p>
        <button className="mt-3 underline" onClick={() => void state.refetch()}>
          {t.submit}
        </button>
      </div>
    );
  if (!state.data.locked || state.data.unlocked) return <>{children}</>;

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setMessage(undefined);
    try {
      const { status } = await unlock({ data: { area, course: courseId, password } });
      if (status === "unlocked") {
        setPassword("");
        await queryClient.invalidateQueries({ queryKey: ["course-password-state"] });
        await queryClient.invalidateQueries({ queryKey: ["curriculum-lesson"] });
      } else {
        setMessage(
          t[status === "limited" ? "limited" : status === "wrong" ? "wrong" : "unavailable"],
        );
      }
    } catch {
      setMessage(t.error);
    } finally {
      setBusy(false);
    }
  }

  const returnTo =
    typeof window === "undefined" ? undefined : window.location.pathname + window.location.search;

  return (
    <section className="mx-auto mt-6 max-w-md rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Lock className="size-5" aria-hidden />
        </span>
        <h2 className="text-lg font-bold">{t.title}</h2>
      </div>
      {!auth.user ? (
        <>
          <p className="text-muted-foreground">{t.signIn}</p>
          <Button asChild className="mt-4">
            <a
              href={`/login?locale=${locale}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`}
            >
              {t.signInCta}
            </a>
          </Button>
        </>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-muted-foreground">{t.body}</p>
          <label className="block space-y-1">
            <span className="text-sm font-medium">{t.label}</span>
            <Input
              type="password"
              name="course-password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={200}
              required
            />
          </label>
          {message && (
            <p role="alert" className="text-sm text-destructive">
              {message}
            </p>
          )}
          <Button type="submit" disabled={busy || !password} className="w-full">
            {busy ? t.checking : t.submit}
          </Button>
        </form>
      )}
    </section>
  );
}
