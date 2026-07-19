/**
 * Server-only request identity resolution for SSR admin route guards.
 * Accepts Authorization Bearer (server-fn RPC) or masaarat_access_token cookie
 * (document SSR). Always verifies via supabase.auth.getClaims — never trusts
 * client-supplied role claims.
 */
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { extractAccessTokenFromHeaders } from "@/lib/auth-access-token-cookie";

export type VerifiedRequestUser = {
  userId: string;
  supabase: ReturnType<typeof createClient<Database>>;
};

export async function resolveVerifiedRequestUser(): Promise<VerifiedRequestUser | null> {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Missing Supabase environment variable(s): SUPABASE_URL and/or SUPABASE_PUBLISHABLE_KEY",
    );
  }

  const request = getRequest();
  if (!request?.headers) {
    return null;
  }

  const token = extractAccessTokenFromHeaders(request.headers);
  if (!token) {
    return null;
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return null;
  }

  return {
    userId: data.claims.sub,
    supabase,
  };
}
