import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Alexandroupoli Pokemon",
  description: "Pick your starter, connect with coworkers, and race up the leaderboard."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "'PokemonFont', sans-serif" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
