"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { ElementBadge, ResourceLabel, SurfaceCard } from "@/components/ui";
import {
  DAILY_BATTLE_TICKETS,
  EVENT_TIMEZONE_OFFSET_HOURS,
  POKEMON_BATTLE_COOLDOWN_HOURS
} from "@/lib/config/game";
import { formatRemainingCooldown, getRestingStatuses } from "@/lib/battles/resting";
import { runInstantBattle } from "@/lib/battles/service";
import { getPrivyAuthContext } from "@/lib/privy/sync-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  getBattleHistoryForUser,
  getCurrentUser,
  getRemainingDailyTickets,
  getUserPokemon,
  getUsersForBattle,
  hasConnectedBattleTodayForPair,
  hasValidConnectionBetweenUsers,
  type UserPokemonRecord,
  type UserProfile
} from "@/lib/supabase/repositories";
import type { Battle } from "@/lib/types/domain";

interface NoticeState {
  tone: "success" | "error";
  message: string;
}

interface BattleRevealState {
  challengerPokemonName: string;
  opponentPokemonName: string;
  challengerWinChance: number;
  opponentWinChance: number;
  roll: number;
  didChallengerWin: boolean;
}

function noticeClass(tone: "success" | "error"): string {
  return tone === "success"
    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : "bg-rose-50 text-rose-800 ring-rose-200";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function BattlePageClient() {
  const { ready, authenticated, user } = usePrivy();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [opponentUsers, setOpponentUsers] = useState<Array<{ id: string; displayName: string }>>([]);
  const [myPokemon, setMyPokemon] = useState<UserPokemonRecord[]>([]);
  const [battleHistory, setBattleHistory] = useState<
    Array<{
      id: string;
      didWin: boolean;
      opponentName: string;
      myPokemonName: string;
      opponentPokemonName: string;
      pointsAwarded: number;
      mode: "connected" | "ticket";
      rankedRewardApplied: boolean;
      playedAtIso: string;
      playedAtLabel: string;
    }>
  >([]);

  const [selectedPokemonId, setSelectedPokemonId] = useState("");
  const [selectedOpponentId, setSelectedOpponentId] = useState("");
  const [remainingTickets, setRemainingTickets] = useState(0);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [lastReveal, setLastReveal] = useState<BattleRevealState | null>(null);
  const [connectedBattleStatus, setConnectedBattleStatus] = useState({
    isConnected: false,
    alreadyUsedToday: false
  });

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

      const [allUsers, userPokemon, historyRows] = await Promise.all([
        getUsersForBattle(client),
        getUserPokemon(client, profile.id),
        getBattleHistoryForUser(client, profile.id, 8)
      ]);
      const ticketCount = await getRemainingDailyTickets(client, profile.id);

      setOpponentUsers(
        allUsers
          .filter((user) => user.id !== profile.id)
          .map((user) => ({ id: user.id, displayName: user.display_name }))
      );
      setMyPokemon(userPokemon);
      setRemainingTickets(ticketCount);

      const uniquePokemonIds = Array.from(
        new Set(historyRows.flatMap((battle) => [battle.player_a_pokemon_id, battle.player_b_pokemon_id]))
      );
      const { data: pokemonNames } = await client
        .from("user_pokemon")
        .select("id,pokemon_name")
        .in("id", uniquePokemonIds);
      const pokemonNameRows = (pokemonNames ?? []) as Array<{ id: string; pokemon_name: string }>;
      const pokemonNameMap = new Map(pokemonNameRows.map((row) => [row.id, row.pokemon_name]));
      const opponentMap = new Map(
        allUsers.map((user) => [user.id, user.display_name] as const)
      );

      setBattleHistory(
        historyRows.map((battle) => ({
          id: battle.id,
          didWin: battle.winner_user_id === profile.id,
          opponentName: opponentMap.get(battle.player_b_id) ?? "Unknown",
          myPokemonName: pokemonNameMap.get(battle.player_a_pokemon_id) ?? "Unknown",
          opponentPokemonName: pokemonNameMap.get(battle.player_b_pokemon_id) ?? "Unknown",
          pointsAwarded: battle.player_a_points_delta,
          mode: battle.battle_mode,
          rankedRewardApplied: battle.ranked,
          playedAtIso: battle.created_at,
          playedAtLabel: new Date(battle.created_at).toLocaleString()
        }))
      );
    };
    void run();
  }, [authenticated, ready, user]);

  useEffect(() => {
    if (!selectedPokemonId && myPokemon.length > 0) {
      setSelectedPokemonId(myPokemon[0].id);
    }
  }, [myPokemon, selectedPokemonId]);

  useEffect(() => {
    if (!selectedOpponentId && opponentUsers.length > 0) {
      setSelectedOpponentId(opponentUsers[0].id);
    }
  }, [opponentUsers, selectedOpponentId]);

  const eventDayKey = useMemo(() => {
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
    const eventMs = utcMs + EVENT_TIMEZONE_OFFSET_HOURS * 60 * 60 * 1000;
    return new Date(eventMs).toISOString().slice(0, 10);
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!currentUser || !selectedOpponentId) {
        setConnectedBattleStatus({ isConnected: false, alreadyUsedToday: false });
        return;
      }
      const client = getSupabaseBrowserClient();
      const [isConnected, alreadyUsedToday] = await Promise.all([
        hasValidConnectionBetweenUsers(client, currentUser.id, selectedOpponentId),
        hasConnectedBattleTodayForPair(client, currentUser.id, selectedOpponentId, eventDayKey)
      ]);
      setConnectedBattleStatus({ isConnected, alreadyUsedToday });
    };
    void run();
  }, [currentUser, eventDayKey, selectedOpponentId]);

  const autoBattleMode = useMemo(() => {
    if (connectedBattleStatus.isConnected && !connectedBattleStatus.alreadyUsedToday) {
      return "connected" as const;
    }
    return "ticket" as const;
  }, [connectedBattleStatus.alreadyUsedToday, connectedBattleStatus.isConnected]);

  const restingStatuses = useMemo(() => {
    const now = new Date();
    const normalizedBattles: Battle[] = battleHistory.map((entry) => ({
      id: entry.id,
      mode: entry.mode,
      eventDayKey,
      challengerUserId: currentUser?.id ?? "",
      opponentUserId: "",
      challengerPokemonId: myPokemon.find((pokemon) => pokemon.pokemonName === entry.myPokemonName)?.id ?? "",
      opponentPokemonId: "",
      challengerWinChance: 50,
      winnerUserId: entry.didWin ? currentUser?.id ?? null : null,
      pointsAwardedToChallenger: entry.pointsAwarded,
      rankedRewardApplied: entry.rankedRewardApplied,
      playedAt: entry.playedAtIso
    }));
    return getRestingStatuses(
      normalizedBattles,
      currentUser?.id ?? "",
      myPokemon.map((pokemon) => pokemon.id),
      now
    );
  }, [battleHistory, currentUser?.id, eventDayKey, myPokemon]);

  const selectedPokemonStatus = useMemo(
    () => restingStatuses.find((status) => status.pokemonId === selectedPokemonId),
    [restingStatuses, selectedPokemonId]
  );
  const selectedPokemon = useMemo(
    () => myPokemon.find((pokemon) => pokemon.id === selectedPokemonId) ?? null,
    [myPokemon, selectedPokemonId]
  );

  useEffect(() => {
    if (!selectedPokemonId) {
      return;
    }
    const currentStatus = restingStatuses.find((status) => status.pokemonId === selectedPokemonId);
    if (currentStatus?.isActive) {
      return;
    }
    const fallbackActive = restingStatuses.find((status) => status.isActive);
    if (fallbackActive) {
      setSelectedPokemonId(fallbackActive.pokemonId);
    }
  }, [restingStatuses, selectedPokemonId]);

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
        <p className="text-base text-slate-600 sm:text-sm">Please login to battle.</p>
      </SurfaceCard>
    );
  }

  if (!currentUser) {
    return null;
  }

  const canStartBattle =
    !!selectedPokemonId &&
    !!selectedOpponentId &&
    (autoBattleMode === "connected" || remainingTickets > 0) &&
    !isRolling;

  const onFightNow = () => {
    const run = async () => {
      setIsRolling(true);
      setLastReveal(null);
      try {
        const result = await runInstantBattle(
          currentUser.id,
          selectedPokemonId,
          selectedOpponentId,
          autoBattleMode
        );

        const client = getSupabaseBrowserClient();
        const authContext = user ? getPrivyAuthContext(user) : null;
        const [profile, pokemon, historyRows] = await Promise.all([
          getCurrentUser(client, authContext),
          getUserPokemon(client, currentUser.id),
          getBattleHistoryForUser(client, currentUser.id, 8)
        ]);
        const ticketCount = await getRemainingDailyTickets(client, currentUser.id);
        if (profile) {
          setCurrentUser(profile);
        }
        setMyPokemon(pokemon);
        setRemainingTickets(ticketCount);

        const uniquePokemonIds = Array.from(
          new Set(historyRows.flatMap((battle) => [battle.player_a_pokemon_id, battle.player_b_pokemon_id]))
        );
        const { data: pokemonNames } = await client
          .from("user_pokemon")
          .select("id,pokemon_name")
          .in("id", uniquePokemonIds);
        const pokemonNameRows = (pokemonNames ?? []) as Array<{ id: string; pokemon_name: string }>;
        const pokemonNameMap = new Map(pokemonNameRows.map((row) => [row.id, row.pokemon_name]));
        const users = await getUsersForBattle(client);
        const opponentMap = new Map(users.map((user) => [user.id, user.display_name] as const));

        setBattleHistory(
          historyRows.map((battle) => ({
            id: battle.id,
            didWin: battle.winner_user_id === currentUser.id,
            opponentName: opponentMap.get(battle.player_b_id) ?? "Unknown",
            myPokemonName: pokemonNameMap.get(battle.player_a_pokemon_id) ?? "Unknown",
            opponentPokemonName: pokemonNameMap.get(battle.player_b_pokemon_id) ?? "Unknown",
            pointsAwarded: battle.player_a_points_delta,
            mode: battle.battle_mode,
            rankedRewardApplied: battle.ranked,
            playedAtIso: battle.created_at,
            playedAtLabel: new Date(battle.created_at).toLocaleString()
          }))
        );

        setNotice({
          tone: result.battle ? "success" : "error",
          message: result.message
        });

        if (result.reveal) {
          await sleep(700);
          setLastReveal(result.reveal);
        }
      } catch {
        setNotice({
          tone: "error",
          message: "Battle failed. Please try again."
        });
      } finally {
        setIsRolling(false);
      }
    };
    void run();
  };

  const selectRandomOpponent = () => {
    if (opponentUsers.length === 0) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * opponentUsers.length);
    setSelectedOpponentId(opponentUsers[randomIndex].id);
  };

  return (
    <div className="space-y-4 sm:space-y-3">
      <SurfaceCard>
        <p className="text-sm uppercase tracking-wide text-slate-500 sm:text-xs">Instant battle setup</p>
        <p className="mt-1 text-base text-slate-700 sm:text-sm">
          Connected mode is the main ranked flow (1 full battle per pair per event day). Ticket mode allows
          extra fights with reduced rewards. Reusing the same Pokemon has a {POKEMON_BATTLE_COOLDOWN_HOURS}h
          cooldown (unless it is your only unlocked Pokemon).
        </p>
      </SurfaceCard>

      <SurfaceCard>
        <p className="mb-2 text-base font-medium text-slate-700 sm:text-sm">Resources</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <ResourceLabel label="Coins" className="text-sm text-slate-500 sm:text-xs" />
            <p className="text-lg font-bold text-slate-900">{currentUser.coins}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
            <ResourceLabel label="Tickets" className="text-sm text-slate-500 sm:text-xs" />
            <p className="text-lg font-bold text-slate-900">
              {remainingTickets} / {DAILY_BATTLE_TICKETS}
            </p>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-500 sm:text-xs">
          Daily tickets and connected-battle limits reset each local event day.
        </p>
      </SurfaceCard>

      <SurfaceCard>
        <label className="mb-2 block text-base font-medium text-slate-700 sm:text-sm" htmlFor="my-pokemon">
          Your Pokemon
        </label>
        <select
          id="my-pokemon"
          value={selectedPokemonId}
          onChange={(event) => setSelectedPokemonId(event.target.value)}
          disabled={myPokemon.length === 0}
          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
        >
          {myPokemon.map((pokemon) => (
            <option key={pokemon.id} value={pokemon.id}>
              {pokemon.pokemonName} ({pokemon.rarity}, {pokemon.type}, P{pokemon.power}) -{" "}
              {restingStatuses.find((status) => status.pokemonId === pokemon.id)?.isActive
                ? "Active"
                : `Resting ${formatRemainingCooldown(
                    restingStatuses.find((status) => status.pokemonId === pokemon.id)?.remainingMs ?? 0
                  )}`}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-slate-500 sm:text-xs">
          {selectedPokemonStatus?.isActive
            ? "Selected Pokemon status: Active."
            : selectedPokemonStatus
              ? `Selected Pokemon status: Resting (${formatRemainingCooldown(selectedPokemonStatus.remainingMs)}).`
              : "Select a Pokemon."}
        </p>
        {selectedPokemon ? (
          <div className="mt-2">
            <ElementBadge element={selectedPokemon.type} />
          </div>
        ) : null}
        {myPokemon.length === 0 ? (
          <p className="mt-1 text-sm text-rose-600 sm:text-xs">
            No Pokemon available yet. Pick a starter or open a ball before battling.
          </p>
        ) : null}
      </SurfaceCard>

      <SurfaceCard>
        <label className="mb-2 block text-base font-medium text-slate-700 sm:text-sm" htmlFor="opponent-user">
          Opponent
        </label>
        <select
          id="opponent-user"
          value={selectedOpponentId}
          onChange={(event) => setSelectedOpponentId(event.target.value)}
          disabled={opponentUsers.length === 0}
          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-base sm:py-2 sm:text-sm"
        >
          {opponentUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.displayName}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={selectRandomOpponent}
          className="btn-pokemon-secondary mt-2 w-full text-base sm:text-sm"
        >
          Random Opponent
        </button>
        <p className="mt-2 text-sm text-slate-500 sm:text-xs">
          {!connectedBattleStatus.isConnected
            ? "No prior connection with this player: this fight will consume 1 ticket."
            : connectedBattleStatus.alreadyUsedToday
              ? "Free connected battle already used today for this pair: this fight will consume 1 ticket."
              : "Free connected battle available today for this pair (no ticket consumed)."}
        </p>
        {opponentUsers.length === 0 ? (
          <p className="mt-1 text-sm text-rose-600 sm:text-xs">
            No opponents available right now. Ask another player to join first.
          </p>
        ) : null}
        {autoBattleMode === "ticket" && remainingTickets <= 0 ? (
          <p className="mt-1 text-sm text-rose-600 sm:text-xs">No tickets left today.</p>
        ) : null}
      </SurfaceCard>

      <SurfaceCard>
        <p className="text-sm uppercase tracking-wide text-slate-500 sm:text-xs">Roulette preview</p>
        <p className="mt-1 text-base text-slate-700 sm:text-sm">
          Challenger: {selectedPokemon?.pokemonName ?? "Select your Pokemon"}.
        </p>
        <p className="mt-1 text-sm text-slate-500 sm:text-xs">
          Opponent Pokemon is still selected randomly from that player&apos;s unlocked collection when the battle starts.
        </p>
      </SurfaceCard>

      <button
        type="button"
        onClick={onFightNow}
        disabled={!canStartBattle}
        className="btn-pokemon w-full text-base sm:text-sm"
      >
        {isRolling
          ? "Rolling battle roulette..."
          : autoBattleMode === "connected"
            ? "Fight Now (Free Connected)"
            : "Fight Now (Use 1 Ticket)"}
      </button>

      {notice ? (
        <SurfaceCard>
          <p className={`rounded-xl px-3 py-2 text-base ring-1 sm:text-sm ${noticeClass(notice.tone)}`}>{notice.message}</p>
        </SurfaceCard>
      ) : null}
      {isRolling ? (
        <SurfaceCard>
          <p className="text-base text-slate-700 sm:text-sm">Spinning weighted odds...</p>
        </SurfaceCard>
      ) : null}
      {lastReveal ? (
        <SurfaceCard>
          <p className="text-sm uppercase tracking-wide text-slate-500 sm:text-xs">Roulette result</p>
          <p className="mt-1 text-base font-semibold text-slate-900 sm:text-sm">
            {lastReveal.challengerPokemonName} vs {lastReveal.opponentPokemonName}
          </p>
          <p className="mt-1 text-base text-slate-700 sm:text-sm">
            Win chance: You {lastReveal.challengerWinChance}% - Opponent {lastReveal.opponentWinChance}%
          </p>
          <p className="mt-1 text-sm text-slate-500 sm:text-xs">
            Roll: {lastReveal.roll} - {lastReveal.didChallengerWin ? "Win" : "Loss"}
          </p>
        </SurfaceCard>
      ) : null}

      <SurfaceCard>
        <p className="text-sm uppercase tracking-wide text-slate-500 sm:text-xs">Battle history</p>
        <ul className="mt-2 space-y-2">
          {battleHistory.length === 0 ? (
            <li className="text-base text-slate-500 sm:text-sm">No battles yet.</li>
          ) : (
            battleHistory.map((entry) => (
              <li key={entry.id} className="rounded-lg bg-slate-50 p-3 text-base ring-1 ring-slate-200 sm:p-2 sm:text-sm">
                <p className="font-semibold text-slate-900">
                  {entry.didWin ? "Win" : "Loss"} vs {entry.opponentName}
                </p>
                <p className="text-sm text-slate-600 sm:text-xs">
                  [{entry.mode}] {entry.myPokemonName} vs {entry.opponentPokemonName}
                </p>
                <p className="text-sm text-slate-500 sm:text-xs">
                  +{entry.pointsAwarded} points
                  {entry.rankedRewardApplied ? "" : " (ticket reduced rewards)"} | {entry.playedAtLabel}
                </p>
              </li>
            ))
          )}
        </ul>
      </SurfaceCard>
    </div>
  );
}
