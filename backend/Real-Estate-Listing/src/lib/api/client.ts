import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/client";

/**
 * Browser Supabase client used by every service in this folder.
 * Row-level security decides what the signed-in admin may read or write.
 *
 * The generated `Database` types describe most tables as
 * `Record<string, unknown>`, which supabase-js narrows to `never` for inserts
 * and updates. Services therefore talk to an untyped client and cast rows to
 * the domain types in `@/types` at the boundary, so every exported service
 * function still has a precise signature.
 */
export function getSupabase(): SupabaseClient {
  return createClient() as unknown as SupabaseClient;
}

/**
 * Turns a PostgrestError into a message that is safe to show in a toast.
 */
export function throwOnError(
  error: PostgrestError | null,
  action: string
): void {
  if (!error) return;

  switch (error.code) {
    case "23505":
      throw new Error(`${action} failed: that value is already taken.`);
    case "23503":
      throw new Error(`${action} failed: a linked record no longer exists.`);
    case "23514":
      throw new Error(`${action} failed: a value is outside the allowed range.`);
    case "42501":
    case "PGRST301":
      throw new Error(
        `${action} failed: your account does not have permission. Ask a super admin to activate it.`
      );
    default:
      throw new Error(error.message || `${action} failed.`);
  }
}

/**
 * Strips empty strings down to null so optional columns stay NULL instead of "".
 */
export function nullifyEmpty<T extends Record<string, unknown>>(
  input: T
): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    output[key] = value === "" || value === undefined ? null : value;
  }
  return output;
}

/**
 * Escapes characters that would otherwise break a PostgREST `or` filter.
 */
export function sanitizeSearch(term: string): string {
  return term.replace(/[,%()]/g, " ").trim();
}
