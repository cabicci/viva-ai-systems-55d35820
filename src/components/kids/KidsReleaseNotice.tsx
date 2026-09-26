import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/lib/locale/locale-context";
import { getKidsCopy } from "@/lib/kids/copy";

/** The public page never infers launch from staged lessons or uploaded videos. */
export function KidsReleaseNotice({ className }: { className?: string }) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.rpc("kids_public_launch_open" as never).then(({ data, error }) => {
      if (active && !error) setOpen(data === true);
    });
    return () => {
      active = false;
    };
  }, []);

  if (open) return null;
  return (
    <p role="status" className={className}>
      {getKidsCopy(locale).reviewNotice}
    </p>
  );
}
