import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveCurrentUserId(client: SupabaseClient<any>): Promise<string | null> {
  const envUserId = process.env.NEXT_PUBLIC_DEV_USER_ID ?? process.env.DEV_USER_ID;
  if (envUserId) {
    const { data } = await client.from("users").select("id").eq("id", envUserId).maybeSingle();
    const row = data as { id: string } | null;
    if (row?.id) {
      return row.id;
    }
  }

  const { data } = await client
    .from("users")
    .select("id")
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const fallback = data as { id: string } | null;
  return fallback?.id ?? null;
}
