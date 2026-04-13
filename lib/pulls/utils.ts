import {
  PULL_COMMON_RATE,
  PULL_EPIC_RATE,
  PULL_RARE_RATE
} from "@/lib/config/game";
import type { Pokemon, Rarity } from "@/lib/types/domain";

export function rollRarity(randomValue: number = Math.random()): Rarity {
  if (randomValue < PULL_COMMON_RATE) {
    return "Common";
  }

  if (randomValue < PULL_COMMON_RATE + PULL_RARE_RATE) {
    return "Rare";
  }

  return "Epic";
}

export function getPokemonByRarity(roster: Pokemon[], rarity: Rarity): Pokemon[] {
  return roster.filter((pokemon) => pokemon.rarity === rarity);
}

export function pickRandomPokemon(candidates: Pokemon[], randomValue: number = Math.random()): Pokemon {
  const index = Math.floor(randomValue * candidates.length);
  return candidates[Math.min(index, candidates.length - 1)];
}

export function getNewUnlockBonusPoints(rarity: Rarity): number {
  if (rarity === "Common") {
    return 10;
  }
  if (rarity === "Rare") {
    return 20;
  }
  return 40;
}

export function validateRates(): boolean {
  const total = PULL_COMMON_RATE + PULL_RARE_RATE + PULL_EPIC_RATE;
  return Math.abs(total - 1) < 0.0001;
}
