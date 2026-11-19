"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import type { Profile, SwipeDirection } from "@/lib/types";
import ProfileCard from "./ProfileCard";

const THRESHOLD = 110;
const EXIT_MS = 300;

export default function SwipeDeck({ onMatch }: { onMatch: (p: Profile) => void }) {
  const [queue, setQueue] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0, active: false });
  const [exit, setExit] = useState<SwipeDirection | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const seen = useRef(new Set<string>());
  const inflight = useRef(new Set<Promise<unknown>>());
  const fetching = useRef(false);
  const start = useRef({ x: 0, y: 0, t: 0 });
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const refill = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    setLoading(true);
    try {
      await Promise.allSettled([...inflight.current]); // let pending swipes land so the server feed is current
      const { profiles } = await api.feed(15);
      setQueue((q) => {
        const have = new Set(q.map((p) => p.id));
        return [...q, ...profiles.filter((p) => !have.has(p.id) && !seen.current.has(p.id))];
      });
      setError(false);
    } catch {
      setError(true);
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refill();
  }, [refill]);

  const commit = useCallback(
    (dir: SwipeDirection) => {
      const p = queue[0];
      if (!p) return;
      seen.current.add(p.id); // a swiped profile never comes back, even before the server confirms
      setQueue((q) => q.slice(1));
      setDrag({ x: 0, y: 0, active: false });
      setExit(null);
      if (dir === "like") flash("Liked quietly. They only find out if it's mutual.");
      navigator.vibrate?.(dir === "like" ? [12] : [6]);
      const job: Promise<unknown> = api
        .swipe(p.id, dir)
        .then((r) => r.matched && r.match && onMatch(r.match))
        .catch((e) => {
          if (e instanceof ApiError && e.status > 0 && e.status < 500 && e.status !== 429) return; // final / invalid: keep it gone
          seen.current.delete(p.id);
          setQueue((q) => [p, ...q]);
          flash("Couldn't save that swipe. Try again.");
        })
        .finally(() => inflight.current.delete(job));
      inflight.current.add(job);
      if (queue.length <= 5) refill();
    },
    [queue, onMatch, flash, refill]
  );

  const fling = useCallback(
    (dir: SwipeDirection) => {
      if (exit || !queue[0]) return;
      setExit(dir);
      setTimeout(() => commit(dir), EXIT_MS);
    },
    [exit, queue, commit]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") fling("like");
      if (e.key === "ArrowLeft") fling("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fling]);

  const down = (e: React.PointerEvent) => {
    if (exit) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    setDrag({ x: 0, y: 0, active: true });
  };
  const move = (e: React.PointerEvent) => {
    if (!drag.active) return;
    setDrag({ x: e.clientX - start.current.x, y: (e.clientY - start.current.y) * 0.4, active: true });
  };
  const up = () => {
    if (!drag.active) return;
    const v = Math.abs(drag.x) / Math.max(performance.now() - start.current.t, 1);
    if (Math.abs(drag.x) > THRESHOLD || (v > 0.6 && Math.abs(drag.x) > 40)) fling(drag.x > 0 ? "like" : "pass");
    else setDrag({ x: 0, y: 0, active: false });
  };

  const [top, next, third] = queue;
  const dir = exit ?? (drag.x > 20 ? "like" : drag.x < -20 ? "pass" : null);
  const progress = Math.min(Math.abs(drag.x) / THRESHOLD, 1);
  const topStyle: React.CSSProperties = exit
    ? { transform: `translate(${exit === "like" ? 140 : -140}vw, ${drag.y - 40}px) rotate(${exit === "like" ? 28 : -28}deg)`, transition: `transform ${EXIT_MS}ms ease-in` }
    : { transform: `translate(${drag.x}px, ${drag.y}px) rotate(${drag.x / 18}deg)`, transition: drag.active ? "none" : "transform 280ms cubic-bezier(.2,.9,.3,1.25)" };

  if (!top && loading) return <div className="state"><div className="spinner" aria-label="Loading" /></div>;
  if (!top && error)
    return (
      <div className="state">
        <h3>Can&apos;t reach Coy</h3>
        <p>Check your connection and try again.</p>
        <button className="btn" onClick={refill}>Retry</button>
      </div>
    );
  if (!top)
    return (
      <div className="state">
        <div className="emoji">🫶</div>
        <h3>You&apos;re all caught up</h3>
        <p>That&apos;s everyone for now. Nobody knows who likes whom until it&apos;s mutual, so check back soon.</p>
        {process.env.NODE_ENV !== "production" && (
          <button className="btn ghost" onClick={async () => { seen.current.clear(); await api.reset(); refill(); }}>
            Reset demo
          </button>
        )}
      </div>
    );

  return (
    <div className="deck">
      <div className="stack">
        {third && <div className="card back2"><ProfileCard p={third} /></div>}
        {next && (
          <div className="card back1" style={{ transform: `scale(${0.95 + progress * 0.05}) translateY(${(1 - progress) * 10}px)` }}>
            <ProfileCard p={next} />
          </div>
        )}
        <div
          key={top.id}
          className="card top"
          style={topStyle}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
        >
          <ProfileCard p={top} />
          <div className="stamp like" style={{ opacity: dir === "like" ? (exit ? 1 : progress) : 0 }}>LIKE</div>
          <div className="stamp pass" style={{ opacity: dir === "pass" ? (exit ? 1 : progress) : 0 }}>PASS</div>
        </div>
      </div>

      <div className="actions">
        <button className="round pass" aria-label="Pass" onClick={() => fling("pass")}>✕</button>
        <button className="round like" aria-label="Like" onClick={() => fling("like")}>♥</button>
      </div>
      <p className="hint">Drag the card or use ← → keys</p>
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
