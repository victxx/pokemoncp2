"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { SurfaceCard } from "@/components/ui";
import { getPrivyAuthContext } from "@/lib/privy/sync-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUser, getLeaderboard } from "@/lib/supabase/repositories";

export function LeaderboardPageClient() {
  const { ready, authenticated, user } = usePrivy();
  const [rows, setRows] = useState<
    Array<{
      userId: string;
      displayName: string;
      points: number;
      totalConnections: number;
    }>
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const client = getSupabaseBrowserClient();
      const authContext = authenticated && user ? getPrivyAuthContext(user) : null;
      const [leaderboardRows, currentUser] = await Promise.all([
        getLeaderboard(client),
        getCurrentUser(client, authContext)
      ]);
      setCurrentUserId(currentUser?.id ?? null);
      setRows(
        leaderboardRows.map((row) => ({
          userId: row.user_id,
          displayName: row.display_name,
          points: row.points,
          totalConnections: row.total_valid_connections
        }))
      );
    };
    void run();
  }, [authenticated, ready, user]);

  if (!ready) {
    return (
      <SurfaceCard>
        <p className="text-sm text-slate-600">Checking authentication...</p>
      </SurfaceCard>
    );
  }

  return (
    <>
      {rows.map((entry, index) => {
        const isCurrentPlayer = entry.userId === currentUserId;
        return (
          <SurfaceCard key={entry.userId}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Rank #{index + 1}</p>
                <h2 className="text-lg font-bold text-slate-900">
                  {entry.displayName} {isCurrentPlayer ? "• You" : ""}
                </h2>
                <p className="text-sm text-slate-600">Points: {entry.points}</p>
                <p className="text-sm text-slate-600">Connections: {entry.totalConnections}</p>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  isCurrentPlayer ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                }`}
              >
                {isCurrentPlayer ? "Current Player" : "Player"}
              </span>
            </div>
          </SurfaceCard>
        );
      })}
    </>
  );
}
