"use client";

import { FormEvent, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { SurfaceCard } from "@/components/ui";
import { attemptConnectionByCode } from "@/lib/connections/service";
import { CONNECTION_COOLDOWN_HOURS } from "@/lib/config/game";
import { getPrivyAuthContext } from "@/lib/privy/sync-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getCurrentUser,
  getRecentConnectionsForUser,
  type UserProfile
} from "@/lib/supabase/repositories";
import { normalizeCode } from "@/lib/connections/utils";

type FeedbackTone = "success" | "error";

interface FeedbackState {
  tone: FeedbackTone;
  message: string;
}

function getFeedbackClasses(tone: FeedbackTone): string {
  return tone === "success"
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : "bg-rose-50 text-rose-800 ring-rose-200";
}

export function ConnectPageClient() {
  const { ready, authenticated, user } = usePrivy();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [recentConnections, setRecentConnections] = useState<
    Array<{ id: string; displayName: string; code: string; connectedAt: string }>
  >([]);
  const [enteredCode, setEnteredCode] = useState("");
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  useEffect(() => {
    if (!ready || !authenticated || !user) {
      setCurrentUser(null);
      return;
    }
    const run = async () => {
      const authContext = getPrivyAuthContext(user);
      if (!authContext) {
        return;
      }
      const client = getSupabaseBrowserClient();
      const profile = await getCurrentUser(client, authContext);
      setCurrentUser(profile);
      if (!profile) {
        return;
      }

      const [connections, users] = await Promise.all([
        getRecentConnectionsForUser(client, profile.id, 6),
        client.from("users").select("id,display_name,personal_code")
      ]);
      const userRows = (users.data ?? []) as Array<{
        id: string;
        display_name: string;
        personal_code: string;
      }>;

      const userMap = new Map(
        userRows.map((user) => [user.id, { displayName: user.display_name, code: user.personal_code }])
      );

      setRecentConnections(
        connections.map((connection) => {
          const counterpartId = connection.userAId === profile.id ? connection.userBId : connection.userAId;
          const counterpart = userMap.get(counterpartId);
          return {
            id: connection.id,
            displayName: counterpart?.displayName ?? "Unknown",
            code: counterpart?.code ?? "-",
            connectedAt: new Date(connection.createdAt).toLocaleString()
          };
        })
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

  if (!authenticated) {
    return (
      <SurfaceCard>
        <p className="text-sm text-slate-600">Please login to connect with others.</p>
      </SurfaceCard>
    );
  }

  if (!currentUser) {
    return (
      <SurfaceCard>
        <p className="text-sm text-rose-700">Unable to load your profile.</p>
      </SurfaceCard>
    );
  }

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeCode(enteredCode);
    if (!normalized) {
      setFeedback({ tone: "error", message: "Enter a code first." });
      return;
    }

    const run = async () => {
      const result = await attemptConnectionByCode(currentUser.id, normalized);
      const client = getSupabaseBrowserClient();
      const authContext = user ? getPrivyAuthContext(user) : null;
      const profile = await getCurrentUser(client, authContext);
      setCurrentUser(profile);

      if (profile) {
        const [connections, users] = await Promise.all([
          getRecentConnectionsForUser(client, profile.id, 6),
          client.from("users").select("id,display_name,personal_code")
        ]);
        const userRows = (users.data ?? []) as Array<{
          id: string;
          display_name: string;
          personal_code: string;
        }>;
        const userMap = new Map(
          userRows.map((user) => [user.id, { displayName: user.display_name, code: user.personal_code }])
        );
        setRecentConnections(
          connections.map((connection) => {
            const counterpartId = connection.userAId === profile.id ? connection.userBId : connection.userAId;
            const counterpart = userMap.get(counterpartId);
            return {
              id: connection.id,
              displayName: counterpart?.displayName ?? "Unknown",
              code: counterpart?.code ?? "-",
              connectedAt: new Date(connection.createdAt).toLocaleString()
            };
          })
        );
      }

      if (result.type === "success") {
        setFeedback({ tone: "success", message: result.message });
        setEnteredCode("");
        return;
      }
      setFeedback({ tone: "error", message: result.message });
    };

    void run();
  };

  return (
    <div className="space-y-3">
      <SurfaceCard>
        <p className="text-xs uppercase tracking-wide text-slate-500">Your personal code</p>
        <p className="mt-1 text-2xl font-extrabold tracking-wide text-slate-900">{currentUser.personalCode}</p>
        <p className="mt-2 text-xs text-slate-500">Share this code with coworkers to connect.</p>
      </SurfaceCard>

      <SurfaceCard>
        <form className="space-y-3" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700" htmlFor="code-input">
            Enter coworker code
          </label>
          <input
            id="code-input"
            value={enteredCode}
            onChange={(event) => setEnteredCode(event.target.value.toUpperCase())}
            placeholder="e.g. NINA02"
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none ring-slate-300 transition focus:ring-2"
          />
          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Connect
          </button>
        </form>
      </SurfaceCard>

      {feedback ? (
        <SurfaceCard>
          <p className={`rounded-xl px-3 py-2 text-sm ring-1 ${getFeedbackClasses(feedback.tone)}`}>
            {feedback.message}
          </p>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <p className="text-xs uppercase tracking-wide text-slate-500">Connection summary</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-slate-50 p-2 text-center ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Coins</p>
            <p className="font-semibold text-slate-900">{currentUser.coins}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-center ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Points</p>
            <p className="font-semibold text-slate-900">{currentUser.points}</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 text-center ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">Total</p>
            <p className="font-semibold text-slate-900">{currentUser.totalConnections}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-500">Pair cooldown: {CONNECTION_COOLDOWN_HOURS} hours.</p>
      </SurfaceCard>

      <SurfaceCard>
        <p className="text-xs uppercase tracking-wide text-slate-500">Recent valid connections</p>
        <ul className="mt-2 space-y-2">
          {recentConnections.length === 0 ? (
            <li className="text-sm text-slate-500">
              No recent connections yet. Share your code with someone and connect to earn coins and points.
            </li>
          ) : (
            recentConnections.map((connection) => (
              <li key={connection.id} className="rounded-lg bg-slate-50 p-2 text-sm ring-1 ring-slate-200">
                <p className="font-medium text-slate-900">{connection.displayName}</p>
                <p className="text-xs text-slate-500">
                  Code: {connection.code} | {connection.connectedAt}
                </p>
              </li>
            ))
          )}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Daily systems reset each local event day. Connection pair cooldown stays {CONNECTION_COOLDOWN_HOURS}h.
        </p>
      </SurfaceCard>
    </div>
  );
}
