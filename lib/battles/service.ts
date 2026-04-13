import {
  CONNECTED_BATTLE_LOSE_POINTS,
  CONNECTED_BATTLE_PLAY_POINTS,
  CONNECTED_BATTLE_WIN_POINTS,
  EVENT_TIMEZONE_OFFSET_HOURS,
  TICKET_BATTLE_LOSE_POINTS,
  TICKET_BATTLE_PLAY_POINTS,
  TICKET_BATTLE_WIN_POINTS
} from "@/lib/config/game";
import { calculateWinChance } from "@/lib/battles/probability";
import { formatRemainingCooldown, getRestingStatuses } from "@/lib/battles/resting";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  consumeTicketIfNeeded,
  createBattle,
  getBattleHistoryForUser,
  getUserPokemon,
  hasConnectedBattleTodayForPair,
  hasValidConnectionBetweenUsers,
  resetDailyTicketsIfNeeded,
  updateUserPointsAndCoins
} from "@/lib/supabase/repositories";
import type { Battle, BattleMode, Pokemon } from "@/lib/types/domain";

const HOUR_MS = 60 * 60 * 1000;

export interface BattleResult {
  battle: Battle | null;
  message: string;
  reveal?: {
    challengerPokemonName: string;
    opponentPokemonName: string;
    challengerWinChance: number;
    opponentWinChance: number;
    roll: number;
    didChallengerWin: boolean;
  };
}

function shiftToEventTimezone(date: Date): Date {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
  const eventMs = utcMs + EVENT_TIMEZONE_OFFSET_HOURS * HOUR_MS;
  return new Date(eventMs);
}

function getEventDayKey(date: Date): string {
  const shifted = shiftToEventTimezone(date);
  return shifted.toISOString().slice(0, 10);
}

function getModePoints(mode: BattleMode, didChallengerWin: boolean): number {
  if (mode === "connected") {
    return didChallengerWin
      ? CONNECTED_BATTLE_PLAY_POINTS + CONNECTED_BATTLE_WIN_POINTS
      : CONNECTED_BATTLE_PLAY_POINTS + CONNECTED_BATTLE_LOSE_POINTS;
  }

  return didChallengerWin
    ? TICKET_BATTLE_PLAY_POINTS + TICKET_BATTLE_WIN_POINTS
    : TICKET_BATTLE_PLAY_POINTS + TICKET_BATTLE_LOSE_POINTS;
}

function pickRandomOpponentPokemon(candidates: Pokemon[]): Pokemon | null {
  if (candidates.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex];
}

export function runInstantBattle(
  challengerUserId: string,
  challengerPokemonRecordId: string,
  opponentUserId: string,
  mode: BattleMode,
  now: Date = new Date()
): Promise<BattleResult> {
  const client = getSupabaseBrowserClient();
  return runInstantBattleWithClient(client, challengerUserId, challengerPokemonRecordId, opponentUserId, mode, now);
}

export async function runInstantBattleWithClient(
  client: ReturnType<typeof getSupabaseBrowserClient>,
  challengerUserId: string,
  challengerPokemonRecordId: string,
  opponentUserId: string,
  mode: BattleMode,
  now: Date = new Date()
): Promise<BattleResult> {
  const eventDayKey = getEventDayKey(now);
  const [challengerPokemonRows, opponentPokemonRows] = await Promise.all([
    getUserPokemon(client, challengerUserId),
    getUserPokemon(client, opponentUserId)
  ]);

  if (challengerPokemonRows.length === 0 || opponentPokemonRows.length === 0) {
    return { battle: null, message: "Invalid battle players." };
  }

  const challengerPokemonRow = challengerPokemonRows.find((row) => row.id === challengerPokemonRecordId);
  const challengerPokemon = challengerPokemonRow
    ? {
        id: challengerPokemonRow.id,
        name: challengerPokemonRow.pokemonName,
        rarity: challengerPokemonRow.rarity,
        element: challengerPokemonRow.type,
        power: challengerPokemonRow.power
      }
    : null;

  if (!challengerPokemon) {
    return {
      battle: null,
      message: "Choose one unlocked Pokemon first."
    };
  }

  if (mode === "connected") {
    const hasConnection = await hasValidConnectionBetweenUsers(client, challengerUserId, opponentUserId);
    if (!hasConnection) {
      return {
        battle: null,
        message: "Connected battle requires a prior connection with this player."
      };
    }

    const alreadyUsedToday = await hasConnectedBattleTodayForPair(
      client,
      challengerUserId,
      opponentUserId,
      eventDayKey
    );
    if (alreadyUsedToday) {
      return {
        battle: null,
        message: "Connected battle already used today for this pair."
      };
    }
  }

  const remainingTickets = await resetDailyTicketsIfNeeded(client, challengerUserId, now);
  if (mode === "ticket" && remainingTickets <= 0) {
    return {
      battle: null,
      message: "No tickets left today."
    };
  }

  if (challengerPokemonRows.length > 1) {
    const challengerHistoryRows = await getBattleHistoryForUser(client, challengerUserId, 100);
    const normalizedHistory: Battle[] = challengerHistoryRows.map((row) => ({
      id: row.id,
      mode: row.battle_mode,
      eventDayKey: row.event_day_key,
      challengerUserId: row.player_a_id,
      opponentUserId: row.player_b_id,
      challengerPokemonId: row.player_a_pokemon_id,
      opponentPokemonId: row.player_b_pokemon_id,
      challengerWinChance: 50,
      winnerUserId: row.winner_user_id,
      pointsAwardedToChallenger: row.player_a_points_delta,
      rankedRewardApplied: row.ranked,
      playedAt: row.created_at
    }));

    const statuses = getRestingStatuses(
      normalizedHistory,
      challengerUserId,
      challengerPokemonRows.map((row) => row.id),
      now
    );
    const selectedStatus = statuses.find((status) => status.pokemonId === challengerPokemonRecordId);
    if (selectedStatus?.isResting) {
      return {
        battle: null,
        message: `This Pokemon is resting. Try again in ${formatRemainingCooldown(selectedStatus.remainingMs)}.`
      };
    }
  }

  const opponentCandidates: Pokemon[] = opponentPokemonRows.map((row) => ({
    id: row.id,
    name: row.pokemonName,
    rarity: row.rarity,
    element: row.type,
    power: row.power
  }));
  const opponentPokemon = pickRandomOpponentPokemon(opponentCandidates);
  if (!opponentPokemon) {
    return {
      battle: null,
      message: "Opponent has no available Pokemon."
    };
  }

  const winChance = calculateWinChance(challengerPokemon, opponentPokemon);
  const roll = Math.random();
  const didChallengerWin = roll < winChance;
  const winnerUserId = didChallengerWin ? challengerUserId : opponentUserId;
  const pointsAwarded = getModePoints(mode, didChallengerWin);

  const battleInserted = await createBattle(client, {
    playerAId: challengerUserId,
    playerBId: opponentUserId,
    playerAPokemonId: challengerPokemon.id,
    playerBPokemonId: opponentPokemon.id,
    winnerUserId,
    playerAPointsDelta: pointsAwarded,
    playerBPointsDelta: 0,
    ranked: mode === "connected",
    battleMode: mode,
    eventDayKey
  });

  if (!battleInserted) {
    return {
      battle: null,
      message: "Failed to save battle."
    };
  }

  await updateUserPointsAndCoins(client, challengerUserId, pointsAwarded, 0);
  if (mode === "ticket") {
    await consumeTicketIfNeeded(client, challengerUserId);
  }

  return {
    battle: {
      id: `local_${Date.now()}`,
      mode,
      eventDayKey,
      challengerUserId,
      opponentUserId,
      challengerPokemonId: challengerPokemon.id,
      opponentPokemonId: opponentPokemon.id,
      challengerWinChance: Math.round(winChance * 100),
      winnerUserId,
      pointsAwardedToChallenger: pointsAwarded,
      rankedRewardApplied: mode === "connected",
      playedAt: now.toISOString()
    },
    reveal: {
      challengerPokemonName: challengerPokemon.name,
      opponentPokemonName: opponentPokemon.name,
      challengerWinChance: Math.round(winChance * 100),
      opponentWinChance: Math.round((1 - winChance) * 100),
      roll: Math.round(roll * 100),
      didChallengerWin
    },
    message: didChallengerWin
      ? `You won! +${pointsAwarded} points.`
      : `You lost. +${pointsAwarded} points.`
  };
}
