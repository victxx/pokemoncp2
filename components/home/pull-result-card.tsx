import Image from "next/image";
import { RarityBadge, SurfaceCard } from "@/components/ui";
import { POKEMON_ROSTER } from "@/data/mock/pokemon";
import { getPokemonSpritePath } from "@/lib/pokemon/sprites";
import type { PullResult } from "@/lib/types/domain";

interface PullResultCardProps {
  result: PullResult;
  onClose: () => void;
}

export function PullResultCard({ result, onClose }: PullResultCardProps) {
  const pokemon = POKEMON_ROSTER.find((item) => item.id === result.pokemonId);
  const spritePath = pokemon ? getPokemonSpritePath(pokemon.id) : null;
  if (!pokemon) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <SurfaceCard>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-wide text-slate-500">Pull result</p>
          {spritePath ? (
            <div className="flex justify-center">
              <Image src={spritePath} alt={pokemon.name} width={110} height={110} className="h-[110px] w-[110px] object-contain" />
            </div>
          ) : null}
          <h3 className="text-xl font-bold text-slate-900">{pokemon.name}</h3>
          <div className="flex items-center gap-2">
            <RarityBadge rarity={result.rarity} />
            <span className="text-sm text-slate-600">Power {pokemon.power}</span>
          </div>
          <p className="text-sm text-slate-700">
            {result.isNewUnlock
              ? `New unlock! +${result.bonusPointsAwarded} points`
              : "Duplicate Pokemon. No extra points this time."}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
          >
            Continue
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}
