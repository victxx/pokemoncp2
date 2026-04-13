import { POKEMON_ROSTER } from "@/data/mock/pokemon";
import { DEFAULT_PULL_COST_COINS } from "@/lib/config/game";
import type { PullResult } from "@/lib/types/domain";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { addUserPokemon, getUserPokemon, updateUserPointsAndCoins } from "@/lib/supabase/repositories";
import {
  getNewUnlockBonusPoints,
  getPokemonByRarity,
  pickRandomPokemon,
  rollRarity,
  validateRates
} from "@/lib/pulls/utils";

type PullAttemptType = "success" | "insufficient_coins" | "error";

export interface PullAttemptResult {
  type: PullAttemptType;
  message: string;
  pullResult: PullResult | null;
}

export async function attemptPokemonPull(
  currentUserId: string,
  now: Date = new Date()
): Promise<PullAttemptResult> {
  const client = getSupabaseBrowserClient();
  const { data: currentUser } = await client
    .from("users")
    .select("id,coins")
    .eq("id", currentUserId)
    .maybeSingle();
  const currentUserRow = currentUser as { id: string; coins: number } | null;

  if (!currentUserRow) {
    return { type: "error", message: "Current user not found.", pullResult: null };
  }

  if (!validateRates()) {
    return { type: "error", message: "Invalid rarity rates configuration.", pullResult: null };
  }

  if (currentUserRow.coins < DEFAULT_PULL_COST_COINS) {
    return {
      type: "insufficient_coins",
      message: `Not enough coins. You need ${DEFAULT_PULL_COST_COINS} coins.`,
      pullResult: null
    };
  }

  const rolledRarity = rollRarity();
  const rarityPool = getPokemonByRarity(POKEMON_ROSTER, rolledRarity);
  if (rarityPool.length === 0) {
    return { type: "error", message: "No Pokemon available for this rarity.", pullResult: null };
  }

  const pulledPokemon = pickRandomPokemon(rarityPool);
  const ownedPokemon = await getUserPokemon(client, currentUserId);
  const isNewUnlock = !ownedPokemon.some(
    (pokemon) => pokemon.pokemonName.toLowerCase() === pulledPokemon.name.toLowerCase()
  );
  const bonusPoints = isNewUnlock ? getNewUnlockBonusPoints(pulledPokemon.rarity) : 0;

  const newPull: PullResult = {
    id: `p_${now.getTime()}`,
    userId: currentUserRow.id,
    pokemonId: pulledPokemon.id,
    rarity: pulledPokemon.rarity,
    isNewUnlock,
    bonusPointsAwarded: bonusPoints,
    costCoins: DEFAULT_PULL_COST_COINS,
    pulledAt: now.toISOString()
  };

  await updateUserPointsAndCoins(client, currentUserId, bonusPoints, -DEFAULT_PULL_COST_COINS);
  await addUserPokemon(client, {
    userId: currentUserId,
    pokemonName: pulledPokemon.name,
    rarity: pulledPokemon.rarity,
    type: pulledPokemon.element,
    power: pulledPokemon.power,
    source: "pull"
  });

  const message = isNewUnlock
    ? `You pulled ${pulledPokemon.name} (${pulledPokemon.rarity})! New unlock: +${bonusPoints} points.`
    : `You pulled ${pulledPokemon.name} (${pulledPokemon.rarity}). Duplicate collected.`;

  return {
    type: "success",
    message,
    pullResult: newPull
  };
}
