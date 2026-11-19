"use client";
import { useState } from "react";
import Discover from "@/components/Discover";

type Tab = "home" | "discover";

const HomeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></svg>
);
const HeartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.6-9.3-9A5.4 5.4 0 0 1 12 6.4 5.4 5.4 0 0 1 21.3 12C19 16.4 12 21 12 21z" /></svg>
);

export default function App() {
  const [tab, setTab] = useState<Tab>("discover");
  return (
    <div className="shell">
      <header className="top">
        <span className="wordmark">coy</span>
        <span className="pill-note">100% anonymous</span>
      </header>
      <main className="screen">
        {tab === "home" ? <div className="blank" aria-label="Home" /> : <Discover />}
      </main>
      <nav className="tabbar" role="tablist">
        <button role="tab" aria-selected={tab === "home"} className={tab === "home" ? "on" : ""} onClick={() => setTab("home")}>
          <HomeIcon />
          <span>Home</span>
        </button>
        <button role="tab" aria-selected={tab === "discover"} className={tab === "discover" ? "on" : ""} onClick={() => setTab("discover")}>
          <HeartIcon />
          <span>Discover</span>
        </button>
      </nav>
    </div>
  );
}
