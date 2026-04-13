import type { LeaderboardEntry } from "@/lib/types/domain";

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: "u2", displayName: "Nina", points: 150, totalConnections: 8, status: "active" },
  { rank: 2, userId: "u1", displayName: "Alex", points: 120, totalConnections: 6, status: "active" },
  { rank: 3, userId: "u3", displayName: "Jo", points: 80, totalConnections: 4, status: "flagged" }
];
