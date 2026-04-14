"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { StarterPicker } from "@/components/starter-picker";
import { SurfaceCard } from "@/components/ui";
import { STARTERS } from "@/data/mock/starters";
import { getPrivyAuthContext } from "@/lib/privy/sync-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureStarterPokemon, getCurrentUser, updateStarter } from "@/lib/supabase/repositories";
import type { StarterId } from "@/lib/types/domain";

export function StarterPageClient() {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const [currentStarterId, setCurrentStarterId] = useState<StarterId | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated || !user) {
      setCurrentUserId(null);
      return;
    }
    const run = async () => {
      const authContext = getPrivyAuthContext(user);
      if (!authContext) {
        return;
      }
      const client = getSupabaseBrowserClient();
      const profile = await getCurrentUser(client, authContext);
      setCurrentUserId(profile?.id ?? null);
      setCurrentStarterId(profile?.starterId ?? null);
    };
    void run();
  }, [authenticated, ready, user]);

  if (!ready) {
    return (
      <SurfaceCard>
        <p className="text-sm text-slate-600">Checking authentication...</p>
      </SurfaceCard>
    );
  }

  if (!authenticated) {
    return (
      <SurfaceCard>
        <p className="text-sm text-slate-600">Please login to choose your starter.</p>
      </SurfaceCard>
    );
  }

  const onConfirmStarter = async (starterId: StarterId) => {
    if (!currentUserId) {
      setMessage("No active user found.");
      return;
    }
    setIsSaving(true);
    const client = getSupabaseBrowserClient();
    const ok = await updateStarter(client, currentUserId, starterId);
    const starterAdded = ok ? await ensureStarterPokemon(client, currentUserId, starterId) : false;
    setIsSaving(false);
    if (ok && starterAdded) {
      setCurrentStarterId(starterId);
      router.replace("/home");
      return;
    }
    if (ok && !starterAdded) {
      setMessage("Starter selected, but failed to add starter to collection.");
      return;
    }
    setMessage("Failed to save starter.");
  };

  return (
    <div className="space-y-3">
      <StarterPicker
        starters={STARTERS}
        initialStarterId={currentStarterId}
        isSaving={isSaving}
        onConfirm={onConfirmStarter}
      />
      {message ? (
        <SurfaceCard>
          <p className="text-sm text-slate-700">{message}</p>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
