import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { freeAccessSnapshot } from "./free-access";

const EMPTY: readonly string[] = Object.freeze([]);
export function useFreeAccessSnapshot() {
  const { user, loading } = useAuth();
  const [, tick] = useState(0);
  const query = useQuery({
    queryKey: ["scheduled-free-access", user?.id],
    enabled: !loading && !!user?.id,
    queryFn: async () => {
      const requestedAt = performance.now();
      const r = await supabase.rpc("get_my_free_access" as never);
      if (r.error) throw r.error;
      const snapshot = freeAccessSnapshot.parse(r.data);
      // A server-relative monotonic deadline ignores a skewed/changed device clock.
      const ttl = Date.parse(snapshot.valid_until) - Date.parse(snapshot.server_time);
      if (!(ttl > 0 && ttl <= 30_000)) throw new Error("INVALID_FREE_ACCESS_DEADLINE");
      return { snapshot, deadline: requestedAt + ttl };
    },
    staleTime: 0,
    retry: false,
    refetchInterval: 30_000,
    refetchOnWindowFocus: "always",
  });
  const { data, refetch } = query;
  useEffect(() => {
    if (!data) return;
    const ttl = Math.max(0, data.deadline - performance.now());
    const before = setTimeout(() => void refetch(), ttl > 2000 ? ttl - 1000 : ttl);
    const timer = setTimeout(() => {
      tick((v) => v + 1);
    }, ttl);
    return () => {
      clearTimeout(before);
      clearTimeout(timer);
    };
  }, [data, refetch]);
  const current =
    !!user && !loading && !query.isError && query.data && performance.now() < query.data.deadline;
  return {
    lessonIds: current ? query.data.snapshot.lesson_ids : EMPTY,
    targets: current ? query.data.snapshot.targets : EMPTY,
    isLoaded: !loading && (!user || query.isSuccess || query.isError),
  };
}

const deliveryDeadlines = new WeakMap<object, number>();
function deliveryMetadata(data: unknown) {
  return data && typeof data === "object"
    ? (data as { free_access_check_at?: string; free_access_server_time?: string })
    : {};
}
/** Stamp on receipt, never on render/remount: cached grants cannot restart their lifetime. */
export function stampFreeDelivery<T>(data: T, requestedAt = performance.now()): T {
  const m = deliveryMetadata(data);
  if (m.free_access_check_at && m.free_access_server_time && data && typeof data === "object") {
    const ttl = Date.parse(m.free_access_check_at) - Date.parse(m.free_access_server_time);
    deliveryDeadlines.set(data, requestedAt + (ttl > 0 && ttl <= 30_000 ? ttl : 0));
  }
  return data;
}
/** Refresh before expiry without unmounting learner drafts; fail closed at the deadline on error. */
export function useFreeDeliveryDeadline(data: unknown, refetch: () => unknown) {
  const [, tick] = useState(0);
  const refresh = useRef(refetch);
  refresh.current = refetch;
  const metadata = deliveryMetadata(data);
  const tagged = !!metadata.free_access_check_at;
  const deadline = data && typeof data === "object" ? (deliveryDeadlines.get(data) ?? 0) : 0;
  useEffect(() => {
    if (!tagged) return;
    const ttl = Math.max(0, deadline - performance.now());
    const before = setTimeout(() => void refresh.current(), ttl > 2000 ? ttl - 1000 : ttl);
    const timer = setTimeout(() => tick((v) => v + 1), ttl);
    return () => {
      clearTimeout(before);
      clearTimeout(timer);
    };
  }, [data, deadline, tagged]);
  return !tagged || performance.now() < deadline;
}
