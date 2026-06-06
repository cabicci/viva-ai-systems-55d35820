import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "إنشاء حساب — AI Ecosystem" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم إنشاء الحساب! افحص بريدك لتأكيد الحساب.");
    navigate({ to: "/login" });
  }

  return (
    <AuthShell title="أنشئ حسابك" subtitle="ابدأ رحلتك في منظومة الـ AI.">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2"><Label>البريد</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div className="space-y-2"><Label>كلمة المرور</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /></div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? "جارٍ الإنشاء..." : <>إنشاء حساب <ArrowLeft className="h-4 w-4" /></>}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        عندك حساب؟ <Link to="/login" className="text-primary hover:underline">سجّل دخول</Link>
      </p>
    </AuthShell>
  );
}
