"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { MatchItem } from "@/lib/types";
import { Photo } from "./ProfileCard";

const ago = (t: number) => {
  const m = Math.floor((Date.now() - t) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
};

export default function MatchesGrid({ refreshKey, onCount }: { refreshKey: number; onCount: (n: number) => void }) {
  const [items, setItems] = useState<MatchItem[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (from?: string) => {
      setBusy(true);
      try {
        const page = await api.matches(from);
        setItems((prev) => (from && prev ? [...prev, ...page.matches] : page.matches));
        setCursor(page.nextCursor);
        onCount(page.total);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setBusy(false);
      }
    },
    [onCount]
  );

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (error && !items)
    return (
      <div className="state">
        <h3>Couldn&apos;t load matches</h3>
        <button className="btn" onClick={() => load()}>Retry</button>
      </div>
    );
  if (!items) return <div className="state"><div className="spinner" /></div>;
  if (!items.length)
    return (
      <div className="state">
        <div className="emoji">💌</div>
        <h3>No matches yet</h3>
        <p>When someone you like likes you back, they&apos;ll show up here. Only then.</p>
      </div>
    );
  return (
    <ul className="grid">
      {items.map((m) => (
        <li key={m.id} className="tile">
          <Photo p={m} className="tile-photo" />
          <div className="tile-info">
            <strong>{m.name}, {m.age}</strong>
            <span>{m.location}</span>
            <em>Matched {ago(m.matchedAt)}</em>
          </div>
        </li>
      ))}
      {cursor && (
        <li className="more">
          <button className="btn ghost" disabled={busy} onClick={() => load(cursor)}>{busy ? "Loading…" : "Load more"}</button>
        </li>
      )}
    </ul>
  );
}
