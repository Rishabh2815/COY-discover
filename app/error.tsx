"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="state" style={{ minHeight: "100dvh" }}>
      <h3>Something went wrong</h3>
      <p>It&apos;s on us. Nothing you did was lost.</p>
      <button className="btn" onClick={reset}>Try again</button>
    </div>
  );
}
