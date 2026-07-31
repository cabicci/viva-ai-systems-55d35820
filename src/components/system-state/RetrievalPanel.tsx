import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePlatformRetrieval, RETRIEVAL_CORPUS_SIZE } from "@/lib/platform-retrieval";
import { useUiString } from "@/lib/locale/use-ui-strings";
import { Section } from "./primitives";

export function RetrievalPanel() {
  const t = useUiString();
  const [query, setQuery] = useState("Context Window");
  const results = usePlatformRetrieval(query, { limit: 8 });

  return (
    <Section
      no="00"
      icon={SearchIcon}
      label={t("systemState.retrieval.label")}
      title={t("systemState.retrieval.title")}
    >
      <div className="glass rounded-2xl p-5 border border-primary/25 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground leading-loose max-w-2xl">
            {t("systemState.retrieval.bodyBefore")}{" "}
            <code className="font-mono text-primary">searchPlatformContent()</code>
            {t("systemState.retrieval.bodyMid")}
            <code className="font-mono text-primary">knowledge_chunks</code>
            {" · "}
            <code className="font-mono text-primary">match_knowledge_chunks()</code>
            {t("systemState.retrieval.bodyAfter")}
          </p>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
            {t("systemState.retrieval.corpus").replace("{count}", String(RETRIEVAL_CORPUS_SIZE))}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("systemState.retrieval.placeholder")}
            className="font-mono"
            dir="ltr"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>{t("systemState.retrieval.query").replace("{query}", query.trim() || "—")}</span>
          <span>
            {t("systemState.retrieval.resultsCount").replace("{count}", String(results.length))}
          </span>
        </div>

        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="rounded-lg border border-border/40 p-4 text-sm text-muted-foreground text-center">
              {t("systemState.retrieval.empty")}
            </div>
          ) : (
            results.map((r, i) => (
              <div
                key={`${r.lessonId}-${r.matchType}-${i}`}
                className="rounded-lg border border-border/40 p-4 bg-background/40 space-y-2"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[10px] tracking-widest text-primary bg-primary/10 rounded px-2 py-0.5">
                      {r.matchType.toUpperCase()}
                    </span>
                    <p className="text-sm font-bold text-foreground">{r.lessonTitle}</p>
                    <span className="text-[11px] text-muted-foreground">· {r.moduleTitle}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-[10px] text-muted-foreground">
                      {r.lessonId}
                    </code>
                    <span className="font-mono text-[10px] text-accent bg-accent/10 rounded px-2 py-0.5">
                      {t("systemState.retrieval.score").replace(
                        "{score}",
                        r.relevanceScore.toFixed(3),
                      )}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-loose">{r.matchedText}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </Section>
  );
}
