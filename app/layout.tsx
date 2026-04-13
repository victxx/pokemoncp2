import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "PokemonCP2 MVP",
  description: "Phase 1 scaffold for off-site event game."
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
