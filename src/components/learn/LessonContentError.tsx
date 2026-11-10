import { Button } from "@/components/ui/button";
import { useUiString } from "@/lib/locale/use-ui-strings";

export function LessonContentError({
  retry,
  retrying = false,
}: {
  retry: () => void;
  retrying?: boolean;
}) {
  const t = useUiString();
  return (
    <div role="alert" className="space-y-3 rounded-2xl border border-border/40 p-8 text-center">
      <p>{t("learn.error.load")}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button disabled={retrying} onClick={retry}>
          {t("learn.content.retry")}
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {t("learn.content.reload")}
        </Button>
      </div>
    </div>
  );
}
