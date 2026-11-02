import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

const snapshotSchema = z.object({
  ai_lifetime_access: z.boolean(), ai_lesson_ids: z.array(z.string().min(1)).max(10000),
  server_time: z.string(), check_at: z.string(),
});
const EMPTY: readonly string[] = Object.freeze([]);

/** Exact purchased content rights; a lifetime purchase is never a subscription tier. */
export function useCommercialAccess() {
  const { user, loading } = useAuth();
  const userId = user?.id;
  const [, tick] = useState(0);
  const query = useQuery({
    queryKey: ["commercial-content-access", userId], enabled: !loading && !!userId,
    queryFn: async () => {
      const requestedAt = performance.now();
      const result = await supabase.rpc("get_my_commercial_access" as never);
      if (result.error) throw result.error;
      const snapshot = snapshotSchema.parse(result.data);
      const ttl = Date.parse(snapshot.check_at) - Date.parse(snapshot.server_time);
      if (!(ttl > 0 && ttl <= 30_000)) throw new Error("INVALID_COMMERCIAL_ACCESS_DEADLINE");
      return { snapshot, userId, deadline: requestedAt + ttl };
    },
    retry: false, staleTime: 0, refetchInterval: 30_000, refetchOnWindowFocus: "always",
  });
  const { data, refetch } = query;
  useEffect(() => {
    if (!data) return;
    const ttl = Math.max(0, data.deadline - performance.now());
    const refresh = setTimeout(() => void refetch(), ttl > 2000 ? ttl - 1000 : ttl);
    const expire = setTimeout(() => tick(value => value + 1), ttl);
    return () => { clearTimeout(refresh); clearTimeout(expire); };
  }, [data, refetch]);
  const current = !!userId && !loading && !query.isError && data?.userId === userId && performance.now() < data.deadline;
  return {
    lessonIds: current && data.snapshot.ai_lifetime_access ? data.snapshot.ai_lesson_ids : EMPTY,
    isLoaded: !loading && (!userId || query.isSuccess || query.isError),
  };
}
