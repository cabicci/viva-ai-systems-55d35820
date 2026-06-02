import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

/**
 * Tracks how long the signed-in user has been active on the platform.
 * - Persists to the `user_activity_time` table so it follows the user
 *   across devices and browsers.
 * - Pauses when the tab is hidden.
 * - Ticks locally every 15s, flushes to the DB every 60s.
 * - Returns total seconds (already includes the in-memory unflushed tail).
 */
const TICK_MS = 15_000;
const FLUSH_MS = 60_000;
const TICK_SECONDS = TICK_MS / 1000;

export function usePlatformTime(): number {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [seconds, setSeconds] = useState<number>(0);

  // Load current total from DB whenever the user changes.
  useEffect(() => {
    if (!userId) {
      setSeconds(0);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("user_activity_time")
        .select("total_seconds")
        .eq("user_id", userId)
        .maybeSingle();
      if (!cancelled) {
        setSeconds(Number(data?.total_seconds ?? 0));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Tick + periodic flush.
  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    let unflushed = 0;

    const flush = async () => {
      if (unflushed <= 0) return;
      const toFlush = unflushed;
      unflushed = 0;
      const { data, error } = await supabase.rpc(
        "increment_user_activity_time",
        { p_seconds: toFlush },
      );
      if (error) {
        // restore on failure so we try again next flush
        unflushed += toFlush;
        return;
      }
      if (typeof data === "number") {
        setSeconds(data);
      }
    };

    const tick = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      unflushed += TICK_SECONDS;
      setSeconds((s) => s + TICK_SECONDS);
    }, TICK_MS);

    const flushTimer = window.setInterval(flush, FLUSH_MS);

    const onVisibility = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onBeforeUnload = () => {
      void flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(flushTimer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      void flush();
    };
  }, [userId]);

  return seconds;
}

export function formatPlatformTime(totalSeconds: number): {
  hours: number;
  minutes: number;
  label: string;
} {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  let label: string;
  if (hours > 0 && minutes > 0) label = `${hours} س ${minutes} د`;
  else if (hours > 0) label = `${hours} ساعة`;
  else label = `${minutes} دقيقة`;
  return { hours, minutes, label };
}