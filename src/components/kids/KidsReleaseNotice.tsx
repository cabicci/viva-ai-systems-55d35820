import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale/locale-context";
import { getKidsCopy } from "@/lib/kids/copy";

/** The public page never infers launch from staged lessons or uploaded videos. */
export function KidsReleaseNotice({ className }: { className?: string }) {
  const { locale } = useLocale();
  // Wait for the live release signal before claiming Kids is closed. The
  // initial HTML is otherwise a false warning on every launched page load.
  const [status, setStatus] = useState<"checking" | "open" | "closed" | "unavailable">("checking");

  useEffect(() => {
    let active = true;
    supabase.rpc("kids_public_launch_open" as never).then(({ data, error }) => {
      if (active) setStatus(error ? "unavailable" : data === true ? "open" : "closed");
    });
    return () => {
      active = false;
    };
  }, []);

  if (status === "checking" || status === "open") return null;
  return (
    <p role="status" className={className}>
      {status === "closed"
        ? getKidsCopy(locale).reviewNotice
        : getKidsCopy(locale).releaseUnavailable}
    </p>
  );
}
