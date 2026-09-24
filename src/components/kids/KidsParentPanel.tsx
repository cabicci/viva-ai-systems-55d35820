import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { KIDS_LEVELS, type KidsLevelId } from "@/lib/kids/catalogue";
import { useKidsParentState } from "@/lib/kids/parent-state";
import { getKidsJourneyCopy } from "@/lib/kids/journey-copy";
import { useLocale } from "@/lib/locale/locale-context";
import { useLocaleLinkSearch } from "@/lib/locale/use-locale-link-search";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function KidsParentPanel() {
  const { locale } = useLocale();
  const localeSearch = useLocaleLinkSearch();
  const copy = getKidsJourneyCopy(locale);
  const { state, profiles, createProfile, refresh } = useKidsParentState();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<KidsLevelId>("level-1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function addProfile(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(false);
    try {
      await createProfile(name, level);
      setName("");
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-label={copy.parentTitle}
      className="rounded-3xl border border-primary/20 bg-card p-6 md:p-8"
    >
      <h2 className="text-2xl font-black">{copy.parentTitle}</h2>
      {state === "signed-out" && (
        <div className="mt-4 space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">{copy.signInNotice}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/signup"
              search={localeSearch({ intent: "kids" })}
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"
            >
              {copy.signUp}
            </Link>
            <Link
              to="/login"
              search={localeSearch({ intent: "kids" })}
              className="inline-flex min-h-11 items-center rounded-full border border-primary px-5 text-sm font-bold text-primary"
            >
              {copy.signIn}
            </Link>
          </div>
        </div>
      )}
      {state === "checking" && (
        <p role="status" className="mt-4 text-sm">
          {copy.waiting}
        </p>
      )}
      {(state === "pending" || state === "unavailable") && (
        <div className="mt-4 space-y-3">
          <p role="status" className="text-sm">
            {state === "pending" ? copy.pending : copy.unavailable}
          </p>
          {state === "pending" ? (
            <>
              <p className="text-sm text-muted-foreground">{copy.requestNote}</p>
              <Link
                to="/contact"
                search={localeSearch()}
                className="inline-flex min-h-11 items-center rounded-full border border-primary px-5 text-sm font-bold text-primary"
              >
                {copy.request}
              </Link>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={refresh}>
              {copy.retryCheck}
            </Button>
          )}
        </div>
      )}
      {state === "ready" && (
        <div className="mt-5 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-bold">{copy.profiles}</h3>
            {profiles.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{copy.noProfile}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {profiles.map((profile) => (
                  <li key={profile.id} className="rounded-xl border border-border/60 p-3 text-sm">
                    {profile.display_name} · {copy.level}{" "}
                    {KIDS_LEVELS.findIndex((item) => item.id === profile.level_id) + 1}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <form onSubmit={addProfile} className="space-y-3 rounded-2xl bg-muted/30 p-4">
            <h3 className="font-bold">{copy.create}</h3>
            <Label htmlFor="kids-profile-name">{copy.name}</Label>
            <Input
              id="kids-profile-name"
              value={name}
              maxLength={40}
              required
              onChange={(event) => setName(event.target.value)}
              autoComplete="off"
            />
            <Label htmlFor="kids-profile-level">{copy.chooseLevel}</Label>
            <select
              id="kids-profile-level"
              value={level}
              onChange={(event) => setLevel(event.target.value as KidsLevelId)}
              className="min-h-11 w-full rounded-md border border-input bg-background px-3"
            >
              {KIDS_LEVELS.map((item, index) => (
                <option key={item.id} value={item.id}>
                  {copy.level} {index + 1} · {item.ages}
                </option>
              ))}
            </select>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {copy.profileError}
              </p>
            )}
            <Button type="submit" disabled={saving || !name.trim()}>
              {copy.submit}
            </Button>
          </form>
        </div>
      )}
    </section>
  );
}
