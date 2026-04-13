const POKEMON_SPRITES: Record<string, string> = {
  wingull: "/pokemon/wingull.png",
  psyduck: "/pokemon/psyduck.png",
  marill: "/pokemon/marill.png",
  horsea: "/pokemon/horsea.png",
  hoppip: "/pokemon/hoppip.png",
  geodude: "/pokemon/geodude.png",
  sandshrew: "/pokemon/sandshrew.png",
  staryu: "/pokemon/staryu.png",
  lanturn: "/pokemon/lanturn.png",
  corsola: "/pokemon/corsola.png",
  xatu: "/pokemon/xatu.png",
  altaria: "/pokemon/altaria.png",
  donphan: "/pokemon/donphan.png",
  lapras: "/pokemon/lapras.png",
  milotic: "/pokemon/milotic.png",
  absol: "/pokemon/absol.png",
  togekiss: "/pokemon/togekiss.png"
};

export function getPokemonSpritePath(pokemonId: string): string | null {
  return POKEMON_SPRITES[pokemonId] ?? null;
}
