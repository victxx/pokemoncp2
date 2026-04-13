"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ActionLink, ElementBadge, StatTile, SurfaceCard } from "@/components/ui";
import { PullResultCard } from "@/components/home/pull-result-card";
import { STARTERS } from "@/data/mock/starters";
import { DAILY_BATTLE_TICKETS, DEFAULT_PULL_COST_COINS } from "@/lib/config/game";
import { getPrivyAuthContext } from "@/lib/privy/sync-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUser, type UserProfile } from "@/lib/supabase/repositories";
import { attemptPokemonPull } from "@/lib/pulls/service";
import type { PullResult } from "@/lib/types/domain";

interface NoticeState {
  tone: "success" | "error";
  message: string;
}

function noticeClass(tone: "success" | "error"): string {
  return tone === "success"
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : "bg-rose-50 text-rose-800 ring-rose-200";
}

export function HomePageClient() {
  const { ready, authenticated, user } = usePrivy();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [lastPull, setLastPull] = useState<PullResult | null>(null);

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
    };
    void run();
  }, [authenticated, ready, user]);

  const selectedStarter = useMemo(
    () => STARTERS.find((starter) => starter.id === currentUser?.starterId),
    [currentUser?.starterId]
  );

  const nextStepText = useMemo(() => {
    if (!currentUser) {
      return "";
    }
    if (!selectedStarter) {
      return "Pick your starter first to unlock the full game flow.";
    }
    if (currentUser.coins < DEFAULT_PULL_COST_COINS) {
      return "Connect with coworkers to earn coins, then open a ball.";
    }
    return "You are ready: connect, open balls, and battle to climb the leaderboard.";
  }, [currentUser, selectedStarter]);

  if (!ready) {
    return (
      <SurfaceCard>
        <p className="text-base text-slate-600 sm:text-sm">Checking authentication...</p>
      </SurfaceCard>
    );
  }

  if (!authenticated) {
    return (
      <SurfaceCard>
        <p className="text-base text-slate-600 sm:text-sm">Please login to view your home.</p>
      </SurfaceCard>
    );
  }

  if (!currentUser) {
    return null;
  }

  const onOpenBall = () => {
    const run = async () => {
      const result = await attemptPokemonPull(currentUser.id);
      const client = getSupabaseBrowserClient();
      const authContext = user ? getPrivyAuthContext(user) : null;
      const profile = await getCurrentUser(client, authContext);
      setCurrentUser(profile);

      if (result.type === "success" && result.pullResult) {
        setLastPull(result.pullResult);
        setNotice({ tone: "success", message: result.message });
        return;
      }

      setLastPull(null);
      setNotice({ tone: "error", message: result.message });
    };
    void run();
  };

  return (
    <div className="space-y-4 sm:space-y-3">
      <SurfaceCard>
        <p className="text-sm uppercase tracking-wide text-slate-500 sm:text-xs">Trainer</p>
        <h2 className="text-xl font-bold text-slate-900">{currentUser.displayName}</h2>
        <p className="mt-1 text-base text-slate-600 sm:text-sm">Starter: {selectedStarter?.name ?? "Not selected"}</p>
        {selectedStarter ? (
          <div className="mt-2">
            <ElementBadge element={selectedStarter.element} />
          </div>
        ) : null}
        {!selectedStarter ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200 sm:text-xs">
            No starter selected yet. Go to Starter Selection to begin.
          </p>
        ) : null}
      </SurfaceCard>

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Coins" value={currentUser.coins} />
        <StatTile label="Points" value={currentUser.points} />
        <StatTile label="Daily Tickets" value={`${currentUser.dailyTickets} / ${DAILY_BATTLE_TICKETS}`} />
        <StatTile label="Connections" value={currentUser.totalConnections} />
      </div>

      <SurfaceCard>
        <p className="text-sm uppercase tracking-wide text-slate-500 sm:text-xs">What to do next</p>
        <p className="mt-1 text-base text-slate-700 sm:text-sm">{nextStepText}</p>
        <p className="mt-2 text-sm text-slate-500 sm:text-xs">
          Tickets and connected battle limits reset each local event day.
        </p>
      </SurfaceCard>

      <div className="grid grid-cols-2 gap-3">
        <ActionLink href="/connect" label="Connect" />
        <button
          type="button"
          onClick={onOpenBall}
          className="btn-pokemon w-full text-base sm:text-sm"
        >
          Open Ball ({DEFAULT_PULL_COST_COINS})
        </button>
        <ActionLink href="/battle" label="Battle" />
        <ActionLink href="/collection" label="Collection" />
        <ActionLink href="/leaderboard" label="Leaderboard" className="col-span-2" />
      </div>

      {notice ? (
        <SurfaceCard>
          <p className={`rounded-xl px-3 py-2 text-sm ring-1 ${noticeClass(notice.tone)}`}>{notice.message}</p>
        </SurfaceCard>
      ) : null}

      {lastPull ? <PullResultCard result={lastPull} onClose={() => setLastPull(null)} /> : null}
    </div>
  );
}
