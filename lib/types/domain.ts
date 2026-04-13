export type ElementType = "Fire" | "Water" | "Grass" | "Neutral";
export type Rarity = "Common" | "Rare" | "Epic";
export type UserStatus = "active" | "flagged" | "blocked" | "invalidated";
export type StarterId = "charmander" | "piplup" | "treecko";
export type ConnectionStatus = "valid" | "invalidated";
export type BattleMode = "connected" | "ticket";

export interface Starter {
  id: StarterId;
  name: "Charmander" | "Piplup" | "Treecko";
  element: "Fire" | "Water" | "Grass";
  power: number;
}

export interface Pokemon {
  id: string;
  name: string;
  rarity: Rarity;
  element: ElementType;
  power: number;
}

export interface User {
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
  collectionPokemonIds: string[];
}

export interface Connection {
  id: string;
  userAId: string;
  userBId: string;
  connectedAt: string;
  status: ConnectionStatus;
}

export interface PullResult {
  id: string;
  userId: string;
  pokemonId: string;
  rarity: Rarity;
  isNewUnlock: boolean;
  bonusPointsAwarded: number;
  costCoins: number;
  pulledAt: string;
}

export interface Battle {
  id: string;
  mode: BattleMode;
  eventDayKey: string;
  challengerUserId: string;
  opponentUserId: string;
  challengerPokemonId: string;
  opponentPokemonId: string;
  challengerWinChance: number;
  winnerUserId: string | null;
  pointsAwardedToChallenger: number;
  rankedRewardApplied: boolean;
  playedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  points: number;
  totalConnections: number;
  status: UserStatus;
}
