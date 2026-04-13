import type { SupabaseClient } from "@supabase/supabase-js";
import { POKEMON_ROSTER } from "@/data/mock/pokemon";
import { STARTERS } from "@/data/mock/starters";
import { DAILY_BATTLE_TICKETS, EVENT_TIMEZONE_OFFSET_HOURS } from "@/lib/config/game";
import type { BattleMode, Rarity, StarterId, UserStatus } from "@/lib/types/domain";
import type { Database } from "@/lib/supabase/types";
import { getOrCreateSupabaseUserFromPrivy, type PrivyAuthContext } from "@/lib/privy/sync-user";

type DBClient = SupabaseClient<any>;
type UserRow = Database["public"]["Tables"]["users"]["Row"];
type UserPokemonRow = Database["public"]["Tables"]["user_pokemon"]["Row"];
type ConnectionRow = Database["public"]["Tables"]["connections"]["Row"];
type BattleRow = Database["public"]["Tables"]["battles"]["Row"];
type LeaderboardRow = Database["public"]["Views"]["leaderboard"]["Row"];

export interface UserProfile {
  id: string;
  displayName: string;
  personalCode: string;
  starterId: StarterId | null;
  coins: number;
  points: number;
  totalConnections: number;
  dailyTickets: number;
  lastTicketResetAt: string;
  status: UserStatus;
}

export interface UserPokemonRecord {
  id: string;
  userId: string;
  pokemonName: string;
  rarity: Rarity;
  type: "Fire" | "Water" | "Grass" | "Neutral";
  power: number;
  source: string;
  createdAt: string;
  rosterId: string | null;
}

function normalizeStarter(starter: string | null): StarterId | null {
  if (!starter) {
    return null;
  }
  const normalized = starter.toLowerCase() as StarterId;
  return STARTERS.some((item) => item.id === normalized) ? normalized : null;
}

function getEventDayKey(now: Date): string {
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const eventMs = utcMs + EVENT_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
  return new Date(eventMs).toISOString().slice(0, 10);
}

function toIsoOrEpoch(value: string | null): string {
  return value ?? new Date(0).toISOString();
}

function mapPokemonNameToRosterId(name: string): string | null {
  return POKEMON_ROSTER.find((item) => item.name.toLowerCase() === name.toLowerCase())?.id ?? null;
}

export async function getCurrentUser(
  client: DBClient,
  authContext?: PrivyAuthContext | null
): Promise<UserProfile | null> {
  if (!authContext) {
    return null;
  }
  const userId = await getOrCreateSupabaseUserFromPrivy(client, authContext);
  if (!userId) {
    return null;
  }
  return getUserProfile(client, userId);
}

export async function getUserProfile(client: DBClient, userId: string): Promise<UserProfile | null> {
  const { data: user, error } = await client.from("users").select("*").eq("id", userId).maybeSingle();
  const userRow = user as UserRow | null;
  if (error || !userRow) {
    return null;
  }

  const { count } = await client
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("status", "valid")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  return {
    id: userRow.id,
    displayName: userRow.display_name,
    personalCode: userRow.personal_code,
    starterId: normalizeStarter(userRow.starter),
    coins: userRow.coins,
    points: userRow.points,
    totalConnections: count ?? 0,
    dailyTickets: userRow.daily_tickets,
    lastTicketResetAt: toIsoOrEpoch(userRow.last_ticket_reset_at),
    status: userRow.status
  };
}

export async function updateStarter(client: DBClient, userId: string, starterId: StarterId): Promise<boolean> {
  const { error } = await client.from("users").update({ starter: starterId }).eq("id", userId);
  return !error;
}

export async function ensureStarterPokemon(client: DBClient, userId: string, starterId: StarterId): Promise<boolean> {
  const starter = STARTERS.find((item) => item.id === starterId);
  if (!starter) {
    return false;
  }

  const { data: existing } = await client
    .from("user_pokemon")
    .select("id")
    .eq("user_id", userId)
    .eq("pokemon_name", starter.name)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    return true;
  }

  const inserted = await addUserPokemon(client, {
    userId,
    pokemonName: starter.name,
    rarity: "Common",
    type: starter.element,
    power: starter.power,
    source: "starter"
  });

  return !!inserted;
}

export async function getUserPokemon(client: DBClient, userId: string): Promise<UserPokemonRecord[]> {
  const { data, error } = await client
    .from("user_pokemon")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as UserPokemonRow[]).map((record) => ({
    id: record.id,
    userId: record.user_id,
    pokemonName: record.pokemon_name,
    rarity: record.rarity,
    type: record.type,
    power: record.power,
    source: record.source,
    createdAt: record.created_at,
    rosterId: mapPokemonNameToRosterId(record.pokemon_name)
  }));
}

export async function getRecentConnectionsForUser(
  client: DBClient,
  userId: string,
  limit = 6
): Promise<Array<{ id: string; userAId: string; userBId: string; createdAt: string }>> {
  const { data, error } = await client
    .from("connections")
    .select("id,user_a_id,user_b_id,created_at,status")
    .eq("status", "valid")
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as ConnectionRow[]).map((connection) => ({
    id: connection.id,
    userAId: connection.user_a_id,
    userBId: connection.user_b_id,
    createdAt: connection.created_at
  }));
}

export async function getLatestConnectionBetweenUsers(
  client: DBClient,
  userAId: string,
  userBId: string
): Promise<{ id: string; createdAt: string } | null> {
  const { data, error } = await client
    .from("connections")
    .select("id,created_at,status,user_a_id,user_b_id")
    .eq("status", "valid")
    .or(`and(user_a_id.eq.${userAId},user_b_id.eq.${userBId}),and(user_a_id.eq.${userBId},user_b_id.eq.${userAId})`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  const row = data as ConnectionRow;
  return { id: row.id, createdAt: row.created_at };
}

export async function hasValidConnectionBetweenUsers(
  client: DBClient,
  userAId: string,
  userBId: string
): Promise<boolean> {
  const latest = await getLatestConnectionBetweenUsers(client, userAId, userBId);
  return !!latest;
}

export async function createConnection(
  client: DBClient,
  userAId: string,
  userBId: string,
  coinsAwarded: number,
  pointsAwarded: number
): Promise<boolean> {
  const { error } = await client.from("connections").insert({
    user_a_id: userAId,
    user_b_id: userBId,
    coins_awarded: coinsAwarded,
    points_awarded: pointsAwarded,
    status: "valid"
  });
  return !error;
}

export async function updateUserPointsAndCoins(
  client: DBClient,
  userId: string,
  pointsDelta: number,
  coinsDelta: number
): Promise<boolean> {
  const { data, error } = await client
    .from("users")
    .select("points,coins")
    .eq("id", userId)
    .maybeSingle();

  const row = data as Pick<UserRow, "points" | "coins"> | null;
  if (error || !row) {
    return false;
  }

  const { error: updateError } = await client
    .from("users")
    .update({ points: row.points + pointsDelta, coins: row.coins + coinsDelta })
    .eq("id", userId);

  return !updateError;
}

export async function getRemainingDailyTickets(client: DBClient, userId: string): Promise<number> {
  const { data } = await client.from("users").select("daily_tickets").eq("id", userId).maybeSingle();
  const row = data as Pick<UserRow, "daily_tickets"> | null;
  return row?.daily_tickets ?? 0;
}

export async function resetDailyTicketsIfNeeded(
  client: DBClient,
  userId: string,
  now: Date = new Date()
): Promise<number> {
  const { data } = await client
    .from("users")
    .select("daily_tickets,last_ticket_reset_at")
    .eq("id", userId)
    .maybeSingle();

  const row = data as Pick<UserRow, "daily_tickets" | "last_ticket_reset_at"> | null;
  if (!row) {
    return 0;
  }

  const lastReset = row.last_ticket_reset_at ? new Date(row.last_ticket_reset_at) : new Date(0);
  const isNewDay = getEventDayKey(lastReset) !== getEventDayKey(now);
  if (!isNewDay) {
    return row.daily_tickets;
  }

  await client
    .from("users")
    .update({
      daily_tickets: DAILY_BATTLE_TICKETS,
      last_ticket_reset_at: now.toISOString()
    })
    .eq("id", userId);

  return DAILY_BATTLE_TICKETS;
}

export async function consumeTicketIfNeeded(client: DBClient, userId: string): Promise<boolean> {
  const { data } = await client.from("users").select("daily_tickets").eq("id", userId).maybeSingle();
  const row = data as Pick<UserRow, "daily_tickets"> | null;
  if (!row || row.daily_tickets <= 0) {
    return false;
  }
  const { error } = await client.from("users").update({ daily_tickets: row.daily_tickets - 1 }).eq("id", userId);
  return !error;
}

export async function hasConnectedBattleTodayForPair(
  client: DBClient,
  userAId: string,
  userBId: string,
  eventDayKey: string
): Promise<boolean> {
  const { data } = await client
    .from("battles")
    .select("id,battle_mode,event_day_key,player_a_id,player_b_id")
    .eq("battle_mode", "connected")
    .eq("event_day_key", eventDayKey)
    .or(`and(player_a_id.eq.${userAId},player_b_id.eq.${userBId}),and(player_a_id.eq.${userBId},player_b_id.eq.${userAId})`)
    .limit(1);

  return !!(data && data.length > 0);
}

export async function createBattle(
  client: DBClient,
  payload: {
    playerAId: string;
    playerBId: string;
    playerAPokemonId: string;
    playerBPokemonId: string;
    winnerUserId: string | null;
    playerAPointsDelta: number;
    playerBPointsDelta: number;
    ranked: boolean;
    battleMode: BattleMode;
    eventDayKey: string;
  }
): Promise<boolean> {
  const { error } = await client.from("battles").insert({
    player_a_id: payload.playerAId,
    player_b_id: payload.playerBId,
    player_a_pokemon_id: payload.playerAPokemonId,
    player_b_pokemon_id: payload.playerBPokemonId,
    winner_user_id: payload.winnerUserId,
    player_a_points_delta: payload.playerAPointsDelta,
    player_b_points_delta: payload.playerBPointsDelta,
    ranked: payload.ranked,
    battle_mode: payload.battleMode,
    event_day_key: payload.eventDayKey
  });

  return !error;
}

export async function getBattleHistoryForUser(
  client: DBClient,
  userId: string,
  limit = 8
): Promise<Database["public"]["Tables"]["battles"]["Row"][]> {
  const { data, error } = await client
    .from("battles")
    .select("*")
    .eq("player_a_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }
  return data as BattleRow[];
}

export async function getUsersForBattle(client: DBClient): Promise<Database["public"]["Tables"]["users"]["Row"][]> {
  const { data, error } = await client.from("users").select("*").order("created_at", { ascending: true });
  if (error || !data) {
    return [];
  }
  return data as UserRow[];
}

export async function getLeaderboard(client: DBClient): Promise<Database["public"]["Views"]["leaderboard"]["Row"][]> {
  const { data, error } = await client
    .from("leaderboard")
    .select("*")
    .order("points", { ascending: false });
  if (error || !data) {
    return [];
  }
  return data as LeaderboardRow[];
}

export async function addUserPokemon(
  client: DBClient,
  payload: {
    userId: string;
    pokemonName: string;
    rarity: Rarity;
    type: "Fire" | "Water" | "Grass" | "Neutral";
    power: number;
    source: string;
  }
): Promise<{ id: string } | null> {
  const { data, error } = await client
    .from("user_pokemon")
    .insert({
      user_id: payload.userId,
      pokemon_name: payload.pokemonName,
      rarity: payload.rarity,
      type: payload.type,
      power: payload.power,
      source: payload.source
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return null;
  }
  const row = data as { id: string };
  return { id: row.id };
}

export async function listUsersForAdmin(client: DBClient): Promise<
  Array<{
    id: string;
    displayName: string;
    personalCode: string;
    status: UserStatus;
    points: number;
    coins: number;
  }>
> {
  const { data, error } = await client
    .from("users")
    .select("id,display_name,personal_code,status,points,coins")
    .order("points", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as Array<Pick<UserRow, "id" | "display_name" | "personal_code" | "status" | "points" | "coins">>).map(
    (row) => ({
      id: row.id,
      displayName: row.display_name,
      personalCode: row.personal_code,
      status: row.status,
      points: row.points,
      coins: row.coins
    })
  );
}

export async function updateUserStatus(
  client: DBClient,
  userId: string,
  status: "active" | "flagged" | "blocked"
): Promise<boolean> {
  const { error } = await client.from("users").update({ status }).eq("id", userId);
  return !error;
}

export async function listConnectionsForAdmin(client: DBClient, limit = 100): Promise<
  Array<{
    id: string;
    userAId: string;
    userBId: string;
    coinsAwarded: number;
    pointsAwarded: number;
    status: "valid" | "invalidated";
    createdAt: string;
    invalidatedAt: string | null;
    invalidationReason: string | null;
  }>
> {
  const { data, error } = await client
    .from("connections")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as ConnectionRow[]).map((row) => ({
    id: row.id,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    coinsAwarded: row.coins_awarded,
    pointsAwarded: row.points_awarded,
    status: row.status,
    createdAt: row.created_at,
    invalidatedAt: row.invalidated_at,
    invalidationReason: row.invalidation_reason
  }));
}

export async function invalidateConnection(
  client: DBClient,
  connectionId: string,
  reason = "manual_moderation"
): Promise<{ ok: boolean; message: string }> {
  const { data, error } = await client
    .from("connections")
    .select("id,user_a_id,user_b_id,coins_awarded,points_awarded,status")
    .eq("id", connectionId)
    .maybeSingle();

  const connection = data as
    | Pick<ConnectionRow, "id" | "user_a_id" | "user_b_id" | "coins_awarded" | "points_awarded" | "status">
    | null;

  if (error || !connection) {
    return { ok: false, message: "Connection not found." };
  }

  if (connection.status === "invalidated") {
    return { ok: false, message: "Connection already invalidated." };
  }

  const { error: invalidateError } = await client
    .from("connections")
    .update({
      status: "invalidated",
      invalidated_at: new Date().toISOString(),
      invalidation_reason: reason
    })
    .eq("id", connection.id)
    .eq("status", "valid");

  if (invalidateError) {
    return { ok: false, message: "Failed to invalidate connection." };
  }

  const { data: usersData, error: usersError } = await client
    .from("users")
    .select("id,coins,points")
    .in("id", [connection.user_a_id, connection.user_b_id]);

  if (usersError || !usersData) {
    return { ok: false, message: "Failed to load users for reversal." };
  }

  const users = usersData as Array<Pick<UserRow, "id" | "coins" | "points">>;
  const userA = users.find((user) => user.id === connection.user_a_id);
  const userB = users.find((user) => user.id === connection.user_b_id);

  if (!userA || !userB) {
    return { ok: false, message: "Affected users not found." };
  }

  const updates = [
    {
      id: userA.id,
      coins: Math.max(0, userA.coins - connection.coins_awarded),
      points: Math.max(0, userA.points - connection.points_awarded)
    },
    {
      id: userB.id,
      coins: Math.max(0, userB.coins - connection.coins_awarded),
      points: Math.max(0, userB.points - connection.points_awarded)
    }
  ];

  const [aUpdate, bUpdate] = await Promise.all(
    updates.map((update) =>
      client.from("users").update({ coins: update.coins, points: update.points }).eq("id", update.id)
    )
  );

  if (aUpdate.error || bUpdate.error) {
    return { ok: false, message: "Connection invalidated, but reversal update failed." };
  }

  return { ok: true, message: "Connection invalidated and totals reversed." };
}
