"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { SurfaceCard } from "@/components/ui";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

// ─── Intro steps ────────────────────────────────────────────────────────────
const INTRO_STEPS = [
  {
    title: "Welcome, Trainer!",
    body: "You have arrived in Alexandroupoli. Your Pokemon journey starts here. Connect with other trainers at the event to grow your team and climb the ranks.",
  },
  {
    title: "How to earn coins",
    body: "Every time you connect with a coworker using their personal code, you both earn coins and points. Each pair has a cooldown of a few hours, so keep meeting new people!",
  },
  {
    title: "Open Poke Balls",
    body: "Spend your coins to open Poke Balls and discover random Pokemon. Rarer Pokemon give bigger battle bonuses. Collect them all.",
  },
  {
    title: "Battle!",
    body: "Challenge other trainers to battles. Connected battles give full rewards. You also get 5 daily tickets for smaller battles. Wins push you up the leaderboard.",
  },
  {
    title: "Pick your Starter",
    body: "Every trainer needs a starter Pokemon. Head to Starter Selection and choose Bulbasaur, Charmander, or Squirtle. Your journey truly begins there. Good luck!",
  },
];

// ─── Pixel dialog wrapper ────────────────────────────────────────────────────
function PixelDialog({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div
        className="w-full max-w-sm"
        style={{
          background: "#f5f0e8",
          border: "4px solid #000",
          boxShadow: "inset -6px -6px 0px #a89f8c, inset 6px 6px 0px #ffffff",
        }}
      >
        <div
          style={{
            background: "#3a5fc8",
            borderBottom: "3px solid #000",
            padding: "8px 14px",
          }}
        >
          <p className="text-sm text-white" style={{ letterSpacing: "0.05em" }}>
            {title}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Username picker modal ───────────────────────────────────────────────────
function UsernameModal({
  privyUserId,
  onDone,
}: {
  privyUserId: string;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (trimmed.length > 20) {
      setError("Name must be 20 characters or less.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const client = getSupabaseBrowserClient();
      const payload: Database["public"]["Tables"]["users"]["Update"] = {
        display_name: trimmed,
      };
      const { error: dbError } = await client
        .from("users")
        .update(payload)
        .eq("privy_user_id", privyUserId);
      if (dbError) throw dbError;
      onDone();
    } catch {
      setError("Could not save name. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PixelDialog title="Choose your Trainer name">
      <div className="px-4 py-4 flex flex-col gap-3">
        <p className="text-xs text-slate-700 leading-relaxed">
          What should other trainers call you? Pick a name — you won&apos;t be able to change it later.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={20}
          placeholder="Enter trainer name..."
          className="w-full px-3 py-2 text-sm"
          style={{
            border: "3px solid #000",
            background: "#fff",
            outline: "none",
            boxShadow: "inset 2px 2px 0px #a89f8c",
            fontFamily: "inherit",
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        {error && (
          <p className="text-xs" style={{ color: "#e8282b" }}>
            {error}
          </p>
        )}
      </div>
      <div
        className="flex px-4 py-3"
        style={{ borderTop: "3px solid #000" }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || name.trim().length < 2}
          className="btn-pokemon text-xs flex-1"
        >
          {saving ? "Saving..." : "Confirm"}
        </button>
      </div>
    </PixelDialog>
  );
}

// ─── Intro modal ─────────────────────────────────────────────────────────────
function IntroModal({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const current = INTRO_STEPS[step];
  const isLast = step === INTRO_STEPS.length - 1;

  return (
    <PixelDialog title={current.title}>
      {/* Step dots */}
      <div className="flex gap-1 px-4 pt-3">
        {INTRO_STEPS.map((_, i) => (
          <span
            key={i}
            style={{
              width: 8,
              height: 8,
              background: i === step ? "#e8282b" : "#a89f8c",
              border: "2px solid #000",
              display: "inline-block",
            }}
          />
        ))}
      </div>
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed text-slate-800">{current.body}</p>
      </div>
      <div className="flex gap-3 px-4 py-3" style={{ borderTop: "3px solid #000" }}>
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="btn-pokemon-secondary text-xs flex-1"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={() => (isLast ? onFinish() : setStep((s) => s + 1))}
          className="btn-pokemon text-xs flex-1"
        >
          {isLast ? "Start!" : "Next"}
        </button>
      </div>
    </PixelDialog>
  );
}

// ─── Flow states ─────────────────────────────────────────────────────────────
type FlowStep = "idle" | "username" | "intro";

function LandingClient() {
  const { ready, authenticated, login, user } = usePrivy();
  const router = useRouter();
  const [flow, setFlow] = useState<FlowStep>("idle");

  // After Privy confirms authentication, decide which step to show
  useEffect(() => {
    if (!authenticated || !user || flow !== "idle") return;

    const checkUser = async () => {
      try {
        const client = getSupabaseBrowserClient();
        const { data } = await client
          .from("users")
          .select("display_name")
          .eq("privy_user_id", user.id)
          .maybeSingle();

        // Show username picker if name is still the auto-generated fallback
        const needsName =
          !data?.display_name || data.display_name.startsWith("Trainer_");

        setFlow(needsName ? "username" : "intro");
      } catch {
        setFlow("intro");
      }
    };

    checkUser();
  }, [authenticated, user, flow]);

  const handleLogin = () => {
    if (!authenticated) {
      login();
    }
  };

  return (
    <>
      {flow === "username" && user && (
        <UsernameModal
          privyUserId={user.id}
          onDone={() => setFlow("intro")}
        />
      )}
      {flow === "intro" && (
        <IntroModal
          onFinish={() => {
            setFlow("idle");
            router.push("/starter");
          }}
        />
      )}

      <PageShell
        title="Alexandroupoli Pokemon"
        subtitle="Meet coworkers, make connections, and build your Pokemon squad."
        hideNav
      >
        <SurfaceCard>
          <p className="text-sm text-slate-700">
            A playful off-site mini game. Pick your starter, connect during the event, and race up the
            leaderboard.
          </p>
        </SurfaceCard>
        <button
          type="button"
          onClick={handleLogin}
          disabled={!ready || authenticated}
          className="btn-pokemon w-full text-sm"
        >
          {!ready ? "Loading..." : authenticated ? "Logged in!" : "Log in"}
        </button>
      </PageShell>
    </>
  );
}

// ─── Page export ─────────────────────────────────────────────────────────────
export default function LandingPage() {
  const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!hasPrivy) {
    return (
      <PageShell
        title="Alexandroupoli Pokemon"
        subtitle="Meet coworkers, make connections, and build your Pokemon squad."
        hideNav
      >
        <SurfaceCard>
          <p className="text-sm text-slate-700">
            A playful off-site mini game. Pick your starter, connect during the event, and race up the
            leaderboard.
          </p>
        </SurfaceCard>
        <button type="button" className="btn-pokemon w-full text-sm">
          Log in
        </button>
      </PageShell>
    );
  }

  return <LandingClient />;
}
