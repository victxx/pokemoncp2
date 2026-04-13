const POKEMON_SPRITES: Record<string, string> = {
  wingull: "/pokemon/wingull-v2.png",
  psyduck: "/pokemon/psyduck-v2.png",
  marill: "/pokemon/marill-v2.png",
  horsea: "/pokemon/horsea-v2.png",
  hoppip: "/pokemon/hoppip-v2.png",
  geodude: "/pokemon/geodude-v2.png",
  sandshrew: "/pokemon/sandshrew-v2.png",
  staryu: "/pokemon/staryu-v2.png",
  lanturn: "/pokemon/lanturn-v2.png",
  corsola: "/pokemon/corsola-v2.png",
  xatu: "/pokemon/xatu-v2.png",
  altaria: "/pokemon/altaria-v2.png",
  donphan: "/pokemon/donphan-v2.png",
  lapras: "/pokemon/lapras-v2.png",
  milotic: "/pokemon/milotic-v2.png",
  absol: "/pokemon/absol-v2.png",
  togekiss: "/pokemon/togekiss-v2.png"
};

export function getPokemonSpritePath(pokemonId: string): string | null {
  return POKEMON_SPRITES[pokemonId] ?? null;
}
