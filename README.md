# Coy · Discover

A swipe-based **Discover** tab for Coy, built as a standalone app: a tab bar with a blank **Home** placeholder and the full **Discover** experience (swipe deck, "It's a match!" screen, Matches view).

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Next.js API routes · SQLite (`better-sqlite3`, WAL) · Node cluster supervisor

## Run it

```bash
npm install
npm run dev                          # http://localhost:3000, single process, hot reload, demo reset enabled
npm run build && npm start           # production: clustered workers (WEB_CONCURRENCY, default = CPUs, max 4)
ENABLE_DEMO_RESET=true npm start     # same, with the demo reset endpoint on (needed to re-run the tests)
npm run smoke                        # 26 API checks (correctness, privacy, input bounds)
npm run load                         # race, load-balancing and rate-limit checks (uses up this minute's feed budget)
```

## Demo script

36 profiles are seeded. **10 have already liked you**: Riya, Meera, Tara, Naina, Aditya, Sahil, Kiara, Myra, Pooja, Sneha. Like any of them for an instant match; liking anyone else stays silent. Feed order is shuffled independent of likes, so position gives nothing away.

## API (`/api`)

| Route | Behaviour |
|---|---|
| `GET /feed?limit=10` | `{ profiles }`: unswiped profiles only, at most 50 per call |
| `POST /swipe` `{ targetId, direction: "like" \| "pass" }` | `{ matched, match }`. Idempotent; the opposite swipe returns `409 swipe_is_final` |
| `GET /matches?limit=24&cursor=…` | `{ matches, nextCursor, total }`: mutual only, newest first, max 100 per page |
| `GET /health` | `200` only if this worker can reach the database (load-balancer probe, not rate limited) |
| `POST /reset` | Demo only; 404 in production unless `ENABLE_DEMO_RESET=true` |

Errors: `400 invalid_body/invalid_query/invalid_cursor` · `403 bad_origin` · `404` · `409 swipe_is_final` · `413` · `415` · `429 rate_limited/daily_limit_reached` (with `Retry-After`) · `503 busy`.

## Privacy model (the core promise)

- One swipe row per pair, ever (composite primary key): swipes are final and retries are idempotent. Flipping a decision is rejected, so nobody can probe who likes them.
- The feed order is a salted hash of (viewer, candidate), never a function of anyone's likes (Tinder/Hinge-style "likes you first" boosting would reveal likers by position). No response contains a "liked you" field, a count, or a who-liked-me endpoint.
- Matching is atomic: swipe, reverse-like lookup and match insert share one `BEGIN IMMEDIATE` transaction, and pairs are stored once (`user_a < user_b`).

## Nothing is open-ended

| Surface | Bound |
|---|---|
| Feed query | `ORDER BY … LIMIT` top-N inside SQLite, max 50 rows; memory is O(limit), not O(users) |
| Matches query | keyset pagination (cursor), max 100 rows per page |
| Request body | 1 KB hard cap, enforced while streaming; JSON content type required |
| Query params / ids | integers clamped (non-numeric → 400), ids match `^[a-z0-9_-]{1,32}$`, cursor validated by regex |
| Swipes per user | rolling 24 h quota (`DAILY_SWIPE_LIMIT`, default 500) checked inside the swipe transaction |
| DB waits | `busy_timeout` 3 s, then `503` + `Retry-After` instead of queueing |
| Client network calls | 8 s deadline on every `fetch` (headers and body) |
| Sockets | headers 15 s, request 30 s, 1024 connections per worker, 16 KB headers |
| Rate-limit table | expired windows pruned continuously, so it holds only live windows |
| Worker restarts | crash-loop guard: more than 10 crashes in a minute → supervisor exits non-zero |
| Shutdown | 10 s drain, then forced close |
| Config | every limit is validated at startup in `lib/config.ts`; invalid values fail fast |

## Load balancing and traffic control

1. **In-process load balancing (`server.mjs`).** A supervisor forks `WEB_CONCURRENCY` workers on one port; connections are spread round-robin. Crashed workers are respawned; SIGTERM drains in-flight requests. Workers are stateless and share one SQLite file in WAL mode, so any worker can serve any request.
2. **Shared rate limiting.** Per client IP and route: feed 60/min, matches 60/min, swipe 120/min, reset 10/min (env-tunable). Counters live in a small SQLite file shared by all workers, so the limit is global rather than per worker (verified: a 150-request burst across 3 workers allowed ≤ 60). `429` responses carry `Retry-After`; all responses carry `X-RateLimit-*`. If the limiter itself fails it fails open and logs, so traffic control can't cause an outage.
3. **Trusted client IP.** The address is taken from the socket, or from the Nth-from-right `X-Forwarded-For` entry when `TRUST_PROXY_HOPS` is set, so a client cannot spoof its way past the limiter.
4. **Edge layer (`deploy/nginx.conf`, `docker-compose.yml`).** nginx `least_conn` across app containers with passive health checks, `limit_req`/`limit_conn` flood protection, body/time bounds, retries only for idempotent requests. The compose file runs 3 replicas × 2 workers on one host sharing a volume.
5. **Other protections.** Same-origin check on writes, CSP/HSTS/frame/content-type headers, `no-store` API responses, request ids, JSON error logs.

**Scaling limits.** SQLite scales across processes on one host. Across hosts you need Postgres (replace `lib/db.ts`) and Redis (replace `lib/ratelimit.ts`); the edge limits in nginx apply regardless.

## Config

`PORT` · `BIND_HOST` · `WEB_CONCURRENCY` (1-16) · `TRUST_PROXY_HOPS` (0-5) · `CLIENT_IP_HEADER` (e.g. `true-client-ip`, takes precedence) · `DATABASE_PATH` · `RATE_LIMIT_DB_PATH` · `DAILY_SWIPE_LIMIT` · `RL_FEED_PER_MIN` · `RL_MATCHES_PER_MIN` · `RL_SWIPE_PER_MIN` · `ALLOWED_HOSTS` (extra allowed Origin hosts) · `ENABLE_DEMO_RESET` · `DB_BUSY_TIMEOUT_MS` · `FEED_SALT`

## Not done yet

Real auth (swap `lib/auth.ts`), push/WebSocket match notification when the other person swipes second, real photo storage, per-viewer ranked candidate generation beyond the shuffled feed, and Postgres/Redis for multi-host.
