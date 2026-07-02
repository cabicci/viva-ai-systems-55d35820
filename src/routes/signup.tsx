import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";
import { useUiString } from "@/lib/locale/use-ui-strings";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "إنشاء حساب — مسارات" }] }),
  component: SignupPage,
});

function SignupPage() {
  const t = useUiString();
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
    toast.success(t("auth.signup.toast.success"));
    navigate({ to: "/login" });
  }

  return (
    <AuthShell title={t("auth.signup.title")} subtitle={t("auth.signup.subtitle")}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>{t("auth.field.email")}</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>{t("auth.field.password")}</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            t("auth.signup.submitting")
          ) : (
            <>
              {t("auth.signup.submit")} <ArrowLeft className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-6">
        {t("auth.signup.footerHasAccount")}{" "}
        <Link to="/login" className="text-primary hover:underline">
          {t("auth.link.login")}
        </Link>
      </p>
    </AuthShell>
  );
}
