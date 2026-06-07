import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "تسجيل الدخول — AI Ecosystem" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setFailed(true);
      return toast.error(error.message);
    }
    toast.success("أهلاً بعودتك!");
    window.location.assign("/dashboard");
  }

  return (
    <AuthShell title="أهلاً بعودتك" subtitle="ادخل المنظومة وأكمل من حيث توقفت.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2"><Label>البريد</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="space-y-2"><Label>كلمة المرور</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "جارٍ الدخول..." : <>دخول <ArrowLeft className="h-4 w-4" /></>}
        </Button>
      </form>
      {failed && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-center">
          <p className="mb-2">فشل تسجيل الدخول. هل نسيت كلمة المرور؟</p>
          <Link to="/forgot-password" className="text-primary hover:underline font-medium">إعادة تعيين كلمة المرور</Link>
        </div>
      )}
      <p className="text-center text-sm text-muted-foreground mt-6">
        جديد؟ <Link to="/signup" className="text-primary hover:underline">أنشئ حسابك</Link>
        <span className="mx-2">·</span>
        <Link to="/forgot-password" className="text-primary hover:underline">نسيت كلمة المرور؟</Link>
      </p>
    </AuthShell>
  );
}
