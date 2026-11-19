import { NextResponse } from "next/server";
import { ApiError } from "./service";

const HEADERS = { "Cache-Control": "no-store" };

export async function handle<T>(fn: () => T | Promise<T>, status = 200) {
  try {
    return NextResponse.json(await fn(), { status, headers: HEADERS });
  } catch (e) {
    if (e instanceof ApiError) return NextResponse.json({ error: e.code }, { status: e.status, headers: HEADERS });
    console.error(e);
    return NextResponse.json({ error: "internal_error" }, { status: 500, headers: HEADERS });
  }
}

// Fixed-window limiter, per process. Swap for Redis (INCR + EXPIRE) when running multiple instances.
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(req: Request, key: string, max: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const k = `${key}:${ip}`;
  const now = Date.now();
  const b = buckets.get(k);
  if (!b || b.reset < now) {
    if (buckets.size > 10_000) buckets.clear();
    buckets.set(k, { n: 1, reset: now + windowMs });
    return;
  }
  if (++b.n > max) throw new ApiError(429, "rate_limited");
}
