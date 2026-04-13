"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { getPrivyAuthContext } from "@/lib/privy/sync-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUser, updateUserDisplayName } from "@/lib/supabase/repositories";

function normalizeDisplayName(value: string): string {
  const trimmed = value.trim().slice(0, 24);
  return trimmed || "Trainer";
}

function AuthControlsInner() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [nameDraft, setNameDraft] = useState<string>("");
  const [isSavingName, setIsSavingName] = useState(false);
  const [showNamePicker, setShowNamePicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated || !user) {
      setUserId(null);
      setDisplayName("");
      setNameDraft("");
      setShowNamePicker(false);
      return;
    }

    const run = async () => {
      const authContext = getPrivyAuthContext(user);
      if (!authContext) {
        return;
      }
      const client = getSupabaseBrowserClient();
      const profile = await getCurrentUser(client, authContext);
      if (!profile) {
        return;
      }
      setUserId(profile.id);
      setDisplayName(profile.displayName);
      setNameDraft(profile.displayName);
      if (!profile.displayName || profile.displayName.startsWith("Trainer_")) {
        setShowNamePicker(true);
      }
    };

    void run();
  }, [authenticated, ready, user]);

  const compactUserId = useMemo(() => user?.id?.slice(0, 8) ?? "", [user?.id]);

  const onSaveName = () => {
    const run = async () => {
      if (!userId) {
        return;
      }
      setIsSavingName(true);
      const client = getSupabaseBrowserClient();
      const nextName = normalizeDisplayName(nameDraft);
      const ok = await updateUserDisplayName(client, userId, nextName);
      setIsSavingName(false);
      if (!ok) {
        return;
      }
      setDisplayName(nextName);
      setNameDraft(nextName);
      setShowNamePicker(false);
    };

    void run();
  };

  if (!ready) {
    return <p className="text-sm text-slate-500 sm:text-xs">Auth loading...</p>;
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={login}
        className="btn-pokemon px-3 py-2 text-sm sm:text-xs"
      >
        Login
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {showNamePicker ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-4 ring-1 ring-slate-200">
            <p className="text-base font-semibold text-slate-900 sm:text-sm">Choose your trainer name</p>
            <p className="mt-1 text-sm text-slate-500 sm:text-xs">
              This name appears on leaderboard and battle screens.
            </p>
            <input
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              maxLength={24}
              className="mt-3 w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none ring-slate-300 focus:ring-2 sm:py-2 sm:text-sm"
              placeholder="Your trainer name"
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowNamePicker(false)}
                className="btn-pokemon-secondary px-3 py-2 text-sm sm:text-xs"
              >
                Later
              </button>
              <button
                type="button"
                onClick={onSaveName}
                disabled={isSavingName}
                className="btn-pokemon px-3 py-2 text-sm sm:text-xs"
              >
                {isSavingName ? "Saving..." : "Save Name"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <Link href="/home" className="btn-pokemon-secondary px-3 py-2 text-sm sm:text-xs" aria-label="Home">
        Home
      </Link>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowUserMenu((value) => !value)}
          className="btn-pokemon-secondary max-w-[9rem] truncate px-3 py-2 text-sm sm:text-xs"
        >
          {displayName ? displayName : compactUserId}
        </button>
        {showUserMenu ? (
          <div className="absolute right-0 mt-2 w-40 border-2 border-black bg-[#f5f0e8] p-2 shadow-[inset_-3px_-3px_0px_#a89f8c,inset_3px_3px_0px_#ffffff]">
            <button
              type="button"
              onClick={() => {
                setNameDraft(displayName || nameDraft);
                setShowNamePicker(true);
                setShowUserMenu(false);
              }}
              className="btn-pokemon-secondary w-full px-2 py-2 text-sm sm:text-xs"
            >
              Change Name
            </button>
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(false);
                logout();
              }}
              className="btn-pokemon mt-2 w-full px-2 py-2 text-sm sm:text-xs"
            >
              Logout
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AuthControls() {
  const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!hasPrivy) return null;
  return <AuthControlsInner />;
}
