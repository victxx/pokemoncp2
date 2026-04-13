import type { ElementType, Pokemon, Rarity } from "@/lib/types/domain";

function rarityScore(rarity: Rarity): number {
  if (rarity === "Common") {
    return 1;
  }
  if (rarity === "Rare") {
    return 2;
  }
  return 3;
}

function hasTypeAdvantage(attacker: ElementType, defender: ElementType): boolean {
  return (
    (attacker === "Fire" && defender === "Grass") ||
    (attacker === "Grass" && defender === "Water") ||
    (attacker === "Water" && defender === "Fire")
  );
}

export function calculateWinChance(challenger: Pokemon, opponent: Pokemon): number {
  // Roulette-style weighted chance with simple, explicit knobs.
  let chance = 0.5;

  if (hasTypeAdvantage(challenger.element, opponent.element)) {
    chance += 0.1;
  } else if (hasTypeAdvantage(opponent.element, challenger.element)) {
    chance -= 0.1;
  }

  const rarityGap = rarityScore(challenger.rarity) - rarityScore(opponent.rarity);
  if (rarityGap >= 2) {
    chance += 0.1;
  } else if (rarityGap === 1) {
    chance += 0.05;
  } else if (rarityGap <= -2) {
    chance -= 0.1;
  } else if (rarityGap === -1) {
    chance -= 0.05;
  }

  const powerGap = challenger.power - opponent.power;
  if (powerGap >= 2) {
    chance += 0.05;
  } else if (powerGap <= -2) {
    chance -= 0.05;
  }

  return Math.max(0.3, Math.min(0.7, chance));
}
