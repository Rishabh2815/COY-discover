import type { MatchItem, Profile, SwipeDirection, SwipeResult } from "./types";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { ...init, headers: { "content-type": "application/json" }, cache: "no-store" });
  } catch {
    throw new ApiError(0, "network");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (body as { error?: string }).error ?? "error");
  return body as T;
}

export const api = {
  feed: (limit = 15) => req<{ profiles: Profile[] }>(`/api/feed?limit=${limit}`),
  swipe: (targetId: string, direction: SwipeDirection) =>
    req<SwipeResult>("/api/swipe", { method: "POST", body: JSON.stringify({ targetId, direction }) }),
  matches: () => req<{ matches: MatchItem[] }>("/api/matches"),
  reset: () => req<{ ok: true }>("/api/reset", { method: "POST" }),
};
