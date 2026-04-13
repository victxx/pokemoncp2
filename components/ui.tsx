import Link from "next/link";
import type { Rarity } from "@/lib/types/domain";

export function SurfaceCard({ children }: { children: React.ReactNode }) {
  return <article className="pixel-card">{children}</article>;
}

export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pixel-card bg-[#f8f3e6] p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function ActionLink({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`btn-pokemon text-sm font-semibold w-full ${className}`}
    >
      {label}
    </Link>
  );
}

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const styles: Record<Rarity, string> = {
    Common: "bg-emerald-100 text-emerald-800",
    Rare: "bg-blue-100 text-blue-800",
    Epic: "bg-violet-100 text-violet-800"
  };

  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold border-2 border-black ${styles[rarity]}`}>
      {rarity}
    </span>
  );
}
