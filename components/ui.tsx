import Link from "next/link";
import Image from "next/image";
import type { Rarity } from "@/lib/types/domain";

export function SurfaceCard({ children }: { children: React.ReactNode }) {
  return <article className="pixel-card">{children}</article>;
}

export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="pixel-card bg-[#f8f3e6] p-3">
      <ResourceLabel label={label} className="text-sm uppercase tracking-wide text-slate-500 sm:text-xs" />
      <p className="mt-1 text-xl font-bold text-slate-900 sm:text-lg">{value}</p>
    </div>
  );
}

export function ActionLink({ href, label, className = "" }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={`btn-pokemon w-full text-base font-semibold sm:text-sm ${className}`}
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
    <span className={`inline-flex border-2 border-black px-2 py-1 text-sm font-semibold sm:text-xs ${styles[rarity]}`}>
      {rarity}
    </span>
  );
}

const TYPE_BADGE_SRC: Record<string, string> = {
  fire: "/types/fire-v3.png",
  water: "/types/water-v3.png",
  grass: "/types/grass-v3.png",
  normal: "/types/normal-v3.png",
  neutral: "/types/normal-v3.png"
};

function normalizeTypeLabel(element: string): string {
  const normalized = element.toLowerCase();
  if (normalized === "neutral") {
    return "Normal";
  }
  return element;
}

export function ElementBadge({ element, className = "" }: { element: string; className?: string }) {
  const normalized = element.toLowerCase();
  const src = TYPE_BADGE_SRC[normalized];
  if (!src) {
    return (
      <span className={`inline-flex border-2 border-black px-2 py-1 text-sm font-semibold sm:text-xs ${className}`}>
        {normalizeTypeLabel(element)}
      </span>
    );
  }

  return (
    <Image
      src={src}
      alt={`${normalizeTypeLabel(element)} type`}
      width={112}
      height={28}
      unoptimized
      className={`h-7 w-auto object-contain ${className}`}
    />
  );
}

function getResourceIcon(label: string): string | null {
  const normalized = label.toLowerCase();
  if (normalized.includes("coin")) {
    return "/resources/coin.png";
  }
  if (normalized.includes("ticket")) {
    return "/resources/ticket.png";
  }
  return null;
}

export function ResourceLabel({ label, className = "" }: { label: string; className?: string }) {
  const iconSrc = getResourceIcon(label);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {iconSrc ? (
        <Image src={iconSrc} alt={`${label} icon`} width={14} height={14} unoptimized className="h-3.5 w-3.5 object-contain" />
      ) : null}
      <span>{label}</span>
    </span>
  );
}
