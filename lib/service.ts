import { config } from "./config";
import { getDb } from "./db";
import type { MatchPage, Profile, SwipeDirection, SwipeResult } from "./types";

export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(code);
  }
}

type UserRow = { id: string; name: string; age: number; photo_url: string; bio: string; location: string; interests: string };
const toProfile = (r: UserRow): Profile => ({
  id: r.id, name: r.name, age: r.age, photo: r.photo_url, bio: r.bio, location: r.location,
  interests: JSON.parse(r.interests) as string[],
});

export const ID_RE = /^[a-z0-9_-]{1,32}$/;
const CURSOR_RE = /^(\d{1,15}):([a-z0-9_-]{1,32})$/;
const clamp = (n: number, min: number, max: number) => Math.min(Math.max(Math.trunc(n), min), max);

/**
 * Profiles the viewer has not swiped on yet, at most `limit` (hard cap config.feed.max).
 *
 * Privacy: Tinder/Hinge-style feeds quietly rank people who liked you first. Coy's promise
 * forbids that, because feed position would leak who liked you. Here the order is a keyed hash of
 * (viewer, candidate): stable across reloads, different per viewer, and independent of anything
 * the candidate has done. The query never reads swipe rows made by other users.
 * The ORDER BY ... LIMIT is a top-N heap inside SQLite, so memory stays O(limit), not O(users).
 */
export function getFeed(viewer: string, limit: number): Profile[] {
  const rows = getDb()
    .prepare(
      `SELECT u.* FROM users u
       WHERE u.id <> @viewer
         AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = @viewer AND s.target_id = u.id)
       ORDER BY feed_rank(@viewer, u.id)
       LIMIT @limit`
    )
    .all({ viewer, limit: clamp(limit, 1, config.feed.max) }) as UserRow[];
  return rows.map(toProfile);
}

const pair = (a: string, b: string) => (a < b ? [a, b] : [b, a]);

/**
 * Record a swipe. Swipes are final and idempotent:
 *  - same swipe again  -> same answer (safe to retry after a flaky network)
 *  - opposite swipe    -> 409, so nobody can flip decisions to probe who likes them
 * The swipe insert, the reverse-like lookup and the match insert share one IMMEDIATE transaction,
 * so two people liking each other at the same instant produce exactly one match, never zero or two.
 */
export function swipe(viewer: string, targetId: string, direction: SwipeDirection): SwipeResult {
  const db = getDb();
  const run = db.transaction((): SwipeResult => {
    if (targetId === viewer) throw new ApiError(400, "cannot_swipe_self");
    const target = db.prepare("SELECT * FROM users WHERE id = ?").get(targetId) as UserRow | undefined;
    if (!target) throw new ApiError(404, "profile_not_found");

    const prior = db
      .prepare("SELECT direction FROM swipes WHERE swiper_id = ? AND target_id = ?")
      .get(viewer, targetId) as { direction: SwipeDirection } | undefined;
    if (prior && prior.direction !== direction) throw new ApiError(409, "swipe_is_final");

    if (!prior) {
      const used = db
        .prepare("SELECT COUNT(*) AS n FROM swipes WHERE swiper_id = ? AND created_at >= ?")
        .get(viewer, Date.now() - 86_400_000) as { n: number };
      if (used.n >= config.dailySwipeLimit) throw new ApiError(429, "daily_limit_reached");
      db.prepare("INSERT INTO swipes (swiper_id, target_id, direction, created_at) VALUES (?, ?, ?, ?)").run(
        viewer, targetId, direction, Date.now()
      );
      if (direction === "like") {
        const theyLikedMe = db
          .prepare("SELECT 1 FROM swipes WHERE swiper_id = ? AND target_id = ? AND direction = 'like'")
          .get(targetId, viewer);
        if (theyLikedMe) {
          const [a, b] = pair(viewer, targetId);
          db.prepare("INSERT OR IGNORE INTO matches (user_a, user_b, created_at) VALUES (?, ?, ?)").run(a, b, Date.now());
        }
      }
    }

    const [a, b] = pair(viewer, targetId);
    const matched = direction === "like" && !!db.prepare("SELECT 1 FROM matches WHERE user_a = ? AND user_b = ?").get(a, b);
    return { matched, match: matched ? toProfile(target) : null };
  });
  return run.immediate();
}

/**
 * Mutual matches only, newest first, one bounded page at a time (cursor = "<created_at>:<partner id>").
 * There is deliberately no endpoint for "who liked me".
 */
export function getMatches(viewer: string, limit: number, cursor?: string): MatchPage {
  const db = getDb();
  let t = Number.MAX_SAFE_INTEGER;
  let id = "\uffff";
  if (cursor !== undefined) {
    const m = CURSOR_RE.exec(cursor);
    if (!m) throw new ApiError(400, "invalid_cursor");
    t = Number(m[1]);
    id = m[2];
  }
  const size = clamp(limit, 1, config.matches.max);
  const rows = db
    .prepare(
      `SELECT u.*, m.created_at AS matched_at FROM matches m
       JOIN users u ON u.id = CASE WHEN m.user_a = @viewer THEN m.user_b ELSE m.user_a END
       WHERE (m.user_a = @viewer OR m.user_b = @viewer)
         AND (m.created_at < @t OR (m.created_at = @t AND u.id < @id))
       ORDER BY m.created_at DESC, u.id DESC
       LIMIT @size`
    )
    .all({ viewer, t, id, size: size + 1 }) as (UserRow & { matched_at: number })[];
  const page = rows.slice(0, size);
  const last = page[page.length - 1];
  const total = db
    .prepare("SELECT (SELECT COUNT(*) FROM matches WHERE user_a = @v) + (SELECT COUNT(*) FROM matches WHERE user_b = @v) AS n")
    .get({ v: viewer }) as { n: number };
  return {
    matches: page.map((r) => ({ ...toProfile(r), matchedAt: r.matched_at })),
    nextCursor: rows.length > size && last ? `${last.matched_at}:${last.id}` : null,
    total: total.n,
  };
}
