import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

function isProbablySupabasePublicKey(value: string | undefined): value is string {
  if (!value) {
    return false;
  }
  return value.startsWith("sb_publishable_") || value.split(".").length === 3;
}

export function getSupabaseBrowserClient() {
  if (browserClient) {
    return browserClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const anonFallbackKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const anonKey = isProbablySupabasePublicKey(publishableKey)
    ? publishableKey
    : isProbablySupabasePublicKey(anonFallbackKey)
      ? anonFallbackKey
      : undefined;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  browserClient = createClient<Database>(url, anonKey);
  return browserClient;
}
