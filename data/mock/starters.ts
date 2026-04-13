import { STARTER_POWER } from "@/lib/config/game";
import type { Starter } from "@/lib/types/domain";

export const STARTERS: Starter[] = [
  { id: "charmander", name: "Charmander", element: "Fire", power: STARTER_POWER },
  { id: "piplup", name: "Piplup", element: "Water", power: STARTER_POWER },
  { id: "treecko", name: "Treecko", element: "Grass", power: STARTER_POWER }
];
