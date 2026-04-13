import { POKEMON_BATTLE_COOLDOWN_HOURS } from "@/lib/config/game";
import type { Battle } from "@/lib/types/domain";

const HOUR_MS = 60 * 60 * 1000;

function getPokemonCooldownRemainingMs(
  battles: Battle[],
  challengerUserId: string,
  challengerPokemonId: string,
  now: Date
): number {
  const latestBattleWithPokemon = battles
    .filter(
      (battle) =>
        battle.challengerUserId === challengerUserId && battle.challengerPokemonId === challengerPokemonId
    )
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())[0];

  if (!latestBattleWithPokemon) {
    return 0;
  }

  const elapsedMs = now.getTime() - new Date(latestBattleWithPokemon.playedAt).getTime();
  const cooldownMs = POKEMON_BATTLE_COOLDOWN_HOURS * HOUR_MS;
  return Math.max(cooldownMs - elapsedMs, 0);
}

export interface RestingStatus {
  pokemonId: string;
  remainingMs: number;
  isResting: boolean;
  isActive: boolean;
}

export function getRestingStatuses(
  battles: Battle[],
  challengerUserId: string,
  pokemonIds: string[],
  now: Date
): RestingStatus[] {
  const statuses = pokemonIds.map((pokemonId) => {
    const remainingMs = getPokemonCooldownRemainingMs(battles, challengerUserId, pokemonId, now);
    return {
      pokemonId,
      remainingMs,
      isResting: remainingMs > 0,
      isActive: remainingMs <= 0
    };
  });

  const allResting = statuses.length > 0 && statuses.every((status) => status.isResting);
  if (!allResting) {
    return statuses;
  }

  // Fallback rule: when all are resting, the closest-to-ready becomes active.
  const fallback = [...statuses].sort((a, b) => a.remainingMs - b.remainingMs)[0];
  return statuses.map((status) =>
    status.pokemonId === fallback.pokemonId
      ? { ...status, isResting: false, isActive: true }
      : status
  );
}

export function formatRemainingCooldown(ms: number): string {
  const totalMinutes = Math.ceil(ms / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}
