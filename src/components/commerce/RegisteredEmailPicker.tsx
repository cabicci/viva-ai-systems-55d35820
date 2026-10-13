import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listUsers } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/locale/locale-context";
import { Button } from "@/components/ui/button";

export function RegisteredEmailPicker({
  onSelect,
  selected = [],
  disabled = false,
}: {
  onSelect: (email: string) => void;
  selected?: string[];
  disabled?: boolean;
}) {
  const { locale } = useLocale();
  const { user, loading } = useAuth();
  const list = useServerFn(listUsers);
  const [search, setSearch] = useState("");
  const w =
    locale === "en"
      ? {
          title: "Choose a registered user",
          search: "Search registered emails",
          more: "Load more users",
          loading: "Loading registered users…",
          empty: "No matching registered users.",
          error: "Could not load registered users.",
          retry: "Retry",
          selected: "Selected",
          hint: "Or enter an unregistered email below.",
        }
      : {
          title: "اختر مستخدمًا مسجلًا",
          search: "بحث في الإيميلات المسجلة",
          more: "تحميل المزيد من المستخدمين",
          loading: "جارٍ تحميل المستخدمين المسجلين…",
          empty: "لا يوجد مستخدم مسجل مطابق.",
          error: "تعذر تحميل المستخدمين المسجلين.",
          retry: "إعادة المحاولة",
          selected: "تم الاختيار",
          hint: "أو أدخل بريدًا غير مسجل بالأسفل.",
        };
  const query = useInfiniteQuery({
    queryKey: ["commerce-registered-emails", user?.id],
    queryFn: ({ pageParam }) => list({ data: { page: pageParam, pageSize: 100 } }),
    initialPageParam: 1,
    getNextPageParam: (page) => (page.hasMore ? page.page + 1 : undefined),
    enabled: !!user && !loading,
    // Do not retain another administrator's email directory after leaving the page.
    gcTime: 0,
    retry: false,
  });
  const term = search.trim().toLowerCase();
  const { hasNextPage, isFetching, isError, fetchNextPage } = query;
  // Search every page, rather than reporting "not found" for an unloaded user.
  useEffect(() => {
    if (term && hasNextPage && !isFetching && !isError) {
      void fetchNextPage();
    }
  }, [term, hasNextPage, isFetching, isError, fetchNextPage]);
  const emails = [
    ...new Set(
      (query.data?.pages ?? []).flatMap((page) =>
        page.users.flatMap((row) => (row.email ? [row.email.trim().toLowerCase()] : [])),
      ),
    ),
  ].filter((email) => email.includes(term));
  const chosen = new Set(selected.map((email) => email.trim().toLowerCase()));
  return (
    <fieldset disabled={disabled} className="space-y-2 rounded border p-3">
      <legend className="px-1 font-medium">{w.title}</legend>
      <input
        type="search"
        aria-label={w.search}
        placeholder={w.search}
        dir="ltr"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="min-h-11 w-full rounded border bg-background px-3"
      />
      <div className="max-h-48 space-y-1 overflow-auto" aria-label={w.title}>
        {emails.map((email) => (
          <Button
            key={email}
            type="button"
            variant="ghost"
            className="w-full justify-start"
            disabled={disabled || chosen.has(email)}
            onClick={() => onSelect(email)}
          >
            <bdi className="truncate">{email}</bdi>
            {chosen.has(email) && <span> · {w.selected}</span>}
          </Button>
        ))}
      </div>
      {(query.isPending || query.isFetching) && <p role="status">{w.loading}</p>}
      {query.isError ? (
        <div role="alert">
          <p>{w.error}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void (query.isFetchNextPageError ? query.fetchNextPage() : query.refetch())
            }
          >
            {w.retry}
          </Button>
        </div>
      ) : (
        !query.isPending &&
        !query.isFetching &&
        !query.hasNextPage &&
        emails.length === 0 && <p>{w.empty}</p>
      )}
      {query.hasNextPage && !term && (
        <Button
          type="button"
          variant="outline"
          disabled={query.isFetching}
          onClick={() => void query.fetchNextPage()}
        >
          {w.more}
        </Button>
      )}
      <p className="text-sm text-muted-foreground">{w.hint}</p>
    </fieldset>
  );
}
