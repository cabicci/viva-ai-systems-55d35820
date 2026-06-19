import { useState } from "react";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  usePlatformRetrieval,
  RETRIEVAL_CORPUS_SIZE,
} from "@/lib/platform-retrieval";
import { Section } from "./primitives";

export function RetrievalPanel() {
  const [query, setQuery] = useState("Context Window");
  const results = usePlatformRetrieval(query, { limit: 8 });

  return (
    <Section
      no="00"
      icon={SearchIcon}
      label="RETRIEVAL LAYER"
      title="Retrieval Layer"
    >
      <div className="glass rounded-2xl p-5 border border-primary/25 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground leading-loose max-w-2xl">
            بحث frontend عبر{" "}
            <code className="font-mono text-primary">
              searchPlatformContent()
            </code>
            {" "}— يكمّل RAG backend (
            <code className="font-mono text-primary">
              knowledge_chunks
            </code>
            {" "}·{" "}
            <code className="font-mono text-primary">
              match_knowledge_chunks()
            </code>
            ). implemented; live smoke test not performed in this cleanup.
          </p>
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
            CORPUS · {RETRIEVAL_CORPUS_SIZE} chunks
          </span>
        </div>

        <div className="flex items-center gap-2">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='جرّب: "Context Window"'
            className="font-mono"
            dir="ltr"
          />
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
          <span>QUERY · {query.trim() || "—"}</span>
          <span>{results.length} results</span>
        </div>

        <div className="space-y-2">
          {results.length === 0 ? (
            <div className="rounded-lg border border-border/40 p-4 text-sm text-muted-foreground text-center">
              لا نتائج داخل محتوى المنصة لهذا الـ Query.
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
                    <p className="text-sm font-bold text-foreground">
                      {r.lessonTitle}
                    </p>
                    <span className="text-[11px] text-muted-foreground">
                      · {r.moduleTitle}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-[10px] text-muted-foreground">
                      {r.lessonId}
                    </code>
                    <span className="font-mono text-[10px] text-accent bg-accent/10 rounded px-2 py-0.5">
                      score {r.relevanceScore.toFixed(3)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-loose">
                  {r.matchedText}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </Section>
  );
}