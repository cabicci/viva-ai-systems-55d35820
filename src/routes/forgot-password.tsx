import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/AuthShell";
import { useUiString } from "@/lib/locale/use-ui-strings";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "إعادة تعيين كلمة المرور — مسارات" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const t = useUiString();
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
    toast.success(t("auth.forgot.toast.success"));
  }

  return (
    <AuthShell title={t("auth.forgot.title")} subtitle={t("auth.forgot.subtitle")}>
      {sent ? (
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{t("auth.forgot.sentMessage")}</p>
          <Link to="/login" className="text-primary hover:underline">
            {t("auth.link.backToLogin")}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("auth.field.email")}</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              {t("auth.link.backToLogin")}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
