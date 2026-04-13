import type { SupabaseClient } from "@supabase/supabase-js";

export interface PrivyAuthContext {
  privyUserId: string;
  walletAddress: string | null;
  displayName: string | null;
}

function sanitizeName(input: string): string {
  const value = input.trim();
  return value.length > 0 ? value : "Trainer";
}

function buildCodeBase(name: string): string {
  const normalized = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const base = normalized.slice(0, 6);
  return base.padEnd(6, "X");
}

async function generateUniquePersonalCode(client: SupabaseClient<any>, displayName: string): Promise<string> {
  const base = buildCodeBase(displayName);
  for (let i = 0; i < 1000; i += 1) {
    const suffix = String(i).padStart(3, "0");
    const candidate = `${base}${suffix}`;
    const { data } = await client.from("users").select("id").eq("personal_code", candidate).maybeSingle();
    if (!data) {
      return candidate;
    }
  }
  return `${base}${Date.now().toString().slice(-3)}`;
}

export async function getOrCreateSupabaseUserFromPrivy(
  client: SupabaseClient<any>,
  auth: PrivyAuthContext
): Promise<string | null> {
  const { data: existingUser } = await client
    .from("users")
    .select("id,wallet_address,display_name")
    .eq("privy_user_id", auth.privyUserId)
    .maybeSingle();

  if (existingUser?.id) {
    const updates: Record<string, string> = {};
    if (auth.walletAddress && !existingUser.wallet_address) {
      updates.wallet_address = auth.walletAddress;
    }
    const shouldBackfillDisplayName =
      !existingUser.display_name || existingUser.display_name.startsWith("Trainer_");
    if (auth.displayName && shouldBackfillDisplayName) {
      updates.display_name = sanitizeName(auth.displayName);
    }
    if (Object.keys(updates).length > 0) {
      await client.from("users").update(updates).eq("id", existingUser.id);
    }
    return existingUser.id;
  }

  const fallbackName = sanitizeName(auth.displayName ?? `Trainer_${auth.privyUserId.slice(0, 6)}`);
  const personalCode = await generateUniquePersonalCode(client, fallbackName);

  const { data: inserted } = await client
    .from("users")
    .insert({
      privy_user_id: auth.privyUserId,
      wallet_address: auth.walletAddress,
      display_name: fallbackName,
      personal_code: personalCode,
      starter: null,
      coins: 0,
      points: 0,
      status: "active",
      daily_tickets: 5,
      last_ticket_reset_at: new Date().toISOString()
    })
    .select("id")
    .maybeSingle();

  return inserted?.id ?? null;
}

export function getPrivyAuthContext(user: any): PrivyAuthContext | null {
  if (!user?.id) {
    return null;
  }

  const walletAddress =
    user?.wallet?.address ??
    user?.linkedAccounts?.find((account: any) => account?.type === "wallet")?.address ??
    null;

  const displayName =
    user?.google?.name ??
    user?.email?.address?.split("@")?.[0] ??
    user?.wallet?.address?.slice(0, 10) ??
    null;

  return {
    privyUserId: user.id,
    walletAddress,
    displayName
  };
}
