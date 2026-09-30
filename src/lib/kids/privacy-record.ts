import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

type Record = { policy_id: string; policy_version: string; attested_at: string };

export function useKidsPrivacyRecord() {
  const { user } = useAuth();
  const userId = user?.id;
  const [loaded, setLoaded] = useState<{ userId: string; record: Record | null } | null>(null);
  const [errorFor, setErrorFor] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!userId) return;
    void supabase.rpc("kids_parent_privacy_record" as never).then(
      ({ data, error }) => {
        if (!active) return;
        const rows: unknown = data;
        if (error || !Array.isArray(rows) || rows.length > 1) {
          setErrorFor(userId);
          return;
        }
        setLoaded({ userId, record: (rows[0] as Record | undefined) ?? null });
        setErrorFor(null);
      },
      () => {
        if (active) setErrorFor(userId);
      },
    );
    return () => {
      active = false;
    };
  }, [userId]);

  return {
    record: loaded && loaded.userId === userId ? loaded.record : null,
    loading: !!userId && loaded?.userId !== userId && errorFor !== userId,
    error: !!userId && errorFor === userId,
  };
}
