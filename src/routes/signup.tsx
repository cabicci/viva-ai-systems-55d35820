import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, ArrowLeft } from "lucide-react";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { verifyTurnstile } from "@/lib/turnstile.functions";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "إنشاء حساب — AI Ecosystem" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  // Maintenance lock: new signups are paused until the platform is fully ready.
  useEffect(() => {
    toast.info("التسجيل مقفول مؤقتاً، هنفتحه قريباً.");
    navigate({ to: "/" });
  }, [navigate]);
  return null;
}

function _SignupPageDisabled() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const verify = useServerFn(verifyTurnstile);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captchaToken) {
      toast.error("من فضلك أكمل التحقق من أنك لست روبوت.");
      return;
    }
    setLoading(true);
    const check = await verify({ data: { token: captchaToken } });
    if (!check.success) {
      setLoading(false);
      setCaptchaToken(null);
      toast.error("فشل التحقق الأمني، حاول تاني.");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/triage",
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء حسابك! تحقق من بريدك لتفعيله.");
    navigate({ to: "/triage" });
  }

  return (
    <AuthShell title="ابدأ رحلتك في المنظومة" subtitle="أنشئ حسابك وادخل نظام التشغيل التعليمي.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="الاسم"><Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="اسمك الكامل" /></Field>
        <Field label="البريد"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" /></Field>
        <Field label="كلمة المرور"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="٦ أحرف على الأقل" /></Field>
        <TurnstileWidget
          onVerify={(t) => setCaptchaToken(t)}
          onExpire={() => setCaptchaToken(null)}
          onError={() => setCaptchaToken(null)}
        />
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading || !captchaToken}>
          {loading ? "جارٍ الإنشاء..." : <>إنشاء الحساب <ArrowLeft className="h-4 w-4" /></>}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        لديك حساب؟ <Link to="/login" className="text-primary hover:underline">سجّل دخولك</Link>
      </p>
    </AuthShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative grid-bg overflow-hidden p-16 flex-col justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold relative z-10">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)] glow-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-gradient">AI Ecosystem</span>
        </Link>
        <div className="absolute -bottom-40 -left-20 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px] animate-pulse-glow" />
        <div className="absolute top-20 -right-20 h-[400px] w-[400px] rounded-full bg-accent/30 blur-[100px] animate-pulse-glow" />
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-black leading-tight">منظومة <span className="text-gradient">حيّة</span> تتعلم وتبني معك.</h2>
          <p className="mt-4 text-muted-foreground">خمس مراحل، مهام تنفيذية، أدوات AI، ومنتج حقيقي في النهاية.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Link to="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[image:var(--gradient-primary)]">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </span>
              <span className="text-gradient">AI Ecosystem</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-2 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
