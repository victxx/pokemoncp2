"use client";

import { useState, useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { SurfaceCard } from "@/components/ui";
import { getPrivyAuthContext } from "@/lib/privy/sync-user";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/repositories";

const INTRO_DONE_KEY = "pokemoncp2_intro_done";

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
    body: "Every trainer needs a starter Pokemon. Head to Starter Selection and choose Charmander, Piplup, or Treecko. Your journey truly begins there. Good luck!",
  },
];

function IntroModal({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);
  const current = INTRO_STEPS[step];
  const isLast = step === INTRO_STEPS.length - 1;

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
        {/* Title bar */}
        <div
          style={{
            background: "#3a5fc8",
            borderBottom: "3px solid #000",
            padding: "8px 14px",
          }}
        >
          <p className="text-sm text-white" style={{ letterSpacing: "0.05em" }}>
            {current.title}
          </p>
        </div>

        {/* Step indicator dots */}
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

        {/* Body text */}
        <div className="px-4 py-4">
          <p className="text-sm leading-relaxed text-slate-800">{current.body}</p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 border-t-2 border-black px-4 py-3" style={{ borderTop: "3px solid #000" }}>
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
            onClick={() => {
              if (isLast) {
                onFinish();
              } else {
                setStep((s) => s + 1);
              }
            }}
            className="btn-pokemon text-xs flex-1"
          >
            {isLast ? "Start!" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LandingClient() {
  const { ready, authenticated, user, login } = usePrivy();
  const router = useRouter();
  const [showIntro, setShowIntro] = useState(false);
  const [checkingRoute, setCheckingRoute] = useState(true);
  const [hasSeenIntro, setHasSeenIntro] = useState(false);
  // Track whether the user clicked login so we only show intro after *they* logged in
  const loginPending = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setHasSeenIntro(window.localStorage.getItem(INTRO_DONE_KEY) === "1");
  }, []);

  // Route authenticated users automatically:
  // - returning + starter -> Home
  // - no starter + intro done -> Starter
  // - no starter + intro not done -> Intro modal
  useEffect(() => {
    const run = async () => {
      if (!ready) {
        return;
      }
      if (!authenticated || !user) {
        setCheckingRoute(false);
        return;
      }

      const authContext = getPrivyAuthContext(user);
      if (!authContext) {
        setCheckingRoute(false);
        return;
      }
      const client = getSupabaseBrowserClient();
      const profile = await getCurrentUser(client, authContext);

      if (profile?.starterId) {
        router.replace("/home");
        return;
      }

      const introDone = typeof window !== "undefined" && window.localStorage.getItem(INTRO_DONE_KEY) === "1";
      if (introDone) {
        router.replace("/starter");
        return;
      }

      setShowIntro(true);
      setCheckingRoute(false);
      loginPending.current = false;
    };

    void run();
  }, [authenticated, ready, router, user]);

  // When Privy finishes user-triggered login, show intro for first-time flow
  useEffect(() => {
    if (authenticated && loginPending.current) {
      loginPending.current = false;
      setShowIntro(true);
      setCheckingRoute(false);
    }
  }, [authenticated]);

  const handleLogin = () => {
    if (authenticated) {
      setShowIntro(true);
      return;
    }
    loginPending.current = true;
    login();
  };

  const handleFinish = () => {
    setShowIntro(false);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(INTRO_DONE_KEY, "1");
    }
    router.push("/starter");
  };

  if (checkingRoute) {
    return (
      <PageShell title="Alexandroupoli Pokemon" subtitle="Preparing your adventure...">
        <SurfaceCard>
          <p className="text-sm text-slate-700">Loading trainer state...</p>
        </SurfaceCard>
      </PageShell>
    );
  }

  return (
    <>
      {showIntro && <IntroModal onFinish={handleFinish} />}
      <PageShell
        title="Alexandroupoli Pokemon"
        subtitle="Meet coworkers, make connections, and build your Pokemon squad."
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
          disabled={!ready}
          className="btn-pokemon w-full text-sm"
        >
          {!ready ? "Loading..." : hasSeenIntro ? "Continue Adventure" : "Start Adventure"}
        </button>
      </PageShell>
    </>
  );
}

export default function LandingPage() {
  const hasPrivy = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!hasPrivy) {
    return (
      <PageShell
        title="Alexandroupoli Pokemon"
        subtitle="Meet coworkers, make connections, and build your Pokemon squad."
      >
        <SurfaceCard>
          <p className="text-sm text-slate-700">
            A playful off-site mini game. Pick your starter, connect during the event, and race up the
            leaderboard.
          </p>
        </SurfaceCard>
        <button type="button" className="btn-pokemon w-full text-sm">
          Start Adventure
        </button>
      </PageShell>
    );
  }

  return <LandingClient />;
}
