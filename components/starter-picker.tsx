"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { Starter, StarterId } from "@/lib/types/domain";
import { SurfaceCard } from "@/components/ui";

interface StarterPickerProps {
  starters: Starter[];
  initialStarterId?: StarterId | null;
  isSaving?: boolean;
  onConfirm: (starterId: StarterId) => Promise<void> | void;
}

const STARTER_SPRITES: Record<StarterId, string> = {
  charmander: "/starters/charmander.png",
  piplup: "/starters/piplup.png",
  treecko: "/starters/treecko.png"
};

export function StarterPicker({ starters, initialStarterId = null, isSaving = false, onConfirm }: StarterPickerProps) {
  const [selectedStarterId, setSelectedStarterId] = useState<StarterId | null>(initialStarterId);

  useEffect(() => {
    setSelectedStarterId(initialStarterId);
  }, [initialStarterId]);

  const selectedStarter = useMemo(
    () => starters.find((starter) => starter.id === selectedStarterId) ?? null,
    [selectedStarterId, starters]
  );

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {starters.map((starter) => {
          const isSelected = selectedStarterId === starter.id;
          return (
            <button
              type="button"
              key={starter.id}
              onClick={() => setSelectedStarterId(starter.id)}
              className={`w-full text-left ${isSelected ? "scale-[1.01]" : ""}`}
            >
              <SurfaceCard>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Image
                      src={STARTER_SPRITES[starter.id]}
                      alt={starter.name}
                      width={48}
                      height={48}
                      className="h-12 w-12 object-contain"
                    />
                    <div>
                      <h2 className="font-semibold">{starter.name}</h2>
                      <p className="text-sm text-slate-600">
                        Type: {starter.element} | Power: {starter.power}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`h-5 w-5 rounded-full ring-2 ${
                      isSelected ? "bg-slate-900 ring-slate-900" : "bg-white ring-slate-300"
                    }`}
                  />
                </div>
              </SurfaceCard>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={!selectedStarter}
        onClick={() => {
          if (selectedStarterId) {
            void onConfirm(selectedStarterId);
          }
        }}
        className="btn-pokemon text-sm w-full"
      >
        {isSaving ? "Saving..." : "Confirm Starter"}
      </button>

      {selectedStarter ? (
        <p className="text-center text-sm text-slate-600">Selected: {selectedStarter.name} (mock only)</p>
      ) : (
        <p className="text-center text-sm text-slate-500">Pick a starter to continue.</p>
      )}
    </div>
  );
}
