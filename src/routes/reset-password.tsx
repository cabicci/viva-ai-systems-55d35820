import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AuthShell } from "./signup";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "تعيين كلمة مرور جديدة — AI Ecosystem" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("كلمة المرور قصيرة جدًا.");
    if (password !== confirm) return toast.error("كلمتا المرور غير متطابقتين.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("تم تحديث كلمة المرور.");
    navigate({ to: "/dashboard" });
  }

  return (
    <AuthShell title="تعيين كلمة مرور جديدة" subtitle="اختر كلمة مرور قوية لحمايتك.">
      {!ready ? (
        <p className="text-center text-sm text-muted-foreground">جارٍ التحقق من الرابط...</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2"><Label>كلمة المرور الجديدة</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
          <div className="space-y-2"><Label>تأكيد كلمة المرور</Label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required /></div>
          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
            {loading ? "جارٍ التحديث..." : "حفظ كلمة المرور"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}