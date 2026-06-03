import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "إعادة تعيين كلمة المرور — AI Ecosystem" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password",
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("تم إرسال رابط إعادة التعيين إلى بريدك.");
  }

  return (
    <AuthShell title="نسيت كلمة المرور؟" subtitle="أدخل بريدك وسنرسل لك رابط إعادة التعيين.">
      {sent ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">تحقق من بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة المرور.</p>
          <Link to="/login" className="text-primary hover:underline">العودة لتسجيل الدخول</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2"><Label>البريد</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "جارٍ الإرسال..." : "إرسال رابط الإعادة"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">العودة لتسجيل الدخول</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}