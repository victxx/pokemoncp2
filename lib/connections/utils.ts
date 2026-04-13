import { CONNECTION_COOLDOWN_HOURS } from "@/lib/config/game";
import type { Connection, User } from "@/lib/types/domain";

const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function findUserByCode(users: User[], code: string): User | undefined {
  const normalizedCode = normalizeCode(code);
  return users.find((user) => normalizeCode(user.personalCode) === normalizedCode);
}

export function buildPairKey(userAId: string, userBId: string): string {
  return [userAId, userBId].sort().join("::");
}

export function isPairMatch(connection: Connection, userAId: string, userBId: string): boolean {
  return buildPairKey(connection.userAId, connection.userBId) === buildPairKey(userAId, userBId);
}

export function getLatestValidPairConnection(
  connections: Connection[],
  userAId: string,
  userBId: string
): Connection | undefined {
  return connections
    .filter((connection) => connection.status === "valid" && isPairMatch(connection, userAId, userBId))
    .sort((a, b) => new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime())[0];
}

export function getCooldownRemainingMs(lastConnectedAt: string, now: Date = new Date()): number {
  const cooldownMs = CONNECTION_COOLDOWN_HOURS * MILLISECONDS_PER_HOUR;
  const elapsedMs = now.getTime() - new Date(lastConnectedAt).getTime();
  return Math.max(cooldownMs - elapsedMs, 0);
}

export function isOnCooldown(lastConnectedAt: string, now: Date = new Date()): boolean {
  return getCooldownRemainingMs(lastConnectedAt, now) > 0;
}

export function formatRemainingTime(remainingMs: number): string {
  const totalMinutes = Math.ceil(remainingMs / (60 * 1000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}
