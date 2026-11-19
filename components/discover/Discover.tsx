"use client";
import { useCallback, useState } from "react";
import type { Profile } from "@/lib/types";
import MatchesGrid from "./MatchesGrid";
import MatchOverlay from "./MatchOverlay";
import SwipeDeck from "./SwipeDeck";

export default function Discover() {
  const [view, setView] = useState<"swipe" | "matches">("swipe");
  const [match, setMatch] = useState<Profile | null>(null);
  const [count, setCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const onCount = useCallback((n: number) => setCount(n), []);
  const onMatch = useCallback((p: Profile) => {
    setMatch(p);
    setCount((c) => c + 1);
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <section className="discover">
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={view === "swipe"} className={view === "swipe" ? "on" : ""} onClick={() => setView("swipe")}>Swipe</button>
        <button role="tab" aria-selected={view === "matches"} className={view === "matches" ? "on" : ""} onClick={() => setView("matches")}>
          Matches{count > 0 && <b>{count}</b>}
        </button>
      </div>
      {/* Keep the deck mounted so its queue and in-flight swipes survive switching views */}
      <div hidden={view !== "swipe"}><SwipeDeck onMatch={onMatch} onReset={() => { setCount(0); setRefreshKey((k) => k + 1); }} /></div>
      {view === "matches" && <MatchesGrid refreshKey={refreshKey} onCount={onCount} />}
      {match && (
        <MatchOverlay p={match} onClose={() => setMatch(null)} onView={() => { setMatch(null); setView("matches"); }} />
      )}
    </section>
  );
}
