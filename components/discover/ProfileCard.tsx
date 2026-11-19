"use client";
import { useState } from "react";
import type { Profile } from "@/lib/types";

const hue = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export function Photo({ p, className }: { p: Profile; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (broken || !p.photo)
    return (
      <div className={`ph ${className ?? ""}`} style={{ background: `linear-gradient(135deg, hsl(${hue(p.id)} 80% 82%), hsl(${(hue(p.id) + 50) % 360} 85% 72%))` }}>
        <span>{p.name[0]}</span>
      </div>
    );
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={className} src={p.photo} alt="" draggable={false} onError={() => setBroken(true)} />;
}

export default function ProfileCard({ p }: { p: Profile }) {
  return (
    <>
      <Photo p={p} className="card-photo" />
      <div className="card-shade" />
      <div className="card-info">
        <h2>
          {p.name} <span>{p.age}</span>
        </h2>
        <p className="loc">📍 {p.location}</p>
        <p className="bio">{p.bio}</p>
        <ul className="chips">
          {p.interests.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
