# Coy · Discover

A swipe-based **Discover** tab for Coy, built as a standalone app: a tab bar with a blank **Home** placeholder and the full **Discover** experience (swipe deck, "It's a match!" screen, Matches view).

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Next.js API routes · SQLite (`better-sqlite3`, WAL mode)

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 (open it on your phone via your LAN IP to try drag gestures)
npm run smoke        # in another terminal: 15 end-to-end API checks
```

The database is created and seeded on first request at `data/coy.db` (override with `DATABASE_PATH`).
Production: `npm run build && npm start` on any host with a persistent disk (Railway, Render, Fly, a VPS).
SQLite needs a writable disk, so it won't persist on serverless platforms such as Vercel; swap `lib/db.ts` for Postgres there.

## Demo script

36 profiles are seeded. **10 of them have already liked you**: Riya, Meera, Tara, Naina, Aditya, Sahil, Kiara, Myra, Pooja, Sneha. Like any of them for an instant match; liking anyone else stays silent. Feed order is deliberately shuffled, so you can't tell who they are from position. *Reset demo* (empty state, dev only) clears your swipes.

## API

All routes are under `/api`. Single logged-in user (`lib/auth.ts` is the seam for real auth).

| Route | Behaviour |
|---|---|
| `GET /api/feed?limit=10` | `{ profiles }`: profiles you haven't swiped on, never anyone you've already swiped |
| `POST /api/swipe` `{ targetId, direction: "like" \| "pass" }` | `{ matched, match }`. Idempotent; the opposite swipe on the same profile returns `409 swipe_is_final` |
| `GET /api/matches` | `{ matches }`: mutual matches only, newest first |
| `POST /api/reset` | Demo only. Disabled in production unless `ENABLE_DEMO_RESET=true` |

Errors: `400 invalid_body`, `404 profile_not_found`, `409 swipe_is_final`, `429 rate_limited`.

## Backend design

Modelled on how Tinder/Hinge-style systems work, adapted to Coy's double-blind promise (getcoy.com: "We never say who. Not directly, and not through counts that would let someone work it out. Adding is final.").

- **One swipe row per pair, ever.** `swipes(swiper_id, target_id)` has a composite primary key, so a swipe is final and retries are idempotent. Passes are stored too, which is what guarantees a profile never reappears. Un-passing or flipping is rejected, so nobody can probe who likes them.
- **Race-free matching.** The swipe insert, the reverse-like lookup and the match insert run in a single `BEGIN IMMEDIATE` transaction. If two people like each other at the same moment you get exactly one match. Matches are stored once per pair via canonical ordering (`user_a < user_b`, enforced by a `CHECK`).
- **The feed can't leak likes.** Real apps boost people who liked you; here that would reveal them by position. Order is a salted hash of (viewer, candidate): stable across reloads, different per viewer, independent of anyone's swipes. The feed query never reads other users' swipes, and no response contains a "liked you" field, a count, or a "who liked me" endpoint. A match only ever appears at the moment both sides have liked.
- **Anti-join feed.** `NOT EXISTS` over the swipes primary key, so the unswiped set is computed in the database.
- **Operational basics:** `no-store` on all API responses, strict input validation, per-IP rate limit on swipes, WAL + `busy_timeout`, foreign keys on, security headers.

**Frontend:** pointer-event drag with fling-velocity detection (no animation library), rotation and LIKE/PASS stamps that fade in with the drag, a spring-back when released early, buttons and ←/→ keys on desktop, haptics where supported, optimistic removal with rollback if the network fails, and a client-side `seen` set so a swiped card can't flicker back while a request is in flight.

## What I'd change at scale

- Feed: replace load-all-then-hash with candidate generation (geo/age filters, precomputed per-viewer ranking, cursor pagination) in Postgres or Redis.
- Match notifications (push/WebSocket) for the case where the *other* person swipes second; today it shows up in Matches on next load.
- Rate limiting in Redis, real auth, a daily swipe quota, and blocking/reporting.
- Real photos on object storage with signed URLs.
