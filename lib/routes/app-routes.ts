export interface AppRoute {
  label: string;
  path: string;
}

export const APP_ROUTES: AppRoute[] = [
  { label: "Landing", path: "/" },
  { label: "How To Play", path: "/how-to" },
  { label: "Starter Selection", path: "/starter" },
  { label: "Home", path: "/home" },
  { label: "Connect", path: "/connect" },
  { label: "Collection", path: "/collection" },
  { label: "Battle", path: "/battle" },
  { label: "Leaderboard", path: "/leaderboard" }
];
