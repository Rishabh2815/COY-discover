import { createHash } from "node:crypto";
import { getDb } from "./db";
import type { MatchItem, Profile, SwipeDirection, SwipeResult } from "./types";

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

const FEED_SALT = process.env.FEED_SALT ?? "coy-feed-v1";

/**
 * Profiles the viewer has not swiped on yet.
 *
 * Privacy: Tinder/Hinge-style feeds quietly rank people who liked you first. Coy's promise
 * forbids that, because feed position would leak who liked you. Here the order is a keyed hash of
 * (viewer, candidate): stable across reloads, different per viewer, and independent of anything
 * the candidate has done. The query never touches swipe rows made by other users.
 */
export function getFeed(viewer: string, limit: number): Profile[] {
  const rows = getDb()
    .prepare(
      `SELECT u.* FROM users u
       WHERE u.id <> @viewer
         AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = @viewer AND s.target_id = u.id)`
    )
    .all({ viewer }) as UserRow[];
  const rank = (id: string) => createHash("sha256").update(`${FEED_SALT}:${viewer}:${id}`).digest("hex");
  return rows
    .map((r) => [rank(r.id), r] as const)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(0, limit)
    .map(([, r]) => toProfile(r));
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

/** Mutual matches only. There is deliberately no endpoint for "who liked me". */
export function getMatches(viewer: string): MatchItem[] {
  const rows = getDb()
    .prepare(
      `SELECT u.*, m.created_at AS matched_at FROM matches m
       JOIN users u ON u.id = CASE WHEN m.user_a = @viewer THEN m.user_b ELSE m.user_a END
       WHERE m.user_a = @viewer OR m.user_b = @viewer
       ORDER BY m.created_at DESC`
    )
    .all({ viewer }) as (UserRow & { matched_at: number })[];
  return rows.map((r) => ({ ...toProfile(r), matchedAt: r.matched_at }));
}
