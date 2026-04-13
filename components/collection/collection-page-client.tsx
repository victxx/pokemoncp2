"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import { ElementBadge, RarityBadge, SurfaceCard } from "@/components/ui";
import { POKEMON_ROSTER } from "@/data/mock/pokemon";
import { getPokemonSpritePath } from "@/lib/pokemon/sprites";
import { getPrivyAuthContext } from "@/lib/privy/sync-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUser, getUserPokemon, type UserPokemonRecord } from "@/lib/supabase/repositories";

export function CollectionPageClient() {
  const { ready, authenticated, user } = usePrivy();
  const [unlockedPokemonIds, setUnlockedPokemonIds] = useState<string[]>([]);
  const [totalUnlocked, setTotalUnlocked] = useState(0);
  const [hasUser, setHasUser] = useState(true);

  useEffect(() => {
    if (!ready || !authenticated || !user) {
      setHasUser(false);
      return;
    }
    const run = async () => {
      const authContext = getPrivyAuthContext(user);
      if (!authContext) {
        setHasUser(false);
        return;
      }
      const client = getSupabaseBrowserClient();
      const currentUser = await getCurrentUser(client, authContext);
      if (!currentUser) {
        setHasUser(false);
        return;
      }
      const userPokemon = await getUserPokemon(client, currentUser.id);
      const rosterIds = userPokemon
        .map((pokemon: UserPokemonRecord) => pokemon.rosterId)
        .filter((value): value is string => !!value);
      setUnlockedPokemonIds([...new Set(rosterIds)]);
      setTotalUnlocked(userPokemon.length);
    };
    void run();
  }, [authenticated, ready, user]);

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
        <p className="text-base text-slate-600 sm:text-sm">Please login to view your collection.</p>
      </SurfaceCard>
    );
  }

  if (!hasUser) {
    return (
      <SurfaceCard>
        <p className="text-base text-rose-700 sm:text-sm">Current mock user not found.</p>
      </SurfaceCard>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-3">
      <SurfaceCard>
        <p className="text-base text-slate-700 sm:text-sm">
          Unlocked: <span className="font-semibold">{totalUnlocked}</span> /{" "}
          {POKEMON_ROSTER.length}
        </p>
        {totalUnlocked === 0 ? (
          <p className="mt-2 text-sm text-slate-500 sm:text-xs">
            No Pokemon yet. Start by picking your starter, then open balls from Home.
          </p>
        ) : null}
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {POKEMON_ROSTER.map((pokemon) => {
          const isUnlocked = unlockedPokemonIds.includes(pokemon.id);
          const spritePath = getPokemonSpritePath(pokemon.id);
          return (
            <article
              key={pokemon.id}
              className={`rounded-2xl p-3 ring-1 ${
                isUnlocked ? "bg-white shadow-sm ring-slate-200" : "bg-slate-100 ring-slate-200"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <RarityBadge rarity={pokemon.rarity} />
                <span className="text-sm text-slate-500 sm:text-xs">Power {pokemon.power}</span>
              </div>
              <div className="mb-2 flex justify-center">
                {spritePath ? (
                  <Image
                    src={spritePath}
                    alt={pokemon.name}
                    width={84}
                    height={84}
                    unoptimized
                    className={`h-[84px] w-[84px] object-contain ${isUnlocked ? "" : "opacity-25 grayscale"}`}
                  />
                ) : (
                  <div className="h-[84px] w-[84px] border border-slate-300 bg-white/40" />
                )}
              </div>
              <h2 className="font-semibold text-slate-900">{isUnlocked ? pokemon.name : "Locked Pokemon"}</h2>
              {isUnlocked ? (
                <div className="mt-1">
                  <ElementBadge element={pokemon.element} />
                </div>
              ) : (
                <p className="text-sm text-slate-500 sm:text-xs">Open balls to unlock</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
