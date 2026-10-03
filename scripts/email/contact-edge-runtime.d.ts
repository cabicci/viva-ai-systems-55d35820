/** Narrow host interfaces for checking the authored Deno entrypoints in CI. */
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
declare module "npm:@supabase/supabase-js@2.105.4" {
  export const createClient: typeof import("@supabase/supabase-js").createClient;
}
