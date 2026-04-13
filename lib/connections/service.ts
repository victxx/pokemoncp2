import { CONNECTION_REWARD_COINS, CONNECTION_REWARD_POINTS } from "@/lib/config/game";
import { formatRemainingTime, getCooldownRemainingMs } from "@/lib/connections/utils";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  createConnection,
  getLatestConnectionBetweenUsers,
  updateUserPointsAndCoins
} from "@/lib/supabase/repositories";

type ConnectionAttemptType =
  | "success"
  | "invalid_code"
  | "self_code"
  | "cooldown_blocked";

export interface ConnectionAttemptResult {
  type: ConnectionAttemptType;
  message: string;
}

export function attemptConnectionByCode(
  currentUserId: string,
  enteredCode: string,
  now: Date = new Date()
): Promise<ConnectionAttemptResult> {
  const client = getSupabaseBrowserClient();
  return attemptConnectionByCodeWithClient(client, currentUserId, enteredCode, now);
}

export async function attemptConnectionByCodeWithClient(
  client: ReturnType<typeof getSupabaseBrowserClient>,
  currentUserId: string,
  enteredCode: string,
  now: Date = new Date()
): Promise<ConnectionAttemptResult> {
  const normalizedCode = enteredCode.trim().toUpperCase();
  const { data: currentUser } = await client
    .from("users")
    .select("id,status")
    .eq("id", currentUserId)
    .maybeSingle();
  const currentUserRow = currentUser as { id: string; status: string } | null;

  if (!currentUserRow) {
    return { type: "invalid_code", message: "Current user not found." };
  }

  const { data: targetUser } = await client
    .from("users")
    .select("id,display_name,personal_code,status")
    .eq("personal_code", normalizedCode)
    .maybeSingle();
  const targetUserRow = targetUser as { id: string; display_name: string } | null;

  if (!targetUserRow) {
    return { type: "invalid_code", message: "Code not found. Try another one." };
  }

  if (targetUserRow.id === currentUserId) {
    return { type: "self_code", message: "You cannot connect with your own code." };
  }

  const latestPairConnection = await getLatestConnectionBetweenUsers(client, currentUserId, targetUserRow.id);
  if (latestPairConnection) {
    const remainingMs = getCooldownRemainingMs(latestPairConnection.createdAt, now);
    if (remainingMs > 0) {
      return {
        type: "cooldown_blocked",
        message: `Cooldown active. Try again in ${formatRemainingTime(remainingMs)}.`
      };
    }
  }

  const connectionCreated = await createConnection(
    client,
    currentUserId,
    targetUserRow.id,
    CONNECTION_REWARD_COINS,
    CONNECTION_REWARD_POINTS
  );
  if (!connectionCreated) {
    return { type: "invalid_code", message: "Failed to create connection. Please try again." };
  }

  await Promise.all([
    updateUserPointsAndCoins(client, currentUserId, CONNECTION_REWARD_POINTS, CONNECTION_REWARD_COINS),
    updateUserPointsAndCoins(client, targetUserRow.id, CONNECTION_REWARD_POINTS, CONNECTION_REWARD_COINS)
  ]);

  return {
    type: "success",
    message: `Connected with ${targetUserRow.display_name}. +${CONNECTION_REWARD_COINS} coins, +${CONNECTION_REWARD_POINTS} points.`
  };
}
