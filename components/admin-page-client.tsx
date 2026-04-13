"use client";

import { useEffect, useMemo, useState } from "react";
import { SurfaceCard } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  invalidateConnection,
  listConnectionsForAdmin,
  listUsersForAdmin,
  updateUserStatus
} from "@/lib/supabase/repositories";

interface AdminUserRow {
  id: string;
  displayName: string;
  personalCode: string;
  status: "active" | "flagged" | "blocked" | "invalidated";
  points: number;
  coins: number;
}

interface AdminConnectionRow {
  id: string;
  userAId: string;
  userBId: string;
  coinsAwarded: number;
  pointsAwarded: number;
  status: "valid" | "invalidated";
  createdAt: string;
  invalidatedAt: string | null;
  invalidationReason: string | null;
}

const ADMIN_KEY = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";

export function AdminPageClient() {
  const [isUnlocked, setIsUnlocked] = useState(ADMIN_KEY.length === 0);
  const [enteredKey, setEnteredKey] = useState("");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [connections, setConnections] = useState<AdminConnectionRow[]>([]);
  const [reasonByConnectionId, setReasonByConnectionId] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const userNameById = useMemo(() => {
    return new Map(users.map((user) => [user.id, user.displayName]));
  }, [users]);

  const refresh = async () => {
    const client = getSupabaseBrowserClient();
    const [usersRows, connectionsRows] = await Promise.all([
      listUsersForAdmin(client),
      listConnectionsForAdmin(client, 100)
    ]);
    setUsers(usersRows);
    setConnections(connectionsRows);
  };

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }
    void refresh();
  }, [isUnlocked]);

  const unlock = () => {
    if (!ADMIN_KEY) {
      setIsUnlocked(true);
      return;
    }
    if (enteredKey === ADMIN_KEY) {
      setIsUnlocked(true);
      setMessage(null);
      return;
    }
    setMessage("Invalid admin key.");
  };

  const onUpdateStatus = async (
    userId: string,
    status: "active" | "flagged" | "blocked"
  ) => {
    const client = getSupabaseBrowserClient();
    const ok = await updateUserStatus(client, userId, status);
    setMessage(ok ? `User updated to ${status}.` : "Failed to update user.");
    if (ok) {
      await refresh();
    }
  };

  const onInvalidateConnection = async (connectionId: string) => {
    const client = getSupabaseBrowserClient();
    const reason = reasonByConnectionId[connectionId]?.trim() || "manual_moderation";
    const result = await invalidateConnection(client, connectionId, reason);
    setMessage(result.message);
    if (result.ok) {
      await refresh();
    }
  };

  if (!isUnlocked) {
    return (
      <div className="space-y-3">
        <SurfaceCard>
          <p className="text-sm font-semibold text-slate-900">Admin Access</p>
          <p className="mt-1 text-xs text-slate-500">
            Temporary protection with local env key. Replace with real auth later.
          </p>
          <input
            type="password"
            value={enteredKey}
            onChange={(event) => setEnteredKey(event.target.value)}
            placeholder="Enter admin key"
            className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={unlock}
            className="btn-pokemon text-sm w-full mt-2"
          >
            Unlock Admin
          </button>
        </SurfaceCard>
        {message ? (
          <SurfaceCard>
            <p className="text-sm text-rose-700">{message}</p>
          </SurfaceCard>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!ADMIN_KEY ? (
        <SurfaceCard>
          <p className="text-xs text-amber-700">
            Admin key not configured. Dev-only open admin mode is active.
          </p>
        </SurfaceCard>
      ) : null}

      {message ? (
        <SurfaceCard>
          <p className="text-sm text-slate-700">{message}</p>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <p className="text-xs uppercase tracking-wide text-slate-500">Users</p>
        <ul className="mt-2 space-y-2">
          {users.map((user) => (
            <li key={user.id} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">
                {user.displayName} ({user.personalCode})
              </p>
              <p className="text-xs text-slate-600">
                Status: {user.status} | Points: {user.points} | Coins: {user.coins}
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => void onUpdateStatus(user.id, "active")}
                  className="btn-pokemon-secondary text-xs px-2 py-1"
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => void onUpdateStatus(user.id, "flagged")}
                  className="btn-pokemon-secondary text-xs px-2 py-1"
                >
                  Flagged
                </button>
                <button
                  type="button"
                  onClick={() => void onUpdateStatus(user.id, "blocked")}
                  className="btn-pokemon-secondary text-xs px-2 py-1"
                >
                  Blocked
                </button>
              </div>
            </li>
          ))}
        </ul>
      </SurfaceCard>

      <SurfaceCard>
        <p className="text-xs uppercase tracking-wide text-slate-500">Recent Connections</p>
        <ul className="mt-2 space-y-2">
          {connections.map((connection) => (
            <li key={connection.id} className="rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
              <p className="font-semibold text-slate-900">
                {userNameById.get(connection.userAId) ?? connection.userAId} ↔{" "}
                {userNameById.get(connection.userBId) ?? connection.userBId}
              </p>
              <p className="text-xs text-slate-600">
                Status: {connection.status} | Coins: {connection.coinsAwarded} | Points:{" "}
                {connection.pointsAwarded}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(connection.createdAt).toLocaleString()}
                {connection.invalidationReason ? ` | Reason: ${connection.invalidationReason}` : ""}
              </p>

              {connection.status === "valid" ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="text"
                    value={reasonByConnectionId[connection.id] ?? ""}
                    onChange={(event) =>
                      setReasonByConnectionId((prev) => ({
                        ...prev,
                        [connection.id]: event.target.value
                      }))
                    }
                    placeholder="Reason (optional)"
                    className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => void onInvalidateConnection(connection.id)}
                    className="btn-pokemon text-xs w-full"
                  >
                    Invalidate Connection
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </SurfaceCard>
    </div>
  );
}
