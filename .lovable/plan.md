# Preflight result: academic-assistant (read-only, nothing changed)

1. Backend project ref: `abyqqeboyrkkwhjpwmtd`. The same value appears in `supabase/config.toml` and in `.env` (VITE_SUPABASE_PROJECT_ID).
2. Restriction on new Edge Functions: this is a real, current instruction for this project. The verbatim text is: "This narrows the TanStack no-new-Edge-Functions rule: maintain existing Edge Functions only; never create a new one. Put new app-internal logic in `createServerFn` and new HTTP endpoints in TanStack server routes. Existing Edge Functions continue to deploy automatically while they remain in the project." It also says: "App-internal logic uses createServerFn ... Do NOT use Supabase Edge Functions."
3. Deploy capability: the deploy tool exists and is technically available. Under the instruction above, though, I cannot create or deploy `academic-assistant` as a new function, even after its code is merged. Only `academic-stripe-checkout` exists today with an `academic-` prefix.
4. Supported path: implement the same logic as a `createServerFn` or a TanStack server route. It would ship with the website when the owner publishes.
5. Secrets (names only): `OPENAI_API_KEY` is present. `LOVABLE_API_KEY` is present and managed by the platform. Both can be read on the server only. Project memory restricts AI calls to the google/gemini model family unless the owner overrides it.

No action pending. Approving this plan does not trigger any deployment.
