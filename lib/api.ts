import type { MatchPage, Profile, SwipeDirection, SwipeResult } from "./types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const TIMEOUT_MS = 8000;

// Every call has a hard deadline (headers and body), so the UI can never hang on a dead connection.
async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(path, { ...init, headers: { "content-type": "application/json" }, cache: "no-store", signal: ctl.signal });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, (body as { error?: string }).error ?? "error");
    return body as T;
  } catch (e) {
    throw e instanceof ApiError ? e : new ApiError(0, "network");
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  feed: (limit = 15) => req<{ profiles: Profile[] }>(`/api/feed?limit=${limit}`),
  swipe: (targetId: string, direction: SwipeDirection) =>
    req<SwipeResult>("/api/swipe", { method: "POST", body: JSON.stringify({ targetId, direction }) }),
  matches: (cursor?: string, limit = 24) =>
    req<MatchPage>(`/api/matches?limit=${limit}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`),
  reset: () => req<{ ok: true }>("/api/reset", { method: "POST" }),
};
