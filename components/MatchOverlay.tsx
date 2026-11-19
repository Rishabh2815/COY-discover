"use client";
import type { Profile } from "@/lib/types";
import { Photo } from "./ProfileCard";

export default function MatchOverlay({ p, onClose, onView }: { p: Profile; onClose: () => void; onView: () => void }) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="It's a match">
      <div className="match">
        <div className="burst" aria-hidden>♥</div>
        <h1>It&apos;s a match!</h1>
        <p>You and {p.name} liked each other. Nobody else ever knew.</p>
        <div className="pair">
          <div className="avatar me"><span>You</span></div>
          <Photo p={p} className="avatar" />
        </div>
        <button className="btn" onClick={onView}>See matches</button>
        <button className="btn ghost" onClick={onClose}>Keep swiping</button>
      </div>
    </div>
  );
}
