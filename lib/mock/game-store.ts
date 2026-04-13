import { MOCK_BATTLES } from "@/data/mock/battles";
import { MOCK_CONNECTIONS } from "@/data/mock/connections";
import { MOCK_PULL_RESULTS } from "@/data/mock/pulls";
import { MOCK_USERS } from "@/data/mock/users";
import { DAILY_BATTLE_TICKETS } from "@/lib/config/game";
import type { Battle, Connection, PullResult, User } from "@/lib/types/domain";

const GAME_STORE_KEY = "pokemoncp2:game-state:v1";

export interface GameState {
  users: User[];
  connections: Connection[];
  pulls: PullResult[];
  battles: Battle[];
}

export function getDefaultGameState(): GameState {
  return {
    users: structuredClone(MOCK_USERS),
    connections: structuredClone(MOCK_CONNECTIONS),
    pulls: structuredClone(MOCK_PULL_RESULTS),
    battles: structuredClone(MOCK_BATTLES)
  };
}

export function loadGameState(): GameState {
  if (typeof window === "undefined") {
    return getDefaultGameState();
  }

  const stored = window.localStorage.getItem(GAME_STORE_KEY);
  if (!stored) {
    return getDefaultGameState();
  }

  try {
    const parsed = JSON.parse(stored) as Partial<GameState>;
    const parsedUsers = Array.isArray(parsed.users) ? parsed.users : structuredClone(MOCK_USERS);
    const normalizedUsers = parsedUsers.map((user) => {
      const typedUser = user as User;
      return {
        ...typedUser,
        dailyTickets:
          typeof typedUser.dailyTickets === "number" ? typedUser.dailyTickets : DAILY_BATTLE_TICKETS,
        lastTicketResetAt:
          typeof typedUser.lastTicketResetAt === "string"
            ? typedUser.lastTicketResetAt
            : new Date(0).toISOString()
      };
    });

    return {
      users: normalizedUsers,
      connections: Array.isArray(parsed.connections) ? parsed.connections : structuredClone(MOCK_CONNECTIONS),
      pulls: Array.isArray(parsed.pulls) ? parsed.pulls : structuredClone(MOCK_PULL_RESULTS),
      battles: Array.isArray(parsed.battles) ? parsed.battles : structuredClone(MOCK_BATTLES)
    };
  } catch {
    return getDefaultGameState();
  }
}

export function persistGameState(state: GameState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(GAME_STORE_KEY, JSON.stringify(state));
}
