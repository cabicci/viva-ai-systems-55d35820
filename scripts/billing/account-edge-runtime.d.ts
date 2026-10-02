/** Use the installed SDK's real interface to check authored Edge entrypoints. */
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
declare module "npm:@supabase/supabase-js@2.105.4" {
  export const createClient: typeof import("@supabase/supabase-js").createClient;
}
