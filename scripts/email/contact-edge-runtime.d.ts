/** Narrow host interfaces for checking the authored Deno entrypoints in CI. */
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
declare module "npm:@supabase/supabase-js@2.105.4" {
  export function createClient(
    url: string,
    key: string,
    options: { auth: { persistSession: boolean; autoRefreshToken: boolean } },
  ): {
    rpc(
      name: string,
      args?: Record<string, unknown>,
    ): PromiseLike<{ data: unknown; error: unknown }>;
  };
}
