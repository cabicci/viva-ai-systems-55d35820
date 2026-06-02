import { useEffect, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useEntitlement } from "@/lib/entitlements";
import { Button } from "@/components/ui/button";

/**
 * Client-side admin gate for internal/diagnostic routes.
 * Redirects non-admins; renders nothing sensitive until verified.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin, isLoaded } = useEntitlement();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    else if (isLoaded && user && !isAdmin) navigate({ to: "/dashboard" });
  }, [loading, isLoaded, user, isAdmin, navigate]);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center max-w-md">
          <ShieldAlert className="h-10 w-10 mx-auto text-destructive mb-3" />
          <h1 className="text-xl font-bold mb-2">صفحة محظورة</h1>
          <p className="text-sm text-muted-foreground mb-4">
            دي صفحة داخلية للأدمن بس.
          </p>
          <Button asChild variant="outline">
            <Link to="/dashboard">رجوع للوحة</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}