import type { User } from "@/lib/types/domain";

export const MOCK_USERS: User[] = [
  {
    id: "u1",
    displayName: "Alex",
    personalCode: "ALEX01",
    starterId: "charmander",
    coins: 40,
    points: 120,
    totalConnections: 6,
    dailyTickets: 5,
    lastTicketResetAt: "2026-01-01T00:00:00.000Z",
    status: "active",
    collectionPokemonIds: ["wingull", "staryu"]
  },
  {
    id: "u2",
    displayName: "Nina",
    personalCode: "NINA02",
    starterId: "piplup",
    coins: 55,
    points: 150,
    totalConnections: 8,
    dailyTickets: 5,
    lastTicketResetAt: "2026-01-01T00:00:00.000Z",
    status: "active",
    collectionPokemonIds: ["marill", "altaria"]
  },
  {
    id: "u3",
    displayName: "Jo",
    personalCode: "JO03",
    starterId: "treecko",
    coins: 20,
    points: 80,
    totalConnections: 4,
    dailyTickets: 5,
    lastTicketResetAt: "2026-01-01T00:00:00.000Z",
    status: "flagged",
    collectionPokemonIds: ["hoppip"]
  }
];
